"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.improvementIdOf = exports.scoredImprovements = void 0;
const chooseProductionState_1 = require("../../lib/chooseProductionState");
const chooseProduction_1 = require("../../lib/chooseProduction");
const Airport_1 = require("@civ-clone/base-city-improvement-airport/Airport");
const Aqueduct_1 = require("@civ-clone/base-city-improvement-aqueduct/Aqueduct");
const Bank_1 = require("@civ-clone/base-city-improvement-bank/Bank");
const Barracks_1 = require("@civ-clone/base-city-improvement-barracks/Barracks");
const BuildPriority_1 = require("@civ-clone/core-city-build/Rules/BuildPriority");
const Cathedral_1 = require("@civ-clone/base-city-improvement-cathedral/Cathedral");
const CityWalls_1 = require("@civ-clone/base-city-improvement-citywalls/CityWalls");
const CoastalFortress_1 = require("@civ-clone/base-city-improvement-coastalfortress/CoastalFortress");
const Colosseum_1 = require("@civ-clone/base-city-improvement-colosseum/Colosseum");
const Courthouse_1 = require("@civ-clone/base-city-improvement-courthouse/Courthouse");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Factory_1 = require("@civ-clone/base-city-improvement-factory/Factory");
const Granary_1 = require("@civ-clone/base-city-improvement-granary/Granary");
const Harbour_1 = require("@civ-clone/base-city-improvement-harbour/Harbour");
const HydroPlant_1 = require("@civ-clone/base-city-improvement-hydroplant/HydroPlant");
const Library_1 = require("@civ-clone/base-city-improvement-library/Library");
const ManufacturingPlant_1 = require("@civ-clone/base-city-improvement-manufacturingplant/ManufacturingPlant");
const Marketplace_1 = require("@civ-clone/base-city-improvement-marketplace/Marketplace");
const NuclearPlant_1 = require("@civ-clone/base-city-improvement-nuclearplant/NuclearPlant");
const OffshorePlatform_1 = require("@civ-clone/base-city-improvement-offshoreplatform/OffshorePlatform");
const Palace_1 = require("@civ-clone/base-city-improvement-palace/Palace");
const PoliceStation_1 = require("@civ-clone/base-city-improvement-policestation/PoliceStation");
const PortFacility_1 = require("@civ-clone/base-city-improvement-portfacility/PortFacility");
const PowerPlant_1 = require("@civ-clone/base-city-improvement-powerplant/PowerPlant");
const RecyclingCenter_1 = require("@civ-clone/base-city-improvement-recyclingcenter/RecyclingCenter");
const ResearchLab_1 = require("@civ-clone/base-city-improvement-researchlab/ResearchLab");
const SamMissileBattery_1 = require("@civ-clone/base-city-improvement-sammissilebattery/SamMissileBattery");
const SdiDefence_1 = require("@civ-clone/base-city-improvement-sdidefence/SdiDefence");
const SewerSystem_1 = require("@civ-clone/base-city-improvement-sewersystem/SewerSystem");
const StockExchange_1 = require("@civ-clone/base-city-improvement-stockexchange/StockExchange");
const Superhighways_1 = require("@civ-clone/base-city-improvement-superhighways/Superhighways");
const Supermarket_1 = require("@civ-clone/base-city-improvement-supermarket/Supermarket");
const Temple_1 = require("@civ-clone/base-city-improvement-temple/Temple");
const University_1 = require("@civ-clone/base-city-improvement-university/University");
/**
 * The improvements Civ2 scores for a city on Auto, by their number (`IMP_*`). The Mass Transit, the Solar Plant, the
 *  spaceship and Capitalization always score 999 there (`city_choose_production_improvement_score`), so they aren't
 *  listed: a city on Auto never chooses them.
 */
