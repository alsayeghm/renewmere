import { AnswerMap, ComplianceModule, ModuleObligation, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "reach_importsOrMakes",
    qid: "Q1",
    type: "single",
    prompt: "Does your business manufacture chemical substances, or import chemical substances or mixtures directly from outside Great Britain — rather than buying chemical products already sourced/sold in GB?",
    options: [
      { value: "no", label: "No, we buy GB-sourced products" },
      { value: "yes", label: "Yes" },
    ],
  },
  {
    id: "reach_registered",
    qid: "Q2",
    type: "single",
    prompt: "Is that registered with the HSE as required under UK REACH (or covered by a Downstream User Import Notification transitional arrangement)?",
    visibleIf: (a) => a.reach_importsOrMakes === "yes",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No / not sure" },
    ],
  },
  {
    id: "reach_sds",
    qid: "Q3",
    type: "single",
    prompt: "For hazardous chemicals you use, do you follow the safety data sheet (SDS) instructions and any exposure scenario it specifies?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No / not sure" },
      { value: "na", label: "We don't use hazardous chemicals" },
    ],
  },
  {
    id: "reach_restricted",
    qid: "Q4",
    type: "single",
    prompt: "Are you confident none of the substances you use are subject to an Annex XVII restriction that your use would breach (e.g. certain solvents, flame retardants, or specific-use bans)?",
    visibleIf: (a) => a.reach_sds !== "na",
    options: [
      { value: "yes", label: "Yes, confident" },
      { value: "no", label: "No / not sure" },
    ],
  },
];

function visibleQuestions(a: AnswerMap): Question[] {
  return questions.filter((q) => !q.visibleIf || q.visibleIf(a));
}

function evaluate(a: AnswerMap): ModuleResult {
  let registrantRag: RAG = "green";
  let registrantReason = "You buy GB-sourced chemical products rather than manufacturing or importing them directly — registrant duties don't apply.";
  if (a.reach_importsOrMakes === "yes") {
    if (a.reach_registered === "yes") {
      registrantRag = "green";
      registrantReason = "Registered with HSE (or covered by a transitional notification) as required.";
    } else {
      registrantRag = "amber";
      registrantReason =
        "Manufacturing or directly importing chemical substances/mixtures brings registrant duties under UK REACH — this needs specialist confirmation with HSE rather than a self-check, since deadlines and thresholds have shifted before.";
    }
  }

  let userRag: RAG = "green";
  let userReason = "No hazardous chemicals reported.";
  if (a.reach_sds !== "na") {
    if (a.reach_sds === "yes" && a.reach_restricted === "yes") {
      userRag = "green";
      userReason = "Safety data sheet instructions are followed, and no restricted-substance conflicts identified.";
    } else if (a.reach_sds === "no") {
      userRag = "red";
      userReason = "Safety data sheet instructions aren't confirmed as followed for hazardous chemicals in use.";
    } else {
      userRag = "amber";
      userReason = "Not confident that current chemical use avoids Annex XVII restrictions — worth checking against the current restricted-substances list.";
    }
  }

  const obligations: ModuleObligation[] = [
    {
      id: "O1",
      title: "Chemical registration (manufacturers/direct importers only)",
      citation: "UK REACH (retained Regulation (EC) 1907/2006, as amended for Great Britain)",
      rag: registrantRag,
      reason: registrantReason,
      billing: "one_time",
    },
    {
      id: "O2",
      title: "Safe use of chemicals per SDS and restriction limits",
      citation: "UK REACH (retained Regulation (EC) 1907/2006, as amended for Great Britain)",
      rag: userRag,
      reason: userReason,
      billing: "recurring",
    },
  ];

  const rank: Record<RAG, number> = { red: 2, amber: 1, green: 0 };
  const overall = obligations.reduce<RAG>((worst, o) => (rank[o.rag] > rank[worst] ? o.rag : worst), "green");

  return { obligations, overall };
}

export const ukReach: ComplianceModule = {
  regulationName: "UK REACH, retained Regulation 1907/2006",
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
    reach_importsOrMakes: null,
    reach_registered: null,
    reach_sds: null,
    reach_restricted: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
