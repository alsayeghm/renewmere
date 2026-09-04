import { AnswerMap, ComplianceModule, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "wh_disturbsLand",
    qid: "Q1",
    type: "single",
    prompt:
      "Does your work involve clearing land or vegetation, demolition, renovation of an older building, hedgerow/tree removal, or other land-disturbing activity?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "wh_protectedFeature",
    qid: "Q2",
    type: "single",
    prompt:
      "Could the site reasonably have any of these: nesting birds, bats (roosting in older buildings, trees, or roof spaces), badger setts, great crested newts (ponds/damp ground), or other protected species or habitats?",
    visibleIf: (a) => a.wh_disturbsLand === "yes",
    options: [
      { value: "no", label: "No, reasonably confident none are present" },
      { value: "yes", label: "Yes, or not sure" },
    ],
  },
  {
    id: "wh_sssi",
    qid: "Q3",
    type: "single",
    prompt: "Is the site in or next to a Site of Special Scientific Interest (SSSI)?",
    visibleIf: (a) => a.wh_disturbsLand === "yes",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes, or not sure" },
    ],
  },
  {
    id: "wh_surveyDone",
    qid: "Q4",
    type: "single",
    prompt:
      "Has an ecological survey been done, and any required Natural England licence or SSSI consent obtained, before starting work?",
    visibleIf: (a) => a.wh_protectedFeature === "yes" || a.wh_sssi === "yes",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "wh_confirmedBreach",
    qid: "Q5",
    type: "single",
    prompt:
      "Has work already gone ahead disturbing a known protected species, nest, or SSSI feature without the required licence or consent?",
    visibleIf: (a) => a.wh_surveyDone === "no",
    options: [
      { value: "no", label: "No — work is paused / hasn't reached that point" },
      { value: "yes", label: "Yes" },
    ],
  },
];

function visibleQuestions(a: AnswerMap): Question[] {
  return questions.filter((q) => !q.visibleIf || q.visibleIf(a));
}

function evaluate(a: AnswerMap): ModuleResult {
  let rag: RAG = "green";
  let reason = "No land-disturbing activity reported — wildlife and habitat protection duties are unlikely to apply.";

  if (a.wh_disturbsLand === "yes") {
    const featureRisk = a.wh_protectedFeature === "yes";
    const sssiRisk = a.wh_sssi === "yes";

    if (!featureRisk && !sssiRisk) {
      rag = "green";
      reason = "Land-disturbing work is happening, but no protected species, habitat, or SSSI is reasonably expected on site.";
    } else if (a.wh_surveyDone === "yes") {
      rag = "green";
      reason = "A protected feature or SSSI may be present, but a survey and any required licence/consent have already been obtained.";
    } else if (a.wh_confirmedBreach === "yes") {
      rag = "red";
      reason = "Work has disturbed a known protected species, nest, or SSSI feature without the required licence or consent — this is a confirmed offence risk, not just a precaution gap.";
    } else {
      rag = "amber";
      reason =
        "A protected species, habitat, or SSSI may reasonably be present and no survey/licence/consent is confirmed yet — species presence can't be determined by a questionnaire, so get an ecological survey before work proceeds rather than assuming it's fine.";
    }
  }

  return {
    obligations: [
      {
        id: "O1",
        title: "Protected species, nests, and SSSI features not disturbed without consent",
        citation: "Wildlife and Countryside Act 1981, ss.1, 9 & 28; Conservation of Habitats and Species Regulations 2017, reg. 43 & 55",
        rag,
        reason,
        billing: "one_time",
      },
    ],
    overall: rag,
    notes: [
      "Seasonal guidance (e.g. bird nesting season) is practical best practice, not a fixed legal cut-off — the actual duty is not disturbing an active nest or protected species/habitat, regardless of date. Badgers and hedgerows sit under separate, related legislation not covered here.",
    ],
  };
}

export const wildlifeHabitats: ComplianceModule = {
  regulationName: "Wildlife and Countryside Act",
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
    wh_disturbsLand: null,
    wh_protectedFeature: null,
    wh_sssi: null,
    wh_surveyDone: null,
    wh_confirmedBreach: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
