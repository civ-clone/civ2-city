"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const Roles_1 = require("@civ-clone/base-unit-role/Roles");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const unitSupport_1 = require("@civ-clone/base-government-unit-support/lib/unitSupport");
const unitSupport_2 = require("@civ-clone/civ2-government/unitSupport");
const Governments_1 = require("../../Governments");
const Cost_1 = require("@civ-clone/core-city/Rules/Cost");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Fanatic_1 = require("@civ-clone/base-unit-fanatic/Fanatic");
const governments_1 = require("@civ-clone/civ2-rules/data/governments");
const Yields_1 = require("../../Yields");
const cosmic_1 = require("@civ-clone/civ2-rules/data/cosmic");
const government_1 = require("../../lib/government");
const roleOf_1 = require("@civ-clone/base-unit-role/roleOf");
// A city's upkeep, as Civilization II has it (OpenCiv2 `src/auto/city.cpp`, richardpenman/civ2@49f26ec): its citizens
//  eat @COSMIC's food each, its units that settle eat by government (`city_calc_food_box_rows`), and each unit it
//  supports past its free ones costs a shield (`city_calc_unit_support`, `city_count_unit_support`). The tables by
//  government are civ2-government's (`unitSupport`).
const getRules = (cityGrowthRegistry = CityGrowthRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance) => {
    // Diplomats, Spies, Caravans and Freight (roles 6 and 7) cost nothing, and aren't counted against the free units: the
    //  game counts only units whose role is below 6.
    const supported = (unit) => !(0, roleOf_1.hasRole)(unit, Roles_1.DiplomacyRole, ruleRegistry) &&
        !(0, roleOf_1.hasRole)(unit, Roles_1.TradeRole, ruleRegistry), settles = (unit) => (0, roleOf_1.hasRole)(unit, Roles_1.SettleRole, ruleRegistry), government = (city) => (0, government_1.default)(city.player(), playerGovernmentRegistry), 
    // A player with no government yet is treated as under Despotism (`lib/government`).
    playerGovernment = (city) => {
        try {
            return playerGovernmentRegistry.getByPlayer(city.player());
        }
        catch (e) {
            return {
                is: (...governments) => governments.includes(Governments_1.Despotism),
            };
        }
    }, free = (city) => (0, unitSupport_2.freeUnits)(playerGovernment(city), cityGrowthRegistry.getByCity(city).size());
    return [
        new Cost_1.default('civ2-city:city/cost/population-support-food', new Effect_1.default((city) => new Yields_1.PopulationSupportFood(cityGrowthRegistry.getByCity(city).size() * cosmic_1.default.foodPerCitizen))),
        new Cost_1.default('civ2-city:city/cost/unit-support-food', new Criterion_1.default((city) => unitRegistry.getByCity(city).some(settles)), new Effect_1.default((city) => (0, unitSupport_1.foodSupport)(unitRegistry.getByCity(city), settles, (0, unitSupport_2.settlerFood)(playerGovernment(city))))),
        // Under Fundamentalism a Fanatic uses up a free unit but never costs a shield itself (`UTYPE_FUNDAMENTALISM_FREE`).
        new Cost_1.default('civ2-city:city/cost/unit-support-production', new Criterion_1.default((city) => unitRegistry.getByCity(city).filter(supported).length > free(city)), new Effect_1.default((city) => (0, unitSupport_1.productionSupport)(unitRegistry.getByCity(city), supported, free(city), unitSupport_2.productionPerUnit).filter((support) => !(government(city) === governments_1.FUNDAMENTALISM &&
            support.unit() instanceof Fanatic_1.default)))),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=cost.js.map