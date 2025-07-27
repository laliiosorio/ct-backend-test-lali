export interface TimetableResponse {
  timeTables: Timetable[];
}

export interface Timetable {
  shipId: string;
  departureDate: string;
  arrivalDate: string;
}

export interface AccommodationResponse {
  accommodations: Accommodation[];
}

export interface Accommodation {
  type: string;
  available: string;
}

export enum PaxTypeEnum {
  Adult = 'adult',
  Children = 'children',
  Infant = 'infant',
}

export interface PriceEntry {
  accommodation: string;
  pax: PaxTypeEnum;
  price: number;
}

export enum BonusTypeEnum {
  Retired = 'retired',
  Resident = 'resident',
  LargeFamily = 'largefamily',
}
