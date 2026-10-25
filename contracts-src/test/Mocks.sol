// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockToken is ERC20 {
    constructor(string memory n) ERC20(n, n) {}
    function mint(address to, uint256 a) external { _mint(to, a); }
}

/// Fixed-rate PancakeSwap stand-in: pays `rate` OXYLOAN per 1 USDT from its own balance.
contract MockRouter {
    uint256 public rate;
    constructor(uint256 r) { rate = r; }
    function setRate(uint256 r) external { rate = r; }
    function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256) external {
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        uint256 out = amountIn * rate;
        require(out >= amountOutMin, "INSUFFICIENT_OUTPUT_AMOUNT");
        IERC20(path[1]).transfer(to, out);
    }
}
