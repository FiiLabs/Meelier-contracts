// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  // const meelier = await hre.ethers.deployContract("Meelier", ["TMeelier", "TMeelier", "ipfs://QmVmczuqpsNM5AG6EM5eks8W2SdH4DBWJRaMNNdGaSq9V2/"]);
  const meelier = await hre.ethers.deployContract("Meelier", ["TMeelier", "TMeelier", "ipfs://QmPKQKbByciYsefccMXyPw1hzvEEDPVzDyfyD36jQwtZKb/"]);

  await meelier.waitForDeployment();

  console.log( `deployed to ${meelier.target}`
  );
  const tx1 = await meelier.publicSale(0);
  await tx1.wait();
  console.log("start public sale,hash:"+ tx1.hash);

  const tx2 = await meelier.lockIssue();
  await tx2.wait();
  console.log("lock issue success,hash:"+ tx2.hash);

  const tx = await meelier.startMint(0);
  await tx.wait();
  console.log("startMint success,hash:"+ tx.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
