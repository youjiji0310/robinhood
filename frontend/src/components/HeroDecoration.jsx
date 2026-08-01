/// Big, loose ink marks drawn across the hero in the collection's own visual
/// language, animated with a stroke draw-in so the page itself feels like
/// it's being sketched on load, not static decoration bolted on top.
export default function HeroDecoration() {
  return (
    <svg className="hero-deco" viewBox="0 0 1400 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path className="deco-stroke s1" d="M-50 580 Q150 480 260 560 T520 500 T780 570" fill="none" stroke="#2e2a24" strokeWidth="10" strokeLinecap="round" />
      <path className="deco-stroke s2" d="M1050 40 Q1120 160 1080 240 T1180 380 T1120 520" fill="none" stroke="#8a4a2b" strokeWidth="9" strokeLinecap="round" />
      <path className="deco-stroke s3" d="M60 40 C55 110 75 130 65 200 C58 240 78 260 70 320" fill="none" stroke="#24304a" strokeWidth="8" strokeLinecap="round" />
      <ellipse className="deco-blot b1" cx="1300" cy="620" rx="46" ry="32" fill="#2e2a24" transform="rotate(-12 1300 620)" />
      <ellipse className="deco-blot b2" cx="1360" cy="560" rx="24" ry="34" fill="#7a2620" transform="rotate(18 1360 560)" />
    </svg>
  );
}
