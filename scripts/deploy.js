import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy SimpleStorage
  const SimpleStorage = await hre.ethers.getContractFactory("SimpleStorage");
  const simpleStorage = await SimpleStorage.deploy();
  await simpleStorage.waitForDeployment();
  console.log("SimpleStorage deployed to:", await simpleStorage.getAddress());

  // Deploy HelloWorld
  const HelloWorld = await hre.ethers.getContractFactory("HelloWorld");
  const helloWorld = await HelloWorld.deploy("Hello, Web3!");
  await helloWorld.waitForDeployment();
  console.log("HelloWorld deployed to:", await helloWorld.getAddress());

  // Deploy SimpleToken (with initial supply of 1000 tokens)
  const SimpleToken = await hre.ethers.getContractFactory("SimpleToken");
  const simpleToken = await SimpleToken.deploy(hre.ethers.parseEther("1000"));
  await simpleToken.waitForDeployment();
  console.log("SimpleToken deployed to:", await simpleToken.getAddress());

  // Interact with SimpleStorage
  console.log("\n--- Interacting with SimpleStorage ---");
  await simpleStorage.set(42);
  console.log("Stored value:", await simpleStorage.get());

  // Interact with HelloWorld
  console.log("\n--- Interacting with HelloWorld ---");
  console.log("Greeting:", await helloWorld.say());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});