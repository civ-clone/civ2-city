"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const Engine_1 = require("@civ-clone/core-engine/Engine");
const famine_1 = require("@civ-clone/base-city-lifecycle/lib/famine");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const FoodExhausted_1 = require("@civ-clone/core-city-growth/Rules/FoodExhausted");
const Yields_1 = require("../../Yields");
// The first unit the city feeds (its Settlers or Engineers), or `null`.
const foodSupportedUnit = (cityGrowth) => (0, famine_1.foodSupportedUnit)(cityGrowth, Yields_1.UnitSupportFood);
// When a city's food box runs out, Civilization II disbands the first unit that settles the city supports, or failing
//  that the city loses a citizen (and is gone at none), and the box is emptied (OpenCiv2 `src/auto/city.cpp`
//  `city_process_food`, richardpenman/civ2@49f26ec). A city short of food eats into its box first.
const getRules = (engine = Engine_1.instance) => [
    new FoodExhausted_1.default('civ2-city:city/food-exhausted/emit', new Effect_1.default((cityGrowth) => {
        (0, famine_1.emitFoodStorageExhausted)(cityGrowth, foodSupportedUnit(cityGrowth), engine);
    })),
    new FoodExhausted_1.default('civ2-city:city/food-exhausted/lose-food-supported-unit', new Criterion_1.default((cityGrowth) => foodSupportedUnit(cityGrowth) !== null), new Effect_1.default((cityGrowth) => (0, famine_1.loseFoodSupportedUnit)(cityGrowth, Yields_1.UnitSupportFood))),
    new FoodExhausted_1.default('civ2-city:city/food-exhausted/shrink', new Criterion_1.default((cityGrowth) => foodSupportedUnit(cityGrowth) === null), new Effect_1.default((cityGrowth) => (0, famine_1.shrinkFromFamine)(cityGrowth))),
    new FoodExhausted_1.default('civ2-city:city/food-exhausted/empty-food-store', new Effect_1.default((cityGrowth) => (0, famine_1.emptyFoodStore)(cityGrowth))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=food-exhausted.js.map