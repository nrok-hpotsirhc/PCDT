/**
 * Price Sync Script
 * Runs via GitHub Actions to fetch latest prices from pokemontcg.io
 * and write them to /data/prices-latest.json + /data/prices/YYYY-MM-DD.json
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.resolve(__dirname, '../data');
const API_BASE = 'https://api.pokemontcg.io/v2';
const API_KEY = process.env['POKEMON_TCG_API_KEY'] ?? '';

interface TcgPlayerPriceSet {
  low?: number;
  mid?: number;
  high?: number;
  market?: number;
}

interface TcgPlayerData {
  url?: string;
  prices?: Record<string, TcgPlayerPriceSet>;
}

interface ApiCard {
  id: string;
  tcgplayer?: TcgPlayerData;
}

interface PriceEntry {
  tcgplayer?: {
    url: string;
    currency: string;
    prices: Record<string, TcgPlayerPriceSet>;
  };
}

async function fetchCardPrices(cardIds: string[]): Promise<Map<string, PriceEntry>> {
  const results = new Map<string, PriceEntry>();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (API_KEY) {
    headers['X-Api-Key'] = API_KEY;
  }

  // Batch by 250 IDs per request (API limit)
  const batchSize = 250;
  for (let i = 0; i < cardIds.length; i += batchSize) {
    const batch = cardIds.slice(i, i + batchSize);
    const query = batch.map((id) => `id:"${id}"`).join(' OR ');
    const url = `${API_BASE}/cards?q=${encodeURIComponent(query)}&select=id,tcgplayer&pageSize=${batchSize}`;

    console.log(`Fetching batch ${Math.floor(i / batchSize) + 1}...`);
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.error(`API error: ${res.status} ${res.statusText}`);
      continue;
    }

    const data = (await res.json()) as { data: ApiCard[] };
    for (const card of data.data) {
      if (card.tcgplayer?.prices) {
        results.set(card.id, {
          tcgplayer: {
            url: card.tcgplayer.url ?? '',
            currency: 'USD',
            prices: card.tcgplayer.prices,
          },
        });
      }
    }
  }

  return results;
}

async function main() {
  // Read current user-cards to know which card IDs to fetch
  const userCardsPath = path.join(DATA_DIR, 'user-cards.json');
  if (!fs.existsSync(userCardsPath)) {
    console.log('No user-cards.json found, nothing to sync.');
    return;
  }

  const userCards = JSON.parse(fs.readFileSync(userCardsPath, 'utf-8')) as { cardId: string }[];
  const cardIds = [...new Set(userCards.map((uc) => uc.cardId))];

  if (cardIds.length === 0) {
    console.log('No cards to sync.');
    return;
  }

  console.log(`Syncing prices for ${cardIds.length} cards...`);
  const prices = await fetchCardPrices(cardIds);

  const snapshot = {
    syncedAt: new Date().toISOString(),
    prices: Object.fromEntries(prices),
  };

  // Write latest
  const latestPath = path.join(DATA_DIR, 'prices-latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(snapshot, null, 2));
  console.log(`Written ${latestPath}`);

  // Write daily archive
  const today = new Date().toISOString().slice(0, 10);
  const pricesDir = path.join(DATA_DIR, 'prices');
  if (!fs.existsSync(pricesDir)) {
    fs.mkdirSync(pricesDir, { recursive: true });
  }
  const archivePath = path.join(pricesDir, `${today}.json`);
  fs.writeFileSync(archivePath, JSON.stringify(snapshot, null, 2));
  console.log(`Written ${archivePath}`);

  console.log(`Done! Synced ${prices.size}/${cardIds.length} cards.`);
}

main().catch((err) => {
  console.error('Price sync failed:', err);
  process.exit(1);
});
