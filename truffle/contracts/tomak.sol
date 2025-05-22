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

    function purchase(uint256 tokenId) public payable {
        require(_ownerOf(tokenId) != address(0), "TomakNFT: URI query for nonexistent token");
        address currentOwner = ownerOf(tokenId);
        require(currentOwner != msg.sender, "You Already Own this token");
        require(
            getApproved(tokenId) == address(this) || isApprovedForAll(currentOwner, address(this)),
            "Contract not approved for transfer"
        );
        require(msg.value == 0.0001 ether, "Price is 0.0001 ether");

        // 이더 전송
        payable(currentOwner).transfer(msg.value);

        // 이 컨트랙트가 대신 소유권 이전
        // from, to, tokenId
        _transfer(currentOwner, msg.sender, tokenId);
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

    //현재 내가 보유중인 nft
    function getOwnedTokenIds(address owner) external view returns (uint256[] memory) {
        uint256 count = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        return tokenIds;
    }

    function getAllTokenInfos() external view returns (uint256[] memory tokenIds, string[] memory uris) {
        uint256 total = totalSupply();
        tokenIds = new uint256[](total);
        uris = new string[](total);
        for (uint256 i = 0; i < total; i++) {
            uint256 tokenId = tokenByIndex(i);
            tokenIds[i] = tokenId;
            uris[i] = tokenURI(tokenId);
        }
    }
}