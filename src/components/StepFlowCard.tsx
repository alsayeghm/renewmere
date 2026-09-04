import { STEPS } from "@/lib/content";

const STEP_COLOR = ["#8B5CF6", "#F0B429", "#22C55E"];

type Stat = { n: string; value: string; label: string };

export function StepFlowCard({ stats }: { stats?: Stat[] }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(28,26,22,0.04),0_12px_32px_-12px_rgba(28,26,22,0.14)]">
      <div className="mb-5 flex items-center justify-between">
        <p className="font-mono text-[12px] uppercase tracking-wide text-muted">
          The flow
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wide text-white">
          3 steps
        </span>
      </div>

      <div className="flex flex-col">
        {STEPS.map((step, i) => {
          const color = STEP_COLOR[i % STEP_COLOR.length];
          const last = i === STEPS.length - 1;
          return (
            <div key={step.n} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-[13px] font-extrabold text-white"
                  style={{ backgroundColor: color }}
                >
                  {step.n}
                </div>
                {!last && (
                  <div
                    className="my-1 w-[2px] flex-1 rounded-full"
                    style={{
                      background: `linear-gradient(${color}, ${
                        STEP_COLOR[(i + 1) % STEP_COLOR.length]
                      })`,
                      minHeight: "28px",
                    }}
                  />
                )}
              </div>
              <div className={last ? "pb-1" : "pb-6"}>
                <h3 className="mb-1 text-[15px] font-bold text-ink">
                  {step.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-muted">
                  {step.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-1.5 border-t border-border pt-4">
        {["#22C55E", "#F0B429", "#EF4444"].map((c) => (
          <span
            key={c}
            className="h-2 flex-1 rounded-full"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <p className="mt-2 text-[12px] leading-snug text-muted">
        Every answer resolves to one of three colours — never a blended
        score.
      </p>

      {stats && stats.length > 0 && (
        <div className="mt-auto grid grid-cols-3 gap-4 border-t border-border pt-5">
          {stats.map((s) => (
            <div key={s.n}>
              <p className="text-xl font-bold tracking-tight text-ink">
                {s.value}
              </p>
              <p className="mt-1 text-[11.5px] leading-snug text-muted">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
