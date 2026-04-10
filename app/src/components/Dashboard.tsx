import type { PortfolioRow } from '@/lib/types';
import { formatCurrency, formatPct, totalPortfolioValue } from '@/lib/price-utils';
import { useI18n } from '@/lib/i18n';
import { PriceSparkline } from './PriceSparkline';

interface DashboardProps {
  rows: PortfolioRow[];
}

export function Dashboard({ rows }: DashboardProps) {
  const { t } = useI18n();
  const currency = rows[0]?.currency ?? 'USD';
  const total = totalPortfolioValue(rows);

  // Total yesterday value
  const totalYesterday = rows.reduce((sum, r) => {
    if (r.priceDayAgo == null) return sum;
    return sum + r.priceDayAgo * r.userCard.quantity;
  }, 0);

  const totalChange = totalYesterday > 0
    ? ((total - totalYesterday) / totalYesterday) * 100
    : null;

  // Top gainers/losers (24h)
  const sorted24h = [...rows]
    .filter((r) => r.changeDayPct != null)
    .sort((a, b) => (b.changeDayPct ?? 0) - (a.changeDayPct ?? 0));

  const topGainers = sorted24h.slice(0, 3);
  const topLosers = sorted24h.slice(-3).reverse();

  // Most valuable cards
  const mostValuable = [...rows]
    .filter((r) => r.currentPrice != null)
    .sort((a, b) => {
      const aVal = (a.currentPrice ?? 0) * a.userCard.quantity;
      const bVal = (b.currentPrice ?? 0) * b.userCard.quantity;
      return bVal - aVal;
    })
    .slice(0, 5);

  // Sparkline data for portfolio total
  const totalSparkline = [
    rows.reduce((s, r) => s + (r.priceYearAgo ?? 0) * r.userCard.quantity, 0),
    rows.reduce((s, r) => s + (r.priceMonthAgo ?? 0) * r.userCard.quantity, 0),
    rows.reduce((s, r) => s + (r.priceWeekAgo ?? 0) * r.userCard.quantity, 0),
    rows.reduce((s, r) => s + (r.priceDayAgo ?? 0) * r.userCard.quantity, 0),
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
        <MoverList title={t('dash.topGainers')} rows={topGainers} currency={currency} />
        <MoverList title={t('dash.topLosers')} rows={topLosers} currency={currency} />
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
              {change >= 0 ? '▲' : '▼'} {formatPct(change)} (24h)
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
  rows,
  currency,
}: {
  title: string;
  rows: PortfolioRow[];
  currency: string;
}) {
  const { t } = useI18n();
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">{t('dash.noData')}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.userCard.id} className="flex items-center gap-3">
              <img src={row.card.images.small} alt="" className="w-7 h-10 object-contain" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{row.card.name}</div>
                <div className="text-xs text-gray-500">{formatCurrency(row.currentPrice, currency)}</div>
              </div>
              <span
                className={`text-xs font-semibold ${
                  (row.changeDayPct ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {(row.changeDayPct ?? 0) >= 0 ? '▲' : '▼'} {formatPct(row.changeDayPct)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
