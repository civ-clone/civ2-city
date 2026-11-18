import { Game, defaultGame } from '@civ-clone/core-game';
import cityAutoBuild from './Rules/City/auto-build';
import cityBuildPriority from './Rules/City/build-priority';
import cityBuildingCancelled from './Rules/City/building-cancelled';
import cityBuildingComplete from './Rules/City/building-complete';
import cityBuild from './Rules/City/build';
import cityBuildingHeld from './Rules/City/building-held';
import cityCanBeWorked from './Rules/City/can-be-worked';
import cityCaptured from './Rules/City/captured';
import cityCorruption from './Rules/City/corruption';
import cityCost from './Rules/City/cost';
import cityCreated from './Rules/City/created';
import cityDestroyed from './Rules/City/destroyed';
import cityFoodExhausted from './Rules/City/food-exhausted';
import cityFoodStorage from './Rules/City/food-storage';
import cityGrow from './Rules/City/grow';
import cityGrowthCost from './Rules/City/growth-cost';
import cityProcessYield from './Rules/City/process-yield';
import cityRenamed from './Rules/City/renamed';
import cityShrink from './Rules/City/shrink';
import cityTileReassigned from './Rules/City/tile-reassigned';
import cityTileReleased from './Rules/City/tile-released';
import cityTileWorked from './Rules/City/tile-worked';
import citySpecialistAvailable from './Rules/City/specialist-available';
import cityTileYield from './Rules/City/tile-yield';
import cityTiles from './Rules/City/tiles';
import cityTradeRoutes from './Rules/City/trade-routes';
import CapitalLink from './lib/capitalLink';
import alliedBy from './lib/allied';
import cityIncited from './Rules/City/incited';
import dependenciesOf from '@civ-clone/civ2-diplomacy/lib/dependenciesOf';
import unitTradeRouteEstablished from './Rules/Unit/trade-route-established';
import cityYield from './Rules/City/yield';
import governmentTerms from './Rules/Government/terms';
import playerAction from './Rules/Player/action';
import playerTurnStart from './Rules/Player/turn-start';
import registerAvailableSpecialists from './registerAvailableSpecialists';
import unitDefeated from './Rules/Unit/defeated';
import unitMoved from './Rules/Unit/moved';
import unitUnsupported from './Rules/Unit/unsupported';

