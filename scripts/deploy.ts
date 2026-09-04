import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.connect();

  const [deployer] = await ethers.getSigners();

  console.log("Deploying from:", deployer.address);

  const token = await ethers.deployContract("OXYToken", [
    deployer.address,
  ]);

  await token.waitForDeployment();

  console.log("OXY Token deployed at:");
  console.log(await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});