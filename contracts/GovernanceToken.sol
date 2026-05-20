// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title GovernanceToken
 * @dev Simple ERC20 token for DAO governance voting.
 */
contract GovernanceToken is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10 ** 18; // 100万代币

    constructor() ERC20("Focus DAO Token", "FDT") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}