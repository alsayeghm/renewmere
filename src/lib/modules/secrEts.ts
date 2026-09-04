import { AnswerMap, ComplianceModule, ModuleObligation, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "se_size",
    qid: "Q1",
    type: "single",
    prompt: "Does your company or LLP meet at least 2 of these 3: turnover over £36 million, balance sheet total over £18 million, or more than 250 employees?",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "se_lowEnergy",
    qid: "Q2",
    type: "single",
    prompt: "Did your business use 40,000 kWh of energy or less in the last financial year?",
    visibleIf: (a) => a.se_size === "yes" || a.se_size === "unsure",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No / not sure" },
    ],
  },
  {
    id: "se_reported",
    qid: "Q3",
    type: "single",
    prompt: "Does your directors' report include your energy use, emissions, an intensity ratio, and energy efficiency actions taken (SECR reporting)?",
    visibleIf: (a) => (a.se_size === "yes" || a.se_size === "unsure") && a.se_lowEnergy === "no",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "se_combustion",
    qid: "Q4",
    type: "single",
    prompt: "Does any single site have combustion equipment (boilers, furnaces, generators) totalling more than 20 megawatts rated thermal input?",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "se_etsCompliant",
    qid: "Q5",
    type: "single",
    prompt: "Are you registered and compliant with the UK Emissions Trading Scheme for that site?",
    visibleIf: (a) => a.se_combustion === "yes" || a.se_combustion === "unsure",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No / not sure" },
    ],
  },
];

function visibleQuestions(a: AnswerMap): Question[] {
  return questions.filter((q) => !q.visibleIf || q.visibleIf(a));
}

function evaluate(a: AnswerMap): ModuleResult {
  let secrRag: RAG = "green";
  let secrReason = "Below the SECR size thresholds (2 of: turnover >£36m, balance sheet >£18m, >250 employees) — no SECR reporting duty.";
  if (a.se_size === "yes" || a.se_size === "unsure") {
    if (a.se_lowEnergy === "yes") {
      secrRag = "green";
      secrReason = "Above the SECR size thresholds, but under the 40,000 kWh/year low-energy exemption.";
    } else if (a.se_reported === "yes") {
      secrRag = "green";
      secrReason = "SECR reporting (energy use, emissions, intensity ratio, efficiency actions) is included in the directors' report.";
    } else if (a.se_reported === "no") {
      secrRag = "red";
      secrReason = "Above the SECR size thresholds and not exempt, but SECR reporting isn't confirmed as included in the directors' report.";
    } else {
      secrRag = "amber";
      secrReason = "Possibly above the SECR size thresholds — confirm against the exact figures before assuming no duty applies.";
    }
  }

  let etsRag: RAG = "green";
  let etsReason = "No large combustion plant reported — UK ETS is very unlikely to apply.";
  if (a.se_combustion === "yes" || a.se_combustion === "unsure") {
    if (a.se_etsCompliant === "yes") {
      etsRag = "green";
      etsReason = "Large combustion plant is registered and compliant with the UK Emissions Trading Scheme.";
    } else {
      etsRag = a.se_combustion === "yes" ? "red" : "amber";
      etsReason = "Combustion capacity may exceed the UK ETS threshold — this needs specialist confirmation, not a self-check, given the technical scope tests involved.";
    }
  }

  const obligations: ModuleObligation[] = [
    {
      id: "O1",
      title: "Streamlined Energy and Carbon Reporting (SECR)",
      citation: "The Companies (Directors' Report) and Limited Liability Partnerships (Energy and Carbon Report) Regulations 2018",
      rag: secrRag,
      reason: secrReason,
      billing: "annual",
    },
    {
      id: "O2",
      title: "UK Emissions Trading Scheme (large combustion plant only)",
      citation: "Greenhouse Gas Emissions Trading Scheme Order 2020",
      rag: etsRag,
      reason: etsReason,
      billing: "annual",
    },
  ];

  const rank: Record<RAG, number> = { red: 2, amber: 1, green: 0 };
  const overall = obligations.reduce<RAG>((worst, o) => (rank[o.rag] > rank[worst] ? o.rag : worst), "green");

  return {
    obligations,
    overall,
    notes: [
      "Both of these are mostly irrelevant to typical SMEs — SECR only bites at the upper end of company size, and UK ETS only applies to large industrial combustion, aviation, or (from 2026–27) maritime.",
    ],
  };
}

export const secrEts: ComplianceModule = {
  regulationName: "Energy and Carbon Report Regulations (SECR)",
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
    se_size: null,
    se_lowEnergy: null,
    se_reported: null,
    se_combustion: null,
    se_etsCompliant: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
