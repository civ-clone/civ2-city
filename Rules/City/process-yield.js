"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const CityBuildRegistry_1 = require("@civ-clone/core-city-build/CityBuildRegistry");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const Yields_1 = require("../../Yields");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const processYield_1 = require("@civ-clone/base-city-lifecycle/lib/processYield");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const PlayerTreasuryRegistry_1 = require("@civ-clone/core-treasury/PlayerTreasuryRegistry");
const capitalizationRules_1 = require("@civ-clone/base-city-improvement-capitalization/lib/capitalizationRules");
const governments_1 = require("@civ-clone/civ2-rules/data/governments");
const Gold_1 = require("@civ-clone/base-city-yield-gold/Gold");
const government_1 = require("../../lib/government");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const ProcessYield_1 = require("@civ-clone/core-city/Rules/ProcessYield");
const Yields_2 = require("../../Yields");
const getRules = (cityBuildRegistry = CityBuildRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, playerTreasuryRegistry = PlayerTreasuryRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance) => [
    new ProcessYield_1.default('civ2-city:city/process-yield/food', new Criterion_1.default((cityYield) => cityYield instanceof Yields_1.Food), 
    // The city's food, net of what its citizens and units eat, goes into its store, which may run out: a city short of
    //  food loses a unit it feeds (or a citizen) only when it does, not as soon as it is short (`FoodExhausted`,
    //  civ-clone/web-renderer#969).
    new Effect_1.default((cityYield, city) => {
        (0, processYield_1.storeFood)(cityYield, city, cityGrowthRegistry);
    })),
    new ProcessYield_1.default('civ2-city:city/process-yield/production', new Criterion_1.default((cityYield) => cityYield instanceof Yields_1.Production), 
    // Units the city can't support go, furthest first, and there's no production while there's civil disorder.
    //
    // While the city builds Capitalization, its shields (after waste and its units' support) never go into the box
    //  (`city_process_production`, city_production.cpp ~3031: the box is frozen), but into the treasury, one for one,
    //  after the Marketplace's and Bank's bonuses (`city_split_trade`, city.cpp ~3617), and only outside civil
    //  disorder and Anarchy (`city_process_disorder`). The build is still checked, so its `Hold` and queue rules run.
    new Effect_1.default((cityYield, city, cityYields) => {
        const cityBuild = cityBuildRegistry.getByCity(city);
        if (!(0, capitalizationRules_1.isBuildingCapitalization)(cityBuild)) {
            (0, processYield_1.buildWithProduction)(cityYield, city, cityYields, Yields_2.UnitSupportProduction, cityBuildRegistry, ruleRegistry);
            return;
        }
        let net = 0;
        // `buildWithProduction` disbands what the city can't support and leaves out the turn's production in disorder;
        //  here what it would add is paid out instead.
        (0, processYield_1.buildWithProduction)(cityYield, city, cityYields, Yields_2.UnitSupportProduction, {
            getByCity: () => ({
                add: (production) => {
                    net = production.value();
                },
                check: () => { },
            }),
        }, ruleRegistry);
        (0, capitalizationRules_1.payOut)(city, net, { playerTreasuryRegistry }, {
            YieldType: Gold_1.default,
            pays: (city) => (0, government_1.default)(city.player(), playerGovernmentRegistry) !== governments_1.ANARCHY,
        });
        cityBuild.check();
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=process-yield.js.map