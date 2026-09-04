export const PREVIEW = [
  { id: "O1", title: "Food waste separated", rag: "green" as const },
  { id: "O2", title: "Dry recyclables separated", rag: "amber" as const },
  { id: "O3", title: "Residual waste kept apart", rag: "green" as const },
  { id: "O4", title: "Collector registered", rag: "red" as const },
];

export const ROW_BG = {
  green: "bg-[color-mix(in_srgb,var(--living)_9%,var(--surface))]",
  amber: "bg-amber-surface",
  red: "bg-danger-surface",
};

export const STATS = [
  {
    n: "01",
    value: "4",
    label: "legal obligations",
    detail: "scored independently — never blended into one number.",
  },
  {
    n: "02",
    value: "30",
    label: "question tree",
    detail: "built from the actual Separation of Waste regulations.",
  },
  {
    n: "03",
    value: "2027",
    label: "the real deadline",
    detail: "for any business under 10 staff — already passed for larger ones.",
  },
  {
    n: "04",
    value: "England",
    label: "only, for now",
    detail: "more nations arrive as the platform grows.",
  },
];

export const STEPS = [
  {
    n: "01",
    title: "Answer",
    detail:
      "A short, branching question set about your waste setup — headcount, collection arrangements, how you separate recyclables. Ten minutes, no jargon.",
  },
  {
    n: "02",
    title: "Score",
    detail:
      "Each obligation is scored Red, Amber, or Green on its own — with the citation and the reason behind the colour, not a blended pass/fail.",
  },
  {
    n: "03",
    title: "Act",
    detail:
      "See exactly what's missing and why it matters before your deadline, not after an inspector tells you.",
  },
];

export const CATEGORIES = [
  "Office & professional",
  "Retail",
  "Hospitality & food service",
  "Manufacturing",
  "Construction",
  "Healthcare & care",
  "Education",
  "Agriculture",
];

const ALL_SECTORS = CATEGORIES;

