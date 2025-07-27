import { SearchJourney } from '@/modules/search/search.schema';
import { Timetable } from '@/modules/servivuelo/servivuelo.types';

export enum TripType {
  Oneway = 'oneway',
  Roundtrip = 'roundtrip',
  Multidestination = 'multidestination',
}

export enum Provider {
  Servivuelo = 'SERVIVUELO',
  Renfe = 'RENFE',
}

export interface TimetableItem {
  journey: SearchJourney;
  departureCode: string;
  arrivalCode: string;
  timetable: Timetable;
  internalDepartureCode: string | null;
  internalArrivalCode: string | null;
}

export interface AccommodationItem {
  shipId: string;
  departureDate: string;
  accommodationType: string;
}

export interface PriceItem {
  journey: SearchJourney;
  shipId: string;
  departureDate: string;
  accommodationType: string;
  timetable: Timetable;
  internalDepartureCode: string | null;
  internalArrivalCode: string | null;
  adultPrice: number;
  childPrice: number;
}

export interface SearchCombination {
  from: string;
  to: string;
  date: string;
  shipId: string;
  departureTime: string;
  arrivalTime: string;
  options: {
    accommodationType: string;
    price: {
      adult: number;
      children: number;
      total: number;
    };
  }[];
}
