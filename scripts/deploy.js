const hre = require("hardhat");

async function main() {
  const metadataBaseURI = process.env.METADATA_BASE_URI || "https://your-backend.example.com/api/metadata/";

  const Factory = await hre.ethers.getContractFactory("PistachioScribbles");
  const contract = await Factory.deploy(metadataBaseURI);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("PistachioScribbles deployed to:", address);
  console.log("Metadata base URI:", metadataBaseURI);
  console.log("\nNext:");
  console.log("1. Save this address into backend/.env and frontend/.env as CONTRACT_ADDRESS.");
  console.log("2. Call setMintOpen(true) from the owner wallet when you're ready to launch.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
