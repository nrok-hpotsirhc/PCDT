import { useState, useEffect } from 'react';
import type { Card, UserCard, PriceSnapshot, PortfolioRow } from '@/lib/types';
import {
  loadCards,
  loadUserCards,
  loadLatestPrices,
  loadPriceSnapshot,
} from '@/lib/data-loader';
import { buildPortfolioRows } from '@/lib/price-utils';

interface PortfolioData {
  rows: PortfolioRow[];
  cards: Card[];
  userCards: UserCard[];
  latestPrices: PriceSnapshot | null;
  loading: boolean;
  error: string | null;
  lastSynced: string | null;
}

export function usePortfolioData(): PortfolioData {
  const [cards, setCards] = useState<Card[]>([]);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [latestPrices, setLatestPrices] = useState<PriceSnapshot | null>(null);
  const [dayAgoPrices, setDayAgoPrices] = useState<PriceSnapshot | null>(null);
  const [weekAgoPrices, setWeekAgoPrices] = useState<PriceSnapshot | null>(null);
  const [monthAgoPrices, setMonthAgoPrices] = useState<PriceSnapshot | null>(null);
  const [yearAgoPrices, setYearAgoPrices] = useState<PriceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [cardsData, userCardsData, latestData] = await Promise.all([
          loadCards(),
          loadUserCards(),
          loadLatestPrices(),
        ]);

        setCards(cardsData);
        setUserCards(userCardsData);
        setLatestPrices(latestData);

        // Load historical snapshots in parallel
        const today = new Date();
        const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
        const addDays = (d: Date, n: number) => {
          const r = new Date(d);
          r.setDate(r.getDate() + n);
          return r;
        };

        const [dayAgo, weekAgo, monthAgo, yearAgo] = await Promise.all([
          loadPriceSnapshot(fmtDate(addDays(today, -1))),
          loadPriceSnapshot(fmtDate(addDays(today, -7))),
          loadPriceSnapshot(fmtDate(addDays(today, -30))),
          loadPriceSnapshot(fmtDate(addDays(today, -365))),
        ]);

        setDayAgoPrices(dayAgo);
        setWeekAgoPrices(weekAgo);
        setMonthAgoPrices(monthAgo);
        setYearAgoPrices(yearAgo);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const rows = buildPortfolioRows(
    userCards,
    cards,
    latestPrices,
    dayAgoPrices,
    weekAgoPrices,
    monthAgoPrices,
    yearAgoPrices,
  );

  return {
    rows,
    cards,
    userCards,
    latestPrices,
    loading,
    error,
    lastSynced: latestPrices?.syncedAt ?? null,
  };
}
