/**
 * Lite-mode stand-in for the 3D synth: a flat, deliberately graphic top-view drawing
 * using the same layout as gl/Synth.tsx (1 unit = 100 px).
 */
const COLS = [-175, -125, -75, -25];

type Box = { x1: number; x2: number; z1: number; z2: number };

/** `highlight` (synth units, as in scenes/s6-specs/parts.ts) outlines one part in signal orange. */
export function SynthSchematic({ className = "", highlight }: { className?: string; highlight?: Box }) {
  const X = (x: number) => x + 230;
  const Y = (z: number) => z + 130;
  const knob = (x: number, z: number, r: number, a: number) => (
    <g key={`${x}${z}`} transform={`translate(${X(x)} ${Y(z)})`}>
      <circle r={r} fill="#0d0c0b" stroke="currentColor" strokeWidth={1.2} />
      <circle r={r * 0.78} fill="none" stroke="currentColor" strokeOpacity={0.35} strokeDasharray="1.5 2.5" />
      <line y2={-r * 0.8} stroke="#ff4a14" strokeWidth={2.2} strokeLinecap="round" transform={`rotate(${a})`} />
    </g>
  );
  return (
    <svg viewBox="0 0 460 260" className={`text-bone ${className}`} role="img" aria-label="OSC-1 top view: four envelope knobs and faders, a scope, a large cutoff knob, a ribbon strip and a sixteen-key strip">
      <rect x={8} y={8} width={444} height={244} rx={12} fill="#121211" stroke="currentColor" strokeWidth={1.4} />
      {COLS.map((x, i) => knob(x, -60, 16, -100 + i * 50))}
      {COLS.map((x, i) => (
        <g key={x}>
          <rect x={X(x) - 2.5} y={Y(-26)} width={5} height={60} rx={2.5} fill="#030303" stroke="currentColor" strokeOpacity={0.4} />
          <rect x={X(x) - 7.5} y={Y(-26) + 12 + i * 9} width={15} height={9} rx={1.5} fill="#ece6da" />
        </g>
      ))}
      <rect x={X(15)} y={Y(-84)} width={80} height={48} rx={3} fill="#070707" stroke="currentColor" strokeOpacity={0.5} />
      <path d={`M${X(19)} ${Y(-60)} q10 -18 18 0 t18 0 t18 0 t18 0`} fill="none" stroke="#ff4a14" strokeWidth={1.8} />
      {knob(30, 10, 20, 40)}
      {knob(80, 10, 20, -30)}
      {knob(160, -30, 42, 70)}
      {Array.from({ length: 11 }, (_, i) => {
        const a = ((-135 + 27 * i) * Math.PI) / 180;
        return <circle key={i} cx={Math.round((X(160) + Math.sin(a) * 56) * 100) / 100} cy={Math.round((Y(-30) - Math.cos(a) * 56) * 100) / 100} r={2.6} fill={i < 7 ? "#ff4a14" : "#3a1408"} />;
      })}
      {Array.from({ length: 8 }, (_, i) => (
        <circle key={i} cx={X(-195 + i * 24)} cy={Y(-104)} r={2.6} fill={i === 0 || i === 3 ? "#ff4a14" : "#3a1408"} />
      ))}
      <rect x={X(-200)} y={Y(50)} width={400} height={6} rx={3} fill="#030303" />
      <line x1={X(-198)} y1={Y(53)} x2={X(198)} y2={Y(53)} stroke="#ff4a14" strokeWidth={1.6} />
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={X(-200 + i * 25) + 1} y={Y(68)} width={22.5} height={40} rx={2} fill={i === 0 || i === 12 ? "#ff4a14" : "#ece6da"} />
      ))}
      <text x={X(86)} y={Y(-98)} fill="currentColor" fontSize={9} fontWeight={700} letterSpacing={1} className="font-[family-name:var(--font-mono)]">
        OSCILLO OSC-1
      </text>
      {highlight && (
        <rect
          x={X(highlight.x1 * 100)}
          y={Y(highlight.z1 * 100)}
          width={(highlight.x2 - highlight.x1) * 100}
          height={(highlight.z2 - highlight.z1) * 100}
          rx={4}
          fill="#ff4a14"
          fillOpacity={0.14}
          stroke="#ff4a14"
          strokeWidth={2.5}
        />
      )}
    </svg>
  );
}
