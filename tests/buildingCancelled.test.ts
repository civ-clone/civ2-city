import BuildingCancelled from '@civ-clone/core-city-build/Rules/BulidingCancelled';
import Engine from '@civ-clone/core-engine/Engine';
import { Game } from '@civ-clone/core-game/Game';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import buildingCancelled from '../Rules/City/building-cancelled';
import { expect } from 'chai';
import register from '../registerRules';

class Warriors extends Unit {}

// The event a client shows a dropped build by, whenever it is dropped (civ-clone/web-renderer#978).
describe('city:building-cancelled', (): void => {
  it('emits the build, the item and the reason the rules are given', (): void => {
    const ruleRegistry = new RuleRegistry(),
      engine = new Engine(),
      cityBuild = {} as any,
      events: unknown[][] = [];

    ruleRegistry.register(...buildingCancelled(engine));

    engine.on('city:building-cancelled', (...args: unknown[]): void => {
      events.push(args);
    });

    // As `CityBuild#cancel` processes them.
    ruleRegistry.process(
      BuildingCancelled,
      cityBuild,
      Warriors as any,
      'unavailable'
    );

    expect(events).eql([[cityBuild, Warriors, 'unavailable']]);
  });

  it('is `civ2-city:city/building-cancelled/emit`', (): void => {
    expect(buildingCancelled(new Engine()).map((rule) => rule.id())).eql([
      'civ2-city:city/building-cancelled/emit',
    ]);
  });

  it('is registered with the rest of the package, before Auto chooses again', (): void => {
    const game = new Game();

    register(game);

    expect(
      game.rules
        .get(BuildingCancelled)
        .map((rule: BuildingCancelled) => rule.id())
    ).eql([
      'civ2-city:city/building-cancelled/emit',
      'civ2-city:city/building-cancelled/auto',
    ]);
  });
});
