import {
  getAccommodationsCached,
  getPricesCached,
  getTimetablesCached,
} from '@/modules/search/search.cache';
import { Journey, SearchParameters } from '@/modules/search/search.schema';
import {
  findFromStationsByCode,
  findToStationsByCode,
  getInternalStationCode,
  getProviderCode,
  saveSearchResult,
} from '@/modules/search/search.service';
import { PriceItem, Provider, SearchCombination } from '@/modules/search/search.types';
import { calculateDuration } from '@/modules/search/tools/calculateDuration';
import { calculateTotalPrice } from '@/modules/search/tools/calculateTotalPrice';
import { detectTripType } from '@/modules/search/tools/detectTripType';
import { PaxTypeEnum } from '@/modules/servivuelo/servivuelo.types';
import { CTSearch, Parameters } from '@/types';

/**
 * Handles the search process for train journeys and options.
 * @param params The search parameters
 * @returns The formatted CTSearch result
 */
export async function handleSearch(params: SearchParameters): Promise<CTSearch[]> {
  const providerFullData: PriceItem[] = [];

  // Process each journey segment (from - to)
  for (const journey of params.journeys) {
    /**
     * Step 1: Resolve city/station codes for departure and arrival.
     */
    const departureStations = await findFromStationsByCode(journey.from);
    const arrivalStations = await findToStationsByCode(journey.to);

    // If no stations found, throw an error
    if (departureStations.length === 0 || arrivalStations.length === 0) {
      throw new Error(`No stations found for "${journey.from}" to "${journey.to}"`);
    }

    /**
     * Step 2: Map internal station codes to provider codes and filter out nulls.
     */
    const departureProviderCodes = (
      await Promise.all(
        departureStations.map(station => getProviderCode(Provider.Servivuelo, station)),
      )
    ).filter((code): code is string => !!code);

    const arrivalProviderCodes = (
      await Promise.all(
        arrivalStations.map(station => getProviderCode(Provider.Servivuelo, station)),
      )
    ).filter((code): code is string => !!code);

    /**
     * Step 3: Build all possible provider code pairs.
     */
    const stationPairs = departureProviderCodes.flatMap(departureCode =>
      arrivalProviderCodes.map(arrivalCode => ({
        departureCode,
        arrivalCode,
      })),
    );

    /**
     * Step 4: Fetch timetables for each provider code pair.
     */
    const timetableItems = (
      await Promise.all(
        stationPairs.map(async ({ departureCode, arrivalCode }) => {
          const timeTables = await getTimetablesCached(
            departureCode,
            arrivalCode,
            journey.date,
            params.passenger.adults,
            params.passenger.children,
          );

          const [internalDepartureCode, internalArrivalCode] = await Promise.all([
            getInternalStationCode(Provider.Servivuelo, departureCode),
            getInternalStationCode(Provider.Servivuelo, arrivalCode),
          ]);

          // Map each Timetable entry into a unified item
          return timeTables.map(timetable => ({
            journey,
            departureCode,
            arrivalCode,
            timetable,
            internalDepartureCode,
            internalArrivalCode,
          }));
        }),
      )
    ).flat();

    // journeys/FullData.push(...timetableItems);

    /**
     * Step 5: Fetch accommodations for each timetable item.
     */
    const accommodationItems = (
      await Promise.all(
        timetableItems.map(async timetableItem => {
          const { timetable } = timetableItem;
          const accommodations = await getAccommodationsCached(
            timetable.shipId,
            timetable.departureDate,
          );
          return accommodations.map(accommodation => ({
            ...timetableItem,
            shipId: timetable.shipId,
            departureDate: timetable.departureDate,
            accommodationType: accommodation.type,
          }));
        }),
      )
    ).flat();

    /**
     * Step 6: Fetch prices for each timetable and accommodation combination.
     */
    const priceItems = await Promise.all(
      accommodationItems.map(async accommodationItem => {
        const { shipId, departureDate, accommodationType } = accommodationItem;
        // Fetch adult price
        const adultRawPrice = await getPricesCached(
          shipId,
          departureDate,
          accommodationType,
          PaxTypeEnum.Adult,
          params.bonus,
        );
        const adultPrice = Number(adultRawPrice) || 0;

        // Fetch child price
        let childPrice = 0;
        if (params.passenger.children > 0) {
          const childRawPrice = await getPricesCached(
            shipId,
            departureDate,
            accommodationType,
            PaxTypeEnum.Children,
          );
          childPrice = Number(childRawPrice) || 0;
        }

        return {
          ...accommodationItem,
          adultPrice,
          childPrice,
        };
      }),
    );

    providerFullData.push(...priceItems);
  }

  /**
   * Step 7: Assemble and persist the final result.
   */
  const searchCombinations = getCombinations(providerFullData, params);

  /**
   * Step 8: Format the CTSearch result and save it to the database.
   */
  const savedResults: CTSearch[] = [];
  for (const combination of searchCombinations) {
    const result = formatCTSearchResult(combination, params);
    await saveSearchResult(result);
    savedResults.push(result);
  }

  return savedResults;
}

/**
 * Groups provider data into unique train combinations by shipId and timetable.
 * Each combination contains all available accommodation options for a specific train and schedule.
 * @param providerFullData The list of price items from providers
 * @param params The search parameters
 * @returns Array of grouped SearchCombination objects
 */
function getCombinations(
  providerFullData: PriceItem[],
  params: SearchParameters,
): SearchCombination[] {
  const searchCombinations = Object.values(
    providerFullData.reduce((combination, item) => {
      const key = `${item.shipId}-${item.timetable.departureDate}-${item.timetable.arrivalDate}`;
      if (!combination[key]) {
        combination[key] = {
          from: item.internalDepartureCode,
          to: item.internalArrivalCode,
          date: item.journey.date,
          shipId: item.shipId,
          departureTime: item.timetable.departureDate,
          arrivalTime: item.timetable.arrivalDate,
          options: [],
        };
      }
      combination[key].options.push({
        accommodationType: item.accommodationType,
        price: {
          adult: item.adultPrice,
          children: item.childPrice,
          total: calculateTotalPrice(
            item.adultPrice,
            item.childPrice,
            params.passenger.adults,
            params.passenger.children,
          ),
        },
      });
      return combination;
    }, {} as Record<string, SearchCombination>),
  );

  return searchCombinations;
}

/**
 * Formats the provider data into a CTSearch result.
 * @param providerData The raw provider data
 * @returns The formatted CTSearch result
 */
function formatCTSearchResult(combination: SearchCombination, params: SearchParameters): CTSearch {
  const { passenger } = params;
  const type = detectTripType(params.journeys);

  const journeys: CTSearch['train']['journeys'] = [
    {
      departure: {
        date: combination.date,
        time: combination.departureTime,
        station: combination.from,
      },
      arrival: {
        date: combination.date,
        time: combination.arrivalTime,
        station: combination.to,
      },
      duration: calculateDuration(
        combination.date,
        combination.departureTime,
        combination.arrivalTime,
      ),
    },
  ];

  const options: CTSearch['train']['options'] = combination.options.map(opt => ({
    accommodation: {
      type: opt.accommodationType,
      passengers: {
        adults: passenger.adults?.toString(),
        children: passenger.children?.toString(),
      },
    },
    price: {
      total: opt.price.total,
      breakdown: { adult: opt.price.adult, children: opt.price.children },
    },
  }));

  const parameters: Parameters = {
    ...params,
    journeys: params.journeys as Journey[],
  };

  return {
    parameters,
    train: { type, journeys, options },
  };
}
