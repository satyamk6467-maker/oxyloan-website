// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IPancakeRouter {
    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external;
}

/**
 * @title OxyloanInvestV2
 * @notice Investors approve USDT (BEP-20) and call invest(). In ONE transaction:
 *           - 50% goes to the management wallet (platform fee)
 *           - 10% goes to the referrer (if there is no referrer, this 10% is swapped for the investor)
 *           - the rest is swapped to OXYLOAN on PancakeSwap and LOCKED in this contract for the investor
 *         Each investment's OXYLOAN unlocks 10% per day: 10% after 1 day ... 100% after 10 days.
 *         Investors call claim() to move their unlocked OXYLOAN to their own wallet.
 *
 * Investor tokens are protected: the owner can never withdraw locked OXYLOAN.
 */
contract OxyloanInvestV2 is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint16 public constant BPS = 10_000;
    uint16 public constant MAX_FEE_BPS = 5_000;       // fee can never exceed 50%
    uint16 public constant MAX_REFERRAL_BPS = 2_000;  // referral can never exceed 20%
    uint256 public constant MAX_MIN_INVEST = 1_000 ether;
    uint256 public constant RELEASE_STEPS = 10;       // 10 steps of 10%
    uint256 public constant STEP_DURATION = 1 days;   // one step per day

    IERC20 public immutable usdt;
    IERC20 public immutable oxyloan;
    IPancakeRouter public immutable router;

    address public managementWallet;
    uint16 public feeBps = 5_000;
    uint16 public referralBps = 1_000;
    uint256 public minInvestment = 10 ether; // USDT on BSC has 18 decimals

    struct Lock {
        uint128 amount;   // OXYLOAN received from the swap
        uint128 claimed;  // OXYLOAN already sent to the investor
        uint64 start;     // when the investment was made
    }

    mapping(address => Lock[]) private _locks;
    mapping(address => uint256) private _firstOpen; // index of the first lock that is not fully claimed
    mapping(address => address) public referrerOf;  // first referrer is permanent
    mapping(address => uint256) public totalInvested;
    mapping(address => uint256) public referralEarned;
    uint256 public totalRaised;
    uint256 public investmentCount;
    uint256 public totalLocked; // OXYLOAN owed to investors (locked + unlocked but not claimed)

    event Invested(
        uint256 indexed id,
        address indexed investor,
        address indexed referrer,
        uint256 amount,
        uint256 managementAmount,
        uint256 referralAmount,
        uint256 swapAmount,
        uint256 oxyloanReceived
    );
    event Claimed(address indexed investor, uint256 amount);
    event ReferrerSet(address indexed investor, address indexed referrer);
    event WalletUpdated(address managementWallet);
    event ParamsUpdated(uint16 feeBps, uint16 referralBps, uint256 minInvestment);

    error ZeroAddress();
    error BelowMinimum();
    error BadParams();
    error NothingToClaim();
    error NotExcess();

    constructor(address _usdt, address _oxyloan, address _router, address _managementWallet, address _owner)
        Ownable(_owner)
    {
        if (_usdt == address(0) || _oxyloan == address(0) || _router == address(0) || _managementWallet == address(0))
            revert ZeroAddress();
        usdt = IERC20(_usdt);
        oxyloan = IERC20(_oxyloan);
        router = IPancakeRouter(_router);
        managementWallet = _managementWallet;
    }

    /// @param amount   USDT amount (18 decimals)
    /// @param referrer referrer wallet, or address(0). Only used on the investor's FIRST investment.
    /// @param minOut   minimum OXYLOAN the swap must deliver (slippage protection, quoted by the website)
    function invest(uint256 amount, address referrer, uint256 minOut) external nonReentrant whenNotPaused {
        if (amount < minInvestment) revert BelowMinimum();

        address ref = referrerOf[msg.sender];
        if (ref == address(0) && referrer != address(0) && referrer != msg.sender && referrer != address(this)) {
            ref = referrer;
            referrerOf[msg.sender] = ref;
            emit ReferrerSet(msg.sender, ref);
        }

        uint256 fee = (amount * feeBps) / BPS;
        uint256 referral = ref == address(0) ? 0 : (amount * referralBps) / BPS;
        uint256 swapAmt = amount - fee - referral;

        usdt.safeTransferFrom(msg.sender, managementWallet, fee);
        if (referral > 0) {
            usdt.safeTransferFrom(msg.sender, ref, referral);
            referralEarned[ref] += referral;
        }
        usdt.safeTransferFrom(msg.sender, address(this), swapAmt);

        // swap on PancakeSwap; measure what actually arrived (works with fee-on-transfer tokens)
        usdt.forceApprove(address(router), swapAmt);
        address[] memory path = new address[](2);
        path[0] = address(usdt);
        path[1] = address(oxyloan);
        uint256 before = oxyloan.balanceOf(address(this));
        router.swapExactTokensForTokensSupportingFeeOnTransferTokens(swapAmt, minOut, path, address(this), block.timestamp);
        uint256 received = oxyloan.balanceOf(address(this)) - before;
        if (received < minOut || received == 0) revert BadParams();

        _locks[msg.sender].push(Lock({amount: uint128(received), claimed: 0, start: uint64(block.timestamp)}));
        totalLocked += received;
        totalInvested[msg.sender] += amount;
        totalRaised += amount;
        uint256 id = ++investmentCount;

        emit Invested(id, msg.sender, ref, amount, fee, referral, swapAmt, received);
    }

    /// @notice send all currently unlocked OXYLOAN to the caller
    function claim() external nonReentrant {
        Lock[] storage locks = _locks[msg.sender];
        uint256 i = _firstOpen[msg.sender];
        uint256 total;
        bool allDoneSoFar = true;
        for (; i < locks.length; i++) {
            Lock storage l = locks[i];
            uint256 unlocked = _unlocked(l);
            uint256 due = unlocked - l.claimed;
            if (due > 0) {
                l.claimed = uint128(unlocked);
                total += due;
            }
            if (allDoneSoFar) {
                if (l.claimed == l.amount) _firstOpen[msg.sender] = i + 1;
                else allDoneSoFar = false;
            }
        }
        if (total == 0) revert NothingToClaim();
        totalLocked -= total;
        oxyloan.safeTransfer(msg.sender, total);
        emit Claimed(msg.sender, total);
    }

    // ---------------- views for the website ----------------

    function _unlocked(Lock memory l) internal view returns (uint256) {
        uint256 steps = (block.timestamp - l.start) / STEP_DURATION; // 10% after day 1, 20% after day 2, ... 100% after day 10
        if (steps >= RELEASE_STEPS) return l.amount;
        return (uint256(l.amount) * steps) / RELEASE_STEPS;
    }

    /// @return total OXYLOAN ever received, claimed so far, claimable now, still locked, next unlock time (0 if none)
    function accountOf(address investor)
        external
        view
        returns (uint256 total, uint256 claimed, uint256 claimable, uint256 locked, uint256 nextUnlock)
    {
        Lock[] storage locks = _locks[investor];
        for (uint256 i = 0; i < locks.length; i++) {
            Lock memory l = locks[i];
            uint256 unlocked = _unlocked(l);
            total += l.amount;
            claimed += l.claimed;
            claimable += unlocked - l.claimed;
            locked += l.amount - unlocked;
            if (unlocked < l.amount) {
                uint256 elapsedSteps = (block.timestamp - l.start) / STEP_DURATION;
                uint256 t = uint256(l.start) + (elapsedSteps + 1) * STEP_DURATION;
                if (nextUnlock == 0 || t < nextUnlock) nextUnlock = t;
            }
        }
    }

    function locksOf(address investor) external view returns (Lock[] memory) {
        return _locks[investor];
    }

    // ---------------- owner controls (capped) ----------------

    function setManagementWallet(address _managementWallet) external onlyOwner {
        if (_managementWallet == address(0)) revert ZeroAddress();
        managementWallet = _managementWallet;
        emit WalletUpdated(_managementWallet);
    }

    function setParams(uint16 _feeBps, uint16 _referralBps, uint256 _minInvestment) external onlyOwner {
        if (_feeBps > MAX_FEE_BPS || _referralBps > MAX_REFERRAL_BPS) revert BadParams();
        if (_minInvestment == 0 || _minInvestment > MAX_MIN_INVEST) revert BadParams();
        feeBps = _feeBps;
        referralBps = _referralBps;
        minInvestment = _minInvestment;
        emit ParamsUpdated(_feeBps, _referralBps, _minInvestment);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /// recover tokens sent here by mistake. Investors' OXYLOAN can never be taken: only the excess above totalLocked.
    function rescueToken(address token, address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (token == address(oxyloan) && amount > oxyloan.balanceOf(address(this)) - totalLocked) revert NotExcess();
        IERC20(token).safeTransfer(to, amount);
    }
}
