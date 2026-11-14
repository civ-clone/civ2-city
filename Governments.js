"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.governments = exports.Republic = exports.Monarchy = exports.Fundamentalism = exports.Despotism = exports.Democracy = exports.Communism = exports.Anarchy = void 0;
const Anarchy_1 = require("@civ-clone/base-government-anarchy/Anarchy");
Object.defineProperty(exports, "Anarchy", { enumerable: true, get: function () { return Anarchy_1.Anarchy; } });
const Communism_1 = require("@civ-clone/base-government-communism/Communism");
Object.defineProperty(exports, "Communism", { enumerable: true, get: function () { return Communism_1.Communism; } });
const Democracy_1 = require("@civ-clone/base-government-democracy/Democracy");
Object.defineProperty(exports, "Democracy", { enumerable: true, get: function () { return Democracy_1.Democracy; } });
const Despotism_1 = require("@civ-clone/base-government-despotism/Despotism");
Object.defineProperty(exports, "Despotism", { enumerable: true, get: function () { return Despotism_1.Despotism; } });
const Fundamentalism_1 = require("@civ-clone/base-government-fundamentalism/Fundamentalism");
Object.defineProperty(exports, "Fundamentalism", { enumerable: true, get: function () { return Fundamentalism_1.Fundamentalism; } });
const Monarchy_1 = require("@civ-clone/base-government-monarchy/Monarchy");
Object.defineProperty(exports, "Monarchy", { enumerable: true, get: function () { return Monarchy_1.Monarchy; } });
const Republic_1 = require("@civ-clone/base-government-republic/Republic");
Object.defineProperty(exports, "Republic", { enumerable: true, get: function () { return Republic_1.Republic; } });
/** Civilization II's governments in its own order (civ2-rules `data/governments`), which many rules compare. */
exports.governments = [
    Anarchy_1.Anarchy,
    Despotism_1.Despotism,
    Monarchy_1.Monarchy,
    Communism_1.Communism,
    Fundamentalism_1.Fundamentalism,
    Republic_1.Republic,
    Democracy_1.Democracy,
];
//# sourceMappingURL=Governments.js.map