import { useEffect, useState, useCallback } from "react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import "./App.css";
import PreviewCard from "./components/PreviewCard.jsx";
import ScribbleMark from "./components/ScribbleMark.jsx";
import CONTRACT_ABI from "./contractAbi.js";
import { generateArtwork } from "./generateArt.js";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const CHAIN_ID_HEX = import.meta.env.VITE_CHAIN_ID_HEX;
const CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME || "Robinhood Chain";
const RPC_URL = import.meta.env.VITE_RPC_URL;

const SAMPLE_IDS = [102, 4471, 8890, 231, 5501, 73, 9999, 1200];
const MARQUEE_IDS = [12, 340, 981, 2200, 5555, 7777, 9001, 143];

function LiveShowcase() {
  const [id, setId] = useState(() => 1 + Math.floor(Math.random() * 10000));

  useEffect(() => {
    const t = setInterval(() => {
      setId(1 + Math.floor(Math.random() * 10000));
    }, 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="showcase">
      <div className="showcase-frame">
        <PreviewCard tokenId={id} size={320} />
      </div>
      <p className="showcase-caption">rendered live, token #{id}</p>
    </div>
  );
}

function MarqueeStrip() {
  const items = MARQUEE_IDS.map((id) => {
    const { attributes } = generateArtwork(id);
    const bg = attributes.find((a) => a.trait_type === "Background").value;
    const mark = attributes.find((a) => a.trait_type === "Mark Combination").value;
    return `#${id} \u00b7 ${bg} \u00b7 ${mark}`;
  });
  const doubled = [...items, ...items];

  return (
    <div className="marquee">
      <div className="marquee-track">
        {doubled.map((t, i) => (
          <span className="marquee-item" key={i}>{t}</span>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [chainState, setChainState] = useState({ totalMinted: 0, maxSupply: 10000, mintPrice: null, mintOpen: false });
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [myTokenIds, setMyTokenIds] = useState([]);

  const readContract = useCallback(async () => {
    try {
      const provider = wallet ? wallet.provider : new BrowserProvider(window.ethereum || undefined);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const [totalMinted, maxSupply, mintPrice, mintOpen] = await Promise.all([
        contract.totalMinted(),
        contract.MAX_SUPPLY(),
        contract.mintPrice(),
        contract.mintOpen(),
      ]);
      setChainState({
        totalMinted: Number(totalMinted),
        maxSupply: Number(maxSupply),
        mintPrice,
        mintOpen,
      });
    } catch {
      // No wallet/provider yet, or contract not deployed
    }
  }, [wallet]);

  useEffect(() => {
    readContract();
  }, [readContract]);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setStatus("No wallet found. Install MetaMask or another injected wallet.");
      return;
    }
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);

    if (CHAIN_ID_HEX && CHAIN_ID_HEX !== "0x0") {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: CHAIN_ID_HEX }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: CHAIN_ID_HEX,
                chainName: CHAIN_NAME,
                rpcUrls: RPC_URL ? [RPC_URL] : [],
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              },
            ],
          });
        }
      }
    }

    setWallet({ provider, address: accounts[0] });
  }, []);

  const mint = useCallback(async () => {
    if (!wallet || !chainState.mintPrice) return;
    setLoading(true);
    setStatus("Confirm the mint transaction in your wallet...");
    try {
      const signer = await wallet.provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const value = chainState.mintPrice * BigInt(quantity);
      const tx = await contract.mint(quantity, { value });
      setStatus("Mint submitted, waiting for confirmation...");
      const receipt = await tx.wait();

      const mintedEvent = receipt.logs
        .map((l) => {
          try {
            return contract.interface.parseLog(l);
          } catch {
            return null;
          }
        })
        .find((e) => e && e.name === "Minted");

      if (mintedEvent) {
        const from = Number(mintedEvent.args.fromTokenId);
        const ids = Array.from({ length: quantity }, (_, i) => from + i);
        setMyTokenIds((prev) => [...prev, ...ids]);
      }

      setStatus(`Minted ${quantity} piece${quantity > 1 ? "s" : ""}.`);
      readContract();
    } catch (err) {
      setStatus(err?.shortMessage || err.message || "Mint failed or was rejected.");
    } finally {
      setLoading(false);
    }
  }, [wallet, chainState.mintPrice, quantity, readContract]);

  const priceLabel = chainState.mintPrice ? `${formatEther(chainState.mintPrice)} ETH` : "-";
  const soldOut = chainState.totalMinted >= chainState.maxSupply;

  return (
    <div className="page">
      <header className="topbar">
        <span className="wordmark">
          <ScribbleMark seed={9001} size={22} /> Pistachio Scribbles
        </span>
        {wallet ? (
          <span className="pill">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
        ) : (
          <button className="btn-solid" onClick={connectWallet}>
            Connect wallet
          </button>
        )}
      </header>

      <section className="hero">
        <div className="hero-grid">
          <div className="hero-inner">
            <p className="eyebrow">10,000 pieces &middot; {CHAIN_NAME}</p>
            <h1>Every piece is code.</h1>
            <p className="lede">
              No image files, no PFP formula. Each token renders live from its
              own ID: jagged lines, ink blots, cross-hatching, and drips, on a
              spectrum of pistachio backgrounds.
            </p>
          </div>
          <LiveShowcase />
        </div>
      </section>

      <MarqueeStrip />

      <section className="gallery-section">
        <p className="section-label">a few pulled at random</p>
        <div className="gallery">
          {SAMPLE_IDS.map((id) => (
            <div className="gallery-tile" key={id}>
              <PreviewCard tokenId={id} size={150} />
            </div>
          ))}
        </div>
      </section>

      <section className="mint-section">
        <div className="mint-panel">
          <div className="mint-stats">
            <div>
              <dt>Minted</dt>
              <dd>{chainState.totalMinted.toLocaleString()} / {chainState.maxSupply.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>{priceLabel}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{soldOut ? "Sold out" : chainState.mintOpen ? "Open" : "Not open yet"}</dd>
            </div>
          </div>

          <div className="mint-controls">
            <div className="qty">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={loading}>-</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(10, q + 1))} disabled={loading}>+</button>
            </div>
            <button
              className="btn-solid btn-mint"
              onClick={wallet ? mint : connectWallet}
              disabled={loading || (wallet && (!chainState.mintOpen || soldOut))}
            >
              {!wallet
                ? "Connect wallet to mint"
                : soldOut
                ? "Sold out"
                : !chainState.mintOpen
                ? "Mint not open yet"
                : loading
                ? "Minting..."
                : `Mint ${quantity}`}
            </button>
          </div>

          {status && <p className="status">{status}</p>}
        </div>

        {myTokenIds.length > 0 && (
          <div className="my-mints">
            <p className="section-label">Your pieces</p>
            <div className="gallery">
              {myTokenIds.map((id) => (
                <div className="gallery-tile" key={id}>
                  <PreviewCard tokenId={id} size={150} showTraits />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <footer className="foot">
        <span>{CHAIN_NAME} - ERC-721</span>
        <span>art generated on-demand, nothing pre-rendered</span>
      </footer>
    </div>
  );
}
