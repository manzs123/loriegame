// Renders a simple pixel-art-style character as SVG
export default function PixelChar({ color, hat, size = 32, dead = false, hiding = false }) {
  const opacity = dead ? 0.3 : hiding ? 0.25 : 1;
  const filter = dead || hiding ? 'grayscale(0.8)' : 'none';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ imageRendering: 'pixelated', opacity, filter }}
    >
      {/* Body */}
      <rect x="4" y="7" width="8" height="7" fill={color} />
      {/* Head */}
      <rect x="3" y="3" width="10" height="8" fill={color} />
      {/* Hat */}
      <rect x="2" y="1" width="12" height="3" fill={hat} />
      <rect x="3" y="0" width="10" height="2" fill={hat} />
      {/* Eyes */}
      <rect x="5" y="5" width="2" height="2" fill="#000" />
      <rect x="9" y="5" width="2" height="2" fill="#000" />
      {/* Eye shine */}
      <rect x="5" y="5" width="1" height="1" fill="#fff" opacity="0.6" />
      <rect x="9" y="5" width="1" height="1" fill="#fff" opacity="0.6" />
      {/* Legs */}
      <rect x="4" y="13" width="3" height="3" fill={hat} />
      <rect x="9" y="13" width="3" height="3" fill={hat} />
      {/* Visor / backpack */}
      <rect x="11" y="8" width="2" height="4" fill={hat} opacity="0.7" />
      {dead && (
        <>
          {/* X eyes */}
          <line x1="5" y1="5" x2="7" y2="7" stroke="#e74c3c" strokeWidth="1" />
          <line x1="7" y1="5" x2="5" y2="7" stroke="#e74c3c" strokeWidth="1" />
          <line x1="9" y1="5" x2="11" y2="7" stroke="#e74c3c" strokeWidth="1" />
          <line x1="11" y1="5" x2="9" y2="7" stroke="#e74c3c" strokeWidth="1" />
        </>
      )}
    </svg>
  );
}
