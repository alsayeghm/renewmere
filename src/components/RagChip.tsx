import type { RAG } from "@/lib/rules";

const STYLES: Record<RAG, string> = {
  green: "bg-[color-mix(in_srgb,var(--living)_15%,var(--surface))] text-living-ink",
  amber: "bg-amber-surface text-amber",
  red: "bg-danger-surface text-danger",
};

const LABEL: Record<RAG, string> = {
  green: "Green",
  amber: "Amber",
  red: "Red",
};

export function RagChip({ rag }: { rag: RAG }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide ${STYLES[rag]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABEL[rag]}
    </span>
  );
}

export function RagDot({ rag }: { rag: RAG }) {
  const color =
    rag === "green"
      ? "var(--living)"
      : rag === "amber"
        ? "var(--amber)"
        : "var(--danger)";
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ background: color }}
    />
  );
}
