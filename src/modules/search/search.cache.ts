import redis from '@/shared/redis';
import {
  Timetable,
  Accommodation,
  PaxTypeEnum,
  BonusTypeEnum,
} from '@/modules/servivuelo/servivuelo.types';
import {
  getTimetablesOrFail,
  getAccommodationsOrFail,
  getPriceOrFail,
} from '@/modules/search/search.service';

/**
 * Retrieves timetables from cache if available, otherwise fetches from provider.
 * Uses a strict OrFail wrapper to preserve error context.
 *
 * @param from - Departure station code
 * @param to - Arrival station code
 * @param date - Travel date (YYYY-MM-DD)
 * @param adults - Number of adult passengers
 * @param children - Number of child passengers
 * @param ttlSeconds - Cache TTL in seconds (default: 60)
 * @returns Array of Timetable objects
 */
export async function getTimetablesCached(
  from: string,
  to: string,
  date: string,
  adults: number,
  children: number,
  ttlSeconds = 60,
): Promise<Timetable[]> {
  const key = `timetables:${from}:${to}:${date}:${adults}:${children}`;
  const cached = await redis.get(key);

  if (cached) {
    console.log(`Cache finded: ${key}`);
    return JSON.parse(cached) as Timetable[];
  }

  console.log(`Cache miss: ${key}`);
  const data = await getTimetablesOrFail(from, to, date, adults, children);

  await redis.setex(key, ttlSeconds, JSON.stringify(data));
  return data;
}

/**
 * Retrieves accommodations from cache if available, otherwise fetches from provider.
 * Uses a strict OrFail wrapper to preserve error context.
 *
 * @param shipId - Unique identifier for the ship
 * @param departureDate - Departure date (YYYY-MM-DD)
 * @param ttlSeconds - Cache TTL in seconds (default: 300)
 * @returns Array of Accommodation objects
 */
export async function getAccommodationsCached(
  shipId: string,
  departureDate: string,
  ttlSeconds = 300,
): Promise<Accommodation[]> {
  const key = `accommodations:${shipId}:${departureDate}`;
  const cached = await redis.get(key);

  if (cached) {
    console.log(`Cache finded: ${key}`);
    return JSON.parse(cached) as Accommodation[];
  }

  console.log(`Cache miss: ${key}`);
  const data = await getAccommodationsOrFail(String(shipId), departureDate);

  await redis.setex(key, ttlSeconds, JSON.stringify(data));
  return data;
}

/**
 * Retrieves prices from cache if available, otherwise fetches from provider.
 * Bonus array is encoded in the cache key for uniqueness.
 * Uses a strict OrFail wrapper to preserve error context.
 *
 * @param shipId - Unique identifier for the ship
 * @param departureDate - Departure date (YYYY-MM-DD)
 * @param accommodation - Accommodation type
 * @param pax - Passenger type (enum)
 * @param bonus - Array of bonus types (optional)
 * @param ttlSeconds - Cache TTL in seconds (default: 120)
 * @returns Price as a string
 */
export async function getPricesCached(
  shipId: string,
  departureDate: string,
  accommodation: string,
  pax: PaxTypeEnum,
  bonus: BonusTypeEnum[] = [],
  ttlSeconds = 120,
): Promise<string> {
  // Build the Redis key, including bonus if present
  const bonusPart = bonus.length ? `:${encodeURIComponent(JSON.stringify(bonus))}` : '';
  const key = `prices:${shipId}:${departureDate}:${accommodation}:${pax}${bonusPart}`;

  // Try reading from cache
  const cached = await redis.get(key);
  if (cached !== null) {
    console.log(`Cache finded: ${key}`);
    return JSON.parse(cached) as string;
  }

  // Cache miss: fetch via the OrFail wrapper
  console.log(`Cache miss: ${key}`);
  const data = await getPriceOrFail(shipId, departureDate, accommodation, pax, bonus);

  // Store in Redis and return
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
  return data;
}
