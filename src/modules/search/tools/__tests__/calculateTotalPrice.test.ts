import { calculateTotalPrice } from '../calculateTotalPrice';

describe('calculateTotalPrice()', () => {
  it('calculates correctly with only adults', () => {
    const total = calculateTotalPrice(10, 5, 2, 0);
    expect(total).toBe(20);
  });

  it('includes children in the total', () => {
    const total = calculateTotalPrice(
      /* adultPrice */ 8,
      /* childPrice */ 3,
      /* adultsCount */ 2,
      /* childrenCount */ 3,
    );
    // 8*2 + 3*3 = 16 + 9 = 25
    expect(total).toBe(25);
  });

  it('returns zero when no passengers', () => {
    const total = calculateTotalPrice(10, 5, 0, 0);
    expect(total).toBe(0);
  });
});
