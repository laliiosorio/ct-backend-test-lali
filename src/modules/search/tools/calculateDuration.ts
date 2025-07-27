import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

/**
 * calculateDuration — computes the trip duration using Day.js
 * @param date      travel date in "DD/MM/YYYY"
 * @param departureTime departureTime time in "HH:mm"
 * @param arrivalTime   arrivalTime time in "HH:mm"
 * @returns an object with { hours, minutes }
 */
export function calculateDuration(
  date: string,
  departureTime: string,
  arrival: string,
): { hours: number; minutes: number } {
  const format = 'DD/MM/YYYY HH:mm';
  // Parse departureTime and arrival on the same base date
  const departureDateTime = dayjs(`${date} ${departureTime}`, format);
  let arrivalDateTime = dayjs(`${date} ${arrival}`, format);

  // If arrival is before departureTime, assume next day
  if (arrivalDateTime.isBefore(departureDateTime)) {
    arrivalDateTime = arrivalDateTime.add(1, 'day');
  }

  // Compute total diff in minutes
  const diffMinutes = arrivalDateTime.diff(departureDateTime, 'minute');

  // Convert to hours and minutes
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  return { hours, minutes };
}
