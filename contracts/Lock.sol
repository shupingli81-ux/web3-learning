// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title SimpleStorage
 * @dev A simple storage contract to learn Solidity basics
 */
contract SimpleStorage {
    uint256 private storedData;
    address public owner;

    event DataStored(uint256 oldValue, uint256 newValue);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    function set(uint256 _data) public onlyOwner {
        uint256 old = storedData;
        storedData = _data;
        emit DataStored(old, _data);
    }

    function get() public view returns (uint256) {
        return storedData;
    }
}

/**
 * @title HelloWorld
 * @dev Your first Solidity contract
 */
contract HelloWorld {
    string public greeting;

    constructor(string memory _greeting) {
        greeting = _greeting;
    }

    function setGreeting(string memory _new) public {
        greeting = _new;
    }

    function say() public view returns (string memory) {
        return greeting;
    }
}

/**
 * @title SimpleToken
 * @dev A simple ERC20 token for learning
 */
contract SimpleToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("SimpleToken", "STK") {
        _mint(msg.sender, initialSupply);
    }
}