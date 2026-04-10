import type { PortfolioRow } from '@/lib/types';
import { CONDITION_LABELS, formatSetNumber } from '@/lib/types';
import { formatCurrency, formatPct } from '@/lib/price-utils';
import { useI18n } from '@/lib/i18n';
import { PriceIndicator } from './PriceIndicator';
import { PriceSparkline } from './PriceSparkline';

interface CardDetailProps {
  row: PortfolioRow;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CardDetail({ row, onClose, onEdit, onDelete }: CardDetailProps) {
  const { card, userCard, currentPrice, currency, sourceUrl } = row;
  const { t } = useI18n();

  const priceHistory = [
    { label: '1 Year Ago', price: row.priceYearAgo, change: row.changeYearPct },
    { label: '30 Days Ago', price: row.priceMonthAgo, change: row.changeMonthPct },
    { label: '7 Days Ago', price: row.priceWeekAgo, change: row.changeWeekPct },
    { label: 'Yesterday', price: row.priceDayAgo, change: row.changeDayPct },
    { label: 'Current', price: currentPrice, change: null },
  ];

  const sparklineData = priceHistory
    .filter((p) => p.price != null)
    .map((p) => p.price!);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
          <img
            src={card.images.large}
            alt={card.name}
            className="w-32 rounded-lg shadow-md"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{card.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {card.set.name} · {formatSetNumber(card.set, card.number)} · {card.rarity}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                {CONDITION_LABELS[userCard.condition]}
              </span>
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                {userCard.variant}
              </span>
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                Qty: {userCard.quantity}
              </span>
              {userCard.grade && (
                <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 rounded text-xs font-medium">
                  {userCard.grade.service} {userCard.grade.score}
                </span>
              )}
            </div>
            {/* Current Price */}
            <div className="mt-4">
              {sourceUrl && currentPrice != null ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-2xl font-bold text-blue-600 hover:underline"
                >
                  {formatCurrency(currentPrice, currency)}
                </a>
              ) : (
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(currentPrice, currency)}
                </span>
              )}
              <span className="text-sm text-gray-500 ml-2">{currency}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Sparkline */}
        {sparklineData.length > 1 && (
          <div className="px-6 pt-4">
            <PriceSparkline data={sparklineData} height={80} />
          </div>
        )}

        {/* Price History */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('detail.priceHistory')}</h3>
          <div className="space-y-2">
            {priceHistory.map((p) => (
              <div
                key={p.label}
                className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <span className="text-sm text-gray-600 dark:text-gray-400">{p.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {formatCurrency(p.price, currency)}
                  </span>
                  {p.change != null && <PriceIndicator pctChange={p.change} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Purchase Info */}
        {(userCard.purchasePrice != null || userCard.notes) && (
          <div className="px-6 pb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Purchase Info</h3>
            {userCard.purchasePrice != null && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Bought for {formatCurrency(userCard.purchasePrice, userCard.purchaseCurrency ?? 'EUR')}
                {userCard.purchaseDate && ` on ${userCard.purchaseDate}`}
                {currentPrice != null && (
                  <span className="ml-2">
                    ({formatPct(((currentPrice - userCard.purchasePrice) / userCard.purchasePrice) * 100)} ROI)
                  </span>
                )}
              </p>
            )}
            {userCard.notes && (
              <p className="text-sm text-gray-500 mt-1 italic">{userCard.notes}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            {t('detail.edit')}
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100"
          >
            {t('detail.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
