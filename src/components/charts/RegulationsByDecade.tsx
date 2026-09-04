import { REGULATIONS } from "@/lib/content";

const DECADES = ["1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];
const DECADE_SHORT = ["'70s", "'80s", "'90s", "'00s", "'10s", "'20s"];
const BAR_COLORS = ["#8B5CF6", "#3B82F6", "#14B8A6", "#F97350", "#F0B429", "#EC4899"];

function decadeOf(year: string) {
  const y = parseInt(year, 10);
  const decade = Math.floor(y / 10) * 10;
  return `${decade}s`;
}

export function RegulationsByDecade() {
  const counts = DECADES.map(
    (d) => REGULATIONS.filter((r) => decadeOf(r.year) === d).length,
  );
  const max = Math.max(...counts);

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-muted">
        By decade
      </p>
      <p className="mb-4 text-[13px] text-ink">
        Where the current rulebook came from
      </p>
      <div className="flex h-28 items-end gap-2.5">
        {counts.map((count, i) => (
          <div
            key={DECADES[i]}
            className="flex flex-1 flex-col items-center gap-2"
          >
            <span className="text-[11px] font-bold text-ink">{count}</span>
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: `${(count / max) * 72}px`,
                backgroundColor: BAR_COLORS[i],
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2.5">
        {DECADE_SHORT.map((d) => (
          <span
            key={d}
            className="flex-1 text-center font-mono text-[9.5px] text-muted"
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}
