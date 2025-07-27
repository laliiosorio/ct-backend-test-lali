jest.mock('@/modules/search/search.service');

import { handleSearch } from '@/modules/search/search.domain';
import * as svc from '@/modules/search/search.service';
import { SearchParameters } from '@/modules/search/search.schema';
import { CTSearch } from '@/types';

const {
  findFromStationsByCode,
  findToStationsByCode,
  getProviderCode,
  getInternalStationCode,
  getTimetablesOrFail,
  getAccommodationsOrFail,
  getPriceOrFail,
  saveSearchResult,
} = svc as jest.Mocked<typeof svc>;

describe('search.domain handleSearch', () => {
  const params: SearchParameters = {
    journeys: [{ from: 'X', to: 'Y', date: '01/01/2022' }],
    passenger: { adults: 1, children: 0, total: 1 },
    bonus: [],
  };

  beforeEach(() => {
    jest.resetAllMocks();

    // Step 1: resolve station codes
    findFromStationsByCode.mockResolvedValue(['X1']);
    findToStationsByCode.mockResolvedValue(['Y1']);

    // Step 2: map to provider codes
    getProviderCode.mockResolvedValueOnce('PX1').mockResolvedValueOnce('PY1');

    // Step 3: fetch timetables
    getTimetablesOrFail.mockResolvedValue([
      { shipId: 'S1', departureDate: '09:00', arrivalDate: '11:00' },
    ]);

    // Step 4: map back to internal codes
    getInternalStationCode.mockResolvedValueOnce('X1').mockResolvedValueOnce('Y1');

    // Step 5: fetch accommodations
    getAccommodationsOrFail.mockResolvedValue([{ type: 'Std', available: 'yes' }]);

    // Step 6: fetch prices (mock returns a string, as per wrapper signature)
    getPriceOrFail.mockResolvedValue('100');

    // Step 7: save result
    saveSearchResult.mockResolvedValue();
  });

  it('builds and returns a CTSearch[] with one element', async () => {
    const results = await handleSearch(params);
    expect(results).toHaveLength(1);

    const res = results[0] as CTSearch;

    // parameters should match input
    expect(res.parameters).toEqual(params);

    // trip type
    expect(res.train.type).toBe('oneway');

    // one journey leg
    expect(res.train.journeys).toHaveLength(1);
    const leg = res.train.journeys[0];
    expect(leg.departure).toEqual({
      date: '01/01/2022',
      time: '09:00',
      station: 'X1',
    });
    expect(leg.arrival).toEqual({
      date: '01/01/2022',
      time: '11:00',
      station: 'Y1',
    });
    expect(leg.duration).toEqual({ hours: 2, minutes: 0 });

    // one option
    expect(res.train.options).toHaveLength(1);
    const opt = res.train.options[0];
    expect(opt.accommodation).toEqual({
      type: 'Std',
      passengers: { adults: '1', children: '0' },
    });
    expect(opt.price.breakdown).toEqual({ adult: 100, children: 0 });
    expect(opt.price.total).toBe(100);

    // ensure we saved the result
    expect(saveSearchResult).toHaveBeenCalledWith(res);
  });
});
