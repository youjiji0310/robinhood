const CONTRACT_ABI = [
  "function mint(uint256 quantity) payable",
  "function mintOpen() view returns (bool)",
  "function mintPrice() view returns (uint256)",
  "function totalMinted() view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function maxPerTx() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "event Minted(address indexed to, uint256 indexed fromTokenId, uint256 quantity)",
];

export default CONTRACT_ABI;
