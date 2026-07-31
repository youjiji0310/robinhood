// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PistachioScribbles
/// @notice 10,000-piece generative collection. Art itself is not stored
///         on-chain — tokenURI points to a metadata service that runs the
///         same deterministic generator (see shared/generateArt.js) keyed
///         only by tokenId, so the artwork is fully reproducible by anyone
///         without trusting a centralized image host.
contract PistachioScribbles is ERC721, Ownable {
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public mintPrice = 0.001 ether; // adjust before deploying
    uint256 public maxPerTx = 10;
    bool public mintOpen = false;

    uint256 public totalMinted;
    string public metadataBaseURI;

    event MintOpened();
    event Minted(address indexed to, uint256 indexed fromTokenId, uint256 quantity);

    constructor(string memory _metadataBaseURI) ERC721("Pistachio Scribbles", "SCRIB") Ownable(msg.sender) {
        metadataBaseURI = _metadataBaseURI;
    }

    function mint(uint256 quantity) external payable {
        require(mintOpen, "mint not open yet");
        require(quantity > 0 && quantity <= maxPerTx, "invalid quantity");
        require(totalMinted + quantity <= MAX_SUPPLY, "sold out");
        require(msg.value >= mintPrice * quantity, "insufficient payment");

        uint256 start = totalMinted + 1; // token IDs start at 1
        for (uint256 i = 0; i < quantity; i++) {
            _safeMint(msg.sender, start + i);
        }
        totalMinted += quantity;

        emit Minted(msg.sender, start, quantity);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string(abi.encodePacked(metadataBaseURI, _toString(tokenId)));
    }

    function setMintOpen(bool open) external onlyOwner {
        mintOpen = open;
        if (open) emit MintOpened();
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    function setMetadataBaseURI(string calldata _uri) external onlyOwner {
        metadataBaseURI = _uri;
    }

    function withdraw() external onlyOwner {
        (bool ok, ) = owner().call{value: address(this).balance}("");
        require(ok, "withdraw failed");
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
