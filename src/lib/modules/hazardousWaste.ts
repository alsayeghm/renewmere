import { AnswerMap, ComplianceModule, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "hw_produces",
    qid: "Q1",
    type: "single",
    prompt: "Does your business produce, store, or arrange removal of any hazardous waste?",
    help: "E.g. solvents, waste oils, asbestos or contaminated soil (construction), sharps/clinical/pharmaceutical waste (healthcare), waste pesticides/sheep dip (agriculture), used cooking oil or chemical cleaners (hospitality), lab chemicals (education). Fluorescent tubes, some batteries and certain electricals can count as hazardous even in an ordinary office.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "hw_classified",
    qid: "Q2",
    type: "single",
    prompt: "Do you know what your hazardous waste is classified as — its waste code(s) and hazard properties?",
    visibleIf: (a) => a.hw_produces === "yes" || a.hw_produces === "unsure",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "hw_consignmentNotes",
    qid: "Q3",
    type: "single",
    prompt: "When hazardous waste leaves your premises, is it always accompanied by a correctly completed consignment note?",
    visibleIf: (a) => a.hw_classified === "yes",
    options: [
      { value: "yes", label: "Yes, always" },
      { value: "sometimes", label: "Sometimes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "hw_carrierChecked",
    qid: "Q4",
    type: "single",
    prompt: "Is your hazardous waste always collected by, or taken to, a business you've confirmed is a registered waste carrier or permitted waste site?",
    visibleIf: (a) => a.hw_classified === "yes",
    options: [
      { value: "yes", label: "Yes, always checked" },
      { value: "sometimes", label: "Checked inconsistently" },
      { value: "no", label: "Never checked" },
    ],
  },
  {
    id: "hw_records",
    qid: "Q5",
    type: "single",
    prompt: "Do you keep your consignment notes, consignee returns, and related records for at least 3 years?",
    visibleIf: (a) => a.hw_classified === "yes",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "hw_storage",
    qid: "Q6",
    type: "single",
    prompt: "Is hazardous waste stored safely and separately — never mixed with non-hazardous waste or a different category of hazardous waste, in suitable sealed and labelled containers?",
    visibleIf: (a) => a.hw_classified === "yes",
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
  let reason = "No hazardous waste reported — these duties don't currently apply to you.";

  if (a.hw_produces === "unsure") {
    rag = "amber";
    reason = "Not confirmed whether your business produces hazardous waste — worth checking against gov.uk's waste classification guidance.";
  }

  if (a.hw_produces === "yes") {
    if (a.hw_classified !== "yes") {
      rag = "red";
      reason = "Hazardous waste is produced but not classified — without classifying it correctly (waste code and hazard properties), duty of care can't be met.";
    } else {
      const checks: { ok: boolean; partial: boolean; label: string }[] = [
        {
          ok: a.hw_consignmentNotes === "yes",
          partial: a.hw_consignmentNotes === "sometimes",
          label: "a correctly completed consignment note doesn't always accompany hazardous waste leaving your premises",
        },
        {
          ok: a.hw_carrierChecked === "yes",
          partial: a.hw_carrierChecked === "sometimes",
          label: "your waste carrier's registration isn't always checked",
        },
        {
          ok: a.hw_records === "yes",
          partial: false,
          label: "consignment notes and related records aren't kept for at least 3 years",
        },
        {
          ok: a.hw_storage === "yes",
          partial: false,
          label: "hazardous waste isn't always stored safely and separately from other waste",
        },
      ];

      const failing = checks.filter((c) => !c.ok);
      if (failing.length === 0) {
        rag = "green";
        reason = "Hazardous waste is classified, consigned, carried by checked registered carriers, recorded, and stored correctly.";
      } else if (failing.some((c) => !c.partial)) {
        rag = "red";
        reason = `Gaps found: ${failing.filter((c) => !c.partial).map((c) => c.label).join("; ")}.`;
      } else {
        rag = "amber";
        reason = `Mostly compliant, but: ${failing.map((c) => c.label).join("; ")}.`;
      }
    }
  }

  return {
    obligations: [
      {
        id: "O1",
        title: "Hazardous waste classified, consigned, and carried correctly",
        citation: "Hazardous Waste (England and Wales) Regulations 2005, Parts 6 & 7",
        rag,
        reason,
        billing: "recurring",
      },
    ],
    overall: rag,
    notes: [
      "England abolished hazardous waste premises registration in 2016 — there's no registration step for producers here, just correct classification, consignment notes, checked carriers, and 3-year record-keeping.",
    ],
  };
}

export const hazardousWaste: ComplianceModule = {
  regulationName: "Hazardous Waste (England and Wales) Regulations",
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
    hw_produces: null,
    hw_classified: null,
    hw_consignmentNotes: null,
    hw_carrierChecked: null,
    hw_records: null,
    hw_storage: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
