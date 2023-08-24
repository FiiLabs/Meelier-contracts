const { ethers } = require("hardhat");
async function main() {
    meelier = await ethers.getContractFactory("Meelier");
    meelier = await meelier.attach('0xE6AfDc260ac2bd254ce05324f58CA4Bb4b7722d5');
    const price = await meelier.PRICE_PER_TOKEN();
    console.log("price is" + price);
    const tx = await meelier.mint(1, { value: price});
    await tx.wait();
    console.log("mint success,hash:"+ tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });