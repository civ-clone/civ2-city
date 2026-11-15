"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const GameDifficultyRegistry_1 = require("@civ-clone/core-difficulty/GameDifficultyRegistry");
const lateGame_1 = require("@civ-clone/civ2-difficulty/lib/lateGame");
const level_1 = require("@civ-clone/civ2-difficulty/level");
const Cost_1 = require("@civ-clone/core-city-growth/Rules/Cost");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const isHuman_1 = require("@civ-clone/civ2-difficulty/isHuman");
// A city grows once its food box holds (size + 1) × its rows: @COSMIC's 10 for the human, and the computer players'
//  by level, less the rows taken off them late in the game (civ2-difficulty `foodBoxRows` and `lateGame`; OpenCiv2
//  `src/auto/city.cpp` `city_process_food` and `city_calc_food_box_rows`, richardpenman/civ2@49f26ec).
const getRules = (gameDifficultyRegistry = GameDifficultyRegistry_1.instance, clientRegistry = ClientRegistry_1.instance, lateGameDependencies = {}) => {
    const late = (0, lateGame_1.default)({
        ...lateGameDependencies,
        clientRegistry,
        gameDifficultyRegistry,
    });
    return [
        new Cost_1.default('civ2-city:city/growth-cost/food-box', new Effect_1.default((cityGrowth) => {
            const human = (0, isHuman_1.default)(cityGrowth.city().player(), clientRegistry);
            return ((0, level_1.foodBoxRows)((0, level_1.levelOf)(gameDifficultyRegistry), human, human ? undefined : late()) *
                (cityGrowth.size() + 1));
        })),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=growth-cost.js.map