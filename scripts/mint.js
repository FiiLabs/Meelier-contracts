const { ethers } = require("hardhat");
async function main() {
    meelier = await ethers.getContractFactory("Meelier");
    meelier = await meelier.attach('0x5e50473ef6bDCCE306caFAb9C4c6bD03132E14F3');
    const supply = await meelier.totalSupply();
    console.log("supply is:" + supply);
    const price = await meelier.getMintPrice(BigInt(supply) + BigInt(1));
    console.log("price is:" + price);
    const tx2 = await meelier.mint(2, { value: BigInt(2)*BigInt(price)});
    await tx2.wait();
    console.log("mint success,hash:"+ tx2.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });