const R = 60;
const C = 70; // centre of a 140 x 140 box

const point = (angle) => [C + R * Math.sin(angle), C - R * Math.cos(angle)];

/**
 * Pie chart of { key, label, color, value } slices, with a legend (count and share).
 * Slices are separated by a thin gap in the panel colour; hovering a slice shows its label.
 */
export default function PieChart({ slices, emptyText = 'Nothing to show yet.' }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const visible = slices.filter((s) => s.value > 0);

  let start = 0;
  const paths = visible.map((s) => {
    const sweep = (s.value / total) * Math.PI * 2;
    const from = start;
    start += sweep;
    if (visible.length === 1) return { ...s, circle: true };
    const [x1, y1] = point(from);
    const [x2, y2] = point(from + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    return { ...s, d: `M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z` };
  });

  return (
    <div className="pie">
      <svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label={`Task status: ${slices.map((s) => `${s.label} ${s.value}`).join(', ')}`}>
        {total === 0 ? (
          <circle cx={C} cy={C} r={R} fill="none" stroke="var(--hairline-strong)" strokeWidth="1.5" strokeDasharray="3 4" />
        ) : (
          paths.map((p) => (p.circle
            ? <circle key={p.key} cx={C} cy={C} r={R} fill={p.color}><title>{`${p.label}: ${p.value}`}</title></circle>
            : <path key={p.key} d={p.d} fill={p.color} stroke="var(--surface-1)" strokeWidth="2" strokeLinejoin="round"><title>{`${p.label}: ${p.value}`}</title></path>))
        )}
      </svg>

      <ul className="pie-legend">
        {slices.map((s) => (
          <li key={s.key}>
            <span className="dot" style={{ background: s.color, width: 8, height: 8 }} />
            <span className="pie-label">{s.label}</span>
            <span className="pie-n">{s.value}</span>
            <span className="pie-pct">{total ? Math.round((s.value / total) * 100) : 0}%</span>
          </li>
        ))}
        {total === 0 && <li className="pie-empty">{emptyText}</li>}
      </ul>
    </div>
  );
}
