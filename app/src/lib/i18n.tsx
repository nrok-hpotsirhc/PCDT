import { createContext, useContext, useState, type ReactNode } from 'react';

export type Locale = 'de' | 'en';

const translations = {
  de: {
    // Header
    'app.title': 'Pokémon Karten Tracker',
    'app.subtitle': 'Portfolio-Wertübersicht',
    'app.cards': 'Karten',
    'app.synced': 'synchronisiert',
    'app.noSync': 'keine Sync-Daten',

    // Tabs
    'tab.dashboard': 'Dashboard',
    'tab.portfolio': 'Portfolio',
    'tab.add': 'Karte hinzufügen',
    'tab.import': 'Import',
    'tab.scan': 'Scan',

    // Dashboard
    'dash.portfolioValue': 'Portfolio-Wert',
    'dash.totalCards': 'Karten gesamt',
    'dash.unique': 'verschiedene',
    'dash.mostValuable': 'Wertvollste',
    'dash.avgValue': 'Ø Kartenwert',
    'dash.topGainers': '🔥 Top Gewinner (24h)',
    'dash.topLosers': '📉 Top Verlierer (24h)',
    'dash.mostValuableCards': '💎 Wertvollste Karten',
    'dash.noData': 'Keine Daten verfügbar',

    // Table
    'table.card': 'Karte',
    'table.owner': 'Besitzer',
    'table.rarity': 'Seltenheit',
    'table.condition': 'Zustand',
    'table.qty': 'Anz.',
    'table.price': 'Preis',
    'table.search': 'Karten suchen...',
    'table.cardsCount': 'Karten',
    'table.page': 'Seite',
    'table.of': 'von',
    'table.previous': 'Zurück',
    'table.next': 'Weiter',

    // Card Form
    'form.addTitle': 'Karte zur Sammlung hinzufügen',
    'form.editTitle': 'Karte bearbeiten',
    'form.card': 'Karte',
    'form.searchPlaceholder': 'Nach Kartenname oder Nummer suchen...',
    'form.condition': 'Zustand',
    'form.variant': 'Variante',
    'form.quantity': 'Anzahl',
    'form.owner': 'Besitzer',
    'form.purchasePrice': 'Kaufpreis',
    'form.currency': 'Währung',
    'form.purchaseDate': 'Kaufdatum',
    'form.gradingService': 'Grading-Service',
    'form.grade': 'Bewertung',
    'form.none': 'Keinen',
    'form.notes': 'Notizen',
    'form.notesPlaceholder': 'Optionale Notizen...',
    'form.add': 'Karte hinzufügen',
    'form.update': 'Aktualisieren',
    'form.cancel': 'Abbrechen',
    'form.noResults': 'Keine Karten gefunden',
    'form.moreResults': 'weitere Ergebnisse – Suche verfeinern',

    // Import
    'import.title': 'Aus Excel/CSV importieren',
    'import.drop': 'Excel/CSV-Datei hierhin ziehen oder',
    'import.browse': 'durchsuchen',
    'import.formats': 'Unterstützt .xlsx, .xls, .csv',
    'import.template': '⬇ Import-Vorlage herunterladen',
    'import.success': 'Karte(n) erfolgreich importiert',
    'import.errors': 'Fehler beim Import:',

    // Scan
    'scan.title': 'Karte scannen (OCR)',
    'scan.idle': 'Scanne eine Pokémon-Karte mit deiner Kamera',
    'scan.position': 'Karte im Rahmen positionieren',
    'scan.analyzing': 'Karte wird analysiert...',
    'scan.startCamera': '📷 Kamera starten',
    'scan.capture': '⚡ Aufnehmen & Scannen',
    'scan.cancel': 'Abbrechen',
    'scan.again': 'Erneut scannen',
    'scan.ocrText': 'OCR-Text:',
    'scan.noText': 'Kein Text erkannt',
    'scan.matches': 'Mögliche Treffer:',
    'scan.noMatch': 'Keine passenden Karten gefunden. Versuche ein klareres Bild.',
    'scan.select': 'Auswählen →',

    // Empty State
    'empty.title': 'Noch keine Karten in deiner Sammlung.',
    'empty.addCard': 'Karte hinzufügen',
    'empty.orImport': 'oder eine Excel-Datei importieren.',

    // Detail
    'detail.priceHistory': 'Preisverlauf',
    'detail.edit': 'Bearbeiten',
    'detail.delete': 'Löschen',

    // Loading
    'loading': 'Portfolio wird geladen...',
    'error': 'Fehler',

    // Footer
    'footer': 'Preise von TCGPlayer via pokemontcg.io · Nicht affiliiert mit The Pokémon Company · Nur für den persönlichen Gebrauch',
  },
  en: {
    'app.title': 'Pokémon Card Tracker',
    'app.subtitle': 'Portfolio value overview',
    'app.cards': 'cards',
    'app.synced': 'synced',
    'app.noSync': 'no sync data',

    'tab.dashboard': 'Dashboard',
    'tab.portfolio': 'Portfolio',
    'tab.add': 'Add Card',
    'tab.import': 'Import',
    'tab.scan': 'Scan',

    'dash.portfolioValue': 'Portfolio Value',
    'dash.totalCards': 'Total Cards',
    'dash.unique': 'unique',
    'dash.mostValuable': 'Most Valuable',
    'dash.avgValue': 'Avg Card Value',
    'dash.topGainers': '🔥 Top Gainers (24h)',
    'dash.topLosers': '📉 Top Losers (24h)',
    'dash.mostValuableCards': '💎 Most Valuable Cards',
    'dash.noData': 'No data available',

    'table.card': 'Card',
    'table.owner': 'Owner',
    'table.rarity': 'Rarity',
    'table.condition': 'Condition',
    'table.qty': 'Qty',
    'table.price': 'Price',
    'table.search': 'Search cards...',
    'table.cardsCount': 'cards',
    'table.page': 'Page',
    'table.of': 'of',
    'table.previous': 'Previous',
    'table.next': 'Next',

    'form.addTitle': 'Add Card to Collection',
    'form.editTitle': 'Edit Card',
    'form.card': 'Card',
    'form.searchPlaceholder': 'Search by card name or number...',
    'form.condition': 'Condition',
    'form.variant': 'Variant',
    'form.quantity': 'Quantity',
    'form.owner': 'Owner',
    'form.purchasePrice': 'Purchase Price',
    'form.currency': 'Currency',
    'form.purchaseDate': 'Purchase Date',
    'form.gradingService': 'Grading Service',
    'form.grade': 'Grade',
    'form.none': 'None',
    'form.notes': 'Notes',
    'form.notesPlaceholder': 'Optional notes...',
    'form.add': 'Add Card',
    'form.update': 'Update Card',
    'form.cancel': 'Cancel',
    'form.noResults': 'No cards found',
    'form.moreResults': 'more results – refine your search',

    'import.title': 'Import from Excel/CSV',
    'import.drop': 'Drag & drop an Excel/CSV file here, or',
    'import.browse': 'browse',
    'import.formats': 'Supports .xlsx, .xls, .csv',
    'import.template': '⬇ Download import template',
    'import.success': 'card(s) successfully imported',
    'import.errors': 'error(s) during import:',

    'scan.title': 'Scan Card (OCR)',
    'scan.idle': 'Scan a Pokémon card with your camera',
    'scan.position': 'Position the card within the frame',
    'scan.analyzing': 'Analyzing card...',
    'scan.startCamera': '📷 Start Camera',
    'scan.capture': '⚡ Capture & Scan',
    'scan.cancel': 'Cancel',
    'scan.again': 'Scan Again',
    'scan.ocrText': 'OCR Text:',
    'scan.noText': 'No text detected',
    'scan.matches': 'Possible matches:',
    'scan.noMatch': 'No matching cards found. Try a clearer image.',
    'scan.select': 'Select →',

    'empty.title': 'No cards in your collection yet.',
    'empty.addCard': 'Add a card',
    'empty.orImport': 'or import an Excel file.',

    'detail.priceHistory': 'Price History',
    'detail.edit': 'Edit',
    'detail.delete': 'Delete',

    'loading': 'Loading portfolio...',
    'error': 'Error',

    'footer': 'Prices from TCGPlayer via pokemontcg.io · Not affiliated with The Pokémon Company · For personal use only',
  },
} as const;

type TranslationKey = keyof typeof translations.de;

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'de',
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('pokemon-tracker-locale');
    return (saved === 'en' || saved === 'de') ? saved : 'de';
  });

  function handleSetLocale(l: Locale) {
    setLocale(l);
    localStorage.setItem('pokemon-tracker-locale', l);
  }

  function t(key: TranslationKey): string {
    return translations[locale][key] ?? key;
  }

  return (
    <I18nContext value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
