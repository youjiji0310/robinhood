import express from "express";
import { generateArtwork, svgToDataUri } from "../../shared/generateArt.js";

const router = express.Router();
const MAX_SUPPLY = 10000;
const COLLECTION_NAME = process.env.COLLECTION_NAME || "Pistachio Scribbles";

/// ERC-721 tokenURI() target. Regenerates the artwork live from the shared
/// deterministic generator — nothing is pre-rendered or stored anywhere.
router.get("/metadata/:tokenId", (req, res) => {
  const tokenId = Number(req.params.tokenId);
  if (!Number.isInteger(tokenId) || tokenId < 1 || tokenId > MAX_SUPPLY) {
    return res.status(404).json({ error: "token_out_of_range" });
  }

  const { svg, attributes } = generateArtwork(tokenId);

  res.json({
    name: `${COLLECTION_NAME} #${tokenId}`,
    description: `A one-of-10,000 procedurally generated piece from ${COLLECTION_NAME}. Every trait, color, and mark is rendered directly from code — no image files, fully reproducible from the token ID.`,
    image: svgToDataUri(svg),
    attributes,
  });
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
