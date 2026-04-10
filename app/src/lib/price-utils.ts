import type {
  Card,
  UserCard,
  PriceSnapshot,
  PortfolioRow,
  CardVariant,
  CardPrices,
} from './types';

export function getMarketPrice(
  snapshot: PriceSnapshot | null,
  cardId: string,
  variant: CardVariant,
): number | null {
  if (!snapshot) return null;
  const entry = snapshot.prices[cardId];
  if (!entry?.tcgplayer?.prices) return null;

  const variantPrices = entry.tcgplayer.prices[variant] as CardPrices | undefined;
  return variantPrices?.market ?? null;
}

export function getCurrency(
  snapshot: PriceSnapshot | null,
  cardId: string,
): string {
  if (!snapshot) return 'USD';
  const entry = snapshot.prices[cardId];
  return entry?.tcgplayer?.currency ?? 'USD';
}

export function getSourceUrl(
  snapshot: PriceSnapshot | null,
  cardId: string,
): string | null {
  if (!snapshot) return null;
  const entry = snapshot.prices[cardId];
  return entry?.tcgplayer?.url ?? null;
}

export function calcPctChange(
  current: number | null,
  previous: number | null,
): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function buildPortfolioRows(
  userCards: UserCard[],
  cards: Card[],
  latestPrices: PriceSnapshot | null,
  dayAgoPrices: PriceSnapshot | null,
  weekAgoPrices: PriceSnapshot | null,
  monthAgoPrices: PriceSnapshot | null,
  yearAgoPrices: PriceSnapshot | null,
): PortfolioRow[] {
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  return userCards
    .map((uc): PortfolioRow | null => {
      const card = cardMap.get(uc.cardId);
      if (!card) return null;

      const currentPrice = getMarketPrice(latestPrices, uc.cardId, uc.variant);
      const priceDayAgo = getMarketPrice(dayAgoPrices, uc.cardId, uc.variant);
      const priceWeekAgo = getMarketPrice(weekAgoPrices, uc.cardId, uc.variant);
      const priceMonthAgo = getMarketPrice(monthAgoPrices, uc.cardId, uc.variant);
      const priceYearAgo = getMarketPrice(yearAgoPrices, uc.cardId, uc.variant);

      return {
        userCard: uc,
        card,
        currentPrice,
        currency: getCurrency(latestPrices, uc.cardId),
        sourceUrl: getSourceUrl(latestPrices, uc.cardId),
        priceDayAgo,
        priceWeekAgo,
        priceMonthAgo,
        priceYearAgo,
        changeDayPct: calcPctChange(currentPrice, priceDayAgo),
        changeWeekPct: calcPctChange(currentPrice, priceWeekAgo),
        changeMonthPct: calcPctChange(currentPrice, priceMonthAgo),
        changeYearPct: calcPctChange(currentPrice, priceYearAgo),
      };
    })
    .filter((row): row is PortfolioRow => row !== null);
}

export function formatCurrency(value: number | null, currency: string): string {
  if (value == null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPct(value: number | null): string {
  if (value == null) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function totalPortfolioValue(rows: PortfolioRow[]): number {
  return rows.reduce((sum, r) => {
    if (r.currentPrice == null) return sum;
    return sum + r.currentPrice * r.userCard.quantity;
  }, 0);
}
