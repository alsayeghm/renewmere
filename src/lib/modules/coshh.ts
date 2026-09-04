import { AnswerMap, ComplianceModule, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "coshh_uses",
    qid: "Q1",
    type: "single",
    prompt: "Does your business use or store any hazardous substances — cleaning chemicals, solvents, paints, adhesives, pesticides, veterinary chemicals, disinfectants, or lab chemicals?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "coshh_assessment",
    qid: "Q2",
    type: "single",
    prompt: "Has a written COSHH risk assessment been done for these substances?",
    visibleIf: (a) => a.coshh_uses === "yes",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "coshh_storage",
    qid: "Q3",
    type: "single",
    prompt: "Are these substances stored safely and kept apart from incompatible substances, with spills contained (e.g. a bunded or sealed cabinet for liquids)?",
    visibleIf: (a) => a.coshh_uses === "yes",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "coshh_sds",
    qid: "Q4",
    type: "single",
    prompt: "Are safety data sheets (SDS) for these substances kept on file and accessible to staff?",
    visibleIf: (a) => a.coshh_uses === "yes",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
];

function visibleQuestions(a: AnswerMap): Question[] {
  return questions.filter((q) => !q.visibleIf || q.visibleIf(a));
}

function evaluate(a: AnswerMap): ModuleResult {
  let rag: RAG = "green";
  let reason = "No hazardous substances reported.";

  if (a.coshh_uses === "yes") {
    const gaps: string[] = [];
    if (a.coshh_storage !== "yes") gaps.push("safe, segregated storage isn't confirmed");
    if (a.coshh_assessment !== "yes") gaps.push("no written COSHH assessment");
    if (a.coshh_sds !== "yes") gaps.push("safety data sheets aren't confirmed as on file");

    if (gaps.length === 0) {
      rag = "green";
      reason = "A written COSHH assessment is in place, storage is safe and segregated, and safety data sheets are on file.";
    } else if (a.coshh_storage !== "yes") {
      rag = "red";
      reason = `Storage isn't confirmed as safe/segregated — this is the piece most likely to cause an environmental spill, not just a workplace-safety gap. Also: ${gaps.filter((g) => g !== "safe, segregated storage isn't confirmed").join("; ") || "no other gaps"}.`;
    } else {
      rag = "amber";
      reason = `Storage is safe, but: ${gaps.join("; ")}.`;
    }
  }

  return {
    obligations: [
      {
        id: "O1",
        title: "Hazardous substances stored and managed safely",
        citation: "Control of Substances Hazardous to Health Regulations 2002, reg. 6, 7(4)(a) & 12",
        rag,
        reason,
        billing: "one_time",
      },
    ],
    overall: rag,
    notes: [
      "COSHH is primarily a workplace-safety law enforced by the HSE, not an environmental one. This check covers only the storage/containment angle most likely to cause an environmental spill — it isn't a full COSHH/HSE compliance check (which also covers exposure limits, health surveillance, and protective equipment).",
    ],
  };
}

export const coshh: ComplianceModule = {
  regulationName: "Control of Substances Hazardous to Health Regulations (COSHH)",
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
    coshh_uses: null,
    coshh_assessment: null,
    coshh_storage: null,
    coshh_sds: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
