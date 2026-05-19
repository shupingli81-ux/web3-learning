const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleStorage", function () {
  async function deploy() {
    const [owner, other] = await ethers.getSigners();
    const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    const simpleStorage = await SimpleStorage.deploy();
    return { simpleStorage, owner, other };
  }

  it("should store a value", async function () {
    const { simpleStorage } = await loadFixture(deploy);
    await simpleStorage.set(42);
    expect(await simpleStorage.get()).to.equal(42);
  });

  it("should only allow owner to set", async function () {
    const { simpleStorage, other } = await loadFixture(deploy);
    await expect(simpleStorage.connect(other).set(100)).to.be.revertedWith("Only owner can call");
  });
});

describe("HelloWorld", function () {
  async function deploy() {
    const HelloWorld = await ethers.getContractFactory("HelloWorld");
    const helloWorld = await HelloWorld.deploy("Hello, Web3!");
    return helloWorld;
  }

  it("should return the greeting", async function () {
    const { say } = await loadFixture(deploy);
    expect(await say()).to.equal("Hello, Web3!");
  });
});