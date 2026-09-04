import { AnswerMap, ComplianceModule, ModuleObligation, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "pd_newDevelopment",
    qid: "Q1",
    type: "single",
    prompt: "Are you planning a new development or building project that requires planning permission?",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
    ],
  },
  {
    id: "pd_eiaScreened",
    qid: "Q2",
    type: "single",
    prompt: "Has the project been screened for Environmental Impact Assessment (EIA) with your local planning authority — needed for larger developments or anything near a sensitive area?",
    visibleIf: (a) => a.pd_newDevelopment === "yes",
    options: [
      { value: "yes-not-needed", label: "Yes, screened — EIA not required" },
      { value: "yes-required", label: "Yes, screened — EIA required and in progress/complete" },
      { value: "no", label: "Not screened yet" },
    ],
  },
  {
    id: "pd_bngPlan",
    qid: "Q3",
    type: "single",
    prompt: "Does the project have an approved Biodiversity Gain Plan showing at least 10% biodiversity net gain (unless a specific exemption applies, e.g. householder applications or very small sites)?",
    visibleIf: (a) => a.pd_newDevelopment === "yes",
    options: [
      { value: "yes", label: "Yes, approved" },
      { value: "exempt", label: "Exempt (confirmed with the local planning authority)" },
      { value: "no", label: "No / not yet" },
    ],
  },
  {
    id: "pd_marineWorks",
    qid: "Q4",
    type: "single",
    prompt: "Does any of your work involve construction, dredging, depositing material, or similar physical activity at or below Mean High Water Springs (coastal/marine works)?",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
    ],
  },
  {
    id: "pd_marineLicence",
    qid: "Q5",
    type: "single",
    prompt: "Do you hold a marine licence from the Marine Management Organisation for that work?",
    visibleIf: (a) => a.pd_marineWorks === "yes",
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
  let planningRag: RAG = "green";
  let planningReason = "No new development requiring planning permission reported.";

  if (a.pd_newDevelopment === "yes") {
    const eiaOk = a.pd_eiaScreened === "yes-not-needed" || a.pd_eiaScreened === "yes-required";
    const bngOk = a.pd_bngPlan === "yes" || a.pd_bngPlan === "exempt";

    if (eiaOk && bngOk) {
      planningRag = "green";
      planningReason = "EIA screening and Biodiversity Net Gain requirements are both confirmed as handled.";
    } else {
      planningRag = "amber";
      const gaps: string[] = [];
      if (!eiaOk) gaps.push("EIA screening with the local planning authority isn't confirmed");
      if (!bngOk) gaps.push("an approved Biodiversity Gain Plan (or confirmed exemption) isn't in place");
      planningReason = `A development requiring planning permission is underway, but: ${gaps.join("; ")}. These are planning-stage requirements — check with your local planning authority.`;
    }
  }

  let marineRag: RAG = "green";
  let marineReason = "No coastal/marine physical works reported.";
  if (a.pd_marineWorks === "yes") {
    if (a.pd_marineLicence === "yes") {
      marineRag = "green";
      marineReason = "A marine licence is held for coastal/marine works.";
    } else {
      marineRag = "red";
      marineReason = "Coastal/marine works without a confirmed marine licence from the Marine Management Organisation — carrying out unlicensed marine works is an offence.";
    }
  }

  const obligations: ModuleObligation[] = [
    {
      id: "O1",
      title: "Environmental Impact Assessment & Biodiversity Net Gain (new developments)",
      citation: "Town and Country Planning (Environmental Impact Assessment) Regulations 2017; Environment Act 2021, Sch. 14",
      rag: planningRag,
      reason: planningReason,
      billing: "one_time",
    },
    {
      id: "O2",
      title: "Marine licence for coastal/marine works",
      citation: "Marine and Coastal Access Act 2009",
      rag: marineRag,
      reason: marineReason,
      billing: "one_time",
    },
  ];

  const rank: Record<RAG, number> = { red: 2, amber: 1, green: 0 };
  const overall = obligations.reduce<RAG>((worst, o) => (rank[o.rag] > rank[worst] ? o.rag : worst), "green");

  return { obligations, overall };
}

export const planningDevelopment: ComplianceModule = {
  regulationName: "Town and Country Planning (EIA) Regulations",
  sectors: ["Construction", "Agriculture", "Hospitality & food service"],
  initialAnswers: {
    pd_newDevelopment: null,
    pd_eiaScreened: null,
    pd_bngPlan: null,
    pd_marineWorks: null,
    pd_marineLicence: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
