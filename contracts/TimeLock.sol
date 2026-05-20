// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title TimeLock
 * @dev Time-locked wallet for DAO treasury.
 * All funds held here can only be moved by governance.
 */
contract TimeLock is TimelockController {
    uint256 public constant MIN_DELAY = 2 days;

    constructor(
        uint256 minDelay,
        address admin  // deployer initially, then transferred to governance
    ) TimelockController(minDelay, new address[](0), new address[](0), admin) {}
}