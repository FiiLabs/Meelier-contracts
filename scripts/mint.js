const { ethers } = require("hardhat");
async function main() {
    meelier = await ethers.getContractFactory("Meelier");
    meelier = await meelier.attach('0x8304caa9D9A2178Ca167daAD30758D5f4D83E37E');
    const price = await meelier.PRICE_PER_TOKEN();
    console.log("price is" + price);
    const tx = await meelier.mint(39, { value: 39n*price});
    await tx.wait();
    console.log("mint success,hash:"+ tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });