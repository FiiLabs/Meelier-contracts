// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

contract TNFT is ERC721Enumerable, Ownable{
    address _otherNFT;
    constructor(address otherNFT_) ERC721("TNFT", "TNFT") {
        _otherNFT = otherNFT_;
    }

    function burn(uint256 tokenId_) external {
        ERC721Burnable(_otherNFT).burn(tokenId_);
    }
}