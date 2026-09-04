import { AnswerMap, ComplianceModule, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "elv_inScope",
    qid: "Q1",
    type: "single",
    prompt:
      "Does your business dismantle, depollute, scrap, or otherwise treat end-of-life motor vehicles (cars or vans that have become waste), OR does it manufacture or professionally import complete road vehicles for sale in the UK?",
    options: [
      { value: "no", label: "No" },
      { value: "dismantler", label: "Yes — I dismantle/scrap/treat end-of-life vehicles" },
      { value: "producer", label: "Yes — I manufacture or professionally import vehicles" },
    ],
  },
  {
    id: "elv_permit",
    qid: "Q2",
    type: "single",
    prompt:
      "Does your site hold an Environment Agency environmental permit (or registered exemption) authorising it as an Authorised Treatment Facility (ATF) for end-of-life vehicles?",
    visibleIf: (a) => a.elv_inScope === "dismantler",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "elv_depollutionAndCoD",
    qid: "Q3",
    type: "single",
    prompt:
      "Do you carry out depollution (removing fuel, batteries, fluids, tyres, airbags, etc.) before further dismantling, and issue Certificates of Destruction via the DVLA system free of charge for every eligible vehicle?",
    visibleIf: (a) => a.elv_inScope === "dismantler" && a.elv_permit === "yes",
    options: [
      { value: "yes", label: "Yes, both" },
      { value: "partial", label: "Partially, or not consistently" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "elv_producerCompliant",
    qid: "Q2b",
    type: "single",
    prompt:
      "Are you registered with Defra as an ELV producer, and do you provide a free take-back network (directly or via a compliance scheme) for end-of-life vehicles of your own brand?",
    visibleIf: (a) => a.elv_inScope === "producer",
    options: [
      { value: "yes", label: "Yes, both" },
      { value: "partial", label: "Partially" },
      { value: "no", label: "No" },
    ],
  },
];

function visibleQuestions(a: AnswerMap): Question[] {
  return questions.filter((q) => !q.visibleIf || q.visibleIf(a));
}

function evaluate(a: AnswerMap): ModuleResult {
  let rag: RAG = "green";
  let reason =
    "This law only applies to vehicle dismantlers/scrapyards (Authorised Treatment Facilities) and vehicle manufacturers/professional importers — not applicable to your business.";

  if (a.elv_inScope === "dismantler") {
    if (a.elv_permit === "yes") {
      if (a.elv_depollutionAndCoD === "yes") {
        rag = "green";
        reason = "Operating as a permitted ATF, with depollution and Certificate of Destruction issuance in place.";
      } else if (a.elv_depollutionAndCoD === "partial") {
        rag = "amber";
        reason = "Permitted as an ATF, but depollution or Certificate of Destruction issuance isn't fully consistent.";
      } else if (a.elv_depollutionAndCoD == null) {
        rag = "amber";
        reason = "Permitted as an ATF, but depollution/Certificate of Destruction practice isn't confirmed.";
      } else {
        rag = "red";
        reason = "Permitted as an ATF, but not carrying out required depollution or issuing Certificates of Destruction.";
      }
    } else if (a.elv_permit === "unsure" || a.elv_permit == null) {
      rag = "amber";
      reason = "Treating end-of-life vehicles, but Authorised Treatment Facility permit status isn't confirmed.";
    } else {
      rag = "red";
      reason =
        "Treating end-of-life vehicles without a confirmed Environment Agency permit or registered exemption as an Authorised Treatment Facility.";
    }
  } else if (a.elv_inScope === "producer") {
    if (a.elv_producerCompliant === "yes") {
      rag = "green";
      reason = "Registered with Defra as an ELV producer, with a free take-back network in place.";
    } else if (a.elv_producerCompliant === "partial" || a.elv_producerCompliant == null) {
      rag = "amber";
      reason = "Vehicle producer/importer, but registration or take-back network isn't fully confirmed.";
    } else {
      rag = "red";
      reason = "Vehicle producer/importer without confirmed Defra registration or a free take-back network.";
    }
  }

  return {
    obligations: [
      {
        id: "O1",
        title: "End-of-life vehicle treatment or producer obligations",
        citation: "End-of-Life Vehicles Regulations 2003",
        rag,
        reason,
        billing: "annual",
      },
    ],
    overall: rag,
  };
}

export const endOfLifeVehicles: ComplianceModule = {
  regulationName: "End-of-Life Vehicles Regulations",
  sectors: ["Manufacturing"],
  initialAnswers: {
    elv_inScope: null,
    elv_permit: null,
    elv_depollutionAndCoD: null,
    elv_producerCompliant: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
