import { AnswerMap, ComplianceModule, ModuleResult, Question, RAG } from "./types";

const questions: Question[] = [
  {
    id: "caa_burnsFuel",
    qid: "Q1",
    type: "single",
    prompt:
      "Does your business burn solid fuel (coal, wood, biomass), or run any wood/coal-fired oven, stove, boiler, or open fire that vents through a chimney or flue?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "caa_smokeControlChecked",
    qid: "Q2",
    type: "single",
    prompt: "Have you checked whether your premises' address is inside a Smoke Control Area, using your local council's smoke control map or register?",
    visibleIf: (a) => a.caa_burnsFuel === "yes",
    options: [
      { value: "not-checked", label: "Not checked yet" },
      { value: "outside", label: "Checked — outside a Smoke Control Area" },
      { value: "inside", label: "Checked — inside a Smoke Control Area" },
    ],
  },
  {
    id: "caa_authorisedFuel",
    qid: "Q3",
    type: "single",
    prompt: "Is the fuel you burn on Defra's list of authorised fuels, or is your appliance on Defra's list of exempt (\"Defra-approved\") appliances for the fuel you use?",
    visibleIf: (a) => a.caa_smokeControlChecked === "inside",
    options: [
      { value: "yes", label: "Yes, one or the other" },
      { value: "no", label: "No / not sure" },
    ],
  },
  {
    id: "caa_darkSmoke",
    qid: "Q4",
    type: "single",
    prompt:
      "In the last 12 months, has your chimney or flue ever visibly emitted thick, dark smoke — other than briefly while lighting a cold furnace, or due to a one-off equipment fault?",
    visibleIf: (a) => a.caa_burnsFuel === "yes",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
    ],
  },
  {
    id: "caa_largeFurnace",
    qid: "Q5",
    type: "single",
    prompt:
      "Does any single furnace, boiler, or oven on site burn solid fuel at 45kg/hour or more, or oil/gas at around 366kW or more? (Roughly: a large commercial boiler, not a typical small office gas boiler.)",
    visibleIf: (a) => a.caa_burnsFuel === "yes",
    options: [
      { value: "no", label: "No, confirmed below that" },
      { value: "yes", label: "Yes" },
      { value: "unsure", label: "Don't know the appliance rating" },
    ],
  },
  {
    id: "caa_chimneyApproved",
    qid: "Q6",
    type: "single",
    prompt: "For that furnace, has the chimney height been formally approved by your local authority under the Clean Air Act 1993?",
    visibleIf: (a) => a.caa_largeFurnace === "yes",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No / not sure" },
    ],
  },
];

function visibleQuestions(a: AnswerMap): Question[] {
  return questions.filter((q) => !q.visibleIf || q.visibleIf(a));
}

function evaluate(a: AnswerMap): ModuleResult {
  let rag: RAG = "green";
  let reason = "No solid-fuel burning or chimney/flue combustion reported — Clean Air Act 1993 obligations are very unlikely to apply.";

  if (a.caa_burnsFuel === "yes") {
    rag = "amber";
    reason = "Burning solid fuel or running a chimney/flue appliance — check the specifics below.";

    if (a.caa_smokeControlChecked === "not-checked" || a.caa_smokeControlChecked == null) {
      rag = "amber";
      reason = "Smoke Control Area status hasn't been checked yet — check your council's smoke control map, since this isn't a rule Renewmere can determine from your address alone.";
    } else if (a.caa_smokeControlChecked === "inside" && a.caa_authorisedFuel === "no") {
      rag = "red";
      reason = "Inside a Smoke Control Area, burning a fuel or using an appliance that isn't confirmed as authorised/exempt — this is a specific offence.";
    } else {
      reason = "Fuel/appliance and Smoke Control Area status look compliant so far.";
    }

    if (a.caa_darkSmoke === "yes") {
      rag = "red";
      reason = "Dark smoke has been emitted from a chimney/flue in the last 12 months — a potential dark smoke offence, regardless of Smoke Control Area status.";
    }

    if (a.caa_largeFurnace === "yes") {
      if (a.caa_chimneyApproved === "yes") {
        if (rag !== "red") reason += " Large furnace chimney height is formally approved.";
      } else {
        rag = "red";
        reason += " A large furnace (45kg/hr solid fuel or ~366kW liquid/gas or more) doesn't have confirmed chimney height approval — operating without it is an offence.";
      }
    } else if (a.caa_largeFurnace === "unsure") {
      if (rag !== "red") rag = "amber";
      reason += " Furnace/boiler rated output isn't confirmed — check with the manufacturer or installer, since this determines whether chimney height approval is needed.";
    }
  }

  return {
    obligations: [
      {
        id: "O1",
        title: "Smoke control, dark smoke, and furnace chimney height",
        citation: "Clean Air Act 1993, ss.1–3, 14–15 & 18–21",
        rag,
        reason,
        billing: "one_time",
      },
    ],
    overall: rag,
    notes: [
      "Smoke Control Area boundaries are set locally by each council — there's no national map, so this can't be determined from your address alone. Always check your own council's register.",
    ],
  };
}

export const cleanAirAct: ComplianceModule = {
  regulationName: "Clean Air Act",
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
    caa_burnsFuel: null,
    caa_smokeControlChecked: null,
    caa_authorisedFuel: null,
    caa_darkSmoke: null,
    caa_largeFurnace: null,
    caa_chimneyApproved: null,
  },
  questions,
  visibleQuestions,
  evaluate,
};
