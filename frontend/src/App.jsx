import { useEffect, useState, useCallback } from "react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import "./App.css";
import PreviewCard from "./components/PreviewCard.jsx";
import ScribbleMark from "./components/ScribbleMark.jsx";
import GoldFX from "./components/GoldFX.jsx";
import MintGame from "./components/MintGame.jsx";
import CONTRACT_ABI from "./contractAbi.js";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const CHAIN_ID_HEX = import.meta.env.VITE_CHAIN_ID_HEX;
const CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME || "Robinhood Chain";
const RPC_URL = import.meta.env.VITE_RPC_URL;
const OPENSEA_URL = import.meta.env.VITE_OPENSEA_URL || "#";
const DISCORD_URL = import.meta.env.VITE_DISCORD_URL || "#";
const TWITTER_URL = import.meta.env.VITE_TWITTER_URL || "#";

const DEFAULT_SAMPLE_IDS = [102, 4471, 8890, 231, 5501, 73, 9999, 1200];

const ROADMAP = [
  { phase: "PHASE 1", title: "Mint live", text: "All 10,000 pieces open for minting on Robinhood Chain. No presale, no allowlist, first come, first served." },
  { phase: "PHASE 2", title: "Marketplace integration", text: "Full metadata and image support across OpenSea and every Robinhood Chain explorer, so every piece renders correctly wherever it's viewed." },
  { phase: "PHASE 3", title: "What's next", text: "Holder perks and future generative drops, decided together with whoever ends up holding the collection." },
];

const FAQS = [
  { q: "What is Pistachio Scribbles?", a: "A collection of 10,000 pieces where every trait is rendered live from code, no pre-made image files, ever." },
  { q: "How is rarity decided?", a: "Background shade, mark combination, ink color, and intensity are each drawn from weighted tables, the same way any generative collection works, just transparently, in open code." },
  { q: "What chain is this on?", a: `${CHAIN_NAME}, an Arbitrum-based Ethereum layer 2.` },
  { q: "Can I see the code?", a: "Yes. The generator is a small, readable script, every piece is fully reproducible from its token ID alone, by anyone." },
  { q: "Is there a limit per wallet?", a: "Yes, minting is capped per wallet to keep distribution fair." },
];

