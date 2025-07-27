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
 * Cache wrapper for timetables, preserving OrFail errors.
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
  // Usamos la versión OrFail para mantener el try/catch contextual
  const data = await getTimetablesOrFail(from, to, date, adults, children);
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
  return data;
}

/**
 * Cache wrapper for accommodations, preserving OrFail errors.
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

export async function getPricesCached(
  shipId: string,
  departureDate: string,
  accommodation: string,
  pax: PaxTypeEnum,
  bonus: BonusTypeEnum[] = [],
  ttlSeconds = 120,
): Promise<string> {
  // 1) Build the Redis key, including bonus if present
  const bonusPart = bonus.length ? `:${encodeURIComponent(JSON.stringify(bonus))}` : '';
  const key = `prices:${shipId}:${departureDate}:${accommodation}:${pax}${bonusPart}`;

  // 2) Try reading from cache
  const cached = await redis.get(key);
  if (cached !== null) {
    console.log(`Cache finded: ${key}`);
    // JSON.parse of a JSON-stringified string gives back the original string
    return JSON.parse(cached) as string;
  }

  // 3) Cache miss: fetch via the OrFail wrapper
  console.log(`Cache miss: ${key}`);
  const data = await getPriceOrFail(shipId, departureDate, accommodation, pax, bonus);

  // 4) Store in Redis and return
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
  return data;
}
