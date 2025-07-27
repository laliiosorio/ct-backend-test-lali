import { Journey, SearchParameters } from '@/modules/search/search.schema';
import {
  findFromStationsByCode,
  findToStationsByCode,
  getAccommodationsOrFail,
  getInternalStationCode,
  getPriceOrFail,
  getProviderCode,
  getTimetablesOrFail,
  saveSearchResult,
} from '@/modules/search/search.service';
import { PriceItem, Provider, TimetableItem } from '@/modules/search/search.types';
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
export async function handleSearch(params: SearchParameters): Promise<CTSearch> {
  const journeysFullData: TimetableItem[] = [];
  const optionsFullData: PriceItem[] = [];

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
          console.log(
            `Fetching timetables for ${departureCode} to ${arrivalCode} on ${journey.date}`,
          );

          const timeTables = await getTimetablesOrFail(
            departureCode,
            arrivalCode,
            journey.date,
            params.passenger.adults,
            params.passenger.children,
          );

          console.log('timeTables -------:', timeTables);

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

    journeysFullData.push(...timetableItems);

    console.log('Timetable items:', timetableItems.length);

    /**
     * Step 5: Fetch accommodations for each timetable item.
     */
    const accommodationItems = (
      await Promise.all(
        timetableItems.map(async timetableItem => {
          const { timetable } = timetableItem;
          const accommodations = await getAccommodationsOrFail(
            timetable.shipId,
            timetable.departureDate,
          );
          return accommodations.map(accommodation => ({
            shipId: timetable.shipId,
            departureDate: timetable.departureDate,
            accommodationType: accommodation.type,
          }));
        }),
      )
    ).flat();

    console.log('Accommodation items:', accommodationItems.length);

    /**
     * Step 6: Fetch prices for each timetable and accommodation combination.
     */
    const priceItems = await Promise.all(
      accommodationItems.map(async accommodationItem => {
        const { shipId, departureDate, accommodationType } = accommodationItem;
        // Fetch adult price
        const adultRawPrice = await getPriceOrFail(
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
          const childRawPrice = await getPriceOrFail(
            shipId,
            departureDate,
            accommodationType,
            PaxTypeEnum.Children,
          );
          childPrice = Number(childRawPrice) || 0;
        }

        return {
          journey,
          ...accommodationItem,
          adultPrice,
          childPrice,
        };
      }),
    );

    optionsFullData.push(...priceItems);
  }

  console.log('Total provider data items:', optionsFullData.length);

  /**
   * Step 7: Assemble and persist the final result.
   */
  const allData = {
    params,
    journeysFullData,
    optionsFullData,
  };
  const result = formatCTSearchResult(allData);

  console.log(
    result.train.journeys.length,
    'journeys found',
    result.train.options.length,
    'options found',
  );

  // Step 8: Save the result in MongoDB
  await saveSearchResult(result);

  return result;
}

/**
 * Formats the provider data into a CTSearch result.
 * @param providerData The raw provider data
 * @returns The formatted CTSearch result
 */
function formatCTSearchResult(providerData: {
  params: SearchParameters;
  journeysFullData: TimetableItem[];
  optionsFullData: PriceItem[];
}): CTSearch {
  const { params, journeysFullData, optionsFullData } = providerData;
  const { passenger } = params;
  const type = detectTripType(params.journeys);

  const journeys: CTSearch['train']['journeys'] = [];
  const options: CTSearch['train']['options'] = [];

  // Map each provider data entry to a CTSearch journey
  const journeyEntries = journeysFullData.map(item => {
    const { journey, timetable, internalDepartureCode, internalArrivalCode } = item;

    const duration = calculateDuration(
      journey.date,
      timetable.departureDate,
      timetable.arrivalDate,
    );

    return {
      departure: {
        date: journey.date,
        time: timetable.departureDate,
        station: internalDepartureCode,
      },
      arrival: {
        date: journey.date,
        time: timetable.arrivalDate,
        station: internalArrivalCode,
      },
      duration,
    };
  });
  journeys.push(...journeyEntries);

  // Map each provider data entry to a CTSearch option
  const optionEntries = optionsFullData.map(({ accommodationType, adultPrice, childPrice }) => ({
    accommodation: {
      type: accommodationType,
      passengers: {
        adults: passenger.adults?.toString(),
        children: passenger.children?.toString(),
      },
    },
    price: {
      total: calculateTotalPrice(adultPrice, childPrice, passenger.adults, passenger.children),
      breakdown: { adult: adultPrice, children: childPrice },
    },
  }));

  options.push(...optionEntries);

  const parameters: Parameters = {
    ...params,
    journeys: params.journeys as Journey[],
  };

  return {
    parameters,
    train: { type, journeys, options },
  };
}
