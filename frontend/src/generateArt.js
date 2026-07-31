// Deterministic generative art engine for the "Pistachio Scribbles" collection.
// Given a tokenId, always produces the exact same artwork + trait attributes,
// anywhere it's run (frontend preview, backend metadata, or a future on-chain
// renderer). No external image files, no IPFS upload needed — the art IS code.

const SALT = "pistachio-scribbles-v1"; // change this and every token's art changes

// --- tiny deterministic PRNG (xmur3 hash -> mulberry32 generator) ---
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRng(tokenId) {
  const seedFn = xmur3(`${SALT}:${tokenId}`);
  return mulberry32(seedFn());
}

// weighted pick: options = [{ value, weight }]
function pick(rng, options) {
  const total = options.reduce((s, o) => s + o.weight, 0);
  let r = rng() * total;
  for (const opt of options) {
    if (r < opt.weight) return opt;
    r -= opt.weight;
  }
  return options[options.length - 1];
}

const BACKGROUNDS = [
  { name: "Fresh Pistachio", hex: "#b7cf8e", weight: 30 },
  { name: "Sage", hex: "#aecb7f", weight: 25 },
  { name: "Matcha", hex: "#c3d99b", weight: 20 },
  { name: "Deep Pistachio", hex: "#93b96e", weight: 15 },
  { name: "Almost Olive", hex: "#7fa05c", weight: 7 },
  { name: "Ghost White Pistachio", hex: "#eef3e2", weight: 3 },
];

const INKS = [
  { name: "Charcoal", hex: "#2e2a24", weight: 40 },
  { name: "Burnt Rust", hex: "#8a4a2b", weight: 25 },
  { name: "Ink Navy", hex: "#24304a", weight: 20 },
  { name: "Ember Red", hex: "#7a2620", weight: 10 },
  { name: "Gold Leaf", hex: "#b8912f", weight: 5 },
];

const MARK_COMBOS = [
  { name: "Single Mark", count: 1, weight: 45 },
  { name: "Double Mark", count: 2, weight: 35 },
  { name: "Triple Mark", count: 3, weight: 15 },
  { name: "Blank Canvas", count: 0, weight: 5 },
];

const INTENSITIES = [
  { name: "Faint", scale: 0.7, weight: 30 },
  { name: "Medium", scale: 1, weight: 45 },
  { name: "Heavy", scale: 1.4, weight: 25 },
];

const MARK_TYPES = ["jagged", "blots", "hatch", "drips"];

function renderJagged(rng, color, scale) {
  const w = 3.5 * scale;
  const y0 = 60 + rng() * 20;
  const pts = [];
  let x = 15 + rng() * 10;
  let y = y0;
  for (let i = 0; i < 4; i++) {
    x += 25 + rng() * 15;
    y += (rng() - 0.5) * 60;
    pts.push([x, Math.max(20, Math.min(130, y))]);
  }
  const d = `M${pts[0][0]} ${pts[0][1]} Q${pts[1][0]} ${pts[1][1] - 20} ${pts[2][0]} ${pts[2][1]} T${pts[3][0]} ${pts[3][1]}`;
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
}

function renderBlots(rng, color, scale) {
  const n = 2 + Math.floor(rng() * 3);
  let out = "";
  for (let i = 0; i < n; i++) {
    const cx = 30 + rng() * 90;
    const cy = 40 + rng() * 90;
    const rx = (10 + rng() * 16) * scale;
    const ry = (8 + rng() * 16) * scale;
    const rot = rng() * 360;
    out += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${color}" transform="rotate(${rot.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
  }
  return out;
}

function renderHatch(rng, color, scale) {
  const x0 = 25 + rng() * 20;
  const y0 = 35 + rng() * 20;
  const size = (70 + rng() * 25) * Math.min(scale, 1.2);
  const gap = 6;
  let lines = "";
  for (let off = -size; off < size; off += gap) {
    lines += `<line x1="${(x0 + off).toFixed(1)}" y1="${y0.toFixed(1)}" x2="${(x0 + off + size).toFixed(1)}" y2="${(y0 + size).toFixed(1)}" stroke="${color}" stroke-width="1" opacity="0.55"/>`;
  }
  return `<clipPath id="hatchclip"><rect x="${x0}" y="${y0}" width="${size}" height="${size}"/></clipPath><g clip-path="url(#hatchclip)">${lines}</g>`;
}

function renderDrips(rng, color, scale) {
  const n = 2 + Math.floor(rng() * 3);
  let out = "";
  let x = 30;
  for (let i = 0; i < n; i++) {
    x += 15 + rng() * 20;
    const topY = 20 + rng() * 15;
    const midY = topY + 30 + rng() * 20;
    const endY = midY + 20 + rng() * 25;
    const w = (3 + rng() * 3) * scale;
    out += `<path d="M${x} ${topY} C${x - 2} ${midY - 15} ${x + 4} ${midY - 5} ${x} ${midY} C${x - 2} ${midY + 12} ${x + 2} ${endY - 8} ${x} ${endY}" fill="none" stroke="${color}" stroke-width="${w.toFixed(1)}" stroke-linecap="round"/>`;
  }
  return out;
}

const RENDERERS = { jagged: renderJagged, blots: renderBlots, hatch: renderHatch, drips: renderDrips };

/// Generates the full artwork + trait list for a given tokenId. Deterministic:
/// calling this twice with the same tokenId always returns identical output.
function generateArtwork(tokenId) {
  const rng = makeRng(tokenId);

  const bg = pick(rng, BACKGROUNDS);
  const ink = pick(rng, INKS);
  const combo = pick(rng, MARK_COMBOS);
  const intensity = pick(rng, INTENSITIES);

  // Choose which distinct mark types appear, in a stable but shuffled order.
  const shuffled = [...MARK_TYPES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const chosenTypes = shuffled.slice(0, combo.count);

  let marks = "";
  for (const type of chosenTypes) {
    marks += RENDERERS[type](rng, ink.hex, intensity.scale);
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" width="500" height="500">` +
    `<rect width="150" height="150" fill="${bg.hex}"/>` +
    marks +
    `</svg>`;

  const attributes = [
    { trait_type: "Background", value: bg.name },
    { trait_type: "Mark Combination", value: combo.name },
    { trait_type: "Ink Color", value: combo.count === 0 ? "None" : ink.name },
    { trait_type: "Intensity", value: combo.count === 0 ? "None" : intensity.name },
    { trait_type: "Mark Types", value: chosenTypes.length ? chosenTypes.join(" + ") : "None" },
  ];

  return { svg, attributes, tokenId };
}

function svgToDataUri(svg) {
  const encoded =
    typeof Buffer !== "undefined"
      ? Buffer.from(svg).toString("base64")
      : btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${encoded}`;
}

export { generateArtwork, svgToDataUri, BACKGROUNDS, INKS, MARK_COMBOS, INTENSITIES };
