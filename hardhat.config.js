require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    // Robinhood Chain is an Arbitrum-based Ethereum L2 (mainnet launched
    // July 1, 2026). Standard Ethereum tooling works — just point at its RPC.
    // Get the current RPC URL / chain ID from https://docs.robinhood.com/chain
    robinhood: {
      url: process.env.ROBINHOOD_RPC_URL || "",
      chainId: process.env.ROBINHOOD_CHAIN_ID ? Number(process.env.ROBINHOOD_CHAIN_ID) : undefined,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
    // Handy fallback while waiting on Robinhood Chain access / funds.
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};
