'use client';

const SIZE  = 160;
const STROKE = 14;
const R     = (SIZE - STROKE) / 2;
const CIRC  = 2 * Math.PI * R;

function scoreLabel(pct: number): { label: string; color: string } {
  if (pct >= 90) return { label: 'Excellent Alignment', color: '#10B981' };
  if (pct >= 70) return { label: 'Good Alignment',      color: '#3B82F6' };
  if (pct >= 50) return { label: 'Moderate Alignment',  color: '#F59E0B' };
  return           { label: 'Needs Attention',          color: '#EF4444' };
}

interface Props { percentage: number }

export function ConformityScoreRing({ percentage }: Props) {
  const pct    = Math.max(0, Math.min(100, percentage));
  const dash   = (pct / 100) * CIRC;
  const { label, color } = scoreLabel(pct);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={SIZE}
        height={SIZE}
        aria-label={`Conformity score: ${pct}%`}
        role="img"
      >
        {/* Background track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={STROKE}
        />
        {/* Score arc */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${CIRC - dash}`}
          strokeDashoffset={CIRC / 4}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        {/* Centre text */}
        <text
          x={SIZE / 2}
          y={SIZE / 2 + 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold"
          style={{ fontSize: 28, fontWeight: 700, fill: color }}
        >
          {pct.toFixed(0)}%
        </text>
      </svg>
      <p className="text-sm font-semibold" style={{ color }}>{label}</p>
    </div>
  );
}
