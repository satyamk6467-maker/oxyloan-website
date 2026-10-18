// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// Minimal stand-in for the Multicall3 contract that exists on real BNB Chain (used only by local tests).
contract Multicall3Lite {
    struct Call3 { address target; bool allowFailure; bytes callData; }
    struct Result { bool success; bytes returnData; }
    function aggregate3(Call3[] calldata calls) external payable returns (Result[] memory r) {
        r = new Result[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            (bool ok, bytes memory d) = calls[i].target.call(calls[i].callData);
            if (!ok && !calls[i].allowFailure) revert("call failed");
            r[i] = Result(ok, d);
        }
    }
}
