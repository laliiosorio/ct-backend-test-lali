/**
 * calculateTotalPrice
 * @param adultPrice   price per adult
 * @param childPrice   price per child
 * @param adultsCount  number of adults
 * @param childrenCount number of children
 * @returns total price for the booking
 */
export function calculateTotalPrice(
  adultPrice: number,
  childPrice: number,
  adultsCount: number,
  childrenCount: number,
): number {
  return adultPrice * adultsCount + childPrice * childrenCount;
}
