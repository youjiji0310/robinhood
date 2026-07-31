import { useMemo } from "react";
import { generateArtwork } from "../generateArt.js";

export default function PreviewCard({ tokenId, size = 160, showTraits = false }) {
  const { svg, attributes } = useMemo(() => generateArtwork(tokenId), [tokenId]);

  return (
    <div className="preview-card">
      <div
        className="preview-art"
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: svg.replace(/width="\d+"/, "").replace(/height="\d+"/, "") }}
      />
      <p className="preview-id">#{tokenId}</p>
      {showTraits && (
        <ul className="preview-traits">
          {attributes.map((a) => (
            <li key={a.trait_type}>
              <span>{a.trait_type}</span>
              <span>{a.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
