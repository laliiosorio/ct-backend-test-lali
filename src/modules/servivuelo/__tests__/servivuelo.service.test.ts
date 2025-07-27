import axios from 'axios';
import {
  TimetableResponse,
  AccommodationResponse,
  PriceEntry,
  PaxTypeEnum,
  BonusTypeEnum,
} from '../servivuelo.types';
import {
  getTimetables,
  getAccommodations,
  getPrices,
} from '@/modules/servivuelo/servivuelo.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('servivuelo.service', () => {
  const base = process.env.SERVIVUELO_URL;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTimetables()', () => {
    it('should call the correct endpoint and return timeTables', async () => {
      const fakeData: TimetableResponse = {
        timeTables: [{ shipId: '1', departureDate: '09:00', arrivalDate: '12:00' }],
      };
      mockedAxios.post.mockResolvedValueOnce({ data: fakeData });

      const result = await getTimetables('FROM', 'TO', '01/01/2022', 2, 1);

      expect(mockedAxios.post).toHaveBeenCalledWith(`${base}/timetables?adults=2&childrens=1`, {
        from: 'FROM',
        to: 'TO',
        date: '01/01/2022',
      });
      expect(result).toEqual(fakeData.timeTables);
    });
  });

  describe('getAccommodations()', () => {
    it('should call the correct endpoint and return accommodations array', async () => {
      const fakeAccommodations: AccommodationResponse = {
        accommodations: [
          { type: 'Estandar', available: '84' },
          { type: 'Premium', available: '12' },
        ],
      };
      mockedAxios.post.mockResolvedValueOnce({ data: fakeAccommodations });

      const result = await getAccommodations('123', '09:00');

      expect(mockedAxios.post).toHaveBeenCalledWith(`${base}/accommodations`, {
        shipID: '123',
        departureDate: '09:00',
      });
      expect(result).toEqual(fakeAccommodations.accommodations);
    });
  });

  describe('getPrices()', () => {
    it('should call prices endpoint without bonus when bonus array is empty', async () => {
      const fakePrices: PriceEntry[] = [
        { accommodation: 'Estandar', pax: PaxTypeEnum.Adult, price: 50 },
      ];
      mockedAxios.post.mockResolvedValueOnce({ data: fakePrices });

      const result = await getPrices('123', '09:00', 'Estandar', PaxTypeEnum.Adult, []);

      expect(mockedAxios.post).toHaveBeenCalledWith(`${base}/prices?pax=adult`, {
        shipID: '123',
        departureDate: '09:00',
        accommodation: 'Estandar',
      });
      expect(result).toEqual(fakePrices);
    });

    it('should include bonus query param when bonus array has an entry', async () => {
      const fakePrices: PriceEntry[] = [
        { accommodation: 'Estandar', pax: PaxTypeEnum.Adult, price: 35 },
      ];
      mockedAxios.post.mockResolvedValueOnce({ data: fakePrices });

      const bonus = [BonusTypeEnum.Retired];
      const result = await getPrices('123', '09:00', 'Estandar', PaxTypeEnum.Adult, bonus);

      const expectedUrl =
        `${base}/prices?pax=adult&bonus=` + encodeURIComponent(JSON.stringify(bonus));

      expect(mockedAxios.post).toHaveBeenCalledWith(expectedUrl, {
        shipID: '123',
        departureDate: '09:00',
        accommodation: 'Estandar',
      });
      expect(result).toEqual(fakePrices);
    });
  });
});
