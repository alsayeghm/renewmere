import { ComplianceModule } from "./types";
import { simplerRecycling } from "./simplerRecycling";
import { ownWasteCarrying } from "./ownWasteCarrying";
import { waterPollution } from "./waterPollution";
import { tradeEffluent } from "./tradeEffluent";
import { weee } from "./weee";
import { hazardousWaste } from "./hazardousWaste";
import { batteries } from "./batteries";
import { environmentalPermitting } from "./environmentalPermitting";
import { endOfLifeVehicles } from "./endOfLifeVehicles";
import { landfillTax } from "./landfillTax";
import { packagingEpr } from "./packagingEpr";
import { coshh } from "./coshh";
import { cleanAirAct } from "./cleanAirAct";
import { fGasOds } from "./fGasOds";
import { contaminatedLand } from "./contaminatedLand";
import { nitratePollution } from "./nitratePollution";
import { wildlifeHabitats } from "./wildlifeHabitats";
import { noiseNuisance } from "./noiseNuisance";
import { secrEts } from "./secrEts";
import { ukReach } from "./ukReach";
import { comah } from "./comah";
import { planningDevelopment } from "./planningDevelopment";
import { plastics } from "./plastics";

export const MODULES: ComplianceModule[] = [
  simplerRecycling,
  ownWasteCarrying,
  waterPollution,
  tradeEffluent,
  weee,
  hazardousWaste,
  batteries,
  environmentalPermitting,
  endOfLifeVehicles,
  landfillTax,
  packagingEpr,
  coshh,
  cleanAirAct,
  fGasOds,
  contaminatedLand,
  nitratePollution,
  wildlifeHabitats,
  noiseNuisance,
  secrEts,
  ukReach,
  comah,
  planningDevelopment,
  plastics,
];

export * from "./types";
