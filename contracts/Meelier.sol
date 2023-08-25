// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract Meelier is ERC721Enumerable, Ownable {
    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public constant WHITELIST_PRICE = 0.03 ether;
    uint256 public constant NORMAL_PRICE = 0.05 ether;
    string public _baseTokenURI;
    bytes32 public _merkleRoot;
    mapping(address=>bool) public _whitelist;
    bool public _startMint = false;

    constructor(string memory name_, string memory symbol_, string memory baseTokenURI) ERC721(name_, symbol_) {
        _baseTokenURI = baseTokenURI;
    }

    function setMerkleRoot(bytes32 merkleRoot_) external onlyOwner() {
        _merkleRoot = merkleRoot_;
    }
    
    function addWhitelist(address lucky_) external onlyOwner() {
        _whitelist[lucky_] = true;
    }

    function addWhitelistBatch(address[] memory lucky_) external onlyOwner() {
        for (uint256 i = 0; i < lucky_.length; i++) {
            _whitelist[lucky_[i]] = true;
        }
    }

    function removeWhitelist(address lucky_) external onlyOwner() {
        _whitelist[lucky_] = false;
    }

    function removeWhitelistBatch(address[] memory lucky_) external onlyOwner() {
        for (uint256 i = 0; i < lucky_.length; i++) {
            _whitelist[lucky_[i]] = false;
        }
    }

    function whitelistClaim(bytes32[] calldata merkleProof_) public{
        require(!_whitelist[msg.sender], "Address has already claimed.");
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(merkleProof_, _merkleRoot, leaf), "Invalid proof.");
        _whitelist[msg.sender] = true;
    }

    function startMint() external onlyOwner() {
        _startMint = true;
    }

    function stopMint() external onlyOwner() {
        _startMint = false;
    }

    function setBaseURI(string memory baseURI_) external onlyOwner() {
        _baseTokenURI = baseURI_;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function freeMint(uint tokenId) external onlyOwner {
        require(tokenId > 0 && tokenId <= MAX_SUPPLY, "Wrong tokenId");
        uint256 ts = totalSupply();
        require(ts + 1 <= MAX_SUPPLY, "Mint exceed max supply");
        _safeMint(msg.sender, tokenId);
    }

    function freeMintBatch(uint numberOfTokens) external onlyOwner {
        uint256 ts = totalSupply();
        require(ts + numberOfTokens <= MAX_SUPPLY, "Mint exceed max supply");

        for (uint256 i = 1; i <= numberOfTokens; i++) {
            _safeMint(msg.sender, ts + i);
        }
    }

    function mint(uint tokenId) public payable {
        require(_startMint, "Mint not start");
        require(tokenId > 0 && tokenId <= MAX_SUPPLY, "Wrong tokenId");
        uint256 ts = totalSupply();
        require(ts + 1 <= MAX_SUPPLY, "Mint exceed max supply");
        uint256 total_fee = 0;
        if(_whitelist[msg.sender])
        {
            total_fee = WHITELIST_PRICE * 1;
        } else {
            total_fee = NORMAL_PRICE * 1;
        }
        require(total_fee <= msg.value, "Insufficient Ether");

        _safeMint(msg.sender, tokenId);
    }

    function mintBatch(uint numberOfTokens) public payable {
        require(_startMint, "Mint not start");
        uint256 ts = totalSupply();
        require(ts + numberOfTokens <= MAX_SUPPLY, "Mint exceed max supply");
        uint256 total_fee = 0;
        if(_whitelist[msg.sender])
        {
            total_fee = WHITELIST_PRICE * numberOfTokens;
        } else {
            total_fee = NORMAL_PRICE * numberOfTokens;
        }
        require(total_fee <= msg.value, "Insufficient Ether");

        for (uint256 i = 1; i <= numberOfTokens; i++) {
            _safeMint(msg.sender, ts + i);
        }
    }

    function withdraw() public onlyOwner {
        uint balance = address(this).balance;
        // payable(msg.sender).transfer(balance);
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
    }

}
