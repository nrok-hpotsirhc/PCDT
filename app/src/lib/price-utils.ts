import type {
  Card,
  UserCard,
  PriceSnapshot,
  PortfolioRow,
  CardVariant,
  CardPrices,
  CardmarketPrices,
} from './types';

/** Get market price (trend) from a snapshot – prefers Cardmarket, falls back to TCGPlayer */
export function getMarketPrice(
  snapshot: PriceSnapshot | null,
  cardId: string,
  variant: CardVariant,
): number | null {
  if (!snapshot) return null;
  const entry = snapshot.prices[cardId];
  if (!entry) return null;

  // Prefer Cardmarket (EUR, European market)
  if (entry.cardmarket?.prices) {
    const cm = entry.cardmarket.prices;
    if (variant === 'reverseHolofoil') {
      return cm.reverseHoloTrend ?? cm.reverseHoloSell ?? null;
    }
    return cm.trendPrice ?? cm.averageSellPrice ?? null;
  }

  // Fallback to TCGPlayer
  if (entry.tcgplayer?.prices) {
    const variantPrices = entry.tcgplayer.prices[variant] as CardPrices | undefined;
    return variantPrices?.market ?? null;
  }

  return null;
}

/** Extract full Cardmarket price set from snapshot */
function getCardmarketPricesFromSnapshot(
  snapshot: PriceSnapshot | null,
  cardId: string,
): CardmarketPrices | null {
  if (!snapshot) return null;
  return snapshot.prices[cardId]?.cardmarket?.prices ?? null;
}

export function getCurrency(
  snapshot: PriceSnapshot | null,
  cardId: string,
): string {
  if (!snapshot) return 'EUR';
  const entry = snapshot.prices[cardId];
  if (entry?.cardmarket) return entry.cardmarket.currency ?? 'EUR';
  return entry?.tcgplayer?.currency ?? 'EUR';
}

export function getSourceUrl(
  snapshot: PriceSnapshot | null,
  cardId: string,
): string | null {
  if (!snapshot) return null;
  const entry = snapshot.prices[cardId];
  if (entry?.cardmarket) return entry.cardmarket.url ?? null;
  return entry?.tcgplayer?.url ?? null;
}

export function calcPctChange(
  current: number | null,
  previous: number | null,
): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/** Extract the Cardmarket price fields for a given card + variant, using snapshot or live card data */
function resolveCardmarketFields(
  card: Card,
  variant: CardVariant,
  latestPrices: PriceSnapshot | null,
): { trendPrice: number | null; lowPrice: number | null; avg1: number | null; avg7: number | null; avg30: number | null } {
  // Try snapshot first, then live card data
  const cm = getCardmarketPricesFromSnapshot(latestPrices, card.id) ?? card.cardmarket?.prices ?? null;
  if (!cm) return { trendPrice: null, lowPrice: null, avg1: null, avg7: null, avg30: null };

  const isReverse = variant === 'reverseHolofoil';
  return {
    trendPrice: isReverse ? (cm.reverseHoloTrend ?? cm.reverseHoloSell ?? null) : (cm.trendPrice ?? cm.averageSellPrice ?? null),
    lowPrice: isReverse ? (cm.reverseHoloLow ?? null) : (cm.lowPrice ?? null),
    avg1: isReverse ? (cm.reverseHoloAvg1 ?? null) : (cm.avg1 ?? null),
    avg7: isReverse ? (cm.reverseHoloAvg7 ?? null) : (cm.avg7 ?? null),
    avg30: isReverse ? (cm.reverseHoloAvg30 ?? null) : (cm.avg30 ?? null),
  };
}

export function buildPortfolioRows(
  userCards: UserCard[],
  cards: Card[],
  latestPrices: PriceSnapshot | null,
): PortfolioRow[] {
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  return userCards
    .map((uc): PortfolioRow | null => {
      const card = cardMap.get(uc.cardId);
      if (!card) return null;

      const prices = resolveCardmarketFields(card, uc.variant, latestPrices);
      const sourceUrl = getSourceUrl(latestPrices, uc.cardId)
        ?? card.cardmarket?.url ?? null;

      return {
        userCard: uc,
        card,
        currentPrice: prices.trendPrice,
        lowPrice: prices.lowPrice,
        avg1: prices.avg1,
        avg7: prices.avg7,
        avg30: prices.avg30,
        currency: getCurrency(latestPrices, uc.cardId),
        sourceUrl,
      };
    })
    .filter((row): row is PortfolioRow => row !== null);
}

export function formatCurrency(value: number | null, currency: string): string {
  if (value == null) return 'N/A';
  const locale = currency === 'EUR' ? 'de-DE' : 'en-US';
  return new Intl.NumberFormat(locale, {
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
