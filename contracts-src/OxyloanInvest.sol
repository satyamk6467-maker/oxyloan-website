// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OxyloanInvest
 * @notice Investors approve USDT (BEP-20) and call invest(). In ONE transaction the
 *         USDT is split straight from the investor's wallet to:
 *           - the management wallet   (platform fee, minus the referral bonus)
 *           - the referrer            (referral bonus, paid out of the fee)
 *           - the swap wallet         (the rest, later swapped to OXYLOAN on PancakeSwap)
 *         The contract NEVER holds investor funds, so there is nothing to drain.
 *
 * Defaults: fee 50%, referral 10% of the investment (paid out of the fee), min 10 USDT.
 * The owner can adjust parameters only within hard caps set below. Use a hardware wallet
 * or a multisig (e.g. Safe) as owner.
 */
contract OxyloanInvest is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint16 public constant BPS = 10_000;
    uint16 public constant MAX_FEE_BPS = 5_000;       // fee can never exceed 50%
    uint16 public constant MAX_REFERRAL_BPS = 2_000;  // referral can never exceed 20%
    uint256 public constant MAX_MIN_INVEST = 1_000 ether; // min investment can never exceed 1000 USDT

    IERC20 public immutable usdt;

    address public managementWallet;
    address public swapWallet;
    uint16 public feeBps = 5_000;
    uint16 public referralBps = 1_000;
    uint256 public minInvestment = 10 ether; // USDT on BSC has 18 decimals

    /// first referrer is permanent
    mapping(address => address) public referrerOf;
    mapping(address => uint256) public totalInvested;
    mapping(address => uint256) public referralEarned;
    uint256 public totalRaised;
    uint256 public investmentCount;

    event Invested(
        uint256 indexed id,
        address indexed investor,
        address indexed referrer,
        uint256 amount,
        uint256 managementAmount,
        uint256 referralAmount,
        uint256 swapAmount
    );
    event ReferrerSet(address indexed investor, address indexed referrer);
    event WalletsUpdated(address managementWallet, address swapWallet);
    event ParamsUpdated(uint16 feeBps, uint16 referralBps, uint256 minInvestment);

    error ZeroAddress();
    error BelowMinimum();
    error BadParams();

    constructor(address _usdt, address _managementWallet, address _swapWallet, address _owner)
        Ownable(_owner)
    {
        if (_usdt == address(0) || _managementWallet == address(0) || _swapWallet == address(0)) revert ZeroAddress();
        usdt = IERC20(_usdt);
        managementWallet = _managementWallet;
        swapWallet = _swapWallet;
    }

    /// @param amount   USDT amount (18 decimals)
    /// @param referrer referrer wallet, or address(0). Only used on the investor's FIRST investment.
    function invest(uint256 amount, address referrer) external nonReentrant whenNotPaused {
        if (amount < minInvestment) revert BelowMinimum();

        address ref = referrerOf[msg.sender];
        if (ref == address(0) && referrer != address(0) && referrer != msg.sender && referrer != address(this)) {
            ref = referrer;
            referrerOf[msg.sender] = ref;
            emit ReferrerSet(msg.sender, ref);
        }

        uint256 fee = (amount * feeBps) / BPS;
        uint256 referral = ref == address(0) ? 0 : (amount * referralBps) / BPS;
        uint256 mgmt = fee - referral; // referral is paid out of the fee
        uint256 swapAmt = amount - fee;

        totalInvested[msg.sender] += amount;
        totalRaised += amount;
        uint256 id = ++investmentCount;
        if (referral > 0) referralEarned[ref] += referral;

        usdt.safeTransferFrom(msg.sender, managementWallet, mgmt);
        if (referral > 0) usdt.safeTransferFrom(msg.sender, ref, referral);
        usdt.safeTransferFrom(msg.sender, swapWallet, swapAmt);

        emit Invested(id, msg.sender, ref, amount, mgmt, referral, swapAmt);
    }

    // ---------------- owner controls (capped) ----------------

    function setWallets(address _managementWallet, address _swapWallet) external onlyOwner {
        if (_managementWallet == address(0) || _swapWallet == address(0)) revert ZeroAddress();
        managementWallet = _managementWallet;
        swapWallet = _swapWallet;
        emit WalletsUpdated(_managementWallet, _swapWallet);
    }

    function setParams(uint16 _feeBps, uint16 _referralBps, uint256 _minInvestment) external onlyOwner {
        if (_feeBps > MAX_FEE_BPS || _referralBps > MAX_REFERRAL_BPS || _referralBps > _feeBps) revert BadParams();
        if (_minInvestment == 0 || _minInvestment > MAX_MIN_INVEST) revert BadParams();
        feeBps = _feeBps;
        referralBps = _referralBps;
        minInvestment = _minInvestment;
        emit ParamsUpdated(_feeBps, _referralBps, _minInvestment);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /// recover tokens sent to this contract by mistake (it never holds investor funds)
    function rescueToken(address token, address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        IERC20(token).safeTransfer(to, amount);
    }
}
