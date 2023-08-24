const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
  const { MerkleTree } = require('merkletreejs');
  const keccak256 = require('keccak256');


  const init_metadata_ipfs = "ipfs://QmRfgBRknoRKHyNmKdoxRdH9RJPz2NezAxatp6pru17Dcd/"
  describe("Meelier", function () {
    async function deployMeelierFixture() {
        const [owner, otherAccount] = await ethers.getSigners();

        const Meelier = await ethers.getContractFactory("Meelier");
        const meelier = await Meelier.deploy(init_metadata_ipfs);
      return { meelier, owner, otherAccount };
    }
  
    describe("Deployment", function () {
      it("Should set the right ipfs address", async function () {
        const { meelier, owner } = await loadFixture(deployMeelierFixture);
        let whitelistAddresses = [
            "0x8fbe0617F8aD2e069a13B24B5C45812F5f046BdA",
            "0xB37E523BcAbF612527e20FeAC3e5dE55B16cDe6E",
            "0xE972983086E03472109fc2aE60924b1b245A6331",
            "0xEa6D83338B535E32A3b53E87568A97685F1ce7de",
            "0x910821548927029cAfAdE56489aF2a54a63b8154",
            "0xa3B6F179c15eF0Fd09b1cA7B08BD6f6cb3f0A262",
            "0xC2a25d898EC69381ac3381593A8Dd19bb4e987A0",
            owner.address
        ]
        console.log("address list\n", whitelistAddresses);
        const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
        const merkleTree = new MerkleTree(leafNodes, keccak256, {sortPairs: true});
        const rootHash = merkleTree.getRoot();
        console.log("Merkle Tree\n", merkleTree.toString());
        await meelier.setMerkleRoot(rootHash);
        console.log("root hash:",await meelier.merkleRoot());
        const claimingAddress = leafNodes[7];
        const hexProof = merkleTree.getHexProof(claimingAddress);
        console.log("hexProof\n", hexProof);
        expect(await meelier.whitelistMint(hexProof)).not.to.be.reverted;
        expect(await meelier.whitelistClaimed(owner.address)).to.equal(true);
      });
    });
  
    describe("Mint", function () {
      describe("Validations", function () {

    });
  });
});