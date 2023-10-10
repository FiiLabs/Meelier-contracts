const hre = require("hardhat");
async function main() {
    meelier = await ethers.getContractFactory("Meelier");
    meelier = await meelier.attach('0x17d2c4bf71Eb50C316fc4d82C21DA35076798550');
    // const addresses = [];
    // for (let i = 0; i < 1000; i++) {
    //   const wallet = ethers.Wallet.createRandom();
    //   addresses.push(wallet.address);
    // }
    // const tx = await meelier.addWhitelistBatch(0, addresses);
    const tx = await meelier.addWhitelistBatch(0, ['0xA2F9F6260D24f14f805D58d7368ECed9c07da8af']);
    await tx.wait();
    console.log("addWhitelistBatch success, hash:" + tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });