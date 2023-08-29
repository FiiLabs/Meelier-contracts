// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract Meelier is ERC721Enumerable, Ownable {
    uint256 private _total_issue;
    string public _baseTokenURI;
    bytes32 public _merkleRoot;
    mapping(address=>bool) public _whitelist;
    struct issueBatchData{
        uint256 startIndex;
        uint256 count;
        uint256 price;
        bool mintWhite;
    }
    mapping(uint=>issueBatchData) public _issueBatch;
    uint256 public _issueBatchCount;
    mapping(uint=>bool) public _startMint;

    constructor(string memory name_, string memory symbol_, string memory baseTokenURI_) ERC721(name_, symbol_) {
        _baseTokenURI = baseTokenURI_;
        _issueBatch[0] = issueBatchData(51, 450, 0.03 ether, true);
        _issueBatch[1] = issueBatchData(501, 500, 0.05 ether, false);
        _issueBatchCount = 2;
        _total_issue = 1000;
    }

    function addIssueBatch(uint256 startIndex_, uint256 count_,uint256 price_, bool mintWhite_) external onlyOwner() {
        _issueBatch[_issueBatchCount] = issueBatchData(startIndex_, count_, price_, mintWhite_);
        _issueBatchCount+=1;
    }

    function updateIssueBatch(uint256 index_, uint256 startIndex_, uint256 count_,uint256 price_, bool mintWhite_) external onlyOwner() {
        require(index_ < _issueBatchCount, "Index out of bound");
        _issueBatch[index_] = issueBatchData(startIndex_, count_, price_, mintWhite_);
    }

    function setTotalIssue(uint256 total_issue_) external onlyOwner() {
        _total_issue = total_issue_;
    }

    function totalIssue() public view returns (uint256) {
        return _total_issue;
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

    function startMint(uint batchIndex_) external onlyOwner() {
        require(batchIndex_ < _issueBatchCount, "Index out of bound");
        _startMint[batchIndex_] = true;
    }

    function stopMint(uint batchIndex_) external onlyOwner() {
        require(batchIndex_ < _issueBatchCount, "Index out of bound");
        _startMint[batchIndex_] = false;
    }

    function setBaseURI(string memory baseURI_) external onlyOwner() {
        _baseTokenURI = baseURI_;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    // function freeMint(uint tokenId_) external onlyOwner {
    //     require(tokenId_ > 0 && tokenId_ <= _total_issue, "Wrong tokenId");
    //     _safeMint(msg.sender, tokenId_);
    // }

    // function freeMintBatch(uint numberOfTokens_) external onlyOwner {
    //     uint256 ts = totalSupply();
    //     require(numberOfTokens_ > 0 && ts + numberOfTokens_ <= _total_issue, "Wrong number");
    //     for (uint256 i = 1; i <= numberOfTokens_; i++) {
    //         _safeMint(msg.sender, ts + i);
    //     }
    // }
    function mintBatchByOwner(uint batch_, uint numberOfTokens_) public payable onlyOwner{
        uint256 ts = totalSupply();
        require(ts + numberOfTokens_ <= _total_issue, "Mint exceed max issued");

        uint256 total_fee = _issueBatch[batch_].price* numberOfTokens_;
        require(total_fee <= msg.value, "Insufficient funds");

        for (uint256 i = 1; i <= numberOfTokens_; i++) {
            _safeMint(msg.sender, ts + i);
        }
    }

    function getMintPrice(uint tokenId_) public view returns (uint256) {
        uint256 startIndex = 0;
        uint256 endIndex = 0;
        uint256 price = 0;
        for (uint i = 0; i < _issueBatchCount; i++) {
            issueBatchData memory batchData = _issueBatch[i];
            startIndex = batchData.startIndex;
            endIndex = batchData.startIndex + batchData.count;
            if(tokenId_ >=startIndex && tokenId_ < endIndex) {
                price = batchData.price;
                break;
            }
        }
        return price;
    }

    function tokenIndex2Batch(uint tokenId_) internal view returns (uint256){
        uint256 startIndex = 0;
        uint256 endIndex = 0;
        uint256 batch = type(uint256).max;
        for (uint i = 0; i < _issueBatchCount; i++) {
            issueBatchData memory batchData = _issueBatch[i];
            startIndex = batchData.startIndex;
            endIndex = batchData.startIndex + batchData.count;
            if(tokenId_ >=startIndex && tokenId_ < endIndex) {
                batch = i;
                break;
            }
        }
        return batch;
    }

    function mint(uint tokenId_) public payable {
        require(tokenId_ > 0 && tokenId_ <= _total_issue, "Wrong tokenId");
        uint batch = tokenIndex2Batch(tokenId_);
        require(_startMint[batch]&& batch != type(uint256).max, "Mint not start");
        uint256 ts = totalSupply();
        require(ts + 1 <= _total_issue, "Mint exceed max issued");
        uint256 total_fee = getMintPrice(tokenId_);
        if(_issueBatch[batch].mintWhite) {
            require(_whitelist[msg.sender], "Mint only whitelist");
        }

        require(total_fee <= msg.value, "Insufficient funds");

        _safeMint(msg.sender, tokenId_);
    }

    function mintBatch(uint batch_, uint numberOfTokens_) public payable {
        require(_startMint[batch_], "Mint not start");
        uint256 ts = totalSupply();
        require(ts + numberOfTokens_ <= _total_issue, "Mint exceed max issued");

        if(_issueBatch[batch_].mintWhite) {
            require(_whitelist[msg.sender], "Mint only whitelist");
        }
        uint256 total_fee = _issueBatch[batch_].price* numberOfTokens_;
        require(total_fee <= msg.value, "Insufficient funds");

        for (uint256 i = 1; i <= numberOfTokens_; i++) {
            _safeMint(msg.sender, ts + i);
        }
    }
    function isMinted(uint256 tokenId_) external view returns (bool) {
        require(
            tokenId_ <= _total_issue,
            "tokenId outside collection bounds"
        );
        return _exists(tokenId_);
    }

    function withdraw() public onlyOwner {
        uint balance = address(this).balance;
        Address.sendValue(payable(owner()), balance);
    }

}
