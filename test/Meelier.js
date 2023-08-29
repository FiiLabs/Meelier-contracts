const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
  const { MerkleTree } = require('merkletreejs');
  const keccak256 = require('keccak256');


  const init_metadata_ipfs = "ipfs://QmRfgBRknoRKHyNmKdoxRdH9RJPz2NezAxatp6pru17Dcd/"
  const max_supply = 1000
  const nft_normal_price = BigInt(50000000000000000)
  const nft_whitelist_price = BigInt(30000000000000000)
  const start_mint = false
  describe("Meelier", function () {
    async function deployMeelierFixture() {
        const [owner, otherAccount] = await ethers.getSigners();

        const Meelier = await ethers.getContractFactory("Meelier");
        const meelier = await Meelier.deploy("Meelier", "Meelier", init_metadata_ipfs);
      return { meelier, owner, otherAccount };
    }
  
    describe("Deployment", function () {
      it("Should set the right init parament", async function () {
        const { meelier, owner } = await loadFixture(deployMeelierFixture);
        expect(await meelier._baseTokenURI()).to.equal(init_metadata_ipfs);
        expect(await meelier.totalIssue()).to.equal(max_supply);
        expect(await meelier._issueBatchCount()).to.equal(2);
        const batch = await meelier._issueBatch(0);
        expect(batch.startIndex).to.equal(51);
        expect(batch.count).to.equal(450);
        expect(batch.price).to.equal(nft_whitelist_price);
        expect(batch.mintWhite).to.equal(true);
        const batch1 = await meelier._issueBatch(1);
        expect(batch1.startIndex).to.equal(501);
        expect(batch1.count).to.equal(500);
        expect(batch1.price).to.equal(nft_normal_price);
        expect(batch1.mintWhite).to.equal(false);
        expect(await meelier._startMint(0)).to.equal(start_mint);
        expect(await meelier._startMint(1)).to.equal(start_mint);
      });
    });
  
    describe("Mint", function () {
    describe("Whitelist", function () {
      it("Should claim whitelist success", async function () {
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
      // console.log("address list\n", whitelistAddresses);
      const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
      const merkleTree = new MerkleTree(leafNodes, keccak256, {sortPairs: true});
      const rootHash = merkleTree.getRoot();
      // console.log("Merkle Tree\n", merkleTree.toString());
      await meelier.setMerkleRoot(rootHash);
      // console.log("root hash:",await meelier.merkleRoot());
      const claimingAddress = leafNodes[7];
      const hexProof = merkleTree.getHexProof(claimingAddress);
      // console.log("hexProof\n", hexProof);
      expect(await meelier.whitelistClaim(hexProof)).not.to.be.reverted;
      expect(await meelier._whitelist(owner.address)).to.equal(true);
    });

    it("Should add and remve whitelist success", async function () {
      const { meelier, owner, otherAccount } = await loadFixture(deployMeelierFixture);
      expect(await meelier._whitelist(otherAccount.address)).to.equal(false);
      await meelier.addWhitelist(otherAccount.address);
      expect(await meelier._whitelist(otherAccount.address)).to.equal(true);
      await meelier.removeWhitelist(otherAccount.address);
      expect(await meelier._whitelist(otherAccount.address)).to.equal(false);
      const account_list = [
        "0x8fbe0617F8aD2e069a13B24B5C45812F5f046BdA",
        "0xB37E523BcAbF612527e20FeAC3e5dE55B16cDe6E",
        "0xE972983086E03472109fc2aE60924b1b245A6331",
        "0xEa6D83338B535E32A3b53E87568A97685F1ce7de",
    ];
    await meelier.addWhitelistBatch(account_list);
    for(let i=0;i<account_list.length;i++) {
      expect(await meelier._whitelist(account_list[i])).to.equal(true);
    }
    await meelier.removeWhitelistBatch(account_list);
    for(let i=0;i<account_list.length;i++) {
      expect(await meelier._whitelist(account_list[i])).to.equal(false);
    }
    });
    it("Add and remve whitelist should be owner", async function () {
      const { meelier, owner, otherAccount } = await loadFixture(deployMeelierFixture);
      expect(await meelier._whitelist(otherAccount.address)).to.equal(false);
      await expect(meelier.connect(otherAccount).addWhitelist(otherAccount.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      expect(await meelier.addWhitelist(otherAccount.address)).not.to.be.reverted;
      expect(await meelier._whitelist(otherAccount.address)).to.equal(true);
      await expect(meelier.connect(otherAccount).removeWhitelist(otherAccount.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      expect(await meelier.removeWhitelist(otherAccount.address)).not.to.be.reverted;
      expect(await meelier._whitelist(otherAccount.address)).to.equal(false);
      const account_list = [
        "0x8fbe0617F8aD2e069a13B24B5C45812F5f046BdA",
        "0xB37E523BcAbF612527e20FeAC3e5dE55B16cDe6E",
        "0xE972983086E03472109fc2aE60924b1b245A6331",
        "0xEa6D83338B535E32A3b53E87568A97685F1ce7de",
    ];
      await expect(meelier.connect(otherAccount).addWhitelistBatch(account_list)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      await expect(meelier.connect(otherAccount).removeWhitelistBatch(account_list)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
    });

    describe("Mint", function () {
      it("Mint check", async function () {
        const { meelier, owner } = await loadFixture(deployMeelierFixture);
        await meelier.startMint(0);
        await meelier.startMint(1);
        //tokenId wrong
        let  tokenId = max_supply + 1
        await expect(meelier.mint(tokenId, { value: nft_normal_price })).to.be.revertedWith(
          "Wrong tokenId"
        );
        tokenId = max_supply
        await expect(meelier.mint(tokenId, { value: nft_normal_price })).not.to.be.reverted;
        tokenId = 0
        await expect(meelier.mint(tokenId, { value: nft_normal_price })).to.be.revertedWith(
          "Wrong tokenId"
        );
        tokenId = max_supply - 1
        await expect(meelier.mint(tokenId, { value: nft_normal_price })).not.to.be.reverted;
        tokenId = 51
        await expect(meelier.mint(tokenId, { value: nft_normal_price })).to.be.revertedWith(
          "Mint only whitelist"
        );
        // add whitelist,then mint success
        expect(await meelier.addWhitelist(owner.address)).not.to.be.reverted;
        await expect(meelier.mint(tokenId, { value: nft_whitelist_price })).not.to.be.reverted;
        tokenId = 501
        await expect(meelier.mint(tokenId, { value: nft_normal_price })).not.to.be.reverted;
        expect(await meelier.isMinted(tokenId)).to.equal(true);
      });

      it("Mint 50 for market", async function () {
        const { meelier, owner, otherAccount} = await loadFixture(deployMeelierFixture);
        expect(await meelier.totalSupply()).to.equal(0);
        expect(await meelier.totalIssue()).to.equal(1000);
        for(let i=1;i<=50;i++) {
          expect(await meelier.isMinted(i)).to.equal(false);
        }
        // owner mint nft no matter then _startMint is set or not
        expect(await meelier.freeMintBatch(50)).not.to.be.reverted;
        for(let i=1;i<=50;i++) {
          expect(await meelier.isMinted(i)).to.equal(true);
          expect(await meelier.ownerOf(i)).to.equal(owner.address);
          expect(await meelier.safeTransferFrom(owner.address, otherAccount.address, i)).not.to.be.reverted;
          expect(await meelier.ownerOf(i)).to.equal(otherAccount.address);
        }
        expect(await meelier.totalIssue()).to.equal(1000);
      });
      it("Mint list", async function () {
        const { meelier, owner, otherAccount} = await loadFixture(deployMeelierFixture);
        await meelier.startMint(1);
        await expect(meelier.mintBatch(1, 50, { value: nft_normal_price*BigInt(50) })).not.to.be.reverted;
        const nft_count = await meelier.balanceOf(owner.address);
        expect(nft_count).to.equal(50);
        for(let i=1;i<=50;i++) {
          expect(await meelier.tokenOfOwnerByIndex(owner.address, i-1)).to.equal(i);
        }
      });
    });
  });


});