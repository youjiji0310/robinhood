import express from "express";
import { generateArtwork } from "../../shared/generateArt.js";

const router = express.Router();
const MAX_SUPPLY = 10000;
const COLLECTION_NAME = process.env.COLLECTION_NAME || "Pistachio Scribbles";

function publicBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  return `${proto}://${req.get("host")}`;
}

/// ERC-721 tokenURI() target. Regenerates the artwork live from the shared
/// deterministic generator — nothing is pre-rendered or stored anywhere.
/// The image field is a real HTTPS URL (not a base64 data URI) because
/// marketplaces like OpenSea reliably fetch/cache a URL but often fail to
/// render inline data URIs.
router.get("/metadata/:tokenId", (req, res) => {
  const tokenId = Number(req.params.tokenId);
  if (!Number.isInteger(tokenId) || tokenId < 1 || tokenId > MAX_SUPPLY) {
    return res.status(404).json({ error: "token_out_of_range" });
  }

  const { attributes } = generateArtwork(tokenId);

  res.json({
    name: `${COLLECTION_NAME} #${tokenId}`,
    description: `A one-of-10,000 procedurally generated piece from ${COLLECTION_NAME}. Every trait, color, and mark is rendered directly from code — no image files, fully reproducible from the token ID.`,
    image: `${publicBaseUrl(req)}/api/image/${tokenId}`,
    attributes,
  });
});

/// Serves the artwork as a real SVG file (Content-Type: image/svg+xml),
/// generated live from the same deterministic generator.
router.get("/image/:tokenId", (req, res) => {
  const tokenId = Number(req.params.tokenId);
  if (!Number.isInteger(tokenId) || tokenId < 1 || tokenId > MAX_SUPPLY) {
    return res.status(404).send("token out of range");
  }
  const { svg } = generateArtwork(tokenId);
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.send(svg);
});

/// Lets the frontend preview any tokenId before/without minting.
router.get("/preview/:tokenId", (req, res) => {
  const tokenId = Number(req.params.tokenId);
  if (!Number.isInteger(tokenId) || tokenId < 1 || tokenId > MAX_SUPPLY) {
    return res.status(404).json({ error: "token_out_of_range" });
  }
  const { svg, attributes } = generateArtwork(tokenId);
  res.json({ svg, attributes });
});

export default router;