export const register = (game: Game): void => {
  registerAvailableSpecialists(game.availableSpecialists);

  // One capital link for corruption and the trade routes: the corruption rules keep it up to date.
  const capitalLink = new CapitalLink({
    cityImprovementRegistry: game.cityImprovements,
    cityRegistry: game.cities,
    landMassRegistry: game.landMasses,
    playerResearchRegistry: game.playerResearch,
    tileImprovementRegistry: game.tileImprovements,
    turn: game.turn,
    unitRegistry: game.units,
    allied: alliedBy(game.interactions),
  });

  game.rules.register(
    ...cityBuildingCancelled(game.engine),
    ...cityBuildingComplete(game.engine),
    ...cityBuildingHeld(game.engine),
    ...cityAutoBuild({
      cityBuildRegistry: game.cityBuilds,
      cityRegistry: game.cities,
      pendingEffectRegistry: game.pendingEffects,
      ruleRegistry: game.rules,
    }),
    ...cityBuildPriority({
      cityBuildRegistry: game.cityBuilds,
      cityGrowthRegistry: game.cityGrowth,
      cityImprovementRegistry: game.cityImprovements,
      cityRegistry: game.cities,
      clientRegistry: game.clients,
      gameDifficultyRegistry: game.difficulty,
      interactionRegistry: game.interactions,
      landMassRegistry: game.landMasses,
      pendingEffectRegistry: game.pendingEffects,
      playerGovernmentRegistry: game.playerGovernments,
      playerRegistry: game.players,
      playerResearchRegistry: game.playerResearch,
      playerTradeRatesRegistry: game.playerTradeRates,
      ruleRegistry: game.rules,
      spaceshipRegistry: game.spaceships,
      specialistRegistry: game.specialists,
      tileImprovementRegistry: game.tileImprovements,
      unitRegistry: game.units,
      wonderRegistry: game.wonders,
    }),
    ...cityCanBeWorked(game.cities, game.units, game.workedTiles),
    ...cityCaptured(
      game.units,
      game.cityGrowth,
      game.cityBuilds,
      game.engine,
      game.playerWorlds,
      game.workedTiles,
      game.specialists,
      game.availableSpecialists,
      {
        cityRegistry: game.cities,
        clientRegistry: game.clients,
        playerGovernmentRegistry: game.playerGovernments,
        playerRegistry: game.players,
        playerResearchRegistry: game.playerResearch,
        playerTreasuryRegistry: game.playerTreasuries,
        ruleRegistry: game.rules,
        tileImprovementRegistry: game.tileImprovements,
        unitImprovementRegistry: game.unitImprovements,
        randomNumberGenerator: game.rng,
        pendingEffectRegistry: game.pendingEffects,
        turn: game.turn,
      }
    ),
    ...cityCorruption({
      capitalLink,
      cityBuildRegistry: game.cityBuilds,
      cityImprovementRegistry: game.cityImprovements,
      cityRegistry: game.cities,
      clientRegistry: game.clients,
      gameDifficultyRegistry: game.difficulty,
      interactionRegistry: game.interactions,
      landMassRegistry: game.landMasses,
      pendingEffectRegistry: game.pendingEffects,
      playerGovernmentRegistry: game.playerGovernments,
      playerResearchRegistry: game.playerResearch,
      tileImprovementRegistry: game.tileImprovements,
      turn: game.turn,
      unitRegistry: game.units,
    }),
    ...cityIncited({
      diplomacy: dependenciesOf(game),
      engine: game.engine,
      randomNumberGenerator: game.rng,
    }),
    ...cityCost(
      game.cityGrowth,
      game.playerGovernments,
      game.units,
      game.rules
    ),
    ...cityCreated(
      game.tileImprovements,
      game.cityBuilds,
      game.cityGrowth,
      game.cities,
      game.playerWorlds,
      game.rules,
      game.availableCityBuildItems,
      game.engine,
      game.workedTiles,
      game.specialists,
      game.availableSpecialists
    ),
    ...cityDestroyed(
      game.tileImprovements,
      game.engine,
      game.units,
      game.workedTiles,
      game.specialists,
      game.rules,
      game.pendingEffects
    ),
    ...cityFoodExhausted(game.engine),
    ...cityFoodStorage(game.rules),
    ...cityGrow(
      game.cityGrowth,
      game.playerWorlds,
      game.workedTiles,
      game.specialists,
      game.availableSpecialists,
      game.engine
    ),
    ...cityGrowthCost(game.difficulty, game.clients, {
      cityImprovementRegistry: game.cityImprovements,
      playerRegistry: game.players,
      playerResearchRegistry: game.playerResearch,
      ruleRegistry: game.rules,
      turn: game.turn,
      wonderRegistry: game.wonders,
    }),
    ...cityProcessYield(
      game.cityBuilds,
      game.cityGrowth,
      game.units,
      game.rules,
      game.playerTreasuries,
      game.playerGovernments
    ),
    ...cityBuild(game.clients, game.difficulty, game.rules),
    ...citySpecialistAvailable(game.cityGrowth),
    ...cityRenamed(game.cityNames),
    ...cityShrink(game.workedTiles, game.specialists, game.engine),
    ...cityTileYield(
      game.tileImprovements,
      game.playerGovernments,
      game.playerResearch,
      game.pendingEffects
    ),
    ...cityTiles(),
    ...cityTradeRoutes({
      capitalLink,
      pendingEffectRegistry: game.pendingEffects,
      ruleRegistry: game.rules,
      tradeRouteRegistry: game.tradeRoutes,
    }),
    ...cityTileReassigned(
      game.playerWorlds,
      game.cityGrowth,
      game.workedTiles,
      game.specialists,
      game.availableSpecialists
    ),
    ...cityTileReleased(game.engine),
    ...cityTileWorked(game.engine),
    ...cityYield(
      game.cityImprovements,
      game.playerGovernments,
      game.specialists,
      game.difficulty,
      game.clients
    ),
    ...playerAction(game.cityBuilds, game.cities, game.specialists),
    ...playerTurnStart(game.cities, game.units, game.workedTiles, game.rules),
    ...unitDefeated(game.engine),
    ...unitTradeRouteEstablished({
      capitalLink,
      cityRegistry: game.cities,
      engine: game.engine,
      interactionRegistry: game.interactions,
      pendingEffectRegistry: game.pendingEffects,
      playerResearchRegistry: game.playerResearch,
      playerTreasuryRegistry: game.playerTreasuries,
      randomNumberGenerator: game.rng,
      ruleRegistry: game.rules,
      tradeRouteRegistry: game.tradeRoutes,
      turn: game.turn,
    }),
    ...unitMoved(game.rules, game.workedTiles),
    ...unitUnsupported()
  );

  // For players to compare governments by: asked by nothing here.
  game.rules.register(...governmentTerms());
};

// The plugin loader imports each package for this side effect. Until it passes a `Game` of its own, dropping it would
//  produce a game with silently absent rules: no error, just wrong behaviour.
register(defaultGame);

export default register;
