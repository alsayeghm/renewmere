import { AnswerMap, ComplianceModule, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "nvz_inZone",
    qid: "Q1",
    type: "single",
    prompt:
      "Does any part of your agricultural land fall within a designated Nitrate Vulnerable Zone (NVZ)? Check the Environment Agency's NVZ map tool if you're not sure.",
    help: "NVZs cover roughly 55% of agricultural land in England, defined field by field — not a rule of thumb by postcode or region.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "nvz_closedPeriod",
    qid: "Q2",
    type: "single",
    prompt:
      "In the last 12 months, have you spread slurry, poultry manure, other high-nitrogen organic manure, or manufactured nitrogen fertiliser on any NVZ land during that land's closed period?",
    help: "Closed period dates vary by manure type, land use, and soil type — check current gov.uk guidance for the dates that apply to your land.",
    visibleIf: (a) => a.nvz_inZone === "yes" || a.nvz_inZone === "unsure",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "nvz_loadingLimit",
    qid: "Q3",
    type: "single",
    prompt:
      "Across your whole holding, does the total nitrogen from livestock manure (including manure deposited directly by grazing animals) exceed 170kg per hectare per year, averaged over your NVZ land?",
    visibleIf: (a) => a.nvz_inZone === "yes" || a.nvz_inZone === "unsure",
    options: [
      { value: "no", label: "No, or not sure" },
      { value: "yes-derogation", label: "Yes, but we hold a grassland derogation covering it" },
      { value: "yes-no-derogation", label: "Yes, and we don't hold a derogation" },
    ],
  },
  {
    id: "nvz_fieldLimit",
    qid: "Q4",
    type: "single",
    prompt: "In any single field, has the total organic manure applied this year exceeded 250kg N/ha (excluding manure deposited directly by grazing animals)?",
    visibleIf: (a) => a.nvz_inZone === "yes" || a.nvz_inZone === "unsure",
    options: [
      { value: "no", label: "No / not sure" },
      { value: "yes", label: "Yes" },
    ],
  },
  {
    id: "nvz_records",
    qid: "Q5",
    type: "single",
    prompt: "Do you keep written records of manure/fertiliser applications (dates, quantities, fields) and livestock numbers, for at least the last 5 years?",
    visibleIf: (a) => a.nvz_inZone === "yes" || a.nvz_inZone === "unsure",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "nvz_storage",
    qid: "Q6",
    type: "single",
    prompt:
      "Do you have enough manure/slurry storage capacity to hold all manure produced during the closed period without spreading it?",
    visibleIf: (a) => a.nvz_inZone === "yes" || a.nvz_inZone === "unsure",
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
  if (a.nvz_inZone === "no") {
    return {
      obligations: [
        {
          id: "O1",
          title: "Nitrate Vulnerable Zone rules",
          citation: "Nitrate Pollution Prevention Regulations 2015",
          rag: "green",
          reason: "No land in a designated Nitrate Vulnerable Zone — these additional rules don't apply, though the national Farming Rules for Water still do.",
          billing: "recurring",
        },
      ],
      overall: "green",
    };
  }

  let rag: RAG = "amber";
  const reasons: string[] = ["Land in (or possibly in) a Nitrate Vulnerable Zone means these additional rules apply on top of the national Farming Rules for Water."];

  if (a.nvz_closedPeriod === "yes") {
    rag = "red";
    reasons.push("Spreading during the closed period for your land type is a specific breach.");
  } else if (a.nvz_closedPeriod === "unsure") {
    reasons.push("Closed-period compliance isn't confirmed — check current gov.uk guidance for the dates that apply to your land/soil type.");
  }

  if (a.nvz_loadingLimit === "yes-no-derogation") {
    rag = "red";
    reasons.push("Exceeding the 170kg N/ha/year whole-holding loading limit without a grassland derogation is a breach.");
  } else if (a.nvz_loadingLimit === "yes-derogation") {
    reasons.push("Loading limit exceeded, but covered by a grassland derogation.");
  }

  if (a.nvz_fieldLimit === "yes") {
    rag = "red";
    reasons.push("Exceeding 250kg N/ha organic manure on a single field is a breach.");
  }

  if (a.nvz_records === "no") {
    if (rag !== "red") rag = "amber";
    reasons.push("Application and livestock records aren't confirmed as kept for 5 years — a separate record-keeping obligation.");
  }

  if (a.nvz_storage === "no") {
    if (rag !== "red") rag = "amber";
    reasons.push("Storage capacity to bridge the closed period isn't confirmed — get a proper capacity calculation rather than estimating.");
  }

  return {
    obligations: [
      {
        id: "O1",
        title: "Nitrate Vulnerable Zone rules",
        citation: "Nitrate Pollution Prevention Regulations 2015",
        rag,
        reason: reasons.join(" "),
        billing: "recurring",
      },
    ],
    overall: rag,
    notes: [
      "NVZ boundaries are reviewed periodically (current cycle 2025–2028) — re-check even if you've confirmed your status before.",
    ],
  };
}

export const nitratePollution: ComplianceModule = {
  regulationName: "Nitrate Pollution Prevention Regulations",
  sectors: ["Agriculture"],
  initialAnswers: {
    nvz_inZone: null,
    nvz_closedPeriod: null,
    nvz_loadingLimit: null,
    nvz_fieldLimit: null,
    nvz_records: null,
    nvz_storage: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
