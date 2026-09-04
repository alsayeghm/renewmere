import { AnswerMap, ComplianceModule, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "fg_hasEquipment",
    qid: "Q1",
    type: "single",
    prompt:
      "Does your business own or operate any fixed refrigeration units, air conditioning systems, heat pumps, or fire suppression systems (excluding small portable/plug-in units and vehicle AC)?",
    help: "E.g. a walk-in fridge, chiller cabinet, multi-split AC, cold store, or server-room fire suppression.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "fg_overThreshold",
    qid: "Q2",
    type: "single",
    prompt: "Is the refrigerant charge of any single system 5 tonnes CO2 equivalent or more — check your last engineer's service record or the equipment nameplate?",
    help: "Most small single split-AC units are well under this; multiplex refrigeration racks, cold stores, and larger central AC/chiller plant often aren't.",
    visibleIf: (a) => a.fg_hasEquipment === "yes" || a.fg_hasEquipment === "unsure",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Don't know" },
    ],
  },
  {
    id: "fg_leakCheck",
    qid: "Q3",
    type: "single",
    prompt: "Has this equipment had a leak check by an F-Gas certified engineer in the last 12 months (or the shorter period required for larger/older systems)?",
    visibleIf: (a) => a.fg_overThreshold === "yes" || a.fg_overThreshold === "unsure",
    options: [
      { value: "yes", label: "Yes, with evidence/certificate" },
      { value: "no", label: "No / don't know" },
    ],
  },
  {
    id: "fg_records",
    qid: "Q4",
    type: "single",
    prompt: "Do you have written records of gas type/quantity, leak check dates and results, and the certified engineer/company's details, kept for at least 5 years?",
    visibleIf: (a) => a.fg_overThreshold === "yes" || a.fg_overThreshold === "unsure",
    options: [
      { value: "yes", label: "Yes" },
      { value: "partial", label: "Partially" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "fg_certifiedContractor",
    qid: "Q5",
    type: "single",
    prompt: "When this equipment was last installed, serviced, or repaired, was it done by an F-Gas company-certified contractor — or by your own directly-employed, individually F-Gas-qualified staff?",
    visibleIf: (a) => a.fg_hasEquipment === "yes" || a.fg_hasEquipment === "unsure",
    options: [
      { value: "yes", label: "Yes, one or the other" },
      { value: "no", label: "No / used an uncertified contractor / don't know" },
    ],
  },
  {
    id: "fg_legacyGas",
    qid: "Q6",
    type: "single",
    prompt: "Is any of this equipment older than roughly 15–20 years, or do you know or suspect it uses R22 or another older refrigerant (rather than a modern HFC/HFO)?",
    visibleIf: (a) => a.fg_hasEquipment === "yes" || a.fg_hasEquipment === "unsure",
    options: [
      { value: "no", label: "No, modern refrigerant confirmed" },
      { value: "yes", label: "Yes / not sure" },
    ],
  },
  {
    id: "fg_legacyTopUp",
    qid: "Q7",
    type: "single",
    prompt: "Has that older system needed a refrigerant top-up or repair in the last 2 years?",
    visibleIf: (a) => a.fg_legacyGas === "yes",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
    ],
  },
];

function visibleQuestions(a: AnswerMap): Question[] {
  return questions.filter((q) => !q.visibleIf || q.visibleIf(a));
}

function evaluate(a: AnswerMap): ModuleResult {
  let rag: RAG = "green";
  const reasons: string[] = [];

  if (a.fg_hasEquipment !== "yes" && a.fg_hasEquipment !== "unsure") {
    return {
      obligations: [
        {
          id: "O1",
          title: "F-Gas & ODS: leak checks, records, and certified contractors",
          citation: "Fluorinated Greenhouse Gases Regulations 2015; Ozone-Depleting Substances Regulations 2015",
          rag: "green",
          reason: "No fixed refrigeration, air conditioning, heat pump, or fire suppression equipment reported.",
          billing: "recurring",
        },
      ],
      overall: "green",
    };
  }

  if (a.fg_overThreshold === "yes" || a.fg_overThreshold === "unsure") {
    rag = "amber";
    reasons.push("Equipment at or above the 5-tonne CO2e threshold triggers mandatory leak checks and record-keeping.");

    if (a.fg_leakCheck === "no" || a.fg_leakCheck == null) {
      rag = "red";
      reasons.push("A statutory leak check by a certified engineer isn't confirmed as up to date.");
    } else {
      reasons.push("Leak checks are up to date.");
    }

    if (a.fg_records === "no" || a.fg_records == null) {
      if (rag !== "red") rag = "amber";
      reasons.push("Required records (gas type/quantity, check dates, engineer details, 5-year retention) aren't confirmed as kept — this is itself a compliance gap, separate from whether a leak has occurred.");
    } else if (a.fg_records === "partial") {
      if (rag !== "red") rag = "amber";
      reasons.push("Records are only partially kept.");
    }
  } else {
    reasons.push("No equipment confirmed at or above the 5-tonne CO2e leak-check threshold — good practice and the no-venting rule still apply.");
  }

  if (a.fg_certifiedContractor === "no") {
    rag = "red";
    reasons.push("Installation/servicing wasn't confirmed as done by an F-Gas company-certified contractor or qualified in-house staff.");
  }

  if (a.fg_legacyGas === "yes" && a.fg_legacyTopUp === "yes") {
    rag = "red";
    reasons.push("An older system has needed a refrigerant top-up or repair — if it uses R22 or another banned substance, topping it up is illegal (no legal source of virgin or recycled R22 exists any more); it must be retrofitted or replaced.");
  } else if (a.fg_legacyGas === "yes") {
    if (rag === "green") rag = "amber";
    reasons.push("Older equipment that may use a now-banned refrigerant — it can keep running, but can never legally be topped up again.");
  }

  return {
    obligations: [
      {
        id: "O1",
        title: "F-Gas & ODS: leak checks, records, and certified contractors",
        citation: "Fluorinated Greenhouse Gases Regulations 2015; Ozone-Depleting Substances Regulations 2015",
        rag,
        reason: reasons.join(" "),
        billing: "recurring",
      },
    ],
    overall: rag,
    notes: [
      "The HFC phase-down quota system applies to gas producers/importers and importers of pre-charged equipment, not ordinary businesses using or servicing equipment — most SMEs have no quota obligation.",
    ],
  };
}

export const fGasOds: ComplianceModule = {
  regulationName: "Fluorinated Greenhouse Gases Regulations",
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
    fg_hasEquipment: null,
    fg_overThreshold: null,
    fg_leakCheck: null,
    fg_records: null,
    fg_certifiedContractor: null,
    fg_legacyGas: null,
    fg_legacyTopUp: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
