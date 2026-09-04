export type RAG = "green" | "amber" | "red";

export type Answers = {
  q4_headcount: number | null;
  q5_partTime: number | null;
  q7_allSites: "yes" | "no" | "single" | null;
  q8_collection: "private" | "council" | "none" | "unsure" | null;
  q10_registered: "yes" | "no" | "unsure" | null;
  q11_foodWaste: "yes" | "no" | null;
  q12_foodSeparate:
    | "weekly-plus"
    | "less-than-weekly"
    | "mixed-general"
    | "mixed-recycling"
    | null;
  q15_dryRecyclables:
    | "always-separate"
    | "combine"
    | "dont-separate"
    | "unsure"
    | null;
  q16_coCollection: "yes" | "no" | "unsure" | "never-asked" | null;
  q17_someRecyclables: "some" | "none" | null;
  q18_spaceRestricted: "yes" | "no" | "unsure" | null;
  q19_residualSeparate: "yes" | "no" | "unsure" | null;
  q26_enforcement: "yes" | "no" | null;
};

export const initialAnswers: Answers = {
  q4_headcount: null,
  q5_partTime: null,
  q7_allSites: null,
  q8_collection: null,
  q10_registered: null,
  q11_foodWaste: null,
  q12_foodSeparate: null,
  q15_dryRecyclables: null,
  q16_coCollection: null,
  q17_someRecyclables: null,
  q18_spaceRestricted: null,
  q19_residualSeparate: null,
  q26_enforcement: null,
};

export function computeFTE(a: Answers): number | null {
  if (a.q4_headcount == null) return null;
  const partTime = a.q5_partTime ?? 0;
  const fullTime = a.q4_headcount - partTime;
  return fullTime * 1.0 + partTime * 0.5;
}

export type ObligationResult = {
  id: "O1" | "O2" | "O3" | "O4";
  title: string;
  citation: string;
  rag: RAG;
  reason: string;
  billing: "one_time" | "annual" | "recurring";
};

export type CheckResult = {
  forcedRed: "enforcement" | null;
  fte: number | null;
  fteBand: "under10" | "over10" | null;
  multiSiteWarning: boolean;
  obligations: ObligationResult[];
  overall: RAG;
};

function overlay(gapExists: boolean, fteBand: "under10" | "over10" | null): RAG {
  if (!gapExists) return "green";
  if (fteBand === "over10") return "red";
  return "amber";
}

export function evaluate(a: Answers): CheckResult {
  const fte = computeFTE(a);
  const fteBand: "under10" | "over10" | null =
    fte == null ? null : fte >= 10 ? "over10" : "under10";
  const multiSiteWarning = a.q7_allSites === "no";
  const noCollection = a.q8_collection === "none";
  const forcedRed = a.q26_enforcement === "yes" ? "enforcement" : null;

  // O1 — food waste separated
  let o1: RAG;
  let o1Reason: string;
  if (noCollection) {
    o1 = "red";
    o1Reason = "No waste collection arranged at all — food waste cannot be compliantly separated.";
  } else if (a.q11_foodWaste === "no") {
    o1 = "green";
    o1Reason = "No food waste produced.";
  } else if (a.q11_foodWaste == null || (a.q11_foodWaste === "yes" && a.q12_foodSeparate == null)) {
    o1 = "amber";
    o1Reason = "Not enough information yet to confirm.";
  } else if (
    a.q12_foodSeparate === "weekly-plus" ||
    a.q12_foodSeparate === "less-than-weekly"
  ) {
    o1 = "green";
    o1Reason = "Food waste is collected separately.";
  } else {
    const gap = true;
    o1 = overlay(gap, fteBand);
    o1Reason =
      "Food waste is currently mixed in with general waste or recycling instead of being collected separately.";
  }

  // O2 — dry recyclables correctly separated
  let o2: RAG;
  let o2Reason: string;
  if (noCollection) {
    o2 = "red";
    o2Reason = "No waste collection arranged at all — dry recyclables cannot be compliantly separated.";
  } else if (a.q18_spaceRestricted === "yes") {
    o2 = "green";
    o2Reason = "Space-restricted exemption applies.";
  } else if (a.q15_dryRecyclables === "always-separate") {
    o2 = "green";
    o2Reason = "Paper/card kept separate from plastic, metal & glass.";
  } else if (a.q15_dryRecyclables === "combine" && a.q16_coCollection === "yes") {
    o2 = "green";
    o2Reason = "Collector has confirmed in writing that combining is acceptable.";
  } else if (
    a.q15_dryRecyclables == null ||
    a.q15_dryRecyclables === "unsure" ||
    (a.q15_dryRecyclables === "combine" && a.q16_coCollection == null) ||
    (a.q15_dryRecyclables === "combine" && a.q16_coCollection === "unsure") ||
    a.q18_spaceRestricted === "unsure"
  ) {
    o2 = "amber";
    o2Reason = "Not enough information yet to confirm.";
  } else if (a.q15_dryRecyclables === "dont-separate" && a.q17_someRecyclables === "some") {
    o2 = "amber";
    o2Reason = "Some dry recyclables are separated, but not consistently.";
  } else if (
    (a.q15_dryRecyclables === "combine" &&
      (a.q16_coCollection === "no" || a.q16_coCollection === "never-asked")) ||
    (a.q15_dryRecyclables === "dont-separate" && a.q17_someRecyclables === "none")
  ) {
    o2 = overlay(true, fteBand);
    o2Reason =
      "Paper/card is not being kept separate from plastic, metal & glass, and no valid exemption applies.";
  } else {
    o2 = "amber";
    o2Reason = "Not enough information yet to confirm.";
  }

  // O3 — residual waste kept separate
  let o3: RAG;
  let o3Reason: string;
  if (noCollection) {
    o3 = "red";
    o3Reason = "No waste collection arranged at all — general waste cannot be compliantly separated.";
  } else if (a.q19_residualSeparate === "yes") {
    o3 = "green";
    o3Reason = "Separate container for general waste in place.";
  } else if (a.q19_residualSeparate === "unsure" || a.q19_residualSeparate == null) {
    o3 = "amber";
    o3Reason = "Not enough information yet to confirm.";
  } else {
    o3 = overlay(true, fteBand);
    o3Reason = "No separate container for general (residual) waste.";
  }

  // O4 — waste collector registered (no deadline phasing)
  let o4: RAG;
  let o4Reason: string;
  if (noCollection) {
    o4 = "amber";
    o4Reason = "No collector currently arranged to assess.";
  } else if (a.q10_registered === "yes") {
    o4 = "green";
    o4Reason = "Collector confirmed on the Public Register of Waste Carriers.";
  } else if (a.q10_registered === "unsure" || a.q10_registered == null) {
    o4 = "amber";
    o4Reason = "Not confirmed whether the collector is registered.";
  } else {
    o4 = "red";
    o4Reason = "Collector is not on the Public Register of Waste Carriers, Brokers and Dealers.";
  }

  const obligations: ObligationResult[] = [
    {
      id: "O1",
      title: "Food waste separated for collection",
      citation: "Separation of Waste (England) Regulations 2024, as amended",
      rag: forcedRed ? "red" : o1,
      reason: forcedRed ? "Active enforcement matter overrides all scoring." : o1Reason,
      billing: "recurring",
    },
    {
      id: "O2",
      title: "Dry recyclables correctly separated",
      citation: "Separation of Waste (England) Regulations 2024, as amended",
      rag: forcedRed ? "red" : o2,
      reason: forcedRed ? "Active enforcement matter overrides all scoring." : o2Reason,
      billing: "recurring",
    },
    {
      id: "O3",
      title: "General waste kept separate from recyclables",
      citation: "Separation of Waste (England) Regulations 2024, as amended",
      rag: forcedRed ? "red" : o3,
      reason: forcedRed ? "Active enforcement matter overrides all scoring." : o3Reason,
      billing: "recurring",
    },
    {
      id: "O4",
      title: "Waste collector is a registered carrier",
      citation:
        "Environmental Protection Act 1990 s.34 (Duty of Care); Waste (England and Wales) Regulations 2011, reg. 3",
      rag: forcedRed ? "red" : o4,
      reason: forcedRed ? "Active enforcement matter overrides all scoring." : o4Reason,
      billing: "annual",
    },
  ];

  const rank: Record<RAG, number> = { red: 2, amber: 1, green: 0 };
  const overall = obligations.reduce<RAG>(
    (worst, o) => (rank[o.rag] > rank[worst] ? o.rag : worst),
    "green"
  );

  return {
    forcedRed,
    fte,
    fteBand,
    multiSiteWarning,
    obligations,
    overall,
  };
}
