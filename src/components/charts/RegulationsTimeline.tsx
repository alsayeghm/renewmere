import { REGULATIONS } from "@/lib/content";

const DECADES = ["1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];

function decadeOf(year: string) {
  const y = parseInt(year, 10);
  const decade = Math.floor(y / 10) * 10;
  return `${decade}s`;
}

export function RegulationsTimeline() {
  const perDecade = DECADES.map(
    (d) => REGULATIONS.filter((r) => decadeOf(r.year) === d).length,
  );
  const cumulative = perDecade.reduce<number[]>((acc, n) => {
    const prior = acc.length > 0 ? acc[acc.length - 1] : 0;
    return [...acc, prior + n];
  }, []);
  const max = cumulative[cumulative.length - 1];

  const w = 320;
  const h = 120;
  const pad = 8;
  const stepX = (w - pad * 2) / (cumulative.length - 1);

  const points = cumulative.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (v / max) * (h - pad * 2);
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`)
    .join(" ");
  const areaPath = `${linePath} L${points[points.length - 1][0]},${h - pad} L${points[0][0]},${h - pad} Z`;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-muted">
        Regulatory growth
      </p>
      <p className="mb-3 text-[13px] text-ink">
        <span className="font-bold">{max}</span> laws tracked, cumulative
        since the 1970s
      </p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        role="img"
        aria-label="Cumulative UK environmental regulations by decade"
      >
        <defs>
          <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="timelineStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#timelineFill)" />
        <path
          d={linePath}
          fill="none"
          stroke="url(#timelineStroke)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#8B5CF6" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[9.5px] text-muted">
        {DECADES.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
    </div>
  );
}
