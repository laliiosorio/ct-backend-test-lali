import { getDb } from '@/shared/mongo';
import { CTSearch } from '@/types';
import '@/shared/env';
import { Provider } from '@/modules/search/search.types';
import {
  getAccommodations,
  getPrices,
  getTimetables,
} from '@/modules/servivuelo/serivuelo.service';
import {
  Accommodation,
  BonusTypeEnum,
  PaxTypeEnum,
  Timetable,
} from '@/modules/servivuelo/servivuelo.types';

const TRAIN_DB = process.env.TRAIN_DB;

/**
 * Finds all departure station codes matching the given code.
 * @param code The departure city or station code
 * @returns An array of matching departure station codes
 */
export async function findFromStationsByCode(code: string): Promise<string[]> {
  const db = await getDb(TRAIN_DB);
  const docs = await db
    .collection('journey_destination_tree')
    .find({
      $or: [{ destinationTree: code }, { destinationCode: code }],
    })
    .toArray();

  const codes = new Set<string>();
  docs.forEach((doc: any) => {
    if (doc.destinationCode) codes.add(doc.destinationCode);
  });

  return [...codes];
}

/**
 * Finds all arrival station codes matching the given code.
 * @param code The arrival city or station code
 * @returns An array of matching arrival station codes
 */
export async function findToStationsByCode(code: string): Promise<string[]> {
  const db = await getDb(TRAIN_DB);
  const docs = await db
    .collection('journey_destination_tree')
    .find({
      $or: [{ arrivalTree: code }, { arrivalCode: code }],
    })
    .toArray();

  const codes = new Set<string>();
  docs.forEach((doc: any) => {
    if (doc.arrivalCode) codes.add(doc.arrivalCode);
  });

  return [...codes];
}

/**
 * Maps an internal station code to the corresponding provider station code.
 * @param provider The provider name (e.g. Provider.Servivuelo)
 * @param ourCode The internal station code
 * @returns The provider station code, or null if not found
 */
export async function getProviderCode(provider: Provider, ourCode: string): Promise<string | null> {
  const db = await getDb(TRAIN_DB);

  // Find document by our internal code
  const doc = await db
    .collection<{ code: string; suppliers: string[] }>('supplier_station_correlation')
    .findOne({ code: ourCode });

  if (!doc?.suppliers) return null;

  const match = doc.suppliers.find(s => s.startsWith(`${provider}#`));
  return match ? match.split('#')[1] : null;
}

/**
 * Maps a provider station code to the corresponding internal station code.
 * @param provider The provider name
 * @param providerCode The provider's station code
 * @returns The internal station code, or null if not found
 */
export async function getInternalStationCode(
  provider: Provider,
  providerCode: string,
): Promise<string | null> {
  const db = await getDb(TRAIN_DB);
  const fullKey = `${provider}#${providerCode}`;

  // Find by the `suppliers` field
  const doc = await db
    .collection<{ code: string; suppliers: string[] }>('supplier_station_correlation')
    .findOne({ suppliers: fullKey });

  return doc?.code ?? null;
}

/**
 * Saves the CTSearch result in MongoDB.
 * @param result The CTSearch result object
 * @returns A promise that resolves when the result is saved
 */
export async function saveSearchResult(result: CTSearch): Promise<void> {
  const db = await getDb(process.env.SEARCH_DB);
  await db.collection('train_results').insertOne(result);
}

// * Servivuelo API Wrappers: contextual error handling

/**
 * Retrieves timetables from Servivuelo for the given parameters.
 * Throws a contextual error if the provider call fails.
 * @param departureCode The provider's departure station code
 * @param arrivalCode The provider's arrival station code
 * @param date The journey date
 * @param adults Number of adult passengers
 * @param children Number of child passengers
 * @returns An array of Timetable objects
 */
export async function getTimetablesOrFail(
  departureCode: string,
  arrivalCode: string,
  date: string,
  adults: number,
  children: number,
): Promise<Timetable[]> {
  try {
    return await getTimetables(departureCode, arrivalCode, date, adults, children);
  } catch (err: any) {
    throw new Error(
      `Servivuelo Timetables API error: Unable to fetch timetables for ${departureCode} to ${arrivalCode} on ${date}. Details: ${err.message}`,
    );
  }
}

/**
 * Retrieves accommodations from Servivuelo for the given ship and departure date.
 * Throws a contextual error if the provider call fails.
 * @param shipId The ship identifier
 * @param departureDate The departure date
 * @returns An array of Accommodation objects
 */
export async function getAccommodationsOrFail(
  shipId: string,
  departureDate: string,
): Promise<Accommodation[]> {
  try {
    return await getAccommodations(shipId, departureDate);
  } catch (err: any) {
    throw new Error(
      `Servivuelo Accommodations API error: Unable to fetch accommodations for ship ${shipId} on ${departureDate}. Details: ${err.message}`,
    );
  }
}

/**
 * Retrieves the price from Servivuelo for the given parameters.
 * Throws a contextual error if the provider call fails.
 * @param shipId The ship identifier
 * @param departureDate The departure date
 * @param accommodation The accommodation type
 * @param pax The passenger type (adult or child)
 * @param bonus Optional array of bonus types
 * @returns The price as a string
 */
export async function getPriceOrFail(
  shipId: string,
  departureDate: string,
  accommodation: string,
  pax: PaxTypeEnum,
  bonus: BonusTypeEnum[] = [],
): Promise<string> {
  try {
    return await getPrices(shipId, departureDate, accommodation, pax, bonus);
  } catch (err: any) {
    throw new Error(
      `Servivuelo Prices API error: Unable to fetch prices for ship ${shipId} on ${departureDate}. Details: ${err.message}`,
    );
  }
}
