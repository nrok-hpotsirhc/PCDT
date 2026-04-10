# Pokémon Card Portfolio Tracker – Agent Instructions

## Projektübersicht

Eine statische Webanwendung (SPA) zur Verwaltung und Wertüberwachung von Pokémon-Sammelkarten.
Vollständig gehostet auf **GitHub Pages** – kein eigener Server/Backend nötig.

## Architektur-Prinzip: "Serverless via Git"

```
┌─────────────────────────────────────────────────────┐
│  GitHub Pages (Static Hosting)                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  SPA (Single Page Application)                │  │
│  │  - Kartenverwaltung UI                        │  │
│  │  - Preistabelle mit Sortierung/Filter         │  │
│  │  - Excel Import (client-side)                 │  │
│  │  - OCR Karten-Scan (client-side)              │  │
│  └───────────────────┬───────────────────────────┘  │
│                      │ lädt                          │
│  ┌───────────────────▼───────────────────────────┐  │
│  │  /data/ (JSON-Dateien im Repo)                │  │
│  │  - cards.json      (Kartenstammdaten)         │  │
│  │  - user-cards.json (Meine Sammlung)           │  │
│  │  - prices/         (Preishistorie pro Tag)    │  │
│  │  - prices-latest.json (aktueller Snapshot)    │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  GitHub Actions (Cron-basierter "Backend-Ersatz")   │
│  - Täglicher Preis-Sync von Börsen-APIs             │
│  - Schreibt aktualisierte JSON-Dateien              │
│  - Committet & pusht → triggert Rebuild             │
└─────────────────────────────────────────────────────┘
```

## Tech-Stack

| Schicht          | Technologie                | Begründung                                    |
|------------------|----------------------------|-----------------------------------------------|
| **Framework**    | React + Vite (oder Next.js static export) | Schnell, großes Ecosystem, Static Export möglich |
| **Styling**      | Tailwind CSS + shadcn/ui   | Moderne UI-Komponenten, geringer Aufwand      |
| **Tabelle**      | TanStack Table             | Sortierung, Filter, Pagination out-of-the-box |
| **Charts**       | Sparkline-Lib (z.B. recharts, lightweight) | Kursverlauf-Miniatur pro Karte       |
| **Datenhaltung** | JSON-Dateien im Git-Repo   | Versioniert, kostenlos, unkritische Daten     |
| **Preis-Sync**   | GitHub Actions (Cron)      | Täglich/stündlich Preise abrufen              |
| **Excel Import** | SheetJS (xlsx)             | Client-side Excel Parsing                     |
| **OCR**          | Tesseract.js (WASM)       | Läuft im Browser, kein Server nötig           |
| **Hosting**      | GitHub Pages               | Kostenlos, automatisches Deployment           |
| **CI/CD**        | GitHub Actions             | Build + Deploy bei Push                       |

## Projektstruktur

```
/
├── .github/
│   ├── AGENTS.md                  # Diese Datei
│   └── workflows/
│       ├── deploy.yml             # Build & Deploy zu GitHub Pages
│       └── price-sync.yml         # Cron: Täglicher Preis-Abruf
├── data/
│   ├── cards.json                 # Kartenstammdaten (aus API befüllt)
│   ├── user-cards.json            # Nutzer-Sammlung (Karte + Zustand + Kaufpreis)
│   ├── prices-latest.json         # Aktuellster Preis-Snapshot
│   └── prices/
│       ├── 2026-04-10.json        # Tägliche Preissnapshots
│       ├── 2026-04-09.json
│       └── ...
├── prompts/                       # Projekt-Prompts & Recherche
│   └── 01_gemini_deepsearch_prompt.md
├── src/
│   ├── app/                       # Seiten / Routing
│   │   ├── page.tsx               # Dashboard / Haupttabelle
│   │   ├── cards/
│   │   │   ├── page.tsx           # Kartenverwaltung
│   │   │   └── [id]/page.tsx      # Kartendetail mit Preisverlauf
│   │   ├── import/
│   │   │   └── page.tsx           # Excel-Import & OCR-Scan
│   │   └── layout.tsx             # App Layout
│   ├── components/
│   │   ├── ui/                    # shadcn/ui Komponenten
│   │   ├── CardTable.tsx          # Haupttabelle mit TanStack Table
│   │   ├── PriceIndicator.tsx     # Rot/Grün Hoch/Tief mit Prozent
│   │   ├── PriceSparkline.tsx     # Mini-Kursverlauf
│   │   ├── CardForm.tsx           # Karten-Eingabeformular
│   │   ├── ExcelImport.tsx        # Drag&Drop Excel Upload
│   │   ├── OcrScanner.tsx         # Kamera + Tesseract.js
│   │   └── CurrencyBadge.tsx      # Währungsanzeige (USD, EUR, JPY)
│   ├── lib/
│   │   ├── data-loader.ts         # JSON-Dateien laden (fetch /data/*.json)
│   │   ├── price-utils.ts         # Preisberechnung, Differenzen, Prozent
│   │   ├── excel-parser.ts        # SheetJS Import/Export Logik
│   │   ├── ocr-engine.ts          # Tesseract.js Wrapper
│   │   ├── card-matcher.ts        # OCR-Ergebnis → Karte zuordnen
│   │   └── types.ts               # TypeScript Interfaces
│   └── styles/
│       └── globals.css
├── scripts/
│   └── sync-prices.ts             # Script für GitHub Action: Preise abrufen
├── public/
│   └── ...
├── package.json
├── tsconfig.json
├── vite.config.ts (oder next.config.js)
└── README.md
```

## Datenmodell (JSON-Dateien)

### data/cards.json – Kartenstammdaten
```json
[
  {
    "id": "base1-4",
    "name": "Charizard",
    "localName": "Glurak",
    "set": "Base Set",
    "setCode": "base1",
    "number": "4/102",
    "rarity": "Rare Holo",
    "supertype": "Pokémon",
    "artist": "Mitsuhiro Arita",
    "images": {
      "small": "https://images.pokemontcg.io/base1/4.png",
      "large": "https://images.pokemontcg.io/base1/4_hires.png"
    }
  }
]
```

### data/user-cards.json – Meine Sammlung
```json
[
  {
    "id": "uc-001",
    "cardId": "base1-4",
    "owner": "default",
    "condition": "Near Mint",
    "grade": { "service": "PSA", "score": 9 },
    "purchasePrice": 250.00,
    "purchaseCurrency": "EUR",
    "purchaseDate": "2024-03-15",
    "notes": "Gekauft auf Cardmarket"
  }
]
```

### data/prices-latest.json – Aktueller Preis-Snapshot
```json
{
  "syncedAt": "2026-04-10T06:00:00Z",
  "prices": {
    "base1-4": {
      "sources": [
        {
          "source": "cardmarket",
          "currency": "EUR",
          "priceTrend": 320.50,
          "priceAvg30": 315.00,
          "priceLow": 280.00,
          "url": "https://www.cardmarket.com/en/Pokemon/Products/Singles/Base-Set/Charizard"
        },
        {
          "source": "tcgplayer",
          "currency": "USD",
          "market": 345.00,
          "low": 299.99,
          "mid": 340.00,
          "url": "https://www.tcgplayer.com/product/12345"
        }
      ]
    }
  }
}
```

### data/prices/YYYY-MM-DD.json – Tägliche Snapshots
Gleiches Format wie `prices-latest.json`, archiviert pro Tag für Historienvergleich.

## Coding-Konventionen

- **Sprache:** TypeScript (strict mode)
- **Komponenten:** Funktionale React-Komponenten mit Hooks
- **Styling:** Tailwind CSS Utility Classes, keine CSS-Module
- **Formatting:** Prettier (2 Spaces, Semicolons, Single Quotes)
- **Naming:**
  - Dateien: kebab-case (`price-utils.ts`)
  - Komponenten: PascalCase (`CardTable.tsx`)
  - Funktionen/Variablen: camelCase
  - Typen/Interfaces: PascalCase mit `I`-Prefix nur wenn nötig
- **Daten:** Immutable Patterns, kein direktes Mutieren von State
- **Fehlerbehandlung:** Graceful Degradation – UI zeigt Fallback wenn Preisdaten fehlen

## GitHub Actions – Preis-Sync Workflow

```yaml
# .github/workflows/price-sync.yml
name: Daily Price Sync
on:
  schedule:
    - cron: '0 6 * * *'   # Täglich um 06:00 UTC
  workflow_dispatch:        # Manuell auslösbar

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx tsx scripts/sync-prices.ts
        env:
          POKEMON_TCG_API_KEY: ${{ secrets.POKEMON_TCG_API_KEY }}
      - name: Commit updated prices
        run: |
          git config user.name "price-bot"
          git config user.email "bot@pokemon-tracker"
          git add data/
          git diff --staged --quiet || git commit -m "chore: price sync $(date -I)"
          git push
```

## Feature-Phasen

### Phase 1 – MVP (Must Have)
- [ ] Projektsetup (Vite/Next.js + Tailwind + shadcn/ui)
- [ ] Datenmodell als JSON-Dateien definieren
- [ ] Kartentabelle mit TanStack Table (sortier-/filterbar)
- [ ] Preisanzeige: aktuell + Vortag + Woche + Monat + Jahr
- [ ] Rot/Grün Indikatoren mit Prozent
- [ ] Währungsanzeige + Direktlink zur Börse
- [ ] GitHub Actions Preis-Sync (pokemontcg.io + Cardmarket/TCGPlayer)
- [ ] GitHub Pages Deployment

### Phase 2 – Kartenverwaltung
- [ ] Karten-Eingabeformular (UI)
- [ ] Kartensuche (Autocomplete via pokemontcg.io Daten)
- [ ] Karten einem Nutzer/Sammlung zuweisen
- [ ] Zustandsbewertung (NM, LP, MP, HP, DMG) + optionales Grading
- [ ] JSON-Daten per GitHub API committen (PAT im localStorage)

### Phase 3 – Import/Export
- [ ] Excel-Import (Drag & Drop, SheetJS)
- [ ] Excel-Template Download
- [ ] Validierung + Fehlerfeedback beim Import
- [ ] CSV/Excel Export der Sammlung

### Phase 4 – OCR Karten-Scan
- [ ] Kamera-Zugriff via WebRTC/MediaDevices
- [ ] Tesseract.js WASM Integration
- [ ] Kartenname + Set-Nummer erkennen
- [ ] Abgleich mit Kartendatenbank → Vorschlag zur Bestätigung
- [ ] Optional: Bildvergleich mit pokemontcg.io Kartenbildern

### Phase 5 – Polish & Erweiterung
- [ ] Dashboard mit Gesamtwert, Top-Gewinner, Top-Verlierer
- [ ] Mini-Sparkline Charts pro Karte
- [ ] Dark Mode
- [ ] Mobile Optimierung
- [ ] PWA (Offline-Support, Installierbar)
- [ ] Mehrere Sammlungen / Nutzer unterstützen

## Wichtige API-Quellen

| API | Zweck | Auth | Kosten | Rate Limit |
|-----|-------|------|--------|------------|
| [pokemontcg.io](https://pokemontcg.io/) | Kartenstammdaten + Bilder + TCGPlayer-Preise | API Key (kostenlos) | Gratis | 20.000/Tag |
| [Cardmarket API](https://www.cardmarket.com/en/Pokemon) | EU-Preise (EUR) | Prüfen (ggf. Scraping via Action) | Prüfen | Prüfen |
| [TCGPlayer API](https://docs.tcgplayer.com/) | US-Preise (USD) | Via pokemontcg.io oder direkt | Gratis-Tier | Prüfen |
| [PriceCharting](https://www.pricecharting.com/) | Preistrends, historisch | Prüfen | Teils gratis | Prüfen |

## Hinweise für den Agenten

1. **Keine Secrets in Code einchecken.** API-Keys nur in GitHub Secrets oder `.env.local` (gitignored).
2. **Daten-Dateien im /data/ Ordner** sind bewusst eingecheckt – sie sind unkritisch und sollen versioniert werden.
3. **Client-Side First:** Alles was im Browser laufen kann, soll im Browser laufen. GitHub Actions nur für geplante Preis-Updates.
4. **Kosten = 0:** Das gesamte Projekt soll im GitHub Free Tier laufen (Pages + Actions + Repo).
5. **Graceful Degradation:** Wenn eine Preisquelle nicht liefert, Fallback-Werte oder "N/A" anzeigen, nicht crashen.
6. **Keine Over-Engineering:** Kein Auth-System, kein eigener Server, keine Datenbank. JSON-Dateien reichen.
7. **Inkrementell bauen:** Immer erst Phase 1 vollständig fertigstellen, bevor Phase 2 beginnt.
