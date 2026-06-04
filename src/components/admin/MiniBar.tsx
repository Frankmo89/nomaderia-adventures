interface MiniBarProps {
  data: Record<string, number>;
  labels: Record<string, string>;
  /** Sort entries by key instead of by count — preserves insertion/chronological order for time-series data */
  sortByKey?: boolean;
  /** Use dark-theme track and secondary-bar colours instead of the warm-light defaults used on the dashboard */
  dark?: boolean;
}

const MiniBar = ({ data, labels, sortByKey = false, dark = false }: MiniBarProps) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return <p className="text-sm text-muted-foreground">Sin datos aún</p>;

  const entries = Object.entries(data);
  const ordered = sortByKey
    ? [...entries].sort(([a], [b]) => a.localeCompare(b))
    : [...entries].sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-2">
      {ordered.map(([key, count], idx) => {
        const pct = Math.round((count / total) * 100);
        const isHighlight = sortByKey || idx === 0;
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="text-sm w-32 truncate text-foreground">{labels[key] || key}</span>
            <div
              className="flex-1 overflow-hidden"
              style={{ background: dark ? '#292524' : '#F0EBE0', height: 7, borderRadius: 4 }}
            >
              <div
                className="transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  height: 7,
                  borderRadius: 4,
                  background: isHighlight
                    ? 'linear-gradient(90deg,#D97706,#F59E0B)'
                    : dark ? '#57534e' : '#E2D9C5',
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-16 text-right">{count} ({pct}%)</span>
          </div>
        );
      })}
    </div>
  );
};

export default MiniBar;
