import { AnswerMap, ComplianceModule, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "cl_transaction",
    qid: "Q1",
    type: "single",
    prompt: "Are you currently buying, selling, taking a new lease on, or developing land or premises?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "cl_history",
    qid: "Q2",
    type: "single",
    prompt:
      "Does your current site have a known history of heavy industrial use, fuel or chemical storage, landfilling, sheep dip, or similar activity — by you or a previous occupier?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
];

function visibleQuestions(a: AnswerMap): Question[] {
  return questions.filter((q) => !q.visibleIf || q.visibleIf(a));
}

function evaluate(a: AnswerMap): ModuleResult {
  let rag: RAG = "green";
  const reasons: string[] = [];

  if (a.cl_transaction === "yes") {
    rag = "amber";
    reasons.push(
      "With a land transaction or development in progress, make sure CON29 and LLC1 searches are done, and commission a Phase 1 desk-study survey if the site history suggests any risk — this needs proper legal/environmental advice, not a self-check.",
    );
  }

  if (a.cl_history === "yes") {
    rag = "amber";
    reasons.push(
      "A known history of industrial use, fuel/chemical storage, or similar activity is a real awareness factor — you (or a previous occupier) could be an \"appropriate person\" if contamination is later found, regardless of whether anything is wrong with your day-to-day operations today. Consider a voluntary investigation.",
    );
  } else if (a.cl_history === "unsure") {
    if (rag === "green") rag = "amber";
    reasons.push("Site history isn't confirmed — worth checking, especially if the site or area has any industrial past.");
  }

  if (reasons.length === 0) {
    reasons.push(
      "No land transaction in progress and no known contamination history — not currently a live risk factor, though this isn't the same as a certified \"compliant\" status, since this regime has no ongoing duty to be compliant with.",
    );
  }

  return {
    obligations: [
      {
        id: "O1",
        title: "Historic land contamination awareness",
        citation: "Environmental Protection Act 1990, Part 2A (ss.78A–78YC)",
        rag,
        reason: reasons.join(" "),
        billing: "one_time",
      },
    ],
    overall: rag,
    notes: [
      "This is a liability-awareness check, not an operational compliance score — there's no licence or return to file. Local authorities regulate this, not the Environment Agency (except \"special sites\").",
    ],
  };
}

export const contaminatedLand: ComplianceModule = {
  regulationName: "Contaminated Land Regime, EPA 1990 Part 2A",
  sectors: ["Construction", "Manufacturing", "Retail", "Agriculture"],
  initialAnswers: {
    cl_transaction: null,
    cl_history: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
