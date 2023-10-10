const { ethers } = require("hardhat");
async function main() {
    meelier = await ethers.getContractFactory("Meelier");
    meelier = await meelier.attach('0xa4dde395a671bbf1d63e037d6a3f8c5595957c11');
    const supply = await meelier.totalSupply();
    console.log("supply is:" + supply);
    const price = await meelier.getMintPrice(BigInt(supply) + BigInt(1));
    console.log("price is:" + price);
    const tx2 = await meelier.mint(10, { value: BigInt(10)*BigInt(price)});
    await tx2.wait();
    console.log("mint success,hash:"+ tx2.hash);
    const tx3 = await meelier.transferBatch2One('0x65B8A3ff22a50f2CEE9977649C77F70578D02310',[6,7,8,9,10,11,12,13,14,15]);
    await tx3.wait();
    console.log("transferFrom success,hash:"+ tx2.hash);
    
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });