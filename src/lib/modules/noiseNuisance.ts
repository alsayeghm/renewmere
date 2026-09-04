import { AnswerMap, ComplianceModule, ModuleObligation, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "nn_producesNuisance",
    qid: "Q1",
    type: "single",
    prompt:
      "Does your business ever produce noise, smoke, fumes, dust, or odour that a neighbour or nearby business could plausibly be affected by — e.g. plant/AC noise, deliveries, cooking smells, dust, or construction work?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "nn_complaint",
    qid: "Q2",
    type: "single",
    prompt: "Have you received a complaint, warning, or abatement notice from your local council about this in the last 12 months?",
    visibleIf: (a) => a.nn_producesNuisance === "yes",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
    ],
  },
  {
    id: "nn_resolved",
    qid: "Q3",
    type: "single",
    prompt: "Has that been fully resolved or complied with?",
    visibleIf: (a) => a.nn_complaint === "yes",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No / ongoing" },
    ],
  },
  {
    id: "nn_construction",
    qid: "Q4",
    type: "single",
    prompt: "Is this a construction site carrying out noisy works — e.g. demolition, piling, or breaking?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "nn_priorConsent",
    qid: "Q5",
    type: "single",
    prompt:
      "Have you applied for prior consent from the local authority (under s.61 Control of Pollution Act 1974) for how noise will be controlled on this site?",
    help: "This is optional, but if granted it gives you a defence against a later noise-control notice.",
    visibleIf: (a) => a.nn_construction === "yes",
    options: [
      { value: "yes", label: "Yes, granted" },
      { value: "applied", label: "Applied, awaiting response" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "nn_noiseNotice",
    qid: "Q6",
    type: "single",
    prompt: "Has the council served a noise-control notice on this site (under s.60 Control of Pollution Act 1974)?",
    visibleIf: (a) => a.nn_construction === "yes",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
    ],
  },
  {
    id: "nn_noticeComplied",
    qid: "Q7",
    type: "single",
    prompt: "Has that notice been fully complied with?",
    visibleIf: (a) => a.nn_noiseNotice === "yes",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No / ongoing" },
    ],
  },
];

function visibleQuestions(a: AnswerMap): Question[] {
  return questions.filter((q) => !q.visibleIf || q.visibleIf(a));
}

function evaluate(a: AnswerMap): ModuleResult {
  let nuisanceRag: RAG = "green";
  let nuisanceReason = "No plausible statutory nuisance (noise, smoke, fumes, dust, odour) reported.";
  if (a.nn_producesNuisance === "yes") {
    nuisanceRag = "amber";
    nuisanceReason =
      "Whether this counts as a statutory nuisance is a case-by-case judgement (\"materially affects reasonable enjoyment\" or is \"prejudicial to health\") with no fixed numeric threshold — no complaint history doesn't guarantee no risk, but it's the best available signal.";
    if (a.nn_complaint === "yes") {
      if (a.nn_resolved === "yes") {
        nuisanceRag = "amber";
        nuisanceReason = "A past complaint/notice was resolved, but ongoing vigilance is worth keeping given the subjective nature of this area.";
      } else {
        nuisanceRag = "red";
        nuisanceReason = "An unresolved complaint or abatement notice — this needs immediate attention; non-compliance with an abatement notice is itself an offence.";
      }
    }
  }

  let constructionRag: RAG = "green";
  let constructionReason = "Not a construction site with noisy works.";
  if (a.nn_construction === "yes") {
    constructionRag = "amber";
    constructionReason = "No prior consent applied for — this is optional, but without it you have less protection if a noise-control notice is later served.";

    if (a.nn_priorConsent === "yes") {
      constructionRag = "green";
      constructionReason = "Prior consent (s.61) is in place, giving a defence against a later noise-control notice.";
    } else if (a.nn_priorConsent === "applied") {
      constructionRag = "amber";
      constructionReason = "Prior consent has been applied for but not yet granted.";
    }

    if (a.nn_noiseNotice === "yes") {
      if (a.nn_noticeComplied === "yes") {
        if (constructionRag !== "green") constructionRag = "amber";
        constructionReason += " A noise-control notice was served and has been complied with.";
      } else {
        constructionRag = "red";
        constructionReason = "A noise-control notice has been served and isn't fully complied with — this is an offence.";
      }
    }
  }

  const obligations: ModuleObligation[] = [
    {
      id: "O1",
      title: "No unresolved statutory nuisance (noise, smoke, fumes, dust, odour)",
      citation: "Environmental Protection Act 1990, Part III (ss.79–82)",
      rag: nuisanceRag,
      reason: nuisanceReason,
      billing: "one_time",
    },
    {
      id: "O2",
      title: "Construction site noise control",
      citation: "Control of Pollution Act 1974, ss.60–61",
      rag: constructionRag,
      reason: constructionReason,
      billing: "one_time",
    },
  ];

  const rank: Record<RAG, number> = { red: 2, amber: 1, green: 0 };
  const overall = obligations.reduce<RAG>((worst, o) => (rank[o.rag] > rank[worst] ? o.rag : worst), "green");

  return { obligations, overall };
}

export const noiseNuisance: ComplianceModule = {
  regulationName: "Statutory Nuisance, EPA 1990 Part III",
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
    nn_producesNuisance: null,
    nn_complaint: null,
    nn_resolved: null,
    nn_construction: null,
    nn_priorConsent: null,
    nn_noiseNotice: null,
    nn_noticeComplied: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
