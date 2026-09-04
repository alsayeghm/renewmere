import { AnswerMap, ComplianceModule, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "tea_extraDischarge",
    qid: "Q1",
    type: "single",
    prompt:
      "Does your business discharge anything into the public sewer other than normal toilet, handwashing, and ordinary staff-kitchen wastewater?",
    help: "Think: commercial food prep, manufacturing/process water, vehicle or equipment washing, an on-site laundry, construction dewatering, farm/dairy washings, or lab/clinical waste.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "tea_toSewer",
    qid: "Q2",
    type: "single",
    prompt:
      "Is that extra discharge piped or drained into the public foul sewer — as opposed to being tankered off-site by a licensed waste contractor, or discharged to a watercourse/soakaway under a separate Environment Agency permit?",
    visibleIf: (a) => a.tea_extraDischarge === "yes" || a.tea_extraDischarge === "unsure",
    options: [
      { value: "sewer", label: "Yes, to the public sewer" },
      { value: "other", label: "No — tankered off-site or to a watercourse/soakaway" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "tea_greaseTrapOnly",
    qid: "Q3",
    type: "single",
    prompt:
      "Is the discharge from commercial food preparation, managed only through a grease trap/separator (with no separate written confirmation from your water company)?",
    visibleIf: (a) => a.tea_toSewer === "sewer",
    options: [
      { value: "yes", label: "Yes, grease trap only" },
      { value: "no", label: "No — it's a different kind of discharge" },
    ],
  },
  {
    id: "tea_consent",
    qid: "Q4",
    type: "single",
    prompt:
      "Do you hold a current trade effluent consent (or agreement) from your water company / sewerage undertaker that covers what you currently discharge?",
    visibleIf: (a) => a.tea_toSewer === "sewer" && a.tea_greaseTrapOnly !== "yes",
    options: [
      { value: "yes", label: "Yes, and it covers our current discharge" },
      { value: "no", label: "No, never applied" },
      { value: "unsure", label: "Not sure / it may be out of date" },
    ],
  },
  {
    id: "tea_ongoing",
    qid: "Q5",
    type: "single",
    prompt:
      "Are you currently discharging this trade effluent to the public sewer without an application in progress or consent granted?",
    visibleIf: (a) => a.tea_toSewer === "sewer" && a.tea_greaseTrapOnly !== "yes" && a.tea_consent === "no",
    options: [
      { value: "yes", label: "Yes, discharging now with nothing in progress" },
      { value: "no", label: "No — we've stopped, or an application is in progress" },
    ],
  },
];

function visibleQuestions(a: AnswerMap): Question[] {
  return questions.filter((q) => !q.visibleIf || q.visibleIf(a));
}

function evaluate(a: AnswerMap): ModuleResult {
  let rag: RAG = "green";
  let reason =
    "No trade effluent beyond normal toilet, handwashing, and staff-kitchen wastewater — trade effluent consent doesn't apply to you.";

  if (a.tea_extraDischarge === "yes" || a.tea_extraDischarge === "unsure") {
    if (a.tea_toSewer === "other") {
      rag = "green";
      reason =
        "Extra discharge doesn't go to the public foul sewer, so trade effluent consent under the Water Industry Act doesn't apply — but check whether a separate Environment Agency permit is needed for that route.";
    } else if (a.tea_toSewer == null || a.tea_toSewer === "unsure") {
      rag = "amber";
      reason = "Not confirmed whether your extra discharge goes to the public foul sewer.";
    } else if (a.tea_greaseTrapOnly === "yes") {
      rag = "amber";
      reason =
        "Grease trap in place, but water companies differ on whether that alone removes the need for a formal trade effluent consent — get written confirmation from your specific water company rather than assuming a grease trap is enough.";
    } else if (a.tea_consent === "yes") {
      rag = "green";
      reason = "Trade effluent consent is in place and covers your current discharge.";
    } else if (a.tea_consent === "unsure" || a.tea_consent == null) {
      rag = "amber";
      reason = "Not confirmed whether a valid trade effluent consent is in place for this discharge.";
    } else if (a.tea_ongoing === "yes") {
      rag = "red";
      reason =
        "Trade effluent is being discharged to the public sewer without consent — this is an offence under s.118(5) Water Industry Act 1991. Contact your water company / retailer to apply immediately.";
    } else {
      rag = "amber";
      reason = "No consent in place yet, but discharge has stopped or an application is in progress.";
    }
  }

  return {
    obligations: [
      {
        id: "O1",
        title: "Trade effluent consent for non-domestic discharges to the public sewer",
        citation: "Water Industry Act 1991, ss.118, 119 & 121",
        rag,
        reason,
        billing: "one_time",
      },
    ],
    overall: rag,
  };
}

export const tradeEffluent: ComplianceModule = {
  regulationName: "Water Industry Act, ss.118 & 121",
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
    tea_extraDischarge: null,
    tea_toSewer: null,
    tea_greaseTrapOnly: null,
    tea_consent: null,
    tea_ongoing: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
