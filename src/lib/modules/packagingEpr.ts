import { AnswerMap, ComplianceModule, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "epr_producerActivity",
    qid: "Q1",
    type: "single",
    prompt:
      "Does your business do any of the following: put your own brand on packaged goods, pack or fill goods into packaging, import packaging or packaged goods into the UK, sell empty packaging you made or imported to other businesses, hire out reusable packaging, or run an online marketplace where overseas sellers sell into the UK?",
    help: "Just buying pre-packaged goods for your own use (e.g. office supplies) doesn't count on its own.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "epr_turnover",
    qid: "Q2",
    type: "single",
    prompt: "What was your business's total worldwide annual turnover in the last full financial year?",
    visibleIf: (a) => a.epr_producerActivity === "yes",
    options: [
      { value: "under1m", label: "Under £1 million" },
      { value: "1to2m", label: "£1 million to £2 million" },
      { value: "over2m", label: "Over £2 million" },
    ],
  },
  {
    id: "epr_tonnage",
    qid: "Q3",
    type: "single",
    prompt:
      "Roughly how much packaging (by weight, all materials combined — cardboard, plastic, glass, etc.) did your business supply, pack, or import in the UK last calendar year?",
    help: "Rule of thumb: a tonne is roughly 1,000 cereal-box-sized cartons.",
    visibleIf: (a) => a.epr_producerActivity === "yes" && a.epr_turnover !== "under1m",
    options: [
      { value: "under25", label: "Under 25 tonnes" },
      { value: "25to50", label: "25–50 tonnes" },
      { value: "over50", label: "Over 50 tonnes" },
    ],
  },
  {
    id: "epr_smallCompliant",
    qid: "Q4",
    type: "single",
    prompt:
      "Are you registered with the Environment Agency (or a compliance scheme) for packaging EPR, and up to date on your annual packaging data report?",
    visibleIf: (a) => obligationTier(a) === "small",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No / not sure" },
    ],
  },
  {
    id: "epr_largeCompliant",
    qid: "Q5",
    type: "single",
    prompt:
      "Are you registered with the Environment Agency (or a compliance scheme) for packaging EPR, up to date on your six-monthly data reports, and have you paid any waste disposal fee invoices issued to you?",
    visibleIf: (a) => obligationTier(a) === "large",
    options: [
      { value: "yes", label: "Yes, all of the above" },
      { value: "partial", label: "Partially, or not sure" },
      { value: "no", label: "No" },
    ],
  },
];

function obligationTier(a: AnswerMap): "none" | "small" | "large" | null {
  if (a.epr_producerActivity !== "yes") return "none";
  if (a.epr_turnover === "under1m") return "none";
  if (a.epr_turnover == null) return null;
  if (a.epr_tonnage === "under25") return "none";
  if (a.epr_tonnage == null) return null;
  if (a.epr_turnover === "over2m" && a.epr_tonnage === "over50") return "large";
  return "small";
}

function visibleQuestions(a: AnswerMap): Question[] {
  return questions.filter((q) => !q.visibleIf || q.visibleIf(a));
}

function evaluate(a: AnswerMap): ModuleResult {
  const tier = obligationTier(a);
  let rag: RAG = "green";
  let reason = "You're not a packaging \"producer\" under pEPR, or you're below the turnover/tonnage thresholds — no obligation.";

  if (tier === "small") {
    if (a.epr_smallCompliant === "yes") {
      rag = "green";
      reason = "Small-producer tier: registered and up to date on annual packaging data reporting. No fees or PRNs required at this tier.";
    } else {
      rag = "amber";
      reason =
        "Small-producer tier applies (registration and annual data reporting only, due 1 April each year — no fees or PRNs at this tier), but it's not confirmed as met.";
    }
  } else if (tier === "large") {
    if (a.epr_largeCompliant === "yes") {
      rag = "green";
      reason = "Large-producer tier: registered, reporting six-monthly, and up to date on waste disposal fee invoices.";
    } else if (a.epr_largeCompliant === "partial") {
      rag = "amber";
      reason = "Large-producer tier applies, but registration, reporting, or fee payment isn't fully confirmed.";
    } else {
      rag = "red";
      reason =
        "Large-producer tier applies (registration, six-monthly reporting, waste disposal fees, and PRNs/PERNs), and none of it is confirmed as in place.";
    }
  }

  return {
    obligations: [
      {
        id: "O1",
        title: "Packaging Extended Producer Responsibility (pEPR)",
        citation: "Producer Responsibility Obligations (Packaging and Packaging Waste) Regulations 2024",
        rag,
        reason,
        billing: "recurring",
      },
    ],
    overall: rag,
    notes:
      tier === "large"
        ? [
            "A standardised \"Recycle / Do Not Recycle / Check Locally\" on-pack labelling requirement is expected but its date has moved before — check current gov.uk guidance rather than treating any specific date as fixed.",
          ]
        : undefined,
  };
}

export const packagingEpr: ComplianceModule = {
  regulationName: "Producer Responsibility Obligations (Packaging and Packaging Waste) Regulations",
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
    epr_producerActivity: null,
    epr_turnover: null,
    epr_tonnage: null,
    epr_smallCompliant: null,
    epr_largeCompliant: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
