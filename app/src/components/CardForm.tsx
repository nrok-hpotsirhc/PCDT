import { useState, useEffect, useRef, useCallback } from 'react';
import type { Card, Condition, CardVariant } from '@/lib/types';
import { formatSetNumber } from '@/lib/types';
import { searchCardsApi, fetchCardById, type SearchResult } from '@/lib/pokemon-api';
import { generateId, getAvailableVariants } from '@/lib/card-store';
import { useI18n } from '@/lib/i18n';
import type { UserCard } from '@/lib/types';

interface CardFormProps {
  cards: Card[];
  onSubmit: (card: UserCard) => void;
  onCancel: () => void;
  editCard?: UserCard | null;
}

const MAX_VISIBLE = 5;

export function CardForm({ cards, onSubmit, onCancel, editCard }: CardFormProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Card[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [condition, setCondition] = useState<Condition>('NM');
  const [variant, setVariant] = useState<CardVariant>('holofoil');
  const [quantity, setQuantity] = useState(1);
  const [owner, setOwner] = useState('default');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseCurrency, setPurchaseCurrency] = useState('EUR');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [gradingService, setGradingService] = useState('');
  const [gradingScore, setGradingScore] = useState('');
  const [notes, setNotes] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const { t } = useI18n();

  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (editCard) {
      // For edit mode: look up card in passed cards array or fetch from API
      const card = cards.find((c) => c.id === editCard.cardId);
      if (card) {
        setSelectedCard(card);
        setQuery(card.name);
      } else {
        void fetchCardById(editCard.cardId).then((c) => {
          if (c) {
            setSelectedCard(c);
            setQuery(c.name);
          }
        });
      }
      setCondition(editCard.condition);
      setVariant(editCard.variant);
      setQuantity(editCard.quantity);
      setOwner(editCard.owner);
      setPurchasePrice(editCard.purchasePrice?.toString() ?? '');
      setPurchaseCurrency(editCard.purchaseCurrency ?? 'EUR');
      setPurchaseDate(editCard.purchaseDate ?? todayStr);
      setGradingService(editCard.grade?.service ?? '');
      setGradingScore(editCard.grade?.score?.toString() ?? '');
      setNotes(editCard.notes ?? '');
    }
  }, [editCard, cards]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setResults([]);
      setTotalCount(0);
      setShowDropdown(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(() => {
      void searchCardsApi(value, MAX_VISIBLE + 1).then((result: SearchResult) => {
        setResults(result.cards.slice(0, MAX_VISIBLE));
        setTotalCount(result.totalCount);
        setShowDropdown(true);
        setSearching(false);
      }).catch(() => {
        setSearching(false);
      });
    }, 350);
  }, []);

  function handleSelectCard(card: Card) {
    setSelectedCard(card);
    setQuery(`${card.name} (${formatSetNumber(card.set, card.number)})`);
    setShowDropdown(false);
    const variants = getAvailableVariants(card);
    if (variants[0]) setVariant(variants[0] as CardVariant);
    // Set default purchase date to today if not editing
    if (!editCard) setPurchaseDate(todayStr);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCard) return;

    const userCard: UserCard = {
      id: editCard?.id ?? generateId(),
      cardId: selectedCard.id,
      owner,
      condition,
      variant,
      quantity: Math.max(1, quantity),
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      purchaseCurrency: purchaseCurrency || undefined,
      purchaseDate: purchaseDate || undefined,
      notes: notes || undefined,
      grade: gradingService && gradingScore
        ? { service: gradingService as 'PSA' | 'BGS' | 'CGC', score: parseFloat(gradingScore) }
        : undefined,
      addedAt: editCard?.addedAt ?? new Date().toISOString(),
    };

    onSubmit(userCard);
  }

  const availableVariants = selectedCard ? getAvailableVariants(selectedCard) : ['normal'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Search */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.card')} *</label>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={t('form.searchPlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        {searching && (
          <div className="absolute right-3 top-9">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}
        {showDropdown && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {results.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => handleSelectCard(card)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-950 text-left"
              >
                <img src={card.images.small} alt="" className="w-8 h-11 object-contain" />
                <div>
                  <div className="text-sm font-medium">{card.name}</div>
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{formatSetNumber(card.set, card.number)}</span> · {card.set.name} · {card.rarity}
                  </div>
                </div>
              </button>
            ))}
            {totalCount > MAX_VISIBLE && (
              <div className="px-3 py-2 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                +{totalCount - MAX_VISIBLE} {t('form.moreResults')}
              </div>
            )}
          </div>
        )}
        {showDropdown && !searching && results.length === 0 && query.length >= 2 && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-sm text-gray-500">
            {t('form.noResults')}
          </div>
        )}
        {selectedCard && (
          <div className="mt-2 flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <img src={selectedCard.images.small} alt="" className="w-12 h-16 object-contain" />
            <div>
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{selectedCard.name}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-semibold">{formatSetNumber(selectedCard.set, selectedCard.number)}</span> · {selectedCard.set.name} · {selectedCard.rarity}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Row 1: Condition + Variant */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.condition')} *</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as Condition)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="NM">Near Mint</option>
            <option value="LP">Lightly Played</option>
            <option value="MP">Moderately Played</option>
            <option value="HP">Heavily Played</option>
            <option value="DMG">Damaged</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.variant')}</label>
          <select
            value={variant}
            onChange={(e) => setVariant(e.target.value as CardVariant)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {availableVariants.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Quantity + Owner */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.quantity')}</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.owner')}</label>
          <input
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Row 3: Purchase */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.purchasePrice')}</label>
          <input
            type="number"
            step="0.01"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.currency')}</label>
          <select
            value={purchaseCurrency}
            onChange={(e) => setPurchaseCurrency(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.purchaseDate')}</label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Row 4: Grading */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.gradingService')}</label>
          <select
            value={gradingService}
            onChange={(e) => setGradingService(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">{t('form.none')}</option>
            <option value="PSA">PSA</option>
            <option value="BGS">BGS / Beckett</option>
            <option value="CGC">CGC</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.grade')}</label>
          <input
            type="number"
            step="0.5"
            min={1}
            max={10}
            value={gradingScore}
            onChange={(e) => setGradingScore(e.target.value)}
            placeholder="e.g. 9.5"
            disabled={!gradingService}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.notes')}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
          placeholder={t('form.notesPlaceholder')}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={!selectedCard}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {editCard ? t('form.update') : t('form.add')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          {t('form.cancel')}
        </button>
      </div>
    </form>
  );
}
