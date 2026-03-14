const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  const Contract = await ethers.getContractFactory("ThrincsDemoSBT");
  const contract = await Contract.deploy();

  await contract.waitForDeployment();

  console.log("ThrincsDemoSBT deployed at:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});