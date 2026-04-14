import { useState, useCallback, useMemo } from 'react';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { CardTable } from '@/components/CardTable';
import { Dashboard } from '@/components/Dashboard';
import { CardForm } from '@/components/CardForm';
import { CardDetail } from '@/components/CardDetail';
import { ExcelImport } from '@/components/ExcelImport';
import { OcrScanner } from '@/components/OcrScanner';
import { formatCurrency, totalPortfolioValue } from '@/lib/price-utils';
import { addUserCard, updateUserCard, deleteUserCard } from '@/lib/card-store';
import { useI18n } from '@/lib/i18n';
import type { UserCard, Card, PortfolioRow } from '@/lib/types';

type Tab = 'dashboard' | 'portfolio' | 'add' | 'import' | 'scan';

export function App() {
  const { rows, cards, userCards, loading, error, lastSynced, setUserCards } = usePortfolioData();
  const { t, locale, setLocale } = useI18n();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [detailRow, setDetailRow] = useState<PortfolioRow | null>(null);
  const [editCard, setEditCard] = useState<UserCard | null>(null);

  const TABS: { id: Tab; label: string; icon: string }[] = useMemo(() => [
    { id: 'dashboard', label: t('tab.dashboard'), icon: '📊' },
    { id: 'portfolio', label: t('tab.portfolio'), icon: '🗂️' },
    { id: 'add', label: t('tab.add'), icon: '➕' },
    { id: 'import', label: t('tab.import'), icon: '📄' },
    { id: 'scan', label: t('tab.scan'), icon: '📷' },
  ], [t]);

  const total = totalPortfolioValue(rows);
  const currency = rows[0]?.currency ?? 'USD';

  const handleAddCard = useCallback(
    (card: UserCard) => {
      setUserCards(addUserCard(userCards, card));
      setTab('portfolio');
    },
    [userCards, setUserCards],
  );

  const handleUpdateCard = useCallback(
    (card: UserCard) => {
      setUserCards(updateUserCard(userCards, card));
      setEditCard(null);
      setDetailRow(null);
    },
    [userCards, setUserCards],
  );

  const handleDeleteCard = useCallback(
    (id: string) => {
      setUserCards(deleteUserCard(userCards, id));
      setDetailRow(null);
    },
    [userCards, setUserCards],
  );

  const handleImport = useCallback(
    (imported: UserCard[]) => {
      let updated = [...userCards];
      for (const card of imported) {
        updated = addUserCard(updated, card);
      }
      setUserCards(updated);
    },
    [userCards, setUserCards],
  );

  const handleScanDetected = useCallback(
    (card: Card) => {
      // Pre-fill form with detected card – switch to add tab with edit state
      setEditCard({
        id: '',
        cardId: card.id,
        owner: '',
        condition: 'NM',
        variant: 'holofoil',
        quantity: 1,
        addedAt: new Date().toISOString(),
      });
      setTab('add');
    },
    [],
  );

  const handleRowClick = useCallback(
    (row: PortfolioRow) => setDetailRow(row),
    [],
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 dark:text-gray-100">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('app.title')}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('app.subtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocale(locale === 'de' ? 'en' : 'de')}
                className="px-2 py-1 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={locale === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
              >
                {locale === 'de' ? '🇬🇧 EN' : '🇩🇪 DE'}
              </button>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(total, currency)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {rows.length} {t('app.cards')} · {lastSynced
                    ? `${t('app.synced')} ${new Date(lastSynced).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US')}`
                    : t('app.noSync')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {TABS.map((tabItem) => (
              <button
                key={tabItem.id}
                onClick={() => setTab(tabItem.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === tabItem.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300'
                }`}
              >
                <span>{tabItem.icon}</span> {tabItem.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">{t('loading')}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-300">
            <strong>{t('error')}:</strong> {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {tab === 'dashboard' && <Dashboard rows={rows} />}

            {tab === 'portfolio' && (
              rows.length > 0 ? (
                <CardTable rows={rows} onRowClick={handleRowClick} />
              ) : (
                <EmptyState onAdd={() => setTab('add')} />
              )
            )}

            {tab === 'add' && (
              <div className="max-w-xl mx-auto">
                <h2 className="text-lg font-semibold mb-4">
                  {editCard ? t('form.editTitle') : t('form.addTitle')}
                </h2>
                <CardForm
                  cards={cards}
                  onSubmit={editCard?.id ? handleUpdateCard : handleAddCard}
                  onCancel={() => { setEditCard(null); setTab('portfolio'); }}
                  editCard={editCard}
                />
              </div>
            )}

            {tab === 'import' && (
              <div className="max-w-xl mx-auto">
                <h2 className="text-lg font-semibold mb-4">{t('import.title')}</h2>
                <ExcelImport onImport={handleImport} userCards={userCards} cards={cards} />
              </div>
            )}

            {tab === 'scan' && (
              <div className="max-w-xl mx-auto">
                <h2 className="text-lg font-semibold mb-4">{t('scan.title')}</h2>
                <OcrScanner cards={cards} onCardDetected={handleScanDetected} />
              </div>
            )}
          </>
        )}
      </main>

      {/* Card Detail Modal */}
      {detailRow && (
        <CardDetail
          row={detailRow}
          onClose={() => setDetailRow(null)}
          onEdit={() => {
            setEditCard(detailRow.userCard);
            setDetailRow(null);
            setTab('add');
          }}
          onDelete={() => handleDeleteCard(detailRow.userCard.id)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 text-xs text-gray-400 text-center">
          {t('footer')}
        </div>
      </footer>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { t } = useI18n();
  return (
    <div className="text-center py-20 text-gray-500 dark:text-gray-400">
      <p className="text-lg">{t('empty.title')}</p>
      <p className="text-sm mt-2">
        <button onClick={onAdd} className="text-blue-600 hover:underline">
          {t('empty.addCard')}
        </button>{' '}
        {t('empty.orImport')}
      </p>
    </div>
  );
}
