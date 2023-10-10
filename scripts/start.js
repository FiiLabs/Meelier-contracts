// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
    meelier = await ethers.getContractFactory("Meelier");
    meelier = await meelier.attach('0xa4dde395a671bbf1d63e037d6a3f8c5595957c11');
  const tx1 = await meelier.withdraw();
  await tx1.wait();
  console.log("start public sale,hash:"+ tx1.hash);

//   const tx2 = await meelier.lockIssue();
//   await tx2.wait();
//   console.log("lock issue success,hash:"+ tx2.hash);

//   const tx = await meelier.startMint(0);
//   await tx.wait();
//   console.log("startMint success,hash:"+ tx.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
