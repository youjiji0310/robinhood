# Pistachio Scribbles — 10,000-piece generative NFT collection

Every token's artwork is generated live from code (`shared/generateArt.js`),
seeded deterministically by its token ID. There are no image files to
create or host — the same generator runs in the frontend (instant preview),
the backend (tokenURI metadata for wallets/marketplaces), and could later run
fully on-chain if you want zero centralized dependency at all.

```
contracts/   Solidity source (PistachioScribbles.sol)
scripts/     Hardhat deploy script
shared/      The generative art engine — the source of truth
backend/     Express API serving tokenURI metadata
frontend/    Vite + React mint site
```

## How it works

- `generateArtwork(tokenId)` uses a seeded PRNG to pick a background shade,
  0–3 "mark" layers (jagged / blots / hatch / drips), an ink color, and an
  intensity — then renders an SVG directly, no PNGs.
- Calling it twice with the same tokenId always gives the exact same result,
  anywhere it runs — that's what makes it trustworthy without hosting files.
- The smart contract only mints token IDs sequentially; `tokenURI()` points
  wallets to the backend, which regenerates the metadata + image on request.

## 1. Get funds on Robinhood Chain

Robinhood Chain is an Arbitrum-based L2 that launched mainnet July 1, 2026.
Check current RPC endpoints, chain ID, and a block explorer at
https://docs.robinhood.com/chain. Bridge or acquire ETH there for your
deployer wallet to cover gas.

**Security note:** never paste RPC URLs that contain your private Alchemy
API key into a chat, a public repo, or anywhere else outside your own
`.env` files. If one has ever been shared publicly, regenerate it in your
provider's dashboard.

## 2. Deploy the contract

```bash
npm install
cp .env.example .env   # fill in ROBINHOOD_RPC_URL, chain id, deployer key
npx hardhat compile
npm run deploy:robinhood
```

No Robinhood Chain funds yet? Use `npm run deploy:arbitrumSepolia` (free
testnet ETH from an Arbitrum Sepolia faucet) to test the whole flow first.

Copy the printed contract address into `backend/.env` isn't needed (backend
doesn't read the chain) but into `frontend/.env` as `VITE_CONTRACT_ADDRESS`.

## 3. Run the backend (metadata service)

```bash
cd backend
npm install
cp .env.example .env
npm start
```

## 4. Run the frontend

```bash
cd frontend
npm install
cp .env.example .env   # fill in contract address, chain id (hex), RPC URL
npm run dev
```

Visit http://localhost:5173 — you'll see six sample pieces rendered
instantly (no wallet needed), then can connect a wallet and mint.

## Before minting is live

1. Deploy the contract (`mintOpen` starts `false`).
2. As the contract owner, call `setMintPrice(...)` if you want a different
   price than the default 0.001 ETH.
3. Call `setMintOpen(true)` when you're ready to launch — this can be done
   from a block explorer's "Write Contract" tab connected to your deployer
   wallet, no extra tooling needed.

## Notes

- `maxPerTx` defaults to 10 — change it in the contract before deploying if
  you want a different limit.
- Rarity weights (background shades, mark combos, ink colors, intensity)
  live at the top of `shared/generateArt.js` — tune them before you deploy,
  since changing them after mint changes everyone's art retroactively.
- Nothing here touches Twitter/X or any paid third-party API — the only
  real cost is Robinhood Chain gas (an L2, so meaningfully cheaper than
  Ethereum mainnet).
