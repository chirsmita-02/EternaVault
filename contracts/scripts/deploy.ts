import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Factory = await ethers.getContractFactory("DeathCertificateRegistry");
  const contract = await Factory.deploy(deployer.address); // initial owner
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("DeathCertificateRegistry deployed at:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


