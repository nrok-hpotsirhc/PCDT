// ── Card Stammdaten (von pokemontcg.io) ──

export interface CardSet {
  id: string;
  name: string;
  series: string;
  releaseDate: string;
  ptcgoCode?: string;
  images: {
    symbol: string;
    logo: string;
  };
}

/** Format set code + number, e.g. "PAL 032" or "BS 4" */
export function formatSetNumber(set: CardSet, number: string): string {
  const code = set.ptcgoCode ?? set.id.toUpperCase();
  return `${code} ${number}`;
}

export interface CardPrices {
  low?: number;
  mid?: number;
  high?: number;
  market?: number;
}

export interface Card {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  set: CardSet;
  number: string;
  rarity?: string;
  artist?: string;
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    url: string;
    prices: {
      holofoil?: CardPrices;
      reverseHolofoil?: CardPrices;
      normal?: CardPrices;
      '1stEditionHolofoil'?: CardPrices;
      '1stEditionNormal'?: CardPrices;
    };
  };
}

// ── Zustand & Grading ──

export type Condition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';
export type GradingService = 'PSA' | 'BGS' | 'CGC';
export type CardVariant = 'holofoil' | 'reverseHolofoil' | 'normal' | '1stEditionHolofoil' | '1stEditionNormal';

export const CONDITION_LABELS: Record<Condition, string> = {
  NM: 'Near Mint',
  LP: 'Lightly Played',
  MP: 'Moderately Played',
  HP: 'Heavily Played',
  DMG: 'Damaged',
};

// ── Nutzer-Sammlung ──

export interface UserCard {
  id: string;
  cardId: string;
  owner: string;
  condition: Condition;
  variant: CardVariant;
  grade?: {
    service: GradingService;
    score: number;
  };
  quantity: number;
  purchasePrice?: number;
  purchaseCurrency?: string;
  purchaseDate?: string;
  notes?: string;
  addedAt: string;
}

// ── Preis-Snapshots ──

export interface PriceSourceData {
  url: string;
  currency: string;
  prices: {
    holofoil?: CardPrices;
    reverseHolofoil?: CardPrices;
    normal?: CardPrices;
    '1stEditionHolofoil'?: CardPrices;
    '1stEditionNormal'?: CardPrices;
  };
}

export interface PriceSnapshot {
  syncedAt: string;
  prices: Record<string, { tcgplayer?: PriceSourceData }>;
}

// ── Berechnete Tabellenzeile ──

export interface PortfolioRow {
  userCard: UserCard;
  card: Card;
  currentPrice: number | null;
  currency: string;
  sourceUrl: string | null;
  priceDayAgo: number | null;
  priceWeekAgo: number | null;
  priceMonthAgo: number | null;
  priceYearAgo: number | null;
  changeDayPct: number | null;
  changeWeekPct: number | null;
  changeMonthPct: number | null;
  changeYearPct: number | null;
}