exports.scoredImprovements = [
    [Palace_1.default, chooseProduction_1.ImprovementId.Palace],
    [Barracks_1.default, chooseProduction_1.ImprovementId.Barracks],
    [Granary_1.default, chooseProduction_1.ImprovementId.Granary],
    [Temple_1.default, chooseProduction_1.ImprovementId.Temple],
    [Marketplace_1.default, chooseProduction_1.ImprovementId.Marketplace],
    [Library_1.default, chooseProduction_1.ImprovementId.Library],
    [Courthouse_1.default, chooseProduction_1.ImprovementId.Courthouse],
    [CityWalls_1.default, chooseProduction_1.ImprovementId.CityWalls],
    [Aqueduct_1.default, chooseProduction_1.ImprovementId.Aqueduct],
    [Bank_1.default, chooseProduction_1.ImprovementId.Bank],
    [Cathedral_1.default, chooseProduction_1.ImprovementId.Cathedral],
    [University_1.default, chooseProduction_1.ImprovementId.University],
    [Colosseum_1.default, chooseProduction_1.ImprovementId.Colosseum],
    [Factory_1.default, chooseProduction_1.ImprovementId.Factory],
    [ManufacturingPlant_1.default, chooseProduction_1.ImprovementId.ManufacturingPlant],
    [SdiDefence_1.default, chooseProduction_1.ImprovementId.SdiDefense],
    [RecyclingCenter_1.default, chooseProduction_1.ImprovementId.RecyclingCenter],
    [PowerPlant_1.default, chooseProduction_1.ImprovementId.PowerPlant],
    [HydroPlant_1.default, chooseProduction_1.ImprovementId.HydroPlant],
    [NuclearPlant_1.default, chooseProduction_1.ImprovementId.NuclearPlant],
    [StockExchange_1.default, chooseProduction_1.ImprovementId.StockExchange],
    [SewerSystem_1.default, chooseProduction_1.ImprovementId.SewerSystem],
    [Supermarket_1.default, chooseProduction_1.ImprovementId.Supermarket],
    [Superhighways_1.default, chooseProduction_1.ImprovementId.Superhighways],
    [ResearchLab_1.default, chooseProduction_1.ImprovementId.ResearchLab],
    [SamMissileBattery_1.default, chooseProduction_1.ImprovementId.SamBattery],
    [CoastalFortress_1.default, chooseProduction_1.ImprovementId.CoastalFortress],
    [Harbour_1.default, chooseProduction_1.ImprovementId.Harbour],
    [OffshorePlatform_1.default, chooseProduction_1.ImprovementId.OffshorePlatform],
    [Airport_1.default, chooseProduction_1.ImprovementId.Airport],
    [PoliceStation_1.default, chooseProduction_1.ImprovementId.PoliceStation],
    [PortFacility_1.default, chooseProduction_1.ImprovementId.PortFacility],
];
/** Civ2's number for `item`: its own class's, or failing that one it's a kind of (a ruleset's subclass). */
const improvementIdOf = (item) => {
    var _a, _b, _c;
    return (_c = (_b = ((_a = exports.scoredImprovements.find(([Type]) => Type === item)) !== null && _a !== void 0 ? _a : exports.scoredImprovements.find(([Type]) => Object.prototype.isPrototypeOf.call(Type, item)))) === null || _b === void 0 ? void 0 : _b[1]) !== null && _c !== void 0 ? _c : null;
};
exports.improvementIdOf = improvementIdOf;
/**
 * Civ2's own ranking for a city on Auto (`city_choose_production`, OpenCiv2 `src/auto/city_production.cpp`,
 *  richardpenman/civ2@49f26ec): each improvement's score (`lib/chooseProduction`), lowest wanted most, as a
 *  core-city-build `BuildPriority` of 501 − the score, so `rankBuildItems` puts the same one first and leaves out what
 *  Civ2 would never choose (a score over 500). Only for a city on Auto: Civ2 uses the same function for its own
 *  players' cities, but a computer player here chooses with simple-ai-client, which reads `BuildPriority` too.
 */
const getRules = (dependencies = {}, 
// What the city and its player look like to Civ2's choice: surveyed from the game by default.
survey = chooseProductionState_1.chooseProductionState) => {
    // `rankBuildItems` hands every item's rules the same yields, so the survey is done once a ranking.
    const states = new WeakMap(), stateOf = (cityBuild, yields) => {
        if (!states.has(yields)) {
            states.set(yields, survey(cityBuild.city(), yields, dependencies));
        }
        return states.get(yields);
    };
    return [
        new BuildPriority_1.default('civ2-city:city/build-priority/auto', new Criterion_1.default((cityBuild) => cityBuild.auto()), new Criterion_1.default((cityBuild, item) => (0, exports.improvementIdOf)(item) !== null), new Effect_1.default((cityBuild, item, yields) => {
            const improvement = (0, exports.improvementIdOf)(item);
            return (0, chooseProduction_1.priorityOf)((0, chooseProduction_1.chooseImprovementScore)(improvement, stateOf(cityBuild, yields)), improvement);
        })),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=build-priority.js.map