import { RagDonut } from "@/components/RagDonut";
import { PREVIEW } from "@/lib/content";
import type { RAG } from "@/lib/rules";

const VIVID: Record<RAG, string> = {
  green: "#22C55E",
  amber: "#F0B429",
  red: "#EF4444",
};

const TINT: Record<RAG, string> = {
  green: "rgba(34,197,94,0.1)",
  amber: "rgba(240,180,41,0.12)",
  red: "rgba(239,68,68,0.1)",
};

function VividBadge({ rag }: { rag: RAG }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wide text-white"
      style={{ backgroundColor: VIVID[rag] }}
    >
      {rag}
    </span>
  );
}

export function LivePreviewCard() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(28,26,22,0.04),0_12px_32px_-12px_rgba(28,26,22,0.14)]">
      <div className="mb-5 flex items-center justify-between">
        <p className="font-mono text-[12px] uppercase tracking-wide text-muted">
          Live preview
        </p>
        <VividBadge rag="amber" />
      </div>

      <div className="mb-5 border-b border-border pb-5">
        <RagDonut items={PREVIEW} />
      </div>

      <div className="flex flex-col gap-2">
        {PREVIEW.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-lg py-2.5 pl-3.5 pr-3 transition-transform hover:scale-[1.015]"
            style={{
              backgroundColor: TINT[p.rag],
              borderLeft: `3px solid ${VIVID[p.rag]}`,
            }}
          >
            <span className="flex-1 text-[14px] font-medium text-ink">
              {p.title}
            </span>
            <VividBadge rag={p.rag} />
          </div>
        ))}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[12px] leading-snug text-muted">
        Each obligation, scored on its own — with the citation behind every
        colour.
      </p>
    </div>
  );
}
