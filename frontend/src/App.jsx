import { useEffect, useState, useCallback } from "react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import "./App.css";
import PreviewCard from "./components/PreviewCard.jsx";
import ScribbleMark from "./components/ScribbleMark.jsx";
import CONTRACT_ABI from "./contractAbi.js";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const CHAIN_ID_HEX = import.meta.env.VITE_CHAIN_ID_HEX;
const CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME || "Robinhood Chain";
const RPC_URL = import.meta.env.VITE_RPC_URL;

const SAMPLE_IDS = [102, 4471, 8890, 231, 5501, 73, 9999, 1200];

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
          <ScribbleMark seed={9001} size={20} /> PISTACHIO SCRIBBLES
        </span>
        {wallet ? (
          <span className="pill">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
        ) : (
          <button className="btn-solid" onClick={connectWallet}>
            CONNECT WALLET
          </button>
        )}
      </header>

      <section className="hero">
        <p className="eyebrow">A COLLECTION OF TEN THOUSAND</p>
        <h1>Every mark, rendered by an algorithm</h1>
        <p className="lede">NO. {String(myTokenIds[0] || 1).padStart(4, "0")} / 10,000 &middot; NO TWO ALIKE</p>
        <LiveShowcase />
      </section>

      <div className="marquee">
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
      </div>

      <section className="mint-section">
        <div className="mint-panel">
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
      </section>

      <section className="gallery-section">
        <p className="section-label">A FEW PULLED AT RANDOM</p>
        <div className="gallery">
          {SAMPLE_IDS.map((id) => (
            <div className="gallery-tile" key={id}>
              <PreviewCard tokenId={id} size={140} />
            </div>
          ))}
        </div>

        {myTokenIds.length > 0 && (
          <div className="my-mints" style={{ marginTop: "56px" }}>
            <p className="section-label">YOUR PIECES</p>
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

      <footer className="foot">
        <span>{CHAIN_NAME.toUpperCase()} - ERC-721</span>
        <span>ART GENERATED ON-DEMAND, NOTHING PRE-RENDERED</span>
      </footer>
    </div>
  );
}
