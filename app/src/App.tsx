import { usePortfolioData } from '@/hooks/usePortfolioData';
import { CardTable } from '@/components/CardTable';
import { formatCurrency, totalPortfolioValue } from '@/lib/price-utils';

export function App() {
  const { rows, loading, error, lastSynced } = usePortfolioData();

  const total = totalPortfolioValue(rows);
  const currency = rows[0]?.currency ?? 'USD';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Pokémon Card Tracker
                </h1>
                <p className="text-xs text-gray-500">
                  Portfolio value overview
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(total, currency)}
              </div>
              <div className="text-xs text-gray-500">
                {rows.length} cards · {lastSynced
                  ? `synced ${new Date(lastSynced).toLocaleDateString('de-DE')}`
                  : 'no sync data'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-3 text-gray-600">Loading portfolio...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No cards in your collection yet.</p>
            <p className="text-sm mt-2">
              Add cards via the UI or import an Excel file.
            </p>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <CardTable rows={rows} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 text-xs text-gray-400 text-center">
          Prices from TCGPlayer via pokemontcg.io · Not affiliated with The Pokémon Company ·
          For personal use only
        </div>
      </footer>
    </div>
  );
}
