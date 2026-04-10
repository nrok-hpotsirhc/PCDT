import { formatCurrency } from '@/lib/price-utils';

interface CurrencyBadgeProps {
  value: number | null;
  currency: string;
  href?: string | null;
}

export function CurrencyBadge({ value, currency, href }: CurrencyBadgeProps) {
  const formatted = formatCurrency(value, currency);

  if (href && value != null) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
        title={`View on source (${currency})`}
      >
        {formatted}
      </a>
    );
  }

  return (
    <span className="font-semibold text-gray-700">
      {formatted}
    </span>
  );
}
