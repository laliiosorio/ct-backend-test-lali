import { getTimetablesOrFail, getAccommodationsOrFail, getPriceOrFail } from '../search.service';
import * as servivuelo from '@/modules/servivuelo/servivuelo.service';
import { PaxTypeEnum, BonusTypeEnum } from '@/modules/servivuelo/servivuelo.types';

jest.mock('@/modules/servivuelo/servivuelo.service');
const mockTimetables = servivuelo.getTimetables as jest.MockedFunction<
  typeof servivuelo.getTimetables
>;
const mockAccommodations = servivuelo.getAccommodations as jest.MockedFunction<
  typeof servivuelo.getAccommodations
>;
const mockPrices = servivuelo.getPrices as jest.MockedFunction<typeof servivuelo.getPrices>;

describe('search.service wrappers', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getTimetablesOrFail', () => {
    it('returns timetables when provider succeeds', async () => {
      const fake = [{ shipId: 'S1', departureDate: '09:00', arrivalDate: '11:00' }];
      mockTimetables.mockResolvedValueOnce(fake);
      const result = await getTimetablesOrFail('A', 'B', '01/01/2022', 1, 0);
      expect(result).toBe(fake);
      expect(mockTimetables).toHaveBeenCalledWith('A', 'B', '01/01/2022', 1, 0);
    });

    it('throws a contextual error when provider fails', async () => {
      mockTimetables.mockRejectedValueOnce(new Error('timeout'));
      await expect(getTimetablesOrFail('X', 'Y', '02/02/2022', 2, 1)).rejects.toThrow(
        /Servivuelo Timetables API error: Unable to fetch timetables for X to Y on 02\/02\/2022\. Details: timeout/,
      );
    });
  });

  describe('getAccommodationsOrFail', () => {
    it('returns accommodations when provider succeeds', async () => {
      const fake = [{ type: 'Std', available: 'yes' }];
      mockAccommodations.mockResolvedValueOnce(fake);
      const result = await getAccommodationsOrFail('123', '09:00');
      expect(result).toBe(fake);
      expect(mockAccommodations).toHaveBeenCalledWith('123', '09:00');
    });

    it('throws a contextual error when provider fails', async () => {
      mockAccommodations.mockRejectedValueOnce(new Error('service down'));
      await expect(getAccommodationsOrFail('S', '10:00')).rejects.toThrow(
        /Servivuelo Accommodations API error: Unable to fetch accommodations for ship S on 10:00\. Details: service down/,
      );
    });
  });

  describe('getPriceOrFail', () => {
    it('returns the raw price string when provider succeeds (no bonus)', async () => {
      const fakePrice = '42';
      mockPrices.mockResolvedValueOnce(fakePrice);
      const result = await getPriceOrFail('123', '09:00', 'Std', PaxTypeEnum.Adult, []);
      expect(result).toBe(fakePrice);
      expect(mockPrices).toHaveBeenCalledWith('123', '09:00', 'Std', PaxTypeEnum.Adult, []);
    });

    it('includes bonus query param when bonus array has an entry and throws on failure', async () => {
      mockPrices.mockRejectedValueOnce(new Error('err'));
      await expect(
        getPriceOrFail('321', '08:00', 'Prem', PaxTypeEnum.Adult, [BonusTypeEnum.Retired]),
      ).rejects.toThrow(
        /Servivuelo Prices API error: Unable to fetch prices for ship 321 on 08:00\. Details: err/,
      );
    });
  });
});
