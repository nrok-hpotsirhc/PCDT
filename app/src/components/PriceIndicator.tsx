import { formatPct } from '@/lib/price-utils';

interface PriceIndicatorProps {
  pctChange: number | null;
  label?: string;
}

export function PriceIndicator({ pctChange, label }: PriceIndicatorProps) {
  if (pctChange == null) {
    return <span className="text-gray-400 text-sm">N/A</span>;
  }

  const isPositive = pctChange >= 0;
  const color = isPositive ? 'text-green-600' : 'text-red-600';
  const bg = isPositive ? 'bg-green-50' : 'bg-red-50';
  const arrow = isPositive ? '▲' : '▼';

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold ${color} ${bg}`}
      title={label}
    >
      <span>{arrow}</span>
      <span>{formatPct(pctChange)}</span>
    </span>
  );
}
