import {
  Accommodation,
  AccommodationResponse,
  BonusTypeEnum,
  PaxTypeEnum,
  Timetable,
  TimetableResponse,
} from '@/modules/servivuelo/servivuelo.types';
import axios from 'axios';

const BASE_URL = process.env.SERVIVUELO_URL;

/**
 * Retrieves available timetables from Servivuelo.
 * Uses query parameters for passenger counts and JSON body for route and date.
 * @param from Departure station code
 * @param to Arrival station code
 * @param date Journey date
 * @param adults Number of adult passengers
 * @param children Number of child passengers
 * @returns Array of Timetable objects
 */
export async function getTimetables(
  from: string,
  to: string,
  date: string,
  adults: number,
  children: number,
): Promise<Timetable[]> {
  const url = `${BASE_URL}/timetables?adults=${adults}&childrens=${children}`;
  const body = { from, to, date };
  const response = await axios.post<TimetableResponse>(url, body);

  return response.data.timeTables;
}

/**
 * Retrieves accommodation options for a given ship and departure date from Servivuelo.
 * @param shipID Ship identifier
 * @param departureDate Departure date and time
 * @returns Array of Accommodation objects
 */
export async function getAccommodations(
  shipID: string,
  departureDate: string,
): Promise<Accommodation[]> {
  const url = `${BASE_URL}/accommodations`;
  const body = { shipID, departureDate };
  const response = await axios.post<AccommodationResponse>(url, body);

  return response.data.accommodations;
}

/**
 * Retrieves price for a specific accommodation and passenger type from Servivuelo.
 * Includes bonus for adult passengers if provided.
 * @param shipID Ship identifier
 * @param departureDate Departure date and time
 * @param accommodation Accommodation type
 * @param pax Passenger type (adult or child)
 * @param bonus Optional array of bonus types
 * @returns Price as a string
 */
export async function getPrices(
  shipID: string,
  departureDate: string,
  accommodation: string,
  pax: PaxTypeEnum,
  bonus: BonusTypeEnum[] = [],
): Promise<string> {
  const params = new URLSearchParams();
  params.append('pax', pax);

  if (pax === PaxTypeEnum.Adult && bonus.length > 0) {
    params.append('bonus', JSON.stringify(bonus));
  }

  const url = `${BASE_URL}/prices?${params.toString()}`;
  const body = { shipID, departureDate, accommodation };
  const response = await axios.post<string>(url, body);
  return response.data;
}
