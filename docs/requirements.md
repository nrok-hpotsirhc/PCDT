# Pokémon Card Portfolio Tracker – Requirements & Arbeitspakete

## 1. Funktionale Anforderungen

### FR-TBL: Kartentabelle (Hauptansicht)
| ID | Anforderung | Priorität |
|----|------------|-----------|
| FR-TBL-01 | Tabelle zeigt alle Karten der Sammlung mit Bild-Thumbnail, Name, Set, Nummer, Seltenheit | Must |
| FR-TBL-02 | Aktueller Marktwert pro Karte mit Originalwährung (EUR/USD) und Währungskennzeichen | Must |
| FR-TBL-03 | Wert vom Vortag, Vorwoche, Vormonat, Vorjahr als separate Spalten | Must |
| FR-TBL-04 | Prozentuale Veränderung pro Zeitraum mit Hoch/Tief-Indikator (grün ▲ / rot ▼) | Must |
| FR-TBL-05 | Aktueller Preis als klickbarer Link zur Karte auf der Preisquelle/Börse | Must |
| FR-TBL-06 | Initiale Sortierung nach aktuellem Kartenwert absteigend | Must |
| FR-TBL-07 | Sortierung umschaltbar nach: Wert, Preisgewinn %, Preisverlust %, Name, Set, Seltenheit | Must |
| FR-TBL-08 | Filterung nach: Set, Seltenheit, Zustand, Besitzer, Preisbereich | Should |
| FR-TBL-09 | Freitextsuche über Kartenname | Should |
| FR-TBL-10 | Paginierung oder virtualisiertes Scrolling bei >100 Karten | Should |

### FR-CRD: Kartenverwaltung
| ID | Anforderung | Priorität |
|----|------------|-----------|
| FR-CRD-01 | Karten per UI-Formular neu anlegen (Name, Set, Nummer, Zustand, Besitzer) | Must |
| FR-CRD-02 | Kartensuche mit Autocomplete aus pokemontcg.io Stammdaten | Must |
| FR-CRD-03 | Zustandsbewertung: Near Mint, Lightly Played, Moderately Played, Heavily Played, Damaged | Must |
| FR-CRD-04 | Optionales Grading: Service (PSA/BGS/CGC) + Score | Should |
| FR-CRD-05 | Kaufpreis und Kaufdatum erfassen | Should |
| FR-CRD-06 | Karte einem Besitzer/Nutzer zuweisen | Must |
| FR-CRD-07 | Karten bearbeiten und löschen | Must |
| FR-CRD-08 | Kartendetailseite mit Preisverlauf-Chart | Should |
| FR-CRD-09 | Duplikaterkennung (gleiche Karte + gleicher Zustand warnen) | Could |

### FR-PRC: Preisdaten
| ID | Anforderung | Priorität |
|----|------------|-----------|
| FR-PRC-01 | Täglicher automatischer Preis-Sync via GitHub Actions | Must |
| FR-PRC-02 | Preise von pokemontcg.io API (TCGPlayer-Preise integriert) | Must |
| FR-PRC-03 | Preishistorie als tägliche JSON-Snapshots im Repo gespeichert | Must |
| FR-PRC-04 | Berechnung der Differenz: aktuell vs. Vortag/Woche/Monat/Jahr | Must |
| FR-PRC-05 | Anzeige der Originalwährung der Preisquelle (USD für TCGPlayer) | Must |
| FR-PRC-06 | Direkter Link zur Karte auf der Börse (TCGPlayer URL) | Must |
| FR-PRC-07 | Fallback wenn Preis nicht verfügbar: "N/A" statt Absturz | Must |
| FR-PRC-08 | Cardmarket-Preise als zweite Quelle (EUR) – wenn API zugänglich | Could |

### FR-IMP: Import/Export
| ID | Anforderung | Priorität |
|----|------------|-----------|
| FR-IMP-01 | Excel-Import via Drag & Drop (XLSX, CSV) | Must |
| FR-IMP-02 | Template-Datei zum Download bereitstellen | Must |
| FR-IMP-03 | Validierung beim Import mit Fehlerfeedback pro Zeile | Must |
| FR-IMP-04 | Pflichtfelder: Kartenname, Set-Code, Collector Number, Zustand, Menge | Must |
| FR-IMP-05 | Fuzzy-Matching: Kartennamen gegen pokemontcg.io Daten abgleichen | Should |
| FR-IMP-06 | CSV/Excel Export der gesamten Sammlung | Should |

