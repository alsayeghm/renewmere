import { AnswerMap, ComplianceModule, ModuleObligation, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "pl_makesOrImports",
    qid: "Q1",
    type: "single",
    prompt: "Does your business manufacture plastic packaging, or import plastic packaging (empty, or already filled with goods) into the UK?",
    help: "Importing already-packaged goods counts — e.g. a retailer importing stock packaged overseas.",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
    ],
  },
  {
    id: "pl_tonnage",
    qid: "Q2",
    type: "single",
    prompt: "Does that come to 10 tonnes or more of finished plastic packaging in a 12-month period?",
    visibleIf: (a) => a.pl_makesOrImports === "yes",
    options: [
      { value: "no", label: "No, or not sure" },
      { value: "yes", label: "Yes" },
    ],
  },
  {
    id: "pl_registered",
    qid: "Q3",
    type: "single",
    prompt: "Are you registered for Plastic Packaging Tax with HMRC and accounting for it on packaging with under 30% recycled content?",
    visibleIf: (a) => a.pl_tonnage === "yes",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No / not sure" },
    ],
  },
  {
    id: "pl_suppliesSingleUse",
    qid: "Q4",
    type: "single",
    prompt: "Do you supply single-use plastic cutlery, plates, bowls, trays, balloon sticks, or polystyrene food/drink containers to customers in England?",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
    ],
  },
  {
    id: "pl_bannedItems",
    qid: "Q5",
    type: "single",
    prompt: "Does that include single-use plastic cutlery, balloon sticks, or polystyrene food/drink containers or cups?",
    help: "These are banned outright with no exemptions.",
    visibleIf: (a) => a.pl_suppliesSingleUse === "yes",
    options: [
      { value: "no", label: "No, just plates/bowls/trays" },
      { value: "yes", label: "Yes" },
    ],
  },
  {
    id: "pl_platesExempt",
    qid: "Q6",
    type: "single",
    prompt: "For any single-use plastic plates, bowls, or trays you supply — are they only sold business-to-business, or supplied as packaging for food that's pre-filled or filled at the point of sale?",
    visibleIf: (a) => a.pl_suppliesSingleUse === "yes" && a.pl_bannedItems === "no",
    options: [
      { value: "yes", label: "Yes, one of those exemptions applies" },
      { value: "no", label: "No" },
    ],
  },
];

function visibleQuestions(a: AnswerMap): Question[] {
  return questions.filter((q) => !q.visibleIf || q.visibleIf(a));
}

function evaluate(a: AnswerMap): ModuleResult {
  let taxRag: RAG = "green";
  let taxReason = "You don't manufacture or import plastic packaging — Plastic Packaging Tax doesn't apply.";
  if (a.pl_makesOrImports === "yes") {
    if (a.pl_tonnage === "yes") {
      if (a.pl_registered === "yes") {
        taxRag = "green";
        taxReason = "Registered for Plastic Packaging Tax and accounting for it as required.";
      } else {
        taxRag = "red";
        taxReason = "Manufacturing/importing 10+ tonnes/year of plastic packaging without confirmed HMRC registration for Plastic Packaging Tax.";
      }
    } else {
      taxRag = "amber";
      taxReason = "Manufacturing or importing plastic packaging, but under (or unsure about) the 10-tonne/year threshold — worth tracking if volumes grow.";
    }
  }

  let banRag: RAG = "green";
  let banReason = "No single-use plastic cutlery, plates, or polystyrene containers supplied to customers.";
  if (a.pl_suppliesSingleUse === "yes") {
    if (a.pl_bannedItems === "yes") {
      banRag = "red";
      banReason = "Supplying single-use plastic cutlery, balloon sticks, or polystyrene food/drink containers — these are banned outright with no exemptions.";
    } else if (a.pl_platesExempt === "yes") {
      banRag = "green";
      banReason = "Single-use plastic plates/bowls/trays supplied only B2B or as packaging for pre-filled food, which is exempt.";
    } else {
      banRag = "red";
      banReason = "Supplying single-use plastic plates/bowls/trays to consumers without a confirmed exemption — this is restricted under the ban.";
    }
  }

  const obligations: ModuleObligation[] = [
    {
      id: "O1",
      title: "Plastic Packaging Tax (manufacturers/importers only)",
      citation: "Finance Act 2021, Part 2",
      rag: taxRag,
      reason: taxReason,
      billing: "recurring",
    },
    {
      id: "O2",
      title: "Single-use plastics ban",
      citation: "Single-Use Plastics (England) Regulations 2023",
      rag: banRag,
      reason: banReason,
      billing: "one_time",
    },
  ];

  const rank: Record<RAG, number> = { red: 2, amber: 1, green: 0 };
  const overall = obligations.reduce<RAG>((worst, o) => (rank[o.rag] > rank[worst] ? o.rag : worst), "green");

  return { obligations, overall };
}

export const plastics: ComplianceModule = {
  regulationName: "Plastic Packaging Tax",
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
    pl_makesOrImports: null,
    pl_tonnage: null,
    pl_registered: null,
    pl_suppliesSingleUse: null,
    pl_bannedItems: null,
    pl_platesExempt: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
