import { INCIDENT, hasFlag } from '@civ-clone/civ2-diplomacy/lib/flags';
import incitedRules, { inciterBecomesFounder } from '../Rules/City/incited';
import Captured from '@civ-clone/core-city/Rules/Captured';
import City from '@civ-clone/core-city/City';
import InciteRevolt from '@civ-clone/base-unit-action-incite-revolt/InciteRevolt';
import InteractionRegistry from '@civ-clone/core-diplomacy/InteractionRegistry';
import PendingEffectRegistry from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import Player from '@civ-clone/core-player/Player';
import PlayerRegistry from '@civ-clone/core-player/PlayerRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import SubvertCity from '@civ-clone/base-unit-action-incite-revolt/SubvertCity';
import Turn from '@civ-clone/core-turn-based-game/Turn';
import Vendetta from '@civ-clone/library-diplomacy/Declarations/Vendetta';
import { expect } from 'chai';
import { founderOf } from '../lib/founder';
import { instanceOf, playedBy } from './lib/stubs';

// OpenCiv2 `src/auto/unit_spy.cpp:835-846` and `src/auto/city.cpp:5378-5413`, richardpenman/civ2@e39fe7b.

describe('incite as a capture', (): void => {
  const setUp = (humans: ('inciter' | 'victim')[] = []) => {
    const ruleRegistry = new RuleRegistry(),
      interactionRegistry = new InteractionRegistry(),
      playerRegistry = new PlayerRegistry(),
      turn = new Turn(),
      inciter = new Player(ruleRegistry),
      victim = new Player(ruleRegistry),
      emitted: unknown[][] = [];

    playerRegistry.register(inciter, victim);

    ruleRegistry.register(
      ...incitedRules({
        diplomacy: {
          clientRegistry: playedBy(
            ...humans.map((side) => (side === 'inciter' ? inciter : victim))
          ),
          interactionRegistry,
          playerRegistry,
          ruleRegistry,
          turn,
        } as any,
        engine: { emit: (...args: unknown[]) => emitted.push(args) } as any,
        randomNumberGenerator: () => 0,
      })
    );

    return {
      capture: (cause: unknown, captor = inciter, loser = victim) =>
        ruleRegistry.process(
          Captured,
          instanceOf(City),
          captor,
          loser,
          cause as any
        ),
      inciter,
      victim,
      interactionRegistry,
      playerRegistry,
      turn,
    };
  };

  it('at the doubled price, the victim holds a vendetta against the inciter, and no incident is raised', (): void => {
    const { capture, inciter, victim, interactionRegistry } = setUp();

    capture(instanceOf(SubvertCity));

    const vendettas = interactionRegistry
      .entries()
      .filter((interaction) => interaction instanceof Vendetta);

    expect(vendettas.length).equal(1);
    expect(vendettas[0].players()).eql([victim, inciter]);
  });

  it('at the plain price, holds no vendetta', (): void => {
    const { capture, interactionRegistry } = setUp();

    capture(instanceOf(InciteRevolt));

    expect(
      interactionRegistry
        .entries()
        .filter((interaction) => interaction instanceof Vendetta)
    ).eql([]);
  });

  it('sets INCIDENT both ways on any capture with a person on either side (city.cpp:5413), and only then', (): void => {
    const flagged = (
      humans: ('inciter' | 'victim')[],
      cause: unknown = null
    ): boolean[] => {
      const { capture, inciter, victim, interactionRegistry } = setUp(humans);

      capture(cause);

      return [
        hasFlag({ interactionRegistry }, inciter, victim, INCIDENT),
        hasFlag({ interactionRegistry }, victim, inciter, INCIDENT),
      ];
    };

    expect(flagged([])).eql([false, false]);
    expect(flagged(['inciter'])).eql([true, true]);
    expect(flagged(['victim'])).eql([true, true]);
    expect(flagged(['victim'], instanceOf(SubvertCity))).eql([true, true]);
  });
});

describe('inciterBecomesFounder', (): void => {
  it('makes the inciter the founder for the capture, until the capture records the loser', (): void => {
    const ruleRegistry = new RuleRegistry(),
      pendingEffectRegistry = new PendingEffectRegistry(),
      playerRegistry = new PlayerRegistry(),
      turn = new Turn(),
      founder = new Player(ruleRegistry),
      inciter = new Player(ruleRegistry),
      city = instanceOf(City, {
        originalPlayer: () => founder,
        player: () => founder,
      });

    playerRegistry.register(founder, inciter);

    const dependencies = { pendingEffectRegistry, playerRegistry, turn };

    expect(founderOf(city, founder, dependencies)).equal(founder);

    inciterBecomesFounder(city, inciter, dependencies);

    expect(founderOf(city, founder, dependencies)).equal(inciter);
  });
});
