export default function GoldFX() {
  const particles = Array.from({ length: 16 }, (_, i) => i);

  return (
    <div className="gold-fx" aria-hidden="true">
      {particles.map((i) => (
        <span
          key={i}
          className="gold-particle"
          style={{
            left: `${(i * 6.25) % 100}%`,
            animationDelay: `${(i * 1.3) % 16}s`,
            animationDuration: `${14 + (i % 5) * 3}s`,
          }}
        />
      ))}
    </div>
  );
}
