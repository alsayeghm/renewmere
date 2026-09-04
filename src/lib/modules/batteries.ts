import { AnswerMap, ComplianceModule, ModuleObligation, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "bat_hasWaste",
    qid: "Q1",
    type: "single",
    prompt: "Does your business ever have used or dead batteries to get rid of (from equipment, tools, torches, devices, vehicles, etc.)?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "bat_disposalRoute",
    qid: "Q2",
    type: "single",
    prompt: "When you get rid of used batteries, do they go in general/mixed waste bins, or does a licensed waste carrier or designated collection point take them separately?",
    visibleIf: (a) => a.bat_hasWaste === "yes",
    options: [
      { value: "separate", label: "Separately, via a licensed carrier or collection point" },
      { value: "general", label: "General or mixed waste" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "bat_industrialType",
    qid: "Q3",
    type: "single",
    prompt: "Do any of your used batteries come from vehicles, forklifts, plant/machinery, fencing energisers, or backup power — i.e. lead-acid, Ni-Cd, or \"industrial\" type rather than ordinary AA/AAA/rechargeable household-style batteries?",
    visibleIf: (a) => a.bat_disposalRoute === "separate",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No — only ordinary portable batteries" },
    ],
  },
  {
    id: "bat_industrialConsignment",
    qid: "Q3b",
    type: "single",
    prompt: "Do those industrial/lead-acid/Ni-Cd batteries go to an authorised treatment facility with a hazardous waste consignment note (not landfill or general incineration)?",
    visibleIf: (a) => a.bat_industrialType === "yes",
    options: [
      { value: "yes", label: "Yes" },
      { value: "unsure", label: "Not sure" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "bat_sells",
    qid: "Q4",
    type: "single",
    prompt: "Does your business sell batteries — on their own, or under its own brand name — to customers?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "bat_annualKg",
    qid: "Q5",
    type: "single",
    prompt: "Roughly how many kilograms of batteries does your business sell to customers per year?",
    help: "Rule of thumb: one pack of 4 AA batteries sold per day is roughly 32kg/year.",
    visibleIf: (a) => a.bat_sells === "yes",
    options: [
      { value: "under32", label: "Under ~32kg/year" },
      { value: "over32", label: "32kg/year or more" },
    ],
  },
  {
    id: "bat_takeback",
    qid: "Q5b",
    type: "single",
    prompt: "Do you provide a free take-back point for customers' waste batteries at every premises you sell them from, and tell customers about it?",
    visibleIf: (a) => a.bat_annualKg === "over32",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "bat_ownBrand",
    qid: "Q6",
    type: "single",
    prompt: "Do you manufacture, import, or put your own brand name on any batteries or battery-powered products before selling them — rather than just reselling other brands as bought?",
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
  let disposalRag: RAG = "green";
  let disposalReason = "No waste batteries reported.";
  if (a.bat_hasWaste === "yes") {
    if (a.bat_disposalRoute === "general" || a.bat_disposalRoute === "unsure" || a.bat_disposalRoute == null) {
      disposalRag = "red";
      disposalReason =
        "Used batteries aren't confirmed as going through a licensed carrier or collection point — lead-acid, Ni-Cd, and mixed battery collections are hazardous waste and must not go in general waste.";
    } else if (a.bat_industrialType === "yes") {
      if (a.bat_industrialConsignment === "yes") {
        disposalRag = "green";
        disposalReason = "Industrial/lead-acid/Ni-Cd batteries are sent to an authorised treatment facility with a consignment note.";
      } else if (a.bat_industrialConsignment === "unsure") {
        disposalRag = "amber";
        disposalReason = "Not confirmed whether industrial/lead-acid/Ni-Cd batteries are consigned to an authorised treatment facility.";
      } else {
        disposalRag = "red";
        disposalReason = "Industrial/lead-acid/Ni-Cd batteries need to go to an authorised treatment facility with a hazardous waste consignment note.";
      }
    } else {
      disposalRag = "green";
      disposalReason = "Waste batteries are collected separately via a licensed carrier or collection point.";
    }
  }

  let retailRag: RAG = "green";
  let retailReason = "You told us you don't sell batteries — the retailer take-back duty doesn't apply.";
  if (a.bat_sells === "yes") {
    if (a.bat_annualKg === "under32") {
      retailRag = "amber";
      retailReason =
        "Under the 32kg/year take-back threshold today — no legal duty yet, but worth monitoring if sales grow, and make sure any batteries you discard yourself are handled correctly.";
    } else if (a.bat_annualKg === "over32") {
      if (a.bat_takeback === "yes") {
        retailRag = "green";
        retailReason = "Free in-store take-back is provided and customers are told about it, as required at 32kg/year or more.";
      } else {
        retailRag = "red";
        retailReason = "Selling 32kg/year or more of batteries requires a free take-back point at every premises — not currently confirmed as in place.";
      }
    } else {
      retailRag = "amber";
      retailReason = "Sells batteries, but annual volume isn't confirmed against the 32kg/year take-back threshold.";
    }
  }

  let producerRag: RAG = "green";
  let producerReason = "No own-brand, manufactured, or imported batteries reported.";
  if (a.bat_ownBrand === "yes") {
    producerRag = "amber";
    producerReason =
      "Manufacturing, importing, or own-branding batteries or battery-powered products likely makes you a battery \"producer\" under the Regulations, regardless of volume — this needs registration with the Environment Agency (or a compliance scheme if over 1 tonne/year). Producer determination has enough nuance that we'd recommend confirming with a specialist rather than relying on a self-check alone.";
  }

  const obligations: ModuleObligation[] = [
    {
      id: "O1",
      title: "Waste batteries disposed of correctly",
      citation: "Waste Batteries and Accumulators Regulations 2009, reg. 2; Environmental Protection Act 1990 s.34",
      rag: disposalRag,
      reason: disposalReason,
      billing: "recurring",
    },
    {
      id: "O2",
      title: "Retailer take-back for batteries sold (32kg/year threshold)",
      citation: "Waste Batteries and Accumulators Regulations 2009, reg. 31",
      rag: retailRag,
      reason: retailReason,
      billing: "recurring",
    },
    {
      id: "O3",
      title: "Producer registration (if you brand, make, or import batteries)",
      citation: "Waste Batteries and Accumulators Regulations 2009, reg. 2",
      rag: producerRag,
      reason: producerReason,
      billing: "annual",
    },
  ];

  const rank: Record<RAG, number> = { red: 2, amber: 1, green: 0 };
  const overall = obligations.reduce<RAG>((worst, o) => (rank[o.rag] > rank[worst] ? o.rag : worst), "green");

  return { obligations, overall };
}

export const batteries: ComplianceModule = {
  regulationName: "Waste Batteries and Accumulators Regulations",
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
    bat_hasWaste: null,
    bat_disposalRoute: null,
    bat_industrialType: null,
    bat_industrialConsignment: null,
    bat_sells: null,
    bat_annualKg: null,
    bat_takeback: null,
    bat_ownBrand: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