export const REGULATIONS = [
  {
    name: "Wildlife and Countryside Act",
    year: "1981",
    note: "Protection for wild species, nests, SSSIs, and habitats — scored together with the Conservation of Habitats and Species Regulations 2017.",
    status: "live" as const,
    sectors: ALL_SECTORS,
  },
  {
    name: "Control of Pollution (Amendment) Act",
    year: "1989",
    note: "Registration requirement when a business carries its own waste.",
    status: "live" as const,
    sectors: ALL_SECTORS,
  },
  {
    name: "Environmental Protection Act 1990, s.34",
    year: "1990",
    note: "Duty of Care — using a registered waste carrier, with documentation.",
    status: "live" as const,
    sectors: ALL_SECTORS,
  },
  {
    name: "Statutory Nuisance, EPA 1990 Part III",
    year: "1990",
    note: "Local-authority controls on noise, smoke, fumes, and odour — includes construction site noise consents under the Control of Pollution Act 1974.",
    status: "live" as const,
    sectors: ALL_SECTORS,
  },
  {
    name: "Water pollution offence (controlled waters)",
    year: "2016",
    note: "Unpermitted pollution of a river, ditch, or groundwater — recodified from Water Resources Act 1991 s.85 (repealed 2010) into the Environmental Permitting Regulations 2016.",
    status: "live" as const,
    sectors: ALL_SECTORS,
  },
  {
    name: "Water Industry Act, ss.118 & 121",
    year: "1991",
    note: "Trade effluent discharge consent into the public sewer.",
    status: "live" as const,
    sectors: ALL_SECTORS,
  },
  {
    name: "Clean Air Act",
    year: "1993",
    note: "Smoke control areas, dark smoke offences, and chimney height requirements.",
    status: "live" as const,
    sectors: ALL_SECTORS,
  },
  {
    name: "Contaminated Land Regime, EPA 1990 Part 2A",
    year: "1995",
    note: "Liability awareness for historic land contamination — mainly relevant when buying, selling, or developing land.",
    status: "live" as const,
    sectors: ["Construction", "Manufacturing", "Retail", "Agriculture"],
  },
  {
    name: "Landfill Tax, Finance Act 1996 Part III",
    year: "1996",
    note: "Tax charged per tonne of waste sent to landfill — mostly paid indirectly via your contractor.",
    status: "live" as const,
    sectors: ALL_SECTORS,
  },
  {
    name: "Control of Substances Hazardous to Health Regulations (COSHH)",
    year: "2002",
    note: "Controls on storing and handling hazardous substances.",
    status: "live" as const,
    sectors: ALL_SECTORS,
  },
  {
    name: "End-of-Life Vehicles Regulations",
    year: "2003",
    note: "Depollution and recycling duties for scrap vehicles.",
    status: "live" as const,
    sectors: ["Manufacturing"],
  },
  {
    name: "Hazardous Waste (England and Wales) Regulations",
    year: "2005",
    note: "Consignment notes and correct handling for hazardous waste.",
    status: "live" as const,
    sectors: ALL_SECTORS,
  },
  {
    name: "Climate Change Act",
    year: "2008",
    note: "The legally binding UK net zero and carbon budget framework — binds government, not individual businesses directly (see SECR/UK ETS for the business-facing rules it underpins).",
    status: "tracked" as const,
    sectors: [],
  },
  {
    name: "Waste Batteries and Accumulators Regulations",
    year: "2009",
    note: "Correct disposal, plus take-back and producer duties where they apply.",
    status: "live" as const,
    sectors: ALL_SECTORS,
  },
  {
    name: "Air Quality Standards Regulations",
    year: "2010",
    note: "Ambient air quality limits — a duty on government and local authorities to monitor and achieve, not a direct obligation on individual businesses.",
    status: "tracked" as const,
    sectors: [],
  },
  {
    name: "Waste Electrical and Electronic Equipment Regulations",
    year: "2013",
    note: "WEEE — take-back and disposal duties for electrical goods.",
    status: "live" as const,
    sectors: ALL_SECTORS,
  },
  {
    name: "Nitrate Pollution Prevention Regulations",
    year: "2015",
    note: "NVZ farming rules limiting agricultural water pollution (England).",
    status: "live" as const,
    sectors: ["Agriculture"],
  },
  {
    name: "Fluorinated Greenhouse Gases Regulations",
    year: "2015",
    note: "F-Gas — leak checks, records, and certified contractors for refrigerants (also covers Ozone-Depleting Substances equipment).",
    status: "live" as const,
    sectors: ALL_SECTORS,
  },
  {
    name: "Control of Major Accident Hazards Regulations",
    year: "2015",
    note: "COMAH — storage of dangerous substances above threshold.",
    status: "live" as const,
    sectors: ["Manufacturing", "Agriculture", "Retail"],
  },
  {
    name: "Environmental Damage (Prevention and Remediation) Regulations",
    year: "2015",
    note: "Strict-liability remediation duty once damage from your activity crosses a \"significant adverse effect\" threshold — a consequence of a serious breach already covered by our other checks, not a separate proactive checklist.",
    status: "tracked" as const,
    sectors: ["Manufacturing", "Construction", "Agriculture"],
  },
  {
    name: "Environmental Permitting (England and Wales) Regulations",
    year: "2016",
    note: "Permits for regulated waste, installation, and discharge activities — including to groundwater (folding in the repealed Groundwater Regulations 2009).",
    status: "live" as const,
    sectors: ALL_SECTORS,
  },
  {
    name: "Town and Country Planning (EIA) Regulations",
    year: "2017",
    note: "Environmental impact assessment for larger developments — scored together with Biodiversity Net Gain and marine licensing.",
    status: "live" as const,
    sectors: ["Construction", "Agriculture", "Hospitality & food service"],
  },
  {
    name: "Farming Rules for Water",
    year: "2018",
    note: "Nutrient and slurry buffer distances and spreading bans — scored together with the water pollution check.",
    status: "live" as const,
    sectors: ["Agriculture"],
  },
  {
    name: "Energy and Carbon Report Regulations (SECR)",
    year: "2019",
    note: "Mandatory energy and carbon disclosure for large companies — scored together with the UK Emissions Trading Scheme.",
    status: "live" as const,
    sectors: ALL_SECTORS,
  },
  {
    name: "UK REACH, retained Regulation 1907/2006",
    year: "2020",
    note: "Registration, authorisation, and restriction of chemical substances.",
    status: "live" as const,
    sectors: ALL_SECTORS,
  },
  {
    name: "Environment Act",
    year: "2021",
    note: "Umbrella framework — its teeth are already scored under their own names (Packaging EPR, Simpler Recycling, Biodiversity Net Gain). Watch items not yet live: Deposit Return Scheme (due 1 Oct 2027) and forest risk commodities due diligence (not yet commenced).",
    status: "tracked" as const,
    sectors: [],
  },
  {
    name: "Plastic Packaging Tax",
    year: "2022",
    note: "Tax on packaging with under 30% recycled plastic content — scored together with the Single-Use Plastics ban.",
    status: "live" as const,
    sectors: ALL_SECTORS,
  },
  {
    name: "Producer Responsibility Obligations (Packaging and Packaging Waste) Regulations",
    year: "2024",
    note: "Packaging EPR — data reporting and fees for packaging placed on the market.",
    status: "live" as const,
    sectors: ALL_SECTORS,
  },
  {
    name: "Separation of Waste (England) Regulations",
    year: "2025",
    note: "Simpler Recycling — six waste streams kept separate for collection.",
    status: "live" as const,
    sectors: ALL_SECTORS,
  },
];

export const UPCOMING = [
  {
    name: "Mandatory Digital Waste Tracking — waste sites",
    date: "1 Oct 2026",
    note: "Digital tracking replaces paper waste transfer notes for permitted waste-receiving sites in England.",
  },
  {
    name: "Packaging EPR eco-modulation fees",
    date: "2026–2029",
    note: "Fees step up in stages for hard-to-recycle, “red-rated” packaging under the existing pEPR scheme.",
  },
  {
    name: "UK Carbon Border Adjustment Mechanism",
    date: "1 Jan 2027",
    note: "A carbon price on imported steel, aluminium, cement, fertiliser, and hydrogen.",
  },
  {
    name: "Simpler Recycling — micro-firm deadline",
    date: "31 Mar 2027",
    note: "Businesses under 10 staff must comply with the recycling rules already live for larger firms.",
  },
  {
    name: "Mandatory Digital Waste Tracking — carriers & brokers",
    date: "Oct 2027",
    note: "Extends digital waste tracking to waste carriers, brokers, and dealers.",
  },
  {
    name: "Deposit Return Scheme for Drinks Containers",
    date: "1 Oct 2027",
    note: "A 20p return scheme for single-use drinks containers across England, Wales, and Northern Ireland.",
  },
  {
    name: "UK ETS — waste incineration",
    date: "1 Jan 2028",
    note: "Extends carbon allowance surrender to energy-from-waste and incineration plants.",
  },
];

export const REG_BADGE = {
  live: {
    label: "Scored today",
    className:
      "bg-[color-mix(in_srgb,var(--living)_15%,var(--surface))] text-living-ink",
  },
  roadmap: {
    label: "Checker coming",
    className: "bg-amber-surface text-amber",
  },
  tracked: {
    label: "Not yet scored",
    className: "bg-surface-2 text-muted",
  },
};