function useShuffledIds(seedList, count = 8) {
  const [ids, setIds] = useState(seedList);
  const shuffle = useCallback(() => {
    const next = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 10000));
    setIds(next);
  }, [count]);
  return [ids, shuffle];
}

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
        <span className="corner corner-tl" />
        <span className="corner corner-tr" />
        <span className="corner corner-bl" />
        <span className="corner corner-br" />
        <PreviewCard tokenId={id} size={276} />
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
  const [sampleIds, shuffleSamples] = useShuffledIds(DEFAULT_SAMPLE_IDS);
  const [openFaq, setOpenFaq] = useState(null);
  const [gameWon, setGameWon] = useState(false);

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

  const scrollToMint = () => document.getElementById("mint")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="page">
      <GoldFX />

      <header className="topbar">
        <span className="wordmark">
          <ScribbleMark seed={9001} size={20} /> PISTACHIO SCRIBBLES
        </span>
        <nav className="nav-links">
          <a href="#collection">Collection</a>
          <a href="#roadmap">Roadmap</a>
          <a href="#faq">FAQ</a>
          <a href={OPENSEA_URL} target="_blank" rel="noreferrer" className="nav-link-strong">OPENSEA</a>
        </nav>
        {wallet ? (
          <span className="pill">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
        ) : (
          <button className="btn-solid" onClick={connectWallet}>
            CONNECT WALLET
          </button>
        )}
      </header>

      <section className="hero">
        <p className="eyebrow">MINTED &middot; {chainState.totalMinted.toLocaleString()} OF 10,000 PIECES</p>
        <h1>Welcome to<br />the canvas</h1>
        <p className="lede">
          10,000 pieces rendered live from an algorithm, minted on {CHAIN_NAME}.
          No image files. No PFP formula. No two ever alike.
        </p>
        <button className="btn-solid btn-hero" onClick={scrollToMint}>MINT NOW</button>

        <LiveShowcase />

        <div className="stat-cards">
          <div className="stat-card">
            <p className="stat-value">10,000</p>
            <p className="stat-label">Supply</p>
          </div>
          <div className="stat-card">
            <p className="stat-value">LIVE</p>
            <p className="stat-label">Mint status</p>
          </div>
          <div className="stat-card">
            <p className="stat-value">20+</p>
            <p className="stat-label">Traits</p>
          </div>
          <div className="stat-card">
            <p className="stat-value">Robinhood</p>
            <p className="stat-label">Chain</p>
          </div>
        </div>
      </section>

      <section className="collection-section" id="collection">
        <p className="kicker">// THE COLLECTION</p>
        <p className="section-label">Meet the marks</p>
        <p className="section-sub">
          Every piece is generated from a handful of trait families: backgrounds,
          mark styles, ink colors, and intensities, combined by a seeded algorithm.
        </p>

        <div className="gallery">
          {sampleIds.map((id) => (
            <div className="gallery-tile" key={id}>
              <PreviewCard tokenId={id} size={140} />
            </div>
          ))}
        </div>

        <button className="btn-ghost" onClick={shuffleSamples}>SHUFFLE THE COLLECTION</button>
      </section>

      <section className="mint-section" id="mint">
        {!gameWon ? (
          <MintGame onWin={() => setGameWon(true)} />
        ) : (
          <div className="mint-panel">
          <div className="mint-stats">
            <div>
              <dt>MINTED</dt>
              <dd>{chainState.totalMinted.toLocaleString()} / {chainState.maxSupply.toLocaleString()}</dd>
            </div>
            <div>
              <dt>PRICE</dt>
              <dd>{priceLabel}</dd>
            </div>
            <div>
              <dt>CHAIN</dt>
              <dd>Robinhood</dd>
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
                ? "CONNECT WALLET TO MINT"
                : soldOut
                ? "SOLD OUT"
                : !chainState.mintOpen
                ? "MINT NOT OPEN YET"
                : loading
                ? "MINTING..."
                : `MINT ${quantity}`}
            </button>
          </div>

          {status && <p className="status">{status}</p>}
          </div>
        )}

        {myTokenIds.length > 0 && (
          <div className="my-mints">
            <p className="section-label" style={{ fontSize: "13px" }}>Your pieces</p>
            <div className="gallery">
              {myTokenIds.map((id) => (
                <div className="gallery-tile" key={id}>
                  <PreviewCard tokenId={id} size={140} showTraits />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="roadmap-section" id="roadmap">
        <p className="kicker">// THE PLAN</p>
        <p className="section-label">Roadmap</p>
        <div className="roadmap-grid">
          {ROADMAP.map((r) => (
            <div className="roadmap-card" key={r.phase}>
              <p className="roadmap-phase">{r.phase}</p>
              <p className="roadmap-title">{r.title}</p>
              <p className="roadmap-text">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="faq-section" id="faq">
        <p className="kicker">// FAQ</p>
        <p className="section-label">Questions</p>
        <div className="faq-list">
          {FAQS.map((f, i) => (
            <div className="faq-item" key={f.q}>
              <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{f.q}</span>
                <span>{openFaq === i ? "-" : "+"}</span>
              </button>
              {openFaq === i && <p className="faq-answer">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="join-section">
        <p className="section-label">Join the collection</p>
        <p className="section-sub">10,000 pieces, minted and live. Follow along for whatever comes next.</p>
        <div className="social-links">
          <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="btn-ghost">DISCORD</a>
          <a href={TWITTER_URL} target="_blank" rel="noreferrer" className="btn-ghost">TWITTER</a>
          <a href={OPENSEA_URL} target="_blank" rel="noreferrer" className="btn-ghost">OPENSEA</a>
        </div>
      </section>

      <footer className="foot">
        <span>{CHAIN_NAME.toUpperCase()} - ERC-721</span>
        <span>ART GENERATED ON-DEMAND, NOTHING PRE-RENDERED</span>
      </footer>
    </div>
  );
}
