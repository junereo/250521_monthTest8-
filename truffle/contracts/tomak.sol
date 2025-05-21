// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract TomakNFT is ERC721Enumerable, Ownable{
    using Strings for uint256;
    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
        Ownable(msg.sender){}

    //tokenid -> 커스텀 url
    mapping(uint256 => string) private _customTokenURIs;

    //아아템 타입 -> 민팅
    mapping(uint256 => uint256) public itemTypeMintCount;

    //아이템 타입 -> base url
    mapping(uint256 => string) public baseURIs;

    function minting(uint256 itemType, string memory customURI) public onlyOwner {
        uint256 index = ++itemTypeMintCount[itemType];
        uint256 tokenId = (itemType << 128) | index;

        _safeMint(msg.sender, tokenId);

        if (bytes(customURI).length > 0) {
            _customTokenURIs[tokenId] = customURI;
        }
    }

    //baseURI 설정 (itemType별)
    function setBaseURI(uint256 itemType) external onlyOwner {
        string memory baseURI = "ipfs://bafybeibqzd5hz5gklqje7byxibwkylwyubmr2lywebafzcqlqolsbhvmtq/";
        string memory fileName = string.concat(itemType.toString(), ".json");
        string memory uri = string.concat(baseURI, fileName);
        baseURIs[itemType] = uri;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "TomakNFT: URI query for nonexistent token");

        if (bytes(_customTokenURIs[tokenId]).length > 0) {
            return _customTokenURIs[tokenId];
        }

        (uint256 itemType, ) = decodeTokenId(tokenId); // index는 무시
        string memory uri = baseURIs[itemType];
        require(bytes(uri).length > 0, "TomakNFT: baseURI not set for itemType");

        return uri; // ✅ .json까지 완성된 값 반환
    }

    function decodeTokenId(uint256 tokenId) public pure returns (uint256 itemType, uint256 index) {
        itemType = tokenId >> 128;
        index = tokenId & ((1 << 128) - 1);
    }

    function getMintedCountByItemType(uint256 itemType) external view returns (uint256) {
        return itemTypeMintCount[itemType];
    }
}