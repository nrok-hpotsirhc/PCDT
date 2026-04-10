import type { PortfolioRow } from '@/lib/types';
import { formatCurrency, formatPct, totalPortfolioValue } from '@/lib/price-utils';
import { useI18n } from '@/lib/i18n';
import { PriceSparkline } from './PriceSparkline';

interface DashboardProps {
  rows: PortfolioRow[];
}

export function Dashboard({ rows }: DashboardProps) {
  const { t } = useI18n();
  const currency = rows[0]?.currency ?? 'EUR';
  const total = totalPortfolioValue(rows);

  // Total based on 30d avg for comparison
  const totalAvg30 = rows.reduce((sum, r) => {
    if (r.avg30 == null) return sum;
    return sum + r.avg30 * r.userCard.quantity;
  }, 0);

  const totalChange = totalAvg30 > 0
    ? ((total - totalAvg30) / totalAvg30) * 100
    : null;

  // Top gainers/losers (trend vs avg30)
  const withChange = rows
    .map((r) => ({
      row: r,
      changePct: r.currentPrice != null && r.avg30 != null && r.avg30 > 0
        ? ((r.currentPrice - r.avg30) / r.avg30) * 100
        : null,
    }))
    .filter((x) => x.changePct != null);

  const sorted = [...withChange].sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0));

  const topGainers = sorted.slice(0, 3);
  const topLosers = sorted.slice(-3).reverse();

  // Most valuable cards
  const mostValuable = [...rows]
    .filter((r) => r.currentPrice != null)
    .sort((a, b) => {
      const aVal = (a.currentPrice ?? 0) * a.userCard.quantity;
      const bVal = (b.currentPrice ?? 0) * b.userCard.quantity;
      return bVal - aVal;
    })
    .slice(0, 5);

  // Sparkline data for portfolio total: avg30 → avg7 → avg1 → trend
  const totalSparkline = [
    rows.reduce((s, r) => s + (r.avg30 ?? 0) * r.userCard.quantity, 0),
    rows.reduce((s, r) => s + (r.avg7 ?? 0) * r.userCard.quantity, 0),
    rows.reduce((s, r) => s + (r.avg1 ?? 0) * r.userCard.quantity, 0),
    total,
  ].filter((v) => v > 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label={t('dash.portfolioValue')}
          value={formatCurrency(total, currency)}
          change={totalChange}
          sparkline={totalSparkline}
        />
        <KpiCard
          label={t('dash.totalCards')}
          value={rows.reduce((s, r) => s + r.userCard.quantity, 0).toString()}
          sublabel={`${rows.length} ${t('dash.unique')}`}
        />
        <KpiCard
          label={t('dash.mostValuable')}
          value={mostValuable[0] ? mostValuable[0].card.name : 'N/A'}
          sublabel={mostValuable[0] ? formatCurrency(mostValuable[0].currentPrice, currency) : ''}
        />
        <KpiCard
          label={t('dash.avgValue')}
          value={formatCurrency(rows.length > 0 ? total / rows.length : null, currency)}
        />
      </div>

      {/* Gainers & Losers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MoverList title={t('dash.topGainers')} items={topGainers} currency={currency} />
        <MoverList title={t('dash.topLosers')} items={topLosers} currency={currency} />
      </div>

      {/* Most Valuable */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('dash.mostValuableCards')}</h3>
        <div className="space-y-2">
          {mostValuable.map((row) => (
            <div key={row.userCard.id} className="flex items-center gap-3">
              <img src={row.card.images.small} alt="" className="w-8 h-11 object-contain" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{row.card.name}</div>
                <div className="text-xs text-gray-500">{row.card.set.name}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">
                  {formatCurrency((row.currentPrice ?? 0) * row.userCard.quantity, currency)}
                </div>
                <div className="text-xs text-gray-400">
                  {row.userCard.quantity > 1 && `${row.userCard.quantity}× `}
                  {formatCurrency(row.currentPrice, currency)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function KpiCard({
  label,
  value,
  sublabel,
  change,
  sparkline,
}: {
  label: string;
  value: string;
  sublabel?: string;
  change?: number | null;
  sparkline?: number[];
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
      <div className="flex items-end justify-between mt-1">
        <div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
          {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
          {change != null && (
            <p className={`text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '▲' : '▼'} {formatPct(change)} (vs Ø 30d)
            </p>
          )}
        </div>
        {sparkline && sparkline.length > 1 && (
          <PriceSparkline data={sparkline} width={80} height={32} />
        )}
      </div>
    </div>
  );
}

function MoverList({
  title,
  items,
  currency,
}: {
  title: string;
  items: { row: PortfolioRow; changePct: number | null }[];
  currency: string;
}) {
  const { t } = useI18n();
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400">{t('dash.noData')}</p>
      ) : (
        <div className="space-y-2">
          {items.map(({ row, changePct }) => (
            <div key={row.userCard.id} className="flex items-center gap-3">
              <img src={row.card.images.small} alt="" className="w-7 h-10 object-contain" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{row.card.name}</div>
                <div className="text-xs text-gray-500">{formatCurrency(row.currentPrice, currency)}</div>
              </div>
              <span
                className={`text-xs font-semibold ${
                  (changePct ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {(changePct ?? 0) >= 0 ? '▲' : '▼'} {formatPct(changePct)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