### FR-OCR: Karten-Scan (Phase 4)
| ID | Anforderung | Priorität |
|----|------------|-----------|
| FR-OCR-01 | Kamera-Zugriff via Browser (WebRTC / MediaDevices API) | Could |
| FR-OCR-02 | Tesseract.js WASM: Kartenname + Set-Nummer per OCR erkennen | Could |
| FR-OCR-03 | Erkannten Text gegen Kartendatenbank matchen (Fuzzy-Matching) | Could |
| FR-OCR-04 | Ergebnis-Vorschau mit Bestätigungs-Dialog vor dem Speichern | Could |

### FR-DSH: Dashboard
| ID | Anforderung | Priorität |
|----|------------|-----------|
| FR-DSH-01 | Gesamtwert der Sammlung prominent anzeigen | Should |
| FR-DSH-02 | Top-5 Gewinner und Top-5 Verlierer (24h / 7d) | Should |
| FR-DSH-03 | Mini-Sparkline pro Karte in der Tabelle (30-Tage-Trend) | Could |

---

## 2. Nicht-Funktionale Anforderungen

| ID | Bereich | Anforderung |
|----|---------|------------|
| NFR-01 | Hosting | Vollständig auf GitHub Pages (kostenlos), kein Backend-Server |
| NFR-02 | Kosten | Gesamtkosten = 0 €/Monat (GitHub Free Tier) |
| NFR-03 | Performance | Initiale Ladezeit < 3s, Tabellen-Interaktion < 100ms |
| NFR-04 | Daten | JSON-Dateien im Repo, keine Datenbank, Git-versioniert |
| NFR-05 | Security | Keine Secrets im Code; API-Keys nur in GitHub Secrets |
| NFR-06 | Responsiveness | Mobile-First Design, nutzbar auf Smartphone für OCR-Scan |
| NFR-07 | Resilience | Graceful Degradation bei fehlenden Preisdaten |
| NFR-08 | Legal | Keine kommerzielle Nutzung von Pokémon-IP; rein privates Tool |
| NFR-09 | Legal | pokemontcg.io Bilder nur per URL einbinden (Hotlink), nicht hosten |
| NFR-10 | CI/CD | Automatischer Build+Deploy bei Push via GitHub Actions |

---

## 3. Datenmodell (JSON-basiert)

### cards.json – Kartenstammdaten (aus pokemontcg.io befüllt)
```
Card {
  id: string              // "base1-4" (pokemontcg.io ID)
  name: string            // "Charizard"
  supertype: string       // "Pokémon" | "Trainer" | "Energy"
  subtypes: string[]      // ["Stage 2", "ex"]
  hp: string              // "120"
  types: string[]         // ["Fire"]
  set: {
    id: string            // "base1"
    name: string          // "Base Set"
    series: string        // "Base"
    releaseDate: string   // "1999-01-09"
    images: { symbol, logo }
  }
  number: string          // "4"
  rarity: string          // "Rare Holo"
  artist: string          // "Mitsuhiro Arita"
  images: {
    small: string         // URL zu pokemontcg.io
    large: string
  }
  tcgplayer: {
    url: string           // Direktlink zur Karte
    prices: {             // Preise nach Variante
      holofoil?: { low, mid, high, market }
      reverseHolofoil?: { ... }
      normal?: { ... }
    }
  }
}
```

### user-cards.json – Sammlung
```
UserCard {
  id: string              // "uc-001" (generierte ID)
  cardId: string          // Referenz auf cards.json → Card.id
  owner: string           // Besitzer-Name
  condition: enum         // "NM" | "LP" | "MP" | "HP" | "DMG"
  variant: string         // "holofoil" | "reverseHolofoil" | "normal"
  grade?: {
    service: string       // "PSA" | "BGS" | "CGC"
    score: number         // z.B. 9.5
  }
  quantity: number        // Default: 1
  purchasePrice?: number
  purchaseCurrency?: string
  purchaseDate?: string
  notes?: string
  addedAt: string         // ISO Timestamp
}
```

### prices-latest.json – Aktueller Snapshot
```
PriceSnapshot {
  syncedAt: string        // ISO Timestamp
  prices: {
    [cardId]: {
      tcgplayer: {
        url: string
        currency: "USD"
        prices: {
          holofoil?: { low, mid, high, market }
          reverseHolofoil?: { ... }
          normal?: { ... }
        }
      }
    }
  }
}
```

### prices/YYYY-MM-DD.json – Tägliche Archiv-Snapshots
Gleiches Format, automatisch per GitHub Action erstellt.

