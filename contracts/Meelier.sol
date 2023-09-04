// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/interfaces/IERC4906.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Meelier is ERC721Enumerable, Ownable, IERC4906, AccessControl{
    using SafeMath for uint256;
    uint256 private _total_issue;
    string public _baseTokenURI;
    bytes32 public _merkleRoot;
    mapping(uint=>mapping(address=>bool)) public _whitelist;
    mapping(uint=>uint) public _whitelistCount;
    struct issueBatchData{
        uint256 startIndex;
        uint256 count;
        uint256 price;
        bool mintWhite;
    }
    mapping(uint=>issueBatchData) public _issueBatch;
    uint256 public _issueBatchCount;
    mapping(uint=>bool) public _startMint;
    uint256 private _whitelistMintLimit;
    uint256 private _threshold;
    struct withdrawProposal {
        address proposer;
        address[] supporters;
        address beneficiary;
        bool execute;
    }
    mapping(uint=>withdrawProposal) public _withdrawProposalList;
    uint256 public _withdrawProposalCount;

    event makeWithdrawProposal(address proposer, address beneficiary, uint id);
    event executeWithdrawProposal(uint id);

    constructor(string memory name_, string memory symbol_, string memory baseTokenURI_) ERC721(name_, symbol_) {
        _baseTokenURI = baseTokenURI_;
        _issueBatch[0] = issueBatchData({
            startIndex: 1,
            count: 1000,
            price: 0.03 ether,
            mintWhite: true
        });
        _issueBatchCount = 1;
        _total_issue = 1000;
        _whitelistMintLimit = 1;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _threshold = 2; // 2/3
    }
    
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable,AccessControl,IERC165) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function addIssueBatch(uint256 startIndex_, uint256 count_,uint256 price_, bool mintWhite_) external onlyOwner() {
        _issueBatch[_issueBatchCount] = issueBatchData(startIndex_, count_, price_, mintWhite_);
        _issueBatchCount = _issueBatchCount.add(1);
    }

    function updateIssueBatch(uint256 index_, uint256 startIndex_, uint256 count_,uint256 price_, bool mintWhite_) external onlyOwner() {
        require(index_ < _issueBatchCount, "Index out of bound");
        _issueBatch[index_].startIndex =  startIndex_;
        _issueBatch[index_].count =  count_;
        _issueBatch[index_].price =  price_;
        _issueBatch[index_].mintWhite =  mintWhite_;
    }

    function removeIssueBatch() external onlyOwner() {
        require(_issueBatchCount > 0, "Batch empty");
        delete _issueBatch[_issueBatchCount.sub(1)];
        _issueBatchCount = _issueBatchCount.sub(1);
    }

    function setTotalIssue(uint256 total_issue_) external onlyOwner() {
        _total_issue = total_issue_;
    }

    function setThreshold(uint256 threshold_) external onlyOwner() {
        _threshold = threshold_;
        if(_withdrawProposalCount > 0) {
            tryExecuteWithdrawProposal(_withdrawProposalCount.sub(1));
        }
    }

    function setWhitelistMintLimit(uint256 whitelistMintLimit_) external onlyOwner() {
        _whitelistMintLimit = whitelistMintLimit_;
    }

    function whitelistMintLimit() public view returns (uint256) {
        return _whitelistMintLimit;
    }

    function totalIssue() public view returns (uint256) {
        return _total_issue;
    }

    function setMerkleRoot(bytes32 merkleRoot_) external onlyOwner() {
        _merkleRoot = merkleRoot_;
    }
    
    function addWhitelist(uint256 index_,address lucky_) external onlyOwner() {
        require(index_ < _issueBatchCount, "Index out of batch bound");
        if(!_whitelist[index_][lucky_]) {
            _whitelist[index_][lucky_] = true;
            _whitelistCount[index_] = _whitelistCount[index_].add(1);
        }
    }

    function addWhitelistBatch(uint256 index_, address[] memory lucky_) external onlyOwner() {
        require(index_ < _issueBatchCount, "Index out of batch bound");
        uint256 count = lucky_.length;
        for (uint256 i = 0; i < count; i++) {
            if(!_whitelist[index_][lucky_[i]]) {
                _whitelist[index_][lucky_[i]] = true;
                _whitelistCount[index_] = _whitelistCount[index_].add(1);
            }
        }
    }

    function removeWhitelist(uint256 index_, address lucky_) external onlyOwner() {
        require(index_ < _issueBatchCount, "Index out of batch bound");
        if(_whitelist[index_][lucky_]) {
            _whitelist[index_][lucky_] = false;
            _whitelistCount[index_] = _whitelistCount[index_].sub(1);
        }
    }

    function removeWhitelistBatch(uint256 index_, address[] memory lucky_) external onlyOwner() {
        require(index_ < _issueBatchCount, "Index out of batch bound");
        uint256 count = lucky_.length;
        for (uint256 i = 0; i < count; i++) {
            if(_whitelist[index_][lucky_[i]]) {
                _whitelist[index_][lucky_[i]] = false;
                _whitelistCount[index_] = _whitelistCount[index_].sub(1);
            }
        }
    }

    function whitelistClaim(uint256 index_, bytes32[] calldata merkleProof_) public{
        require(!_whitelist[index_][msg.sender], "Address has already claimed.");
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(merkleProof_, _merkleRoot, leaf), "Invalid proof.");
        _whitelist[index_][msg.sender] = true;
        _whitelistCount[index_] = _whitelistCount[index_].add(1);
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
        emit BatchMetadataUpdate(1, _total_issue.sub(1));
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function burn(uint256 tokenId_) public onlyOwner {
        require(tokenId_ > 0 && tokenId_ <= _total_issue, "Wrong tokenId");
        require(_exists(tokenId_), "Only burn minted");
        _burn(tokenId_);
    }

    function getMintPrice(uint tokenId_) public view returns (uint256) {
        uint256 startIndex = 0;
        uint256 endIndex = 0;
        uint256 price = 0;
        for (uint i = 0; i < _issueBatchCount; i++) {
            issueBatchData memory batchData = _issueBatch[i];
            startIndex = batchData.startIndex;
            endIndex = batchData.startIndex.add(batchData.count);
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
            endIndex = batchData.startIndex.add(batchData.count);
            if(tokenId_ >=startIndex && tokenId_ < endIndex) {
                batch = i;
                break;
            }
        }
        return batch;
    }

    function mint(uint numberOfTokens_) public payable {
        uint256 ts = totalSupply();
        uint256 firstId = ts.add(1);
        uint256 batch = tokenIndex2Batch(firstId);
        require(_startMint[batch]&& batch != type(uint256).max, "Mint not start");
        require(ts.add(numberOfTokens_) <= _total_issue, "Mint exceed max issued");
        require(numberOfTokens_ > 0, "At least mint one");
        require(ts.add(numberOfTokens_) < _issueBatch[batch].startIndex.add(_issueBatch[batch].count), "Mint exceed batch issued");
        if(_issueBatch[batch].mintWhite) {
            require(_whitelist[batch][msg.sender], "Mint only whitelist");
            // owner can mint more
            require(balanceOf(msg.sender).add(numberOfTokens_)<= _whitelistMintLimit || owner() == _msgSender(), "Exceed whitelist mint limit");
        }
        uint256 total_fee = _issueBatch[batch].price.mul(numberOfTokens_);
        require(total_fee <= msg.value, "Insufficient funds");

        for (uint256 i = 1; i <= numberOfTokens_; i++) {
            _safeMint(msg.sender, ts.add(i));
        }
    }

    function mintList() external view returns (uint256[] memory) {
        uint256 count = balanceOf(msg.sender);
        uint256[] memory newArray = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            newArray[i] = tokenOfOwnerByIndex(msg.sender, i);
        }
        return newArray;
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

    function makeProposalForWithdraw(address beneficiary_) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!_withdrawProposalList[_withdrawProposalCount].execute, "only one proposal on the same time");
        address [] memory supporters=new address[](1);
        supporters[0]=msg.sender;
        _withdrawProposalList[_withdrawProposalCount] = withdrawProposal(msg.sender, supporters, beneficiary_, false);
        emit makeWithdrawProposal(msg.sender, beneficiary_, _withdrawProposalCount);
        _withdrawProposalCount = _withdrawProposalCount.add(1);
    }

    function tryExecuteWithdrawProposal(uint256 proposalId_) private {
        address[] memory supporters = _withdrawProposalList[proposalId_].supporters;
        uint supporter_count = supporters.length;
        if(supporter_count>=_threshold && !_withdrawProposalList[proposalId_].execute) {
            uint balance = address(this).balance;
            Address.sendValue(payable(_withdrawProposalList[proposalId_].beneficiary), balance);
            _withdrawProposalList[proposalId_].execute = true;
            emit executeWithdrawProposal(proposalId_);
        }
    }

    function supportProposalForWithdraw(uint256 proposalId_) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(proposalId_ < _withdrawProposalCount, "wrong proposalId_");
        address[] memory supporters = _withdrawProposalList[proposalId_].supporters;
        for (uint i = 0; i < supporters.length; i++) {
            if(supporters[i]==msg.sender) {
                return;
            }
        }
        _withdrawProposalList[proposalId_].supporters.push(msg.sender);
        tryExecuteWithdrawProposal(proposalId_);
    }
}
