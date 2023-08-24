const hre = require("hardhat");
async function main() {
    meelier = await ethers.getContractFactory("Meelier");
    meelier = await meelier.attach('0x6FB0e7b75916ea4AC19a524852cFA20d4B22d770');
    const baseURI = "ipfs://QmNUQfHsjgwmdPZRGUAGan6yQMAA3HGJ6bG6EYDz45XoJf/"
    const tx = await meelier.setBaseURI(baseURI)
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