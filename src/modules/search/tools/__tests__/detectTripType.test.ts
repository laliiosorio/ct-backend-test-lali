import { detectTripType } from '../detectTripType';
import type { SearchParameters } from '@/modules/search/search.schema';

const makeJourney = (from: string, to: string, date: string) => ({ from, to, date });

describe('detectTripType()', () => {
  it('returns "oneway" when there is only one journey', () => {
    const journeys: SearchParameters['journeys'] = [makeJourney('A', 'B', '01/01/2022')];
    expect(detectTripType(journeys)).toBe('oneway');
  });

  it('returns "roundtrip" for two legs that return to origin', () => {
    const journeys: SearchParameters['journeys'] = [
      makeJourney('A', 'B', '01/01/2022'),
      makeJourney('B', 'A', '02/01/2022'),
    ];
    expect(detectTripType(journeys)).toBe('roundtrip');
  });

  it('returns "multidestination" otherwise', () => {
    const journeys: SearchParameters['journeys'] = [
      makeJourney('A', 'B', '01/01/2022'),
      makeJourney('B', 'C', '02/01/2022'),
    ];
    expect(detectTripType(journeys)).toBe('multidestination');
  });
});
