import { AnswerMap, ComplianceModule, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "comah_storesDangerous",
    qid: "Q1",
    type: "single",
    prompt:
      "Does your site store large quantities of hazardous substances — e.g. bulk LPG/fuel (tens of tonnes or more), bulk agrochemicals/fertiliser, or industrial chemicals at a scale well beyond normal workshop/office quantities?",
    help: "This only applies at genuinely large industrial quantities (COMAH thresholds start around 10 tonnes for the most hazardous substances, and run into thousands of tonnes for others) — most businesses will answer no.",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes, possibly at that scale" },
    ],
  },
  {
    id: "comah_assessed",
    qid: "Q2",
    type: "single",
    prompt: "Have you had this checked against the COMAH Schedule 1 thresholds (e.g. with HSE or a specialist consultant), and put in place the required MAPP document (lower tier) or Safety Report (upper tier) if a threshold is met?",
    visibleIf: (a) => a.comah_storesDangerous === "yes",
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
  let rag: RAG = "green";
  let reason = "No large-scale hazardous substance storage reported — COMAH thresholds are a niche, high-quantity regime that most businesses never reach.";

  if (a.comah_storesDangerous === "yes") {
    if (a.comah_assessed === "yes") {
      rag = "green";
      reason = "Storage has been checked against COMAH thresholds and the required documentation is in place.";
    } else {
      rag = "amber";
      reason =
        "Storage at this scale needs checking against the exact COMAH Schedule 1 thresholds, which vary hugely by substance (from around 10 tonnes to tens of thousands of tonnes) — this needs specialist confirmation (HSE or a competent consultant), not a self-assessment.";
    }
  }

  return {
    obligations: [
      {
        id: "O1",
        title: "Major accident hazard storage thresholds (COMAH)",
        citation: "Control of Major Accident Hazards Regulations 2015",
        rag,
        reason,
        billing: "annual",
      },
    ],
    overall: rag,
  };
}

export const comah: ComplianceModule = {
  regulationName: "Control of Major Accident Hazards Regulations",
  sectors: ["Manufacturing", "Agriculture", "Retail"],
  initialAnswers: {
    comah_storesDangerous: null,
    comah_assessed: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
