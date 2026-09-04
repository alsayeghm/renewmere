import { CATEGORIES } from "@/lib/content";

const TILE_COLORS = [
  "#8B5CF6",
  "#3B82F6",
  "#14B8A6",
  "#F97350",
  "#F0B429",
  "#EC4899",
  "#22C55E",
  "#6366F1",
];

export function SectorHeatmap() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-muted">
        Who&apos;s in scope
      </p>
      <p className="mb-4 text-[13px] text-ink">
        Every sector, same question tree
      </p>
      <div className="grid grid-cols-4 gap-2">
        {CATEGORIES.map((c, i) => (
          <div
            key={c}
            className="flex aspect-square items-center justify-center rounded-lg p-1.5 text-center text-[10px] font-semibold leading-tight text-white"
            style={{ backgroundColor: TILE_COLORS[i % TILE_COLORS.length] }}
          >
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}
