// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ThrincsDemoSBT is ERC721 {
    uint256 private _nextTokenId;

    struct CertificateData {
        string metadataURI;
        string documentHash;
        address issuer;
        uint256 issuedAt;
    }

    mapping(uint256 => CertificateData) public certificates;
    mapping(uint256 => string) private _tokenURIs;
    mapping(string => bool) public usedHashes;

    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed student,
        address indexed issuer,
        string metadataURI,
        string documentHash
    );

    constructor() ERC721("Thrincs Demo Certificate", "TDC") {}

    function mintCertificate(
        address student,
        string memory metadataURI,
        string memory documentHash
    ) external returns (uint256) {
        require(student != address(0), "Invalid student");
        require(bytes(metadataURI).length > 0, "Metadata required");
        require(bytes(documentHash).length > 0, "Hash required");
        require(!usedHashes[documentHash], "Hash already used");

        uint256 tokenId = ++_nextTokenId;

        _safeMint(student, tokenId);

        certificates[tokenId] = CertificateData({
            metadataURI: metadataURI,
            documentHash: documentHash,
            issuer: msg.sender,
            issuedAt: block.timestamp
        });

        _tokenURIs[tokenId] = metadataURI;
        usedHashes[documentHash] = true;

        emit CertificateMinted(
            tokenId,
            student,
            msg.sender,
            metadataURI,
            documentHash
        );

        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenURIs[tokenId];
    }

    function transferFrom(address, address, uint256) public pure override {
        revert("Soulbound: transfers disabled");
    }

    function safeTransferFrom(address, address, uint256) public pure override {
        revert("Soulbound: transfers disabled");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("Soulbound: transfers disabled");
    }
}