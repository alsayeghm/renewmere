import { AnswerMap, ComplianceModule, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "wp_pathway",
    qid: "Q1",
    type: "single",
    prompt:
      "Does any water from your site's yard, roof, car park, or drains flow into a river, stream, ditch, pond, or a surface-water drain — rather than entirely into the foul/sewage drain?",
    options: [
      { value: "no", label: "No — all drainage is foul sewer, or there's no outdoor area" },
      { value: "yes", label: "Yes" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "wp_storage",
    qid: "Q2",
    type: "single",
    prompt:
      "Do you store more than 200 litres of oil, fuel, or chemicals (e.g. heating oil, diesel, waste oil, cleaning chemicals) outdoors or anywhere a leak could reach a drain?",
    visibleIf: (a) => a.wp_pathway === "yes" || a.wp_pathway === "unsure",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "wp_bunded",
    qid: "Q3",
    type: "single",
    prompt:
      "Is that storage fully bunded or contained — sat in a sealed drip tray or bund that would hold all of the contents (110% of your biggest container) if it leaked, away from any drain?",
    visibleIf: (a) => a.wp_storage === "yes",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "wp_washwater",
    qid: "Q4",
    type: "single",
    prompt:
      "Does your business wash vehicles, equipment, containers, or outdoor surfaces (e.g. wheelie bins, mixer trucks, forecourts, kitchen extraction) — and if so, where does that washwater go?",
    visibleIf: (a) => a.wp_pathway === "yes" || a.wp_pathway === "unsure",
    options: [
      { value: "none", label: "No such washing activity" },
      { value: "foul", label: "Goes to the foul (sewage) drain" },
      { value: "surface", label: "Goes to a surface/outside drain" },
      { value: "unsure", label: "Not sure which drain" },
    ],
  },
  {
    id: "wp_construction",
    qid: "Q5",
    type: "single",
    prompt:
      "If your work involves digging, dewatering, or concrete mixing/washout within about 10 metres of a river, stream, or ditch — do you have silt fencing, settlement tanks, or a written method statement controlling runoff?",
    help: "Not applicable? Just answer \"not applicable\".",
    visibleIf: (a) => a.wp_pathway === "yes" || a.wp_pathway === "unsure",
    options: [
      { value: "na", label: "Not applicable — no such work" },
      { value: "yes", label: "Yes, controls are in place" },
      { value: "no", label: "No, or not sure" },
    ],
  },
  {
    id: "wp_agriculture",
    qid: "Q6",
    type: "single",
    prompt:
      "If you store or spread manure, slurry, silage effluent, or fertiliser — do you keep back from watercourses by at least 10 metres (manure/slurry, reducible to 6m with precision equipment) or 2 metres (manufactured fertiliser), keep back at least 50 metres from any spring, well, or borehole for manure, and avoid spreading on waterlogged, flooded, snow-covered, or recently frozen ground?",
    help: "Not applicable? Just answer \"not applicable\".",
    visibleIf: (a) => a.wp_pathway === "yes" || a.wp_pathway === "unsure",
    options: [
      { value: "na", label: "Not applicable — no manure/slurry/fertiliser" },
      { value: "yes", label: "Yes, buffers and conditions are observed" },
      { value: "no", label: "No, or not sure" },
    ],
  },
  {
    id: "wp_enforcement",
    qid: "Q7",
    type: "single",
    prompt:
      "In the last 3 years, has your business had a water pollution incident, a warning letter from the Environment Agency, an enforcement notice, or a prosecution relating to water?",
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
  const reasons: string[] = [];

  if (a.wp_pathway === "no") {
    reasons.push("No pathway from your site to a watercourse or surface-water drain — the main structural risk factor isn't present.");
  } else {
    // Has a pathway (yes or unsure) — residual risk unless nothing else applies.
    rag = "amber";
    reasons.push("Water from your site can reach a watercourse or surface drain, so this needs ongoing attention even without a specific breach identified.");

    if (a.wp_storage === "yes") {
      if (a.wp_bunded === "yes") {
        reasons.push("Oil/fuel/chemical storage over 200L is bunded.");
      } else {
        rag = "red";
        reasons.push("Oil/fuel/chemical storage over 200L is not confirmed as bunded — a leak reaching a drain would very likely breach the law.");
      }
    }

    if (a.wp_washwater === "surface" || a.wp_washwater === "unsure") {
      rag = "red";
      reasons.push("Washwater from vehicles/equipment/surfaces is going to (or its route to) a surface drain isn't confirmed — this is one of the most common real breaches.");
    } else if (a.wp_washwater === "foul") {
      reasons.push("Washwater is directed to the foul drain (check separately whether a trade effluent consent is needed for its contents).");
    }

    if (a.wp_construction === "no") {
      rag = "red";
      reasons.push("Groundworks/dewatering/concrete work near a watercourse without silt controls or a method statement is a leading cause of real enforcement action.");
    } else if (a.wp_construction === "yes") {
      reasons.push("Silt/runoff controls are in place for groundworks near a watercourse.");
    }

    if (a.wp_agriculture === "no") {
      rag = "red";
      reasons.push("Manure/slurry/fertiliser buffer distances or spreading conditions aren't confirmed as being met — these are specific legal requirements, not just good practice.");
    } else if (a.wp_agriculture === "yes") {
      reasons.push("Manure/slurry/fertiliser buffer distances and spreading conditions are being observed.");
    }
  }

  if (a.wp_enforcement === "yes") {
    rag = "red";
    reasons.push("An enforcement contact in the last 3 years is a strong signal of live risk, regardless of other answers.");
  }

  return {
    obligations: [
      {
        id: "O1",
        title: "No unpermitted pollution of controlled waters",
        citation:
          "Environmental Permitting (England and Wales) Regulations 2016, reg. 12(1)(b) & 38 (successor to Water Resources Act 1991 s.85, repealed 2010)",
        rag,
        reason: reasons.join(" "),
        billing: "recurring",
      },
    ],
    overall: rag,
    notes: [
      "A written spill-response plan and accessible spill kit isn't a separate legal requirement for most businesses, but it's the main way to show \"reasonable precautions\" were taken if a pollution incident does happen.",
    ],
  };
}

export const waterPollution: ComplianceModule = {
  regulationName: "Water pollution offence (controlled waters)",
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
    wp_pathway: null,
    wp_storage: null,
    wp_bunded: null,
    wp_washwater: null,
    wp_construction: null,
    wp_agriculture: null,
    wp_enforcement: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
