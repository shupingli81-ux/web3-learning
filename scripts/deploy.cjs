const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("🚀 Deploying Focus DAO contracts");
  console.log("📡 Network:", network.name, "(chainId:", Number(network.chainId), ")");
  console.log("👤 Deployer:", deployer.address, "\n");

  // Check balance
  const balance = await ethers.formatEther(await ethers.provider.getBalance(deployer.address));
  console.log("💰 Deployer balance:", balance, "ETH\n");

  // 1. Deploy GovernanceToken
  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const token = await GovernanceToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ GovernanceToken deployed to:", tokenAddress);

  // 2. Deploy TimeLock
  const TimeLock = await ethers.getContractFactory("TimeLock");
  const minDelay = 2 * 24 * 60 * 60; // 2 days
  const timelock = await TimeLock.deploy(minDelay, deployer.address);
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log("✅ TimeLock deployed to:", timelockAddress);

  // 3. Deploy Governance
  const Governance = await ethers.getContractFactory("Governance");
  const governance = await Governance.deploy(tokenAddress, timelockAddress);
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  console.log("✅ Governance deployed to:", governanceAddress);

  // 4. Setup TimeLock roles
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  const TIMELOCK_ADMIN_ROLE = await timelock.TIMELOCK_ADMIN_ROLE();

  console.log("\n⚙️ Setting up TimeLock roles...");

  const proposerTx = await timelock.connect(deployer).grantRole(PROPOSER_ROLE, governanceAddress);
  await proposerTx.wait();
  console.log("✅ PROPOSER role granted to Governance");

  const executorTx = await timelock.connect(deployer).grantRole(EXECUTOR_ROLE, ethers.ZeroAddress);
  await executorTx.wait();
  console.log("✅ EXECUTOR role granted to anyone");

  const transferTx = await timelock.connect(deployer).grantRole(TIMELOCK_ADMIN_ROLE, governanceAddress);
  await transferTx.wait();
  console.log("✅ TIMELOCK_ADMIN_ROLE transferred to Governance");

  const renounceTx = await timelock.connect(deployer).renounceRole(TIMELOCK_ADMIN_ROLE, deployer.address);
  await renounceTx.wait();
  console.log("✅ Deployer renounced TIMELOCK_ADMIN_ROLE (fully decentralized!)");

  console.log("\n" + "=".repeat(60));
  console.log("📋 Deployment Summary");
  console.log("=".repeat(60));
  console.log("Network:    ", network.name);
  console.log("Token:     ", tokenAddress);
  console.log("TimeLock:  ", timelockAddress);
  console.log("Governance:", governanceAddress);
  console.log("=".repeat(60));

  // Save deployed addresses
  const fs = require("fs");
  const path = require("path");
  const deployments = {
    token: tokenAddress,
    timelock: timelockAddress,
    governance: governanceAddress,
    network: Number(network.chainId).toString(),
    timestamp: new Date().toISOString()
  };
  
  const deploymentsPath = path.join(__dirname, "../deployments.json");
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log("\n💾 Saved deployment addresses to deployments.json");

  // Update frontend contracts config
  const frontendContractsPath = path.join(__dirname, "../frontend/src/utils/contracts.js");
  const contractsContent = `export const CONTRACTS = {
  ${Number(network.chainId)}: {
    token: "${tokenAddress}",
    governance: "${governanceAddress}",
    timelock: "${timelockAddress}",
  },
};\n`;
  fs.writeFileSync(frontendContractsPath, contractsContent);
  console.log("💾 Updated frontend contracts config");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});