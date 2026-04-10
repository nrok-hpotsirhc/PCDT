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
    'form.moreResults': 'weitere Ergebnisse – klicken um alle zu sehen',
    'form.searchHint': 'Suche nach Name (z.B. "Pikachu") oder Set-Code + Nr. (z.B. "PAL 072")',
    'form.allResults': 'Alle Ergebnisse',
    'form.close': 'Schließen',
    'form.loadingAll': 'Lade alle Ergebnisse...',
    'form.gradePlaceholder': 'z.B. 9.5',

    // Conditions
    'condition.NM': 'Nahezu Neuwertig',
    'condition.LP': 'Leicht Bespielt',
    'condition.MP': 'Mäßig Bespielt',
    'condition.HP': 'Stark Bespielt',
    'condition.DMG': 'Beschädigt',

    // Variants
    'variant.normal': 'Normal',
    'variant.holofoil': 'Holo',
    'variant.reverseHolofoil': 'Reverse Holo',
    'variant.1stEditionHolofoil': '1. Edition Holo',
    'variant.1stEditionNormal': '1. Edition Normal',

    // Rarities
    'rarity.Common': 'Häufig',
    'rarity.Uncommon': 'Ungewöhnlich',
    'rarity.Rare': 'Selten',
    'rarity.Rare Holo': 'Selten Holo',
    'rarity.Rare Holo EX': 'Selten Holo EX',
    'rarity.Rare Holo GX': 'Selten Holo GX',
    'rarity.Rare Holo V': 'Selten Holo V',
    'rarity.Rare VMAX': 'Selten VMAX',
    'rarity.Rare VSTAR': 'Selten VSTAR',
    'rarity.Rare Ultra': 'Ultra Selten',
    'rarity.Rare Secret': 'Geheim Selten',
    'rarity.Rare Rainbow': 'Regenbogen Selten',
    'rarity.Rare Shiny': 'Shiny Selten',
    'rarity.Rare Holo Star': 'Selten Holo Star',
    'rarity.Rare Prime': 'Selten Prime',
    'rarity.Rare ACE': 'Selten ACE',
    'rarity.Rare BREAK': 'Selten BREAK',
    'rarity.Rare Prism Star': 'Selten Prisma-Stern',
    'rarity.Amazing Rare': 'Erstaunlich Selten',
    'rarity.LEGEND': 'LEGENDE',
    'rarity.Promo': 'Promo',
    'rarity.Double Rare': 'Doppelt Selten',
    'rarity.Ultra Rare': 'Ultra Selten',
    'rarity.Illustration Rare': 'Illustration Selten',
    'rarity.Special Illustration Rare': 'Spezial-Illustration Selten',
    'rarity.Hyper Rare': 'Hyper Selten',
    'rarity.Shiny Rare': 'Schillernd Selten',
    'rarity.Shiny Ultra Rare': 'Schillernd Ultra Selten',
    'rarity.ACE SPEC Rare': 'ACE SPEC Selten',
    'rarity.Radiant Rare': 'Strahlend Selten',
    'rarity.Classic Collection': 'Klassische Sammlung',
    'rarity.Trainer Gallery Rare Holo': 'Trainer-Galerie Selten Holo',

    // Detail panel
    'detail.yearAgo': 'Vor 1 Jahr',
    'detail.monthAgo': 'Vor 30 Tagen',
    'detail.weekAgo': 'Vor 7 Tagen',
    'detail.yesterday': 'Gestern',
    'detail.current': 'Aktuell',
    'detail.qty': 'Anz.',
    'detail.purchaseInfo': 'Kaufinformationen',
    'detail.boughtFor': 'Gekauft für',
    'detail.on': 'am',
    'detail.roi': 'ROI',

    // Table tooltips
    'table.vsDay': 'vs. gestern',
    'table.vsWeek': 'vs. vor 7 Tagen',
    'table.vsMonth': 'vs. vor 30 Tagen',
    'table.vsYear': 'vs. vor 1 Jahr',

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
    'form.moreResults': 'more results – click to show all',
    'form.searchHint': 'Search by name (e.g. "Pikachu") or set code + no. (e.g. "PAL 072")',
    'form.allResults': 'All Results',
    'form.close': 'Close',
    'form.loadingAll': 'Loading all results...',
    'form.gradePlaceholder': 'e.g. 9.5',

    // Conditions
    'condition.NM': 'Near Mint',
    'condition.LP': 'Lightly Played',
    'condition.MP': 'Moderately Played',
    'condition.HP': 'Heavily Played',
    'condition.DMG': 'Damaged',

    // Variants
    'variant.normal': 'Normal',
    'variant.holofoil': 'Holofoil',
    'variant.reverseHolofoil': 'Reverse Holofoil',
    'variant.1stEditionHolofoil': '1st Edition Holofoil',
    'variant.1stEditionNormal': '1st Edition Normal',

    // Detail panel
    'detail.yearAgo': '1 Year Ago',
    'detail.monthAgo': '30 Days Ago',
    'detail.weekAgo': '7 Days Ago',
    'detail.yesterday': 'Yesterday',
    'detail.current': 'Current',
    'detail.qty': 'Qty',
    'detail.purchaseInfo': 'Purchase Info',
    'detail.boughtFor': 'Bought for',
    'detail.on': 'on',
    'detail.roi': 'ROI',

    // Table tooltips
    'table.vsDay': 'vs yesterday',
    'table.vsWeek': 'vs 7 days ago',
    'table.vsMonth': 'vs 30 days ago',
    'table.vsYear': 'vs 1 year ago',

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
  /** Translate a dynamic key with prefix. Falls back to raw value if key not found. */
  tr: (prefix: string, value: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'de',
  setLocale: () => {},
  t: (key) => key,
  tr: (_prefix, value) => value,
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
    return (translations[locale] as Record<string, string>)[key] ?? key;
  }

  function tr(prefix: string, value: string): string {
    const fullKey = `${prefix}.${value}`;
    return (translations[locale] as Record<string, string>)[fullKey] ?? value;
  }

  return (
    <I18nContext value={{ locale, setLocale: handleSetLocale, t, tr }}>
      {children}
    </I18nContext>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