---

## 4. Arbeitspakete

### Phase 1 – MVP (Must Have)

| AP | Titel | Beschreibung | Komplexität | Abhängig von |
|----|-------|-------------|-------------|-------------|
| 1.1 | Projektsetup | React + Vite + TypeScript + Tailwind CSS + shadcn/ui | S | – |
| 1.2 | TypeScript Types | Interfaces für Card, UserCard, PriceSnapshot, PriceHistory | S | – |
| 1.3 | Seed-Daten | Beispiel-JSON-Dateien in /data/ mit 5-10 Karten inkl. Preise | S | 1.2 |
| 1.4 | Data-Loader | Fetch-Funktionen für /data/*.json mit Error Handling | M | 1.2 |
| 1.5 | Price-Utils | Berechnung: Diff, Prozent, Hoch/Tief Vergleich über Zeiträume | M | 1.2 |
| 1.6 | App Layout | Header, Navigation, Responsive Shell mit Tailwind | M | 1.1 |
| 1.7 | Kartentabelle | TanStack Table: alle Spalten, Sortierung, Filter | L | 1.4, 1.5 |
| 1.8 | PriceIndicator | Rot/Grün Badge mit ▲/▼ und Prozentanzeige | S | 1.5 |
| 1.9 | CurrencyBadge | Währungsanzeige mit Formatierung (€, $) | S | – |
| 1.10 | Preis-Sync Script | Node.js Script: pokemontcg.io → prices-latest.json + Archiv | L | 1.2 |
| 1.11 | GitHub Actions | deploy.yml + price-sync.yml Workflows | M | 1.10 |
| 1.12 | GitHub Pages Deploy | Vite Build → gh-pages Branch | S | 1.11 |

### Phase 2 – Kartenverwaltung

| AP | Titel | Beschreibung | Komplexität | Abhängig von |
|----|-------|-------------|-------------|-------------|
| 2.1 | Karten-Formular | Eingabemaske: Card-Suche, Zustand, Besitzer, Kaufpreis | M | 1.7 |
| 2.2 | Card-Search Autocomplete | pokemontcg.io Daten durchsuchen, Vorschläge anzeigen | M | 1.3 |
| 2.3 | Karten-CRUD | Hinzufügen / Bearbeiten / Löschen in user-cards.json | M | 2.1 |
| 2.4 | Kartendetailseite | Einzelkarten-Ansicht mit großem Bild + Preisverlauf | M | 1.4 |

### Phase 3 – Import/Export

| AP | Titel | Beschreibung | Komplexität | Abhängig von |
|----|-------|-------------|-------------|-------------|
| 3.1 | Excel-Import UI | Drag & Drop Upload Komponente | M | 1.1 |
| 3.2 | Excel Parser | SheetJS: XLSX/CSV parsen → UserCard[] Validierung | L | 1.2 |
| 3.3 | Import-Template | Downloadbare XLSX-Vorlage mit Pflichtfeldern | S | 3.2 |
| 3.4 | Export | Sammlung als CSV/XLSX exportieren | M | 1.4 |

### Phase 4 – OCR Karten-Scan

| AP | Titel | Beschreibung | Komplexität | Abhängig von |
|----|-------|-------------|-------------|-------------|
| 4.1 | Kamera-Integration | WebRTC MediaDevices, Foto-Capture im Browser | L | 1.1 |
| 4.2 | Tesseract.js Setup | WASM-basierte OCR im Browser | L | – |
| 4.3 | Card-Matcher | OCR-Text → Fuzzy-Match gegen Kartendatenbank | L | 1.3, 4.2 |
| 4.4 | Scan-Bestätigung UI | Vorschau + Bestätigung vor dem Speichern | M | 4.1, 4.3 |

### Phase 5 – Polish

| AP | Titel | Beschreibung | Komplexität | Abhängig von |
|----|-------|-------------|-------------|-------------|
| 5.1 | Dashboard-KPIs | Gesamtwert, Top Gewinner/Verlierer | M | 1.5 |
| 5.2 | Sparkline-Charts | Mini-Kursverlauf pro Karte (30d) via Recharts | M | 1.4 |
| 5.3 | Dark Mode | Tailwind dark: Variante | S | 1.6 |
| 5.4 | PWA | Service Worker, Offline-Cache, Installierbar | M | 1.12 |
| 5.5 | Mobile Optimierung | Touch-Gesten, responsive Tabelle, Karten-Ansicht | M | 1.7 |
