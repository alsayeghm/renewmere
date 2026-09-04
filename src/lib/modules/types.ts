export type RAG = "green" | "amber" | "red";

export type AnswerValue = string | number | null;
export type AnswerMap = Record<string, AnswerValue>;

export type QuestionOption = { value: string; label: string };

type BaseQuestion = {
  /** Unique across the whole app — prefix with the module slug, e.g. "weee_disposal". */
  id: string;
  /** Short display code shown above the question, e.g. "Q1". */
  qid: string;
  prompt: string;
  help?: string;
  visibleIf?: (a: AnswerMap) => boolean;
};

export type Question =
  | (BaseQuestion & { type: "single"; options: QuestionOption[] })
  | (BaseQuestion & { type: "number"; min?: number });

/**
 * How a "Fix this for us" engagement for this obligation is naturally billed:
 * - one_time: a discrete task, done once, no next cycle (e.g. an ecological survey, a permit application).
 * - annual: a certification/registration/report that's paid for once and then renews on a cycle.
 * - recurring: ongoing day-to-day/week-to-week operational work that needs continuous management.
 */
export type BillingType = "one_time" | "annual" | "recurring";

export type ModuleObligation = {
  id: string;
  title: string;
  citation: string;
  rag: RAG;
  reason: string;
  billing: BillingType;
};

export type ModuleResult = {
  obligations: ModuleObligation[];
  overall: RAG;
  /** True when the answers show this law doesn't apply to this business at all. */
  notApplicable?: boolean;
  notApplicableReason?: string;
  /** Optional free-text notes shown above the obligations, e.g. an FTE/threshold summary. */
  notes?: string[];
};

export type ComplianceModule = {
  /** Matches a `name` in src/lib/content.ts REGULATIONS so results can link back to it. */
  regulationName: string;
  sectors: string[];
  initialAnswers: AnswerMap;
  questions: Question[];
  visibleQuestions: (a: AnswerMap) => Question[];
  evaluate: (a: AnswerMap) => ModuleResult;
};
