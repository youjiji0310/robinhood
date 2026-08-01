import express from "express";
import { generateArtwork } from "../../shared/generateArt.js";

const router = express.Router();
const MAX_SUPPLY = 10000;
const COLLECTION_NAME = process.env.COLLECTION_NAME || "Pistachio Scribbles";

function publicBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  return `${proto}://${req.get("host")}`;
}

router.get("/metadata/:tokenId", (req, res) => {
  const tokenId = Number(req.params.tokenId);
  if (!Number.isInteger(tokenId) || tokenId < 1 || tokenId > MAX_SUPPLY) {
    return res.status(404).json({ error: "token_out_of_range" });
  }

  const { attributes } = generateArtwork(tokenId);

  res.json({
    name: `${COLLECTION_NAME} #${tokenId}`,
    description: `A one-of-10,000 procedurally generated piece from ${COLLECTION_NAME}. Every trait, color, and mark is rendered directly from code, no image files, fully reproducible from the token ID.`,
    image: `${publicBaseUrl(req)}/api/image/${tokenId}`,
    attributes,
  });
});

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

router.get("/preview/:tokenId", (req, res) => {
  const tokenId = Number(req.params.tokenId);
  if (!Number.isInteger(tokenId) || tokenId < 1 || tokenId > MAX_SUPPLY) {
    return res.status(404).json({ error: "token_out_of_range" });
  }
  const { svg, attributes } = generateArtwork(tokenId);
  res.json({ svg, attributes });
});

export default router;
