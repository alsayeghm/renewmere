import { Answers, evaluate as evaluateRules, initialAnswers as baseInitial } from "@/lib/rules";
import { AnswerMap, ComplianceModule, ModuleResult, Question } from "./types";

const questions: Question[] = [
  {
    id: "q4_headcount",
    qid: "Q1",
    type: "number",
    prompt: "How many people work for your business in total, including part-time?",
  },
  {
    id: "q5_partTime",
    qid: "Q2",
    type: "number",
    prompt: "Roughly how many of those are part-time?",
  },
  {
    id: "q7_allSites",
    qid: "Q3",
    type: "single",
    prompt:
      "If you operate more than one site in England, is the count above across all sites combined?",
    options: [
      { value: "yes", label: "Yes, that's the combined total" },
      { value: "no", label: "No, that's just one site" },
      { value: "single", label: "We only have a single site" },
    ],
  },
  {
    id: "q8_collection",
    qid: "Q4",
    type: "single",
    prompt: "Do you have waste collection arranged?",
    options: [
      { value: "private", label: "Private contractor" },
      { value: "council", label: "Council commercial collection" },
      { value: "none", label: "None arranged" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "q10_registered",
    qid: "Q5",
    type: "single",
    prompt:
      "Is your collector on the Environment Agency's Public Register of Waste Carriers, Brokers and Dealers?",
    visibleIf: (a) => a.q8_collection !== "none",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "q11_foodWaste",
    qid: "Q6",
    type: "single",
    prompt: "Does your business produce any food waste, even small amounts?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q12_foodSeparate",
    qid: "Q7",
    type: "single",
    prompt: "Is that food waste currently collected separately?",
    visibleIf: (a) => a.q11_foodWaste === "yes",
    options: [
      { value: "weekly-plus", label: "Yes, weekly or more often" },
      { value: "less-than-weekly", label: "Yes, but less than weekly" },
      { value: "mixed-general", label: "No, mixed with general waste" },
      { value: "mixed-recycling", label: "No, mixed with recycling" },
    ],
  },
  {
    id: "q15_dryRecyclables",
    qid: "Q8",
    type: "single",
    prompt: "Do you separate paper & card from plastic, metal & glass?",
    options: [
      { value: "always-separate", label: "Yes, always separate" },
      { value: "combine", label: "We combine them" },
      { value: "dont-separate", label: "We don't separate dry recyclables at all" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "q16_coCollection",
    qid: "Q9",
    type: "single",
    prompt:
      "Has your waste collector confirmed in writing (a co-collection assessment) that combining is acceptable for your collection?",
    visibleIf: (a) => a.q15_dryRecyclables === "combine",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
      { value: "never-asked", label: "Never asked" },
    ],
  },
  {
    id: "q17_someRecyclables",
    qid: "Q10",
    type: "single",
    prompt: "Do you separate any dry recyclables from general waste at all?",
    visibleIf: (a) => a.q15_dryRecyclables === "dont-separate",
    options: [
      { value: "some", label: "Yes, some" },
      { value: "none", label: "No, none" },
    ],
  },
  {
    id: "q18_spaceRestricted",
    qid: "Q11",
    type: "single",
    prompt:
      "Is your space for storing separate bins very restricted (e.g. small flat-based unit, no external bin storage)?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "q19_residualSeparate",
    qid: "Q12",
    type: "single",
    prompt: "Do you have a separate container for general (residual, non-recyclable) waste?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "q26_enforcement",
    qid: "Q13",
    type: "single",
    prompt:
      "Have you ever received a compliance notice, warning, or enforcement contact from the Environment Agency or your council about waste?",
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
  const result = evaluateRules(a as unknown as Answers);
  const notes: string[] = [];
  if (result.fte != null) {
    notes.push(
      `Estimated FTE: ${result.fte} — deadline band: ${
        result.fteBand === "over10" ? "31 Mar 2025 (already passed)" : "31 Mar 2027"
      }`,
    );
  }
  if (result.multiSiteWarning) {
    notes.push(
      "The law counts staff across all your sites combined. Your business may cross the 10-FTE threshold once other sites are added.",
    );
  }
  return {
    obligations: result.obligations,
    overall: result.overall,
    notes,
  };
}

export const simplerRecycling: ComplianceModule = {
  regulationName: "Separation of Waste (England) Regulations",
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
  initialAnswers: baseInitial as unknown as AnswerMap,
  questions,
  visibleQuestions,
  evaluate,
};
