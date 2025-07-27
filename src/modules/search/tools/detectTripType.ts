import { SearchParameters } from '@/modules/search/search.schema';
import { TripType } from '@/modules/search/search.types';
import { CTSearch } from '@/types';

/**
 * Determine whether the search is:
 * - oneway (1 journey)
 * - roundtrip (2 journeys, return path swapped)
 * - multidestination (>2 journeys)
 */
export function detectTripType(journeys: SearchParameters['journeys']): CTSearch['train']['type'] {
  if (journeys.length === 1) return TripType.Oneway;
  if (
    journeys.length === 2 &&
    journeys[0].from === journeys[1].to &&
    journeys[0].to === journeys[1].from
  ) {
    return TripType.Roundtrip;
  }
  return TripType.Multidestination;
}
