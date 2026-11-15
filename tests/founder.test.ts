import { FOUNDER, founderOf, recordCapture } from '../lib/founder';
import { captureRules, withCaptureDefaults } from '../lib/captureAftermath';
import City from '@civ-clone/core-city/City';
import LandMassRegistry from '@civ-clone/core-world/LandMassRegistry';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import Player from '@civ-clone/core-player/Player';
import PlayerRegistry from '@civ-clone/core-player/PlayerRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import { expect } from 'chai';
import destroyed from '../Rules/City/destroyed';
import mapWorld from './lib/mapWorld';

// OpenCiv2 `src/auto/city.cpp` `city_capture_aftermath` (~5407 `was_founder`, ~5538 `founder = civ2`) and
//  `city_process_turn` (~4450), richardpenman/civ2@49f26ec.
describe("Civ2's founder of a city", (): void => {
  const setUp = async () => {
    const ruleRegistry = new RuleRegistry(),
      pendingEffectRegistry = new PendingEffectRegistry(),
      playerRegistry = new PlayerRegistry(),
      turnValue = { value: 10 },
      turn = { value: () => turnValue.value } as any,
      [a, b, c] = [1, 2, 3].map(() => new Player(ruleRegistry)),
      world = await mapWorld(
        ['...', '...', '...'],
        ruleRegistry,
        new LandMassRegistry()
      ),
      city = new City(a, world.get(1, 1), 'city', ruleRegistry),
      dependencies = { pendingEffectRegistry, playerRegistry, turn },
      rules = captureRules(
        {} as any,
        {} as any,
        { emit: () => {} } as any,
        withCaptureDefaults({ ...dependencies, ruleRegistry })
      ),
      [partisans] = rules.filter(
        (rule) => rule.id() === 'civ2-city:city/captured/partisans'
      ),
      [founder] = rules.filter(
        (rule) => rule.id() === 'civ2-city:city/captured/founder'
      ),
      // As `City#capture` would: the owner changes, then the rules run.
      capture = (captor: Player): boolean => {
        const loser = city.player();

        (city as any)._player = captor;

        const raises = partisans.validate(city, captor, loser, null);

        founder.process(city, captor, loser, null);

        return raises;
      };

    playerRegistry.register(a, b, c);

    return {
      a,
      b,
      c,
      city,
      capture,
      dependencies,
      pendingEffectRegistry,
      turnValue,
    };
  };

  it('is the loser of the last capture, so retaking a city taken from you raises no Partisans', async (): Promise<void> => {
    const { a, b, c, city, capture, dependencies } = await setUp();

    expect(founderOf(city, a, dependencies) === a).true;
    // B takes A's city: B isn't its founder.
    expect(capture(b)).true;
    expect(founderOf(city, b, dependencies) === a).true;
    // C takes it from B: B is now the founder.
    expect(capture(c)).true;
    expect(founderOf(city, c, dependencies) === b).true;
    // B retakes it: a liberation in Civ2, though A founded it.
    expect(capture(b)).false;
    expect(city.originalPlayer() === a).true;
  });

  it('is the owner from 63 turns after a capture', async (): Promise<void> => {
    const { a, b, city, dependencies, turnValue } = await setUp();

    recordCapture(city, a, dependencies);
    turnValue.value += 62;

    expect(founderOf(city, b, dependencies) === a).true;

    turnValue.value += 1;

    expect(founderOf(city, b, dependencies) === b).true;
  });

  it('is kept as one pending effect on the city, with string data, so it saves', async (): Promise<void> => {
    const { a, b, city, dependencies, pendingEffectRegistry } = await setUp();

    recordCapture(city, a, dependencies);
    recordCapture(city, b, dependencies);

    const effects = pendingEffectRegistry
      .getByTarget(city)
      .filter((effect) => effect.handler() === FOUNDER);

    expect(effects.length).equal(1);
    expect(effects[0].data()).eql({ loser: b.id(), turn: '10' });
  });

  it('is forgotten when the city is destroyed', async (): Promise<void> => {
    const { a, city, dependencies, pendingEffectRegistry } = await setUp();

    recordCapture(city, a, dependencies);
    destroyed(
      undefined,
      undefined,
      undefined,
      undefined,
      { getByCity: () => [] } as any,
      undefined,
      pendingEffectRegistry
    )
      .filter((rule) => rule.id() === 'civ2-city:city/destroyed/forget-founder')
      .forEach((rule) => rule.process(city, null));

    expect(pendingEffectRegistry.getByTarget(city).length).equal(0);
  });
});
