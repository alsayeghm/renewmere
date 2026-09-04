import { AnswerMap, ComplianceModule, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "lt_directOperator",
    qid: "Q1",
    type: "single",
    prompt:
      "Does your business own or operate a licensed landfill site, or dispose of waste directly into your own land or quarry void under an environmental permit — rather than using a waste contractor or skip company?",
    options: [
      { value: "no", label: "No, we use a waste contractor / skip company" },
      { value: "yes", label: "Yes, we operate our own licensed disposal site" },
    ],
  },
  {
    id: "lt_directRegistered",
    qid: "Q2",
    type: "single",
    prompt:
      "Are you registered with HMRC for Landfill Tax, and accounting for tax on your taxable disposals?",
    visibleIf: (a) => a.lt_directOperator === "yes",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "lt_segregate",
    qid: "Q3",
    type: "single",
    prompt:
      "When you send construction or demolition waste to landfill (e.g. via skip hire), do you separate inert material (rubble, brick, concrete, soil, ceramics) from mixed, non-qualifying waste (timber, plastic, plasterboard, packaging, metal)?",
    help: "This is a cost tip, not a legal requirement — segregated inert waste qualifies for a much lower tax rate, but only if it isn't contaminated with other material.",
    visibleIf: (a) => a.lt_directOperator === "no",
    options: [
      { value: "yes", label: "Yes, always" },
      { value: "sometimes", label: "Sometimes" },
      { value: "no", label: "No / not sure" },
      { value: "na", label: "Not applicable — we don't produce construction waste" },
    ],
  },
];

function visibleQuestions(a: AnswerMap): Question[] {
  return questions.filter((q) => !q.visibleIf || q.visibleIf(a));
}

function evaluate(a: AnswerMap): ModuleResult {
  let rag: RAG = "green";
  let reason =
    "Landfill Tax is paid by your waste contractor via the landfill site operator and passed through in your bill — you have no separate HMRC registration or filing duty.";

  if (a.lt_directOperator === "yes") {
    if (a.lt_directRegistered === "yes") {
      rag = "green";
      reason = "Registered with HMRC and accounting for Landfill Tax as a site operator.";
    } else if (a.lt_directRegistered === "unsure" || a.lt_directRegistered == null) {
      rag = "amber";
      reason = "Operating a licensed disposal site, but Landfill Tax registration status isn't confirmed.";
    } else {
      rag = "red";
      reason =
        "Operating a licensed disposal site without confirmed Landfill Tax registration — site operators must register with HMRC within 30 days of starting taxable activity.";
    }
  }

  const notes: string[] = [];
  if (a.lt_segregate === "no" || a.lt_segregate === "sometimes") {
    notes.push(
      "Cost tip: segregating inert waste (rubble, brick, concrete, soil) from mixed waste can cut the Landfill Tax charge on that fraction dramatically — mixing it with non-qualifying waste usually means the whole load gets taxed at the higher standard rate. Not a compliance risk, just a cost worth capturing.",
    );
  }

  return {
    obligations: [
      {
        id: "O1",
        title: "Landfill Tax — direct registration duty (site operators only)",
        citation: "Finance Act 1996, Part III (ss.39–71)",
        rag,
        reason,
        billing: "recurring",
      },
    ],
    overall: rag,
    notes: notes.length ? notes : undefined,
  };
}

export const landfillTax: ComplianceModule = {
  regulationName: "Landfill Tax, Finance Act 1996 Part III",
  sectors: [
    "Office & professional",
    "Retail",
    "Hospitality & food service",
    "Manufacturing",
    "Construction",
    "Healthcare & care",
    "Education",
    "Agriculture",
  ],
  initialAnswers: {
    lt_directOperator: null,
    lt_directRegistered: null,
    lt_segregate: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
