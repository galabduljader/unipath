"use client";

// A tiny potted plant that visualizes progress: leaves grow from the base upward
// as the percentage rises (and a little bloom opens near 100%). Same app palette as
// the Course Garden — teal foliage, navy planter — so Home and My Plan feel of a
// piece. Purely presentational; pass a 0–100 percent.

export function ProgressPlant({ pct, size = 72 }: { pct: number; size?: number }) {
  const p = Math.max(0, Math.min(100, pct));
  const LEAVES = 5;
  const grown = Math.round((p / 100) * LEAVES);
  const bloomed = p >= 95;

  // leaf anchor points along the stem, bottom (i=0) → top
  const leaves = Array.from({ length: LEAVES }, (_, i) => {
    const y = 78 - i * 12.5;
    const side = i % 2 === 0 ? -1 : 1;
    const x = 48 + side * 13;
    return { i, x, y, side, on: i < grown };
  });

  const TEAL = "#1E8378";
  const FAINT = "#D4DAD6";

  return (
    <svg width={size} height={(size * 108) / 96} viewBox="0 0 96 108" aria-hidden style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id="pp-stem" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#1E8378" /><stop offset="1" stopColor="#8CD3C6" /></linearGradient>
        <linearGradient id="pp-pot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1E5E78" /><stop offset="1" stopColor="#102A40" /></linearGradient>
      </defs>

      {/* stem */}
      <path d="M48,86 C45,66 51,44 48,22" fill="none" stroke="url(#pp-stem)" strokeWidth={3} strokeLinecap="round" />

      {/* leaves — grown ones teal, the rest faint */}
      {leaves.map((lf) => (
        <ellipse
          key={lf.i}
          cx={lf.x}
          cy={lf.y}
          rx={9}
          ry={4.6}
          fill={lf.on ? TEAL : FAINT}
          transform={`rotate(${lf.side * 32} ${lf.x} ${lf.y})`}
          style={{ transition: "fill .5s ease" }}
        />
      ))}

      {/* a little bloom at the top once nearly done */}
      {bloomed ? (
        <g>
          {[0, 72, 144, 216, 288].map((a) => {
            const r = (a * Math.PI) / 180;
            return <ellipse key={a} cx={48 + Math.cos(r) * 6} cy={18 + Math.sin(r) * 6} rx={4.5} ry={2.6} fill="#2AA396" transform={`rotate(${a} ${48 + Math.cos(r) * 6} ${18 + Math.sin(r) * 6})`} />;
          })}
          <circle cx={48} cy={18} r={3.2} fill="#F2C94C" />
        </g>
      ) : (
        <ellipse cx={48} cy={20} rx={5} ry={7} fill={grown >= LEAVES ? TEAL : "#A9D8CE"} transform="rotate(0 48 20)" />
      )}

      {/* soil + pot */}
      <ellipse cx={48} cy={86} rx={19} ry={3.4} fill="#4a3322" />
      <rect x={30} y={82} width={36} height={6} rx={2} fill="#174E64" />
      <path d="M33,88 L63,88 L58,105 L38,105 Z" fill="url(#pp-pot)" />
    </svg>
  );
}
