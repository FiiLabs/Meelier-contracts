// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract Meelier is ERC721Enumerable, Ownable {
    using Strings for uint256;
    uint256 public constant MAX_SUPPLY = 5000;
    uint256 public constant PRICE_PER_TOKEN = 0.001 ether;
    string private _baseTokenURI;
    bytes32 public merkleRoot;
    mapping(address=>bool) public whitelistClaimed;

    constructor(string memory baseTokenURI) ERC721("Meelier", "Meelier") {
        _baseTokenURI = baseTokenURI;
    }

    function setMerkleRoot(bytes32 merkleRoot_) external onlyOwner() {
        merkleRoot = merkleRoot_;
    }
    
    function whitelistMint(bytes32[] calldata _merkleProof) public{
        require(!whitelistClaimed[msg.sender], "Address has already claimed.");
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(_merkleProof, merkleRoot, leaf), "Invalid proof.");
        whitelistClaimed[msg.sender]=true;
    }

    function setBaseURI(string memory baseURI_) external onlyOwner() {
        _baseTokenURI = baseURI_;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function mint(uint numberOfTokens) public payable {
        uint256 ts = totalSupply();
        require(ts + numberOfTokens <= MAX_SUPPLY, "Purchase would exceed max tokens");
        require(PRICE_PER_TOKEN * numberOfTokens <= msg.value, "Ether value sent is not correct");

        for (uint256 i = 1; i <= numberOfTokens; i++) {
            _safeMint(msg.sender, ts + i);
        }
    }

    function withdraw() public onlyOwner {
        uint balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

}
