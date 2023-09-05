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
        const [owner, otherAccount, Alice,Bob,Charli] = await ethers.getSigners();

        const Meelier = await ethers.getContractFactory("Meelier");
        const meelier = await Meelier.deploy("Meelier", "Meelier", init_metadata_ipfs);
      return { meelier, owner, otherAccount ,Alice, Bob,Charli};
    }
  
    describe("Deployment", function () {
      it("Should set the right init parament", async function () {
        const { meelier, owner } = await loadFixture(deployMeelierFixture);
        expect(await meelier._baseTokenURI()).to.equal(init_metadata_ipfs);
        expect(await meelier.totalIssue()).to.equal(max_supply);
        expect(await meelier._issueBatchCount()).to.equal(1);
        const batch = await meelier._issueBatch(0);
        expect(batch.startIndex).to.equal(1);
        expect(batch.count).to.equal(1000);
        expect(batch.price).to.equal(nft_whitelist_price);
        expect(batch.mintWhite).to.equal(true);
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
      expect(await meelier.whitelistClaim(0, hexProof)).not.to.be.reverted;
      expect(await meelier._whitelist(0, owner.address)).to.equal(true);
      expect(await meelier._whitelistCount(0)).to.equal(1);
    });

    it("Should add and remve whitelist success", async function () {
      const { meelier, owner, otherAccount } = await loadFixture(deployMeelierFixture);
      expect(await meelier._whitelist(0, otherAccount.address)).to.equal(false);
      await meelier.addWhitelist(0, otherAccount.address);
      expect(await meelier._whitelist(0, otherAccount.address)).to.equal(true);
      expect(await meelier._whitelistCount(0)).to.equal(1);
      await meelier.removeWhitelist(0, otherAccount.address);
      expect(await meelier._whitelist(0, otherAccount.address)).to.equal(false);
      expect(await meelier._whitelistCount(0)).to.equal(0);
      const account_list = [
        "0x8fbe0617F8aD2e069a13B24B5C45812F5f046BdA",
        "0xB37E523BcAbF612527e20FeAC3e5dE55B16cDe6E",
        "0xE972983086E03472109fc2aE60924b1b245A6331",
        "0xEa6D83338B535E32A3b53E87568A97685F1ce7de",
    ];
    await meelier.addWhitelistBatch(0, account_list);
    for(let i=0;i<account_list.length;i++) {
      expect(await meelier._whitelist(0, account_list[i])).to.equal(true);
    }
    expect(await meelier._whitelistCount(0)).to.equal(4);
    await meelier.removeWhitelistBatch(0, account_list);
    for(let i=0;i<account_list.length;i++) {
      expect(await meelier._whitelist(0, account_list[i])).to.equal(false);
    }
    expect(await meelier._whitelistCount(0)).to.equal(0);
    });
    it("Add and remve whitelist should be owner", async function () {
      const { meelier, owner, otherAccount } = await loadFixture(deployMeelierFixture);
      expect(await meelier._whitelist(0, otherAccount.address)).to.equal(false);
      await expect(meelier.connect(otherAccount).addWhitelist(0, otherAccount.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      expect(await meelier.addWhitelist(0, otherAccount.address)).not.to.be.reverted;
      expect(await meelier._whitelist(0, otherAccount.address)).to.equal(true);
      await expect(meelier.connect(otherAccount).removeWhitelist(0, otherAccount.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      expect(await meelier.removeWhitelist(0, otherAccount.address)).not.to.be.reverted;
      expect(await meelier._whitelist(0, otherAccount.address)).to.equal(false);
      const account_list = [
        "0x8fbe0617F8aD2e069a13B24B5C45812F5f046BdA",
        "0xB37E523BcAbF612527e20FeAC3e5dE55B16cDe6E",
        "0xE972983086E03472109fc2aE60924b1b245A6331",
        "0xEa6D83338B535E32A3b53E87568A97685F1ce7de",
    ];
      await expect(meelier.connect(otherAccount).addWhitelistBatch(0, account_list)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      await expect(meelier.connect(otherAccount).removeWhitelistBatch(0, account_list)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
    });

    describe("Mint", function () {
      it("Mint check", async function () {
        const { meelier, owner } = await loadFixture(deployMeelierFixture);
        await meelier.startMint(0);
        expect(await meelier.isMinted(await meelier.totalSupply())).to.equal(false);
        await expect(meelier.mint(1, { value: nft_whitelist_price })).to.be.revertedWith(
          "Mint only whitelist"
        );
        // add whitelist,then mint success
        expect(await meelier.addWhitelist(0, owner.address)).not.to.be.reverted;
        await expect(meelier.mint(1, { value: nft_whitelist_price })).not.to.be.reverted;
        expect(await meelier.isMinted(await meelier.totalSupply())).to.equal(true);
      });

      it("Mint 50 for market", async function () {
        const { meelier, owner, otherAccount} = await loadFixture(deployMeelierFixture);
        await meelier.startMint(0);
        // expect(await meelier.updateIssueBatch(0, 1, 1000, nft_normal_price, false)).not.to.be.reverted;
        expect(await meelier.totalSupply()).to.equal(0);
        expect(await meelier.totalIssue()).to.equal(1000);
        for(let i=1;i<=50;i++) {
          expect(await meelier.isMinted(i)).to.equal(false);
        }
        expect(await meelier.addWhitelist(0, owner.address)).not.to.be.reverted;
        // owner mint nft no matter then _startMint is set or not
        expect(await meelier.mint(50, { value: nft_whitelist_price*BigInt(50) })).not.to.be.reverted;
        for(let i=1;i<=50;i++) {
          expect(await meelier.isMinted(i)).to.equal(true);
          expect(await meelier.ownerOf(i)).to.equal(owner.address);
          expect(await meelier.safeTransferFrom(owner.address, otherAccount.address, i)).not.to.be.reverted;
          expect(await meelier.ownerOf(i)).to.equal(otherAccount.address);
        }
        expect(await meelier.totalSupply()).to.equal(50);
        expect(await meelier.totalIssue()).to.equal(1000);
      });
      it("Mint list", async function () {
        const { meelier, owner, otherAccount} = await loadFixture(deployMeelierFixture);
        await meelier.startMint(0);
        expect(await meelier.updateIssueBatch(0, 1, 1000, nft_normal_price, false)).not.to.be.reverted;
        await expect(meelier.mint(50, { value: nft_normal_price*BigInt(50) })).not.to.be.reverted;
        const nft_count = await meelier.balanceOf(owner.address);
        expect(nft_count).to.equal(50);
        for(let i=1;i<=50;i++) {
          expect(await meelier.tokenOfOwnerByIndex(owner.address, i-1)).to.equal(i);
        }
        // console.log(await meelier.mintList());
        await expect(meelier.connect(otherAccount).mint(50, { value: nft_normal_price*BigInt(50) })).not.to.be.reverted;
        // console.log(await meelier.connect(otherAccount).mintList());
      });
      it("mint batch and transfer batch", async function () {
        const { meelier, owner} = await loadFixture(deployMeelierFixture);
        await meelier.startMint(0);
        expect(await meelier.addWhitelist(0, owner.address)).not.to.be.reverted;
        await expect(meelier.mint(50, { value: nft_whitelist_price*BigInt(50) })).not.to.be.reverted;
        const account_list = [
          "0x8fbe0617F8aD2e069a13B24B5C45812F5f046BdA",
          "0xB37E523BcAbF612527e20FeAC3e5dE55B16cDe6E",
          "0xE972983086E03472109fc2aE60924b1b245A6331",
          "0xEa6D83338B535E32A3b53E87568A97685F1ce7de",
      ];
        for(let i=1;i<=4;i++) {
          expect(await meelier.isMinted(i)).to.equal(true);
          expect(await meelier.ownerOf(i)).to.equal(owner.address);
        }
        const tokenIds1 = [
          1,2,3,4
      ];
      await expect(meelier.transferBatch2One(account_list[0], tokenIds1)).not.to.be.reverted;
      for(let i=1;i<=4;i++) {
        expect(await meelier.ownerOf(i)).not.to.equal(owner.address);
        expect(await meelier.ownerOf(i)).to.equal(account_list[0]);
      }
      const tokenIds2 = [
        5,6,7,8
    ];
      await expect(meelier.transferBatch2Many(account_list, tokenIds2)).not.to.be.reverted;
      for(let i=5;i<=8;i++) {
        expect(await meelier.ownerOf(i)).not.to.equal(owner.address);
        expect(await meelier.ownerOf(i)).to.equal(account_list[i-5]);
      }
      console.log(await meelier.mintList());
      console.log(await meelier.balanceOf(owner.address));
      await expect(meelier.transferAll2One(account_list[0])).not.to.be.reverted;
      console.log(await meelier.mintList());
      for(let i=9;i<=50;i++) {
        expect(await meelier.ownerOf(i)).not.to.equal(owner.address);
        expect(await meelier.ownerOf(i)).to.equal(account_list[0]);
      }
      });

    });
  });
  describe("withdraw", function () {
    it("withdraw by owner", async function () {
      const { meelier, owner, otherAccount} = await loadFixture(deployMeelierFixture);
      await meelier.startMint(0);
      expect(await meelier.addWhitelist(0, owner.address)).not.to.be.reverted;
      console.log("=================before mint:" + await ethers.provider.getBalance(owner.address));
      await expect(meelier.mint(1, { value: nft_whitelist_price })).not.to.be.reverted;
      console.log("=================after mint:" + await ethers.provider.getBalance(owner.address));
      await expect(meelier.connect(otherAccount).withdraw()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      await meelier.withdraw();
      console.log("=================after withdraw:" + await ethers.provider.getBalance(owner.address));
    });
    it("withdraw by proposal 1", async function () {
      const { meelier, owner, otherAccount, Alice,Bob,Charli} = await loadFixture(deployMeelierFixture);
      const testAddress="0x8fbe0617F8aD2e069a13B24B5C45812F5f046BdA";
      await meelier.startMint(0);
      expect(await meelier.addWhitelist(0, owner.address)).not.to.be.reverted;
      await expect(meelier.mint(1, { value: nft_whitelist_price })).not.to.be.reverted;
      expect(await meelier.grantRole("0x0000000000000000000000000000000000000000000000000000000000000000", Alice.address)).not.to.be.reverted;
      expect(await meelier.makeProposalForWithdraw(testAddress)).not.to.be.reverted;
      expect(await meelier.connect(Alice).supportProposalForWithdraw(0)).not.to.be.reverted;
      await expect(meelier.connect(Bob).supportProposalForWithdraw(0)).to.be.revertedWith(
        "AccessControl: account "+Bob.address.toLowerCase()+" is missing role 0x0000000000000000000000000000000000000000000000000000000000000000"
      );
      expect(await meelier.grantRole("0x0000000000000000000000000000000000000000000000000000000000000000", Bob.address)).not.to.be.reverted;
      expect(await meelier.connect(Bob).supportProposalForWithdraw(0)).not.to.be.reverted;
      expect(await ethers.provider.getBalance(testAddress)).to.equal(nft_whitelist_price);
    });
    it("withdraw by proposal 2", async function () {
      const { meelier, owner, otherAccount, Alice,Bob,Charli} = await loadFixture(deployMeelierFixture);
      const testAddress="0x8fbe0617F8aD2e069a13B24B5C45812F5f046BdA";
      await meelier.startMint(0);
      expect(await meelier.addWhitelist(0, owner.address)).not.to.be.reverted;
      await expect(meelier.mint(1, { value: nft_whitelist_price })).not.to.be.reverted;
      expect(await meelier.grantRole("0x0000000000000000000000000000000000000000000000000000000000000000", Alice.address)).not.to.be.reverted;
      expect(await meelier.grantRole("0x0000000000000000000000000000000000000000000000000000000000000000", Bob.address)).not.to.be.reverted;
      expect(await meelier.grantRole("0x0000000000000000000000000000000000000000000000000000000000000000", Charli.address)).not.to.be.reverted;
      expect(await meelier.makeProposalForWithdraw(testAddress)).not.to.be.reverted;
      expect(await meelier.connect(Alice).supportProposalForWithdraw(0)).not.to.be.reverted;
      expect(await ethers.provider.getBalance(testAddress)).to.equal(nft_whitelist_price);
      expect(await meelier.addWhitelist(0, otherAccount.address)).not.to.be.reverted;
      await expect(meelier.connect(otherAccount).mint(1, { value: nft_whitelist_price })).not.to.be.reverted;
      expect(await meelier.connect(Alice).makeProposalForWithdraw(testAddress)).not.to.be.reverted;
      expect(await meelier.connect(Bob).supportProposalForWithdraw(1)).not.to.be.reverted;
      expect(await ethers.provider.getBalance(testAddress)).to.equal(nft_whitelist_price*BigInt(2));
      expect(await meelier.connect(Charli).supportProposalForWithdraw(1)).not.to.be.reverted;
      expect(await meelier._withdrawProposalCount()).to.equal(2);
      const proposal = await meelier._withdrawProposalList(1);
      expect(proposal.execute).to.equal(true);

    });
    it("withdraw by proposal 3", async function () {
      const { meelier, owner, otherAccount, Alice,Bob,Charli} = await loadFixture(deployMeelierFixture);
      const testAddress="0x8fbe0617F8aD2e069a13B24B5C45812F5f046BdA";
      await meelier.startMint(0);
      expect(await meelier.addWhitelist(0, owner.address)).not.to.be.reverted;
      await expect(meelier.mint(1, { value: nft_whitelist_price })).not.to.be.reverted;
      expect(await meelier.grantRole("0x0000000000000000000000000000000000000000000000000000000000000000", Alice.address)).not.to.be.reverted;
      expect(await meelier.grantRole("0x0000000000000000000000000000000000000000000000000000000000000000", Bob.address)).not.to.be.reverted;
      expect(await meelier.grantRole("0x0000000000000000000000000000000000000000000000000000000000000000", Charli.address)).not.to.be.reverted;
      expect(await meelier.setThreshold(3)).not.to.be.reverted;
      expect(await meelier.makeProposalForWithdraw(testAddress)).not.to.be.reverted;
      expect(await meelier.connect(Alice).supportProposalForWithdraw(0)).not.to.be.reverted;
      expect(await ethers.provider.getBalance(testAddress)).to.equal(0);
      expect(await meelier.connect(Bob).supportProposalForWithdraw(0)).not.to.be.reverted;
      expect(await ethers.provider.getBalance(testAddress)).to.equal(nft_whitelist_price);

    });
    it("withdraw by proposal 4", async function () {
      const { meelier, owner, otherAccount, Alice,Bob,Charli} = await loadFixture(deployMeelierFixture);
      const testAddress="0x8fbe0617F8aD2e069a13B24B5C45812F5f046BdA";
      await meelier.startMint(0);
      expect(await meelier.addWhitelist(0, owner.address)).not.to.be.reverted;
      await expect(meelier.mint(1, { value: nft_whitelist_price })).not.to.be.reverted;
      expect(await meelier.grantRole("0x0000000000000000000000000000000000000000000000000000000000000000", Alice.address)).not.to.be.reverted;
      expect(await meelier.grantRole("0x0000000000000000000000000000000000000000000000000000000000000000", Bob.address)).not.to.be.reverted;
      expect(await meelier.grantRole("0x0000000000000000000000000000000000000000000000000000000000000000", Charli.address)).not.to.be.reverted;
      expect(await meelier.setThreshold(3)).not.to.be.reverted;
      expect(await ethers.provider.getBalance(testAddress)).to.equal(0);
      expect(await meelier.makeProposalForWithdraw(testAddress)).not.to.be.reverted;
      expect(await meelier.connect(Alice).supportProposalForWithdraw(0)).not.to.be.reverted;
      expect(await ethers.provider.getBalance(testAddress)).to.equal(0);
      expect(await meelier.setThreshold(2)).not.to.be.reverted;
      expect(await ethers.provider.getBalance(testAddress)).to.equal(nft_whitelist_price);
      // TODO:update threshold should refresh???
      // expect(await meelier.connect(Bob).supportProposalForWithdraw(0)).not.to.be.reverted;
    });
  });
});