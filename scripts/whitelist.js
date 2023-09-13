const hre = require("hardhat");
async function main() {
    meelier = await ethers.getContractFactory("Meelier");
    meelier = await meelier.attach('0xDDAb81893fD708b1aF08BFDF2DaFad7534f0f1aD');
    const addresses = [];
    for (let i = 0; i < 400; i++) {
      const wallet = ethers.Wallet.createRandom();
      addresses.push(wallet.address);
    }
    const tx = await meelier.addWhitelistBatch(0, addresses);
    await tx.wait();
    console.log("setBaseURL success, hash:" + tx.hash);
    console.log(await meelier.tokenURI(1))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });