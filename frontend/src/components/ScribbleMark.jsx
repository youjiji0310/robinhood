import { useMemo } from "react";
import { generateArtwork } from "../generateArt.js";

/// Renders just the ink marks (no background) from a given seed, so the
/// site's own chrome is made of the same visual language as the collection —
/// not a separate decorative flourish bolted on top.
export default function ScribbleMark({ seed, size = 60, color }) {
  const { svg } = useMemo(() => generateArtwork(seed), [seed]);
  const inner = svg.replace(/<svg[^>]*>/, "").replace("</svg>", "");
  const withoutBg = inner.replace(/<rect[^>]*\/>/, "");

  return (
    <svg
      viewBox="0 0 150 150"
      width={size}
      height={size}
      style={color ? { filter: `drop-shadow(0 0 0 ${color})` } : undefined}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: withoutBg }}
    />
  );
}
