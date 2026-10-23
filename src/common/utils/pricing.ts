/**
 * 💰 Calcul du prix (identique au mobile)
 */

export const PRICING = {
  MIN_PRICE: 1000,
  BASE_DISTANCE_KM: 1.5,
  BASE_PRICE: 1000,
  PRICE_PER_KM: 400,
  MIN_PRICE_DISTANCE_KM: 2,
} as const;

export function calculatePrice(distanceKm: number): number {
  if (distanceKm <= PRICING.MIN_PRICE_DISTANCE_KM) {
    return PRICING.MIN_PRICE;
  }

  const extraKm = distanceKm - PRICING.BASE_DISTANCE_KM;
  const price = PRICING.BASE_PRICE + extraKm * PRICING.PRICE_PER_KM;

  return Math.max(PRICING.MIN_PRICE, Math.round(price));
}