import { AnswerMap, ComplianceModule, ModuleObligation, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "weee_producer",
    qid: "Q1",
    type: "single",
    prompt:
      "Does your business manufacture, rebrand, or import electrical or electronic equipment for sale in the UK (including selling directly to UK customers from abroad, or running an online marketplace that does)?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "weee_producerRegistered",
    qid: "Q2",
    type: "single",
    prompt:
      "Are you registered with the Environment Agency as a WEEE producer — directly if you place under 5 tonnes of EEE on the market a year, or via a Producer Compliance Scheme if it's 5 tonnes or more?",
    visibleIf: (a) => a.weee_producer === "yes",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "weee_sellsEEE",
    qid: "Q3",
    type: "single",
    prompt:
      "Does your business sell electrical or electronic equipment (including vapes) to members of the public, in a shop or online?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "weee_takeback",
    qid: "Q4",
    type: "single",
    prompt:
      "Do you offer free take-back of customers' old electrical items (in-store or by post), or are you signed up to the Distributor Takeback Scheme (DTS)?",
    help: "Note: if you sell vapes, DTS membership alone isn't enough — vape retailers must offer their own take-back for waste vapes regardless of size.",
    visibleIf: (a) => a.weee_sellsEEE === "yes",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "weee_disposalRoute",
    qid: "Q5",
    type: "single",
    prompt:
      "When your business gets rid of its own old electrical or electronic equipment (computers, appliances, tools, lighting, medical or monitoring equipment), where does it go?",
    options: [
      { value: "carrier", label: "Collected by a registered waste carrier, with a transfer note kept" },
      { value: "general", label: "Goes in general waste or a general skip" },
      { value: "unverified", label: "An unverified \"man with a van\" takes it" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "weee_hazardousItems",
    qid: "Q6",
    type: "single",
    prompt:
      "Does any of that equipment include items likely to be hazardous — e.g. fluorescent tubes or lamps, older monitors/screens, or built-in batteries?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "weee_hazardousConsignment",
    qid: "Q7",
    type: "single",
    prompt:
      "For that hazardous equipment, do you have hazardous waste consignment notes (rather than just an ordinary waste transfer note)?",
    visibleIf: (a) => a.weee_hazardousItems === "yes",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
];

function visibleQuestions(a: AnswerMap): Question[] {
  return questions.filter((q) => !q.visibleIf || q.visibleIf(a));
}

function evaluate(a: AnswerMap): ModuleResult {
  let o1: RAG = "green";
  let o1Reason = "You told us you don't manufacture, rebrand, or import electrical equipment — producer registration doesn't apply to you.";
  if (a.weee_producer === "yes") {
    if (a.weee_producerRegistered === "yes") {
      o1 = "green";
      o1Reason = "Registered as a WEEE producer, as required.";
    } else if (a.weee_producerRegistered === "unsure" || a.weee_producerRegistered == null) {
      o1 = "amber";
      o1Reason = "Not confirmed whether producer registration is in place.";
    } else {
      o1 = "red";
      o1Reason =
        "Not registered as a WEEE producer. Registration is required regardless of tonnage — directly if under 5 tonnes/year, via a Producer Compliance Scheme if 5 tonnes or more.";
    }
  }

  let o2: RAG = "green";
  let o2Reason = "You told us you don't sell electrical or electronic equipment to the public — distributor take-back doesn't apply to you.";
  if (a.weee_sellsEEE === "yes") {
    if (a.weee_takeback === "yes") {
      o2 = "green";
      o2Reason = "Take-back for customers' old equipment is in place.";
    } else if (a.weee_takeback === "unsure" || a.weee_takeback == null) {
      o2 = "amber";
      o2Reason = "Not confirmed whether take-back arrangements are in place.";
    } else {
      o2 = "red";
      o2Reason =
        "No take-back arrangement or Distributor Takeback Scheme membership confirmed for customers' old electrical items.";
    }
  }

  let o3: RAG;
  let o3Reason: string;
  if (a.weee_disposalRoute === "carrier") {
    o3 = "green";
    o3Reason = "Old electrical equipment is collected by a registered waste carrier with a transfer note kept.";
  } else if (a.weee_disposalRoute === "unsure" || a.weee_disposalRoute == null) {
    o3 = "amber";
    o3Reason = "Not enough information yet to confirm how old electrical equipment is disposed of.";
  } else {
    o3 = "red";
    o3Reason =
      "Old electrical equipment is not being disposed of through a registered waste carrier — WEEE must not go into general waste, and a carrier's registration should always be checked.";
  }

  let o4: RAG = "green";
  let o4Reason = "No hazardous electrical items flagged.";
  if (a.weee_hazardousItems === "yes") {
    if (a.weee_hazardousConsignment === "yes") {
      o4 = "green";
      o4Reason = "Hazardous waste consignment notes are kept for hazardous electrical equipment.";
    } else if (a.weee_hazardousConsignment === "unsure" || a.weee_hazardousConsignment == null) {
      o4 = "amber";
      o4Reason = "Not confirmed whether hazardous waste consignment notes are kept.";
    } else {
      o4 = "red";
      o4Reason =
        "Hazardous electrical items (e.g. fluorescent tubes, older screens) need a hazardous waste consignment note, not just an ordinary transfer note.";
    }
  } else if (a.weee_hazardousItems === "unsure") {
    o4 = "amber";
    o4Reason = "Not confirmed whether any disposed equipment counts as hazardous waste.";
  }

  const obligations: ModuleObligation[] = [
    {
      id: "O1",
      title: "WEEE producer registration (if you make, rebrand, or import EEE)",
      citation: "Waste Electrical and Electronic Equipment Regulations 2013, reg. 14–17 & 25",
      rag: o1,
      reason: o1Reason,
      billing: "annual",
    },
    {
      id: "O2",
      title: "Distributor take-back for customers' old equipment (if you sell EEE)",
      citation: "Waste Electrical and Electronic Equipment Regulations 2013, reg. 42, 46 & 68",
      rag: o2,
      reason: o2Reason,
      billing: "annual",
    },
    {
      id: "O3",
      title: "Proper disposal of your own old electrical equipment",
      citation:
        "Waste Electrical and Electronic Equipment Regulations 2013, reg. 31–32; Environmental Protection Act 1990 s.34",
      rag: o3,
      reason: o3Reason,
      billing: "recurring",
    },
    {
      id: "O4",
      title: "Hazardous WEEE handled with a consignment note",
      citation: "Hazardous Waste (England and Wales) Regulations 2005",
      rag: o4,
      reason: o4Reason,
      billing: "recurring",
    },
  ];

  const rank: Record<RAG, number> = { red: 2, amber: 1, green: 0 };
  const overall = obligations.reduce<RAG>((worst, o) => (rank[o.rag] > rank[worst] ? o.rag : worst), "green");

  return { obligations, overall };
}

export const weee: ComplianceModule = {
  regulationName: "Waste Electrical and Electronic Equipment Regulations",
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
    weee_producer: null,
    weee_producerRegistered: null,
    weee_sellsEEE: null,
    weee_takeback: null,
    weee_disposalRoute: null,
    weee_hazardousItems: null,
    weee_hazardousConsignment: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
