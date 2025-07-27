import { calculateDuration } from '../calculateDuration';

describe('calculateDuration()', () => {
  it('computes duration when arrival is later same day', () => {
    const result = calculateDuration('01/01/2022', '09:00', '12:30');
    expect(result).toEqual({ hours: 3, minutes: 30 });
  });

  it('computes overnight duration when arrival is past midnight', () => {
    const result = calculateDuration('01/01/2022', '23:30', '01:15');
    expect(result).toEqual({ hours: 1, minutes: 45 });
  });

  it('returns zero duration for identical times', () => {
    const result = calculateDuration('01/01/2022', '10:00', '10:00');
    expect(result).toEqual({ hours: 0, minutes: 0 });
  });
});
