import { AnswerMap, ComplianceModule, ModuleObligation, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "epr_wasteOnSite",
    qid: "Q1",
    type: "single",
    prompt:
      "Do you store, sort, bale, shred, compost, recover, or otherwise treat any waste on your premises before it's collected or reused — rather than a licensed collector simply taking it straight away?",
    help: "E.g. scrap metal, wood offcuts, waste oil, food waste, construction/demolition materials, slurry/manure, digestate.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No, it's just collected as-is" },
    ],
  },
  {
    id: "epr_wasteCovered",
    qid: "Q2",
    type: "single",
    prompt:
      "For that on-site activity, do you hold a registered waste exemption from the Environment Agency, or a full environmental permit, that covers it — and are you confident you're within its limits?",
    visibleIf: (a) => a.epr_wasteOnSite === "yes",
    options: [
      { value: "yes", label: "Yes, registered exemption or permit in place, within limits" },
      { value: "unsure", label: "Not sure, or it may be out of date" },
      { value: "no", label: "No registration or permit held" },
    ],
  },
  {
    id: "epr_liquidDischarge",
    qid: "Q3",
    type: "single",
    prompt:
      "Does your site discharge any liquid waste, wastewater, dirty water, or treated water directly to a river, stream, lake, ditch, soakaway, or into/onto the ground — i.e. NOT to the mains foul sewer or tankered away?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No — everything goes to mains sewer or is tankered away" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "epr_dischargeType",
    qid: "Q4",
    type: "single",
    prompt:
      "Is that discharge only clean, uncontaminated water — such as roof or hardstanding rainwater run-off, or short-term construction dewatering (under 3 months) of rainwater/groundwater with no chemicals, concrete washout, or oil involved?",
    visibleIf: (a) => a.epr_liquidDischarge === "yes" || a.epr_liquidDischarge === "unsure",
    options: [
      { value: "yes", label: "Yes, clearly low-risk and uncontaminated" },
      { value: "no", label: "No, or it may run longer / contain contamination" },
    ],
  },
  {
    id: "epr_permitHeld",
    qid: "Q5",
    type: "single",
    prompt:
      "Do you hold a current environmental permit (bespoke or standard rules) from the Environment Agency for this discharge?",
    visibleIf: (a) =>
      (a.epr_liquidDischarge === "yes" || a.epr_liquidDischarge === "unsure") && a.epr_dischargeType === "no",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure / application in progress" },
    ],
  },
  {
    id: "epr_specialistTrigger",
    qid: "Q6",
    type: "single",
    prompt:
      "Does your business involve any of the following: mobile plant brought onto sites (e.g. mobile crushers/screeners), spray-painting or solvent-based processes, anaerobic digestion, slurry/silage/fuel oil storage on a farm, or storage/treatment of clinical or hazardous waste beyond routine short-term holding for collection?",
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
  let o1: RAG = "green";
  let o1Reason = "No on-site storage, sorting, or treatment of waste reported — a licensed collector takes it as-is.";
  if (a.epr_wasteOnSite === "yes") {
    if (a.epr_wasteCovered === "yes") {
      o1 = "green";
      o1Reason = "A registered waste exemption or environmental permit is in place and believed to be within its limits.";
    } else if (a.epr_wasteCovered === "unsure" || a.epr_wasteCovered == null) {
      o1 = "amber";
      o1Reason =
        "On-site waste storage/treatment is happening, but it's not confirmed whether a registered exemption or permit covers it. Most SME waste activity needs at least a free/low-cost registered exemption.";
    } else {
      o1 = "red";
      o1Reason =
        "Waste is stored, sorted, or treated on site without a registered exemption or permit — operating a regulated waste facility without authorisation is an offence.";
    }
  }

  let o2: RAG = "green";
  let o2Reason = "No direct discharge to a watercourse, ditch, soakaway, or ground reported.";
  if (a.epr_liquidDischarge === "yes" || a.epr_liquidDischarge === "unsure") {
    if (a.epr_dischargeType === "yes") {
      o2 = "green";
      o2Reason =
        "Discharge appears to be clean, low-risk water (e.g. rainwater run-off, or short construction dewatering) — but keep records if this is construction dewatering, since the easement is time-limited.";
    } else if (a.epr_permitHeld === "yes") {
      o2 = "green";
      o2Reason = "An environmental permit is held for this discharge.";
    } else if (a.epr_permitHeld === "unsure" || a.epr_permitHeld == null) {
      o2 = "amber";
      o2Reason = "A discharge to water or ground is happening, but permit status isn't confirmed.";
    } else {
      o2 = "red";
      o2Reason =
        "Discharge to a watercourse or ground is happening without a held environmental permit — this needs urgent attention.";
    }
  }

  let o3: RAG = "green";
  let o3Reason = "No specialist activity flagged (mobile plant, solvents, anaerobic digestion, farm slurry storage, or clinical/hazardous waste storage).";
  if (a.epr_specialistTrigger === "yes") {
    o3 = "amber";
    o3Reason =
      "This kind of activity often sits under its own permitting rules (mobile plant, solvent emissions, anaerobic digestion thresholds, SSAFO slurry storage standards, or hazardous waste storage) that a simple self-check can't reliably score — get this specifically checked against Environment Agency guidance rather than treating a general 'no permit needed' answer as safe.";
  }

  const obligations: ModuleObligation[] = [
    {
      id: "O1",
      title: "Waste storage or treatment covered by a registered exemption or permit",
      citation: "Environmental Permitting (England and Wales) Regulations 2016, reg. 12 & Schedule 3",
      rag: o1,
      reason: o1Reason,
      billing: "annual",
    },
    {
      id: "O2",
      title: "Discharges to water or ground covered by a permit or valid exclusion",
      citation: "Environmental Permitting (England and Wales) Regulations 2016, reg. 12(1)(b) & 38",
      rag: o2,
      reason: o2Reason,
      billing: "annual",
    },
    {
      id: "O3",
      title: "Specialist activities correctly identified for their own permitting route",
      citation: "Environmental Permitting (England and Wales) Regulations 2016, Schedule 1",
      rag: o3,
      reason: o3Reason,
      billing: "one_time",
    },
  ];

  const rank: Record<RAG, number> = { red: 2, amber: 1, green: 0 };
  const overall = obligations.reduce<RAG>((worst, o) => (rank[o.rag] > rank[worst] ? o.rag : worst), "green");

  return { obligations, overall };
}

export const environmentalPermitting: ComplianceModule = {
  regulationName: "Environmental Permitting (England and Wales) Regulations",
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
    epr_wasteOnSite: null,
    epr_wasteCovered: null,
    epr_liquidDischarge: null,
    epr_dischargeType: null,
    epr_permitHeld: null,
    epr_specialistTrigger: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
