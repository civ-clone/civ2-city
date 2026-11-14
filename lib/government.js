"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.governmentOf = void 0;
const governments_1 = require("@civ-clone/civ2-rules/data/governments");
const Governments_1 = require("../Governments");
/**
 * The index, in Civilization II's order (`Governments`), of `player`'s government: Despotism for a player with none,
 * or with a government Civ2 doesn't have, as a city of a player who hasn't started is.
 */
const governmentOf = (player, playerGovernmentRegistry) => {
    try {
        const playerGovernment = playerGovernmentRegistry.getByPlayer(player), index = Governments_1.governments.findIndex((GovernmentType) => playerGovernment.is(GovernmentType));
        return index === -1 ? governments_1.DESPOTISM : index;
    }
    catch (e) {
        return governments_1.DESPOTISM;
    }
};
exports.governmentOf = governmentOf;
exports.default = exports.governmentOf;
//# sourceMappingURL=government.js.map