import type { RAG } from "@/lib/rules";

const COLOR: Record<RAG, string> = {
  green: "#22C55E",
  amber: "#F0B429",
  red: "#EF4444",
};

export function RagDonut({ items }: { items: { rag: RAG }[] }) {
  const total = items.length;
  const counts: Record<RAG, number> = { green: 0, amber: 0, red: 0 };
  for (const item of items) counts[item.rag]++;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const order: RAG[] = ["green", "amber", "red"];

  let cumulative = 0;
  const segments = order
    .filter((rag) => counts[rag] > 0)
    .map((rag) => {
      const fraction = counts[rag] / total;
      const length = fraction * circumference;
      const offset = cumulative;
      cumulative += length;
      return { rag, length, offset };
    });

  const worst = counts.red > 0 ? "red" : counts.amber > 0 ? "amber" : "green";

  return (
    <div className="flex items-center gap-5">
      <svg
        width="92"
        height="92"
        viewBox="0 0 100 100"
        className="shrink-0 -rotate-90"
        role="img"
        aria-label="Compliance status breakdown"
      >
        <defs>
          <filter id="donutGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="2.5"
              floodOpacity="0.35"
            />
          </filter>
        </defs>
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="12"
        />
        {segments.map((seg) => (
          <circle
            key={seg.rag}
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={COLOR[seg.rag]}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${Math.max(seg.length - 3, 0)} ${circumference}`}
            strokeDashoffset={-seg.offset}
            filter="url(#donutGlow)"
          />
        ))}
      </svg>
      <div>
        <p
          className="text-2xl font-extrabold tracking-tight"
          style={{ color: COLOR[worst] }}
        >
          {counts[worst]}/{total}
        </p>
        <p className="text-[12.5px] text-muted">
          {worst === "green"
            ? "fully on track"
            : worst === "amber"
              ? "need attention"
              : "genuine gaps"}
        </p>
      </div>
    </div>
  );
}
