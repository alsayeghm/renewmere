import { AnswerMap, ComplianceModule, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "owc_selfCarries",
    qid: "Q1",
    type: "single",
    prompt:
      "Does anyone at your business ever use your own vehicle (van, pickup, trailer, car) to take your business's waste to a tip, recycling centre, or transfer station — rather than having it collected by a waste contractor?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "owc_ownSitesOnly",
    qid: "Q2",
    type: "single",
    prompt:
      "Is this only ever moving waste between sites or premises that your own business operates, rather than to an outside disposal or recycling facility?",
    visibleIf: (a) => a.owc_selfCarries === "yes",
    options: [
      { value: "yes", label: "Yes, only between our own premises" },
      { value: "no", label: "No, it goes to an external site" },
    ],
  },
  {
    id: "owc_constructionWaste",
    qid: "Q3",
    type: "single",
    prompt:
      "Is any of the waste you carry yourself construction or demolition waste (e.g. rubble, bricks, plasterboard, timber offcuts, tiles) from building, renovation, or fit-out work?",
    visibleIf: (a) => a.owc_selfCarries === "yes" && a.owc_ownSitesOnly === "no",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "owc_regular",
    qid: "Q4",
    type: "single",
    prompt: "Do you do this regularly, as a normal part of how the business runs — or has it only happened rarely, as a one-off?",
    visibleIf: (a) => a.owc_selfCarries === "yes" && a.owc_ownSitesOnly === "no" && a.owc_constructionWaste === "no",
    options: [
      { value: "regular", label: "Regularly" },
      { value: "rare", label: "Rarely / one-off" },
    ],
  },
  {
    id: "owc_registered",
    qid: "Q5",
    type: "single",
    prompt:
      "Is your business registered with the Environment Agency as a waste carrier — lower tier for your own non-construction waste, or upper tier if it's construction/demolition waste?",
    visibleIf: (a) =>
      a.owc_selfCarries === "yes" &&
      a.owc_ownSitesOnly === "no" &&
      (a.owc_constructionWaste === "yes" || a.owc_regular === "regular"),
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
  let reason = "You told us your business doesn't self-carry its own waste to an external site — this is about your own vehicle, separate from whether your contractor is registered.";

  if (a.owc_selfCarries === "yes") {
    if (a.owc_ownSitesOnly === "yes") {
      rag = "green";
      reason = "Waste is only moved between your own premises, which is exempt from carrier registration.";
    } else {
      const needsRegistration = a.owc_constructionWaste === "yes" || a.owc_regular === "regular";
      if (!needsRegistration && a.owc_regular === "rare") {
        rag = "amber";
        reason =
          "Self-carrying waste only rarely/as a one-off is likely exempt for now, but there's no precise legal trip-count threshold — if this becomes regular, registration will be required.";
      } else if (needsRegistration) {
        if (a.owc_registered === "yes") {
          rag = "green";
          reason = a.owc_constructionWaste === "yes"
            ? "Registered for upper-tier waste carrying, as required for self-carried construction/demolition waste regardless of frequency."
            : "Registered for lower-tier waste carrying for your own regularly self-carried waste.";
        } else if (a.owc_registered === "no") {
          rag = "red";
          reason = a.owc_constructionWaste === "yes"
            ? "Self-carrying construction/demolition waste always needs full (upper tier, paid) waste carrier registration, however often it happens — not currently registered."
            : "Regularly self-carrying your own waste needs free lower-tier waste carrier registration — not currently registered.";
        } else {
          rag = "amber";
          reason = "Self-carrying waste in a way that likely needs registration, but registration status isn't confirmed.";
        }
      } else {
        rag = "amber";
        reason = "Self-carrying waste to an external site, but frequency and registration status aren't fully confirmed.";
      }
    }
  }

  return {
    obligations: [
      {
        id: "O1",
        title: "Registration for self-carrying your own waste",
        citation: "Control of Pollution (Amendment) Act 1989; Controlled Waste (Registration of Carriers) Regulations 1991",
        rag,
        reason,
        billing: "annual",
      },
    ],
    overall: rag,
    notes: [
      "This is separate from whether your waste contractor is a registered carrier (covered under Simpler Recycling) — it's about times your own business uses its own vehicle to move waste.",
    ],
  };
}

export const ownWasteCarrying: ComplianceModule = {
  regulationName: "Control of Pollution (Amendment) Act",
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
    owc_selfCarries: null,
    owc_ownSitesOnly: null,
    owc_constructionWaste: null,
    owc_regular: null,
    owc_registered: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
