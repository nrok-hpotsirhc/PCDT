import { read, utils, writeFile } from 'xlsx';
import type { UserCard, Condition, CardVariant, Card } from './types';
import { getCardmarketPrice } from './types';
import { generateId } from './card-store';

interface ImportRow {
  cardId?: string;
  name?: string;
  setCode?: string;
  number?: string;
  condition?: string;
  variant?: string;
  quantity?: number;
  owner?: string;
  purchasePrice?: number;
  purchaseCurrency?: string;
  purchaseDate?: string;
  notes?: string;
  gradingService?: string;
  gradingScore?: number;
}

export interface ImportResult {
  success: UserCard[];
  errors: { row: number; message: string }[];
}

function createExportFilename(): string {
  return `pokemon-collection-${new Date().toISOString().slice(0, 10)}.xlsx`;
}

const VALID_VARIANTS: CardVariant[] = [
  'holofoil', 'reverseHolofoil', 'normal', '1stEditionHolofoil', '1stEditionNormal',
];

function normalizeCondition(raw: string): Condition | null {
  const upper = raw.toUpperCase().trim();
  const map: Record<string, Condition> = {
    NM: 'NM', 'NEAR MINT': 'NM',
    LP: 'LP', 'LIGHTLY PLAYED': 'LP',
    MP: 'MP', 'MODERATELY PLAYED': 'MP',
    HP: 'HP', 'HEAVILY PLAYED': 'HP',
    DMG: 'DMG', DAMAGED: 'DMG',
  };
  return map[upper] ?? null;
}

function normalizeVariant(raw: string): CardVariant {
  const lower = raw.toLowerCase().trim();
  if (VALID_VARIANTS.includes(lower as CardVariant)) return lower as CardVariant;
  if (lower.includes('reverse')) return 'reverseHolofoil';
  if (lower.includes('1st') && lower.includes('holo')) return '1stEditionHolofoil';
  if (lower.includes('1st')) return '1stEditionNormal';
  if (lower.includes('holo')) return 'holofoil';
  return 'normal';
}

export function parseExcelFile(buffer: ArrayBuffer): ImportResult {
  const wb = read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { success: [], errors: [{ row: 0, message: 'No sheet found' }] };

  const rows = utils.sheet_to_json<ImportRow>(wb.Sheets[sheetName]!);
  const success: UserCard[] = [];
  const errors: ImportResult['errors'] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // 1-indexed + header

    if (!row.cardId && !row.name) {
      errors.push({ row: rowNum, message: 'Missing cardId or name' });
      return;
    }

    const condition = normalizeCondition(row.condition ?? 'NM');
    if (!condition) {
      errors.push({ row: rowNum, message: `Invalid condition: ${row.condition}` });
      return;
    }

    const cardId = row.cardId ?? `${row.setCode ?? 'unknown'}-${row.number ?? '0'}`;

    success.push({
      id: generateId(),
      cardId,
      owner: row.owner ?? 'default',
      condition,
      variant: normalizeVariant(row.variant ?? 'normal'),
      quantity: Math.max(1, Math.floor(row.quantity ?? 1)),
      purchasePrice: row.purchasePrice,
      purchaseCurrency: row.purchaseCurrency ?? 'EUR',
      purchaseDate: row.purchaseDate,
      notes: row.notes,
      grade: row.gradingService && row.gradingScore
        ? { service: row.gradingService as 'PSA' | 'BGS' | 'CGC', score: row.gradingScore }
        : undefined,
      addedAt: new Date().toISOString(),
    });
  });

  return { success, errors };
}

export function exportToExcel(
  userCards: UserCard[],
  cards: Card[] = [],
  filename = createExportFilename(),
): void {
  const cardMap = new Map(cards.map((card) => [card.id, card]));
  const data = userCards.map((uc) => {
    const card = cardMap.get(uc.cardId);

    return {
      cardId: uc.cardId,
      name: card?.name ?? '',
      setCode: card?.set.ptcgoCode ?? card?.set.id?.toUpperCase() ?? '',
      setName: card?.set.name ?? '',
      number: card?.number ?? '',
      rarity: card?.rarity ?? '',
      owner: uc.owner,
      condition: uc.condition,
      variant: uc.variant,
      quantity: uc.quantity,
      currentPrice: card ? getCardmarketPrice(card, uc.variant) ?? '' : '',
      currentPriceCurrency: card?.cardmarket ? 'EUR' : '',
      purchasePrice: uc.purchasePrice ?? '',
      purchaseCurrency: uc.purchaseCurrency ?? '',
      purchaseDate: uc.purchaseDate ?? '',
      gradingService: uc.grade?.service ?? '',
      gradingScore: uc.grade?.score ?? '',
      notes: uc.notes ?? '',
      addedAt: uc.addedAt,
      sourceUrl: card?.cardmarket?.url ?? card?.tcgplayer?.url ?? '',
      imageUrl: card?.images.large ?? '',
    };
  });

  const ws = utils.json_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Collection');
  writeFile(wb, filename);
}

export function downloadTemplate(): void {
  const template = [
    {
      cardId: 'base1-4',
      owner: 'default',
      condition: 'NM',
      variant: 'holofoil',
      quantity: 1,
      purchasePrice: 100,
      purchaseCurrency: 'EUR',
      purchaseDate: '2024-01-01',
      gradingService: '',
      gradingScore: '',
      notes: 'Example card',
    },
  ];

  const ws = utils.json_to_sheet(template);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Template');
  writeFile(wb, 'pokemon-import-template.xlsx');
}
