# Gemini Deep Search Prompt – Pokémon Card Portfolio Tracker

> **Modus:** Deep Search / Thinking Mode  
> **Ziel:** Lückenlose Recherche als Grundlage für ein vollständiges Spezifikations- und Requirements-Engineering-Dokument

---

## Kontext & Aufgabenstellung

Ich plane die Entwicklung einer Webanwendung ("Pokémon Card Portfolio Tracker"), mit der Nutzer:
- Den aktuellen Börsenwert ihrer physischen Pokémon-Sammelkarten einsehen können
- Virtuelle Abbilder ihrer echten Karten in der Anwendung pflegen und einem Nutzerkonto zuweisen können
- Karten filtern, sortieren und deren Wertentwicklung verfolgen können

### Kernfeatures der Anwendung:
1. **Karten-Portfolio-Verwaltung:** Nutzer können virtuelle Versionen ihrer echten Pokémon-Karten einpflegen und einem Benutzerkonto zuordnen
2. **Echtzeit-Marktpreise:** Jede Karte zeigt den aktuellen Marktwert, bezogen von einer oder mehreren Pokémon-Karten-Börsen
3. **Historische Wertentwicklung:** Pro Karte wird angezeigt:
   - Aktueller Wert
   - Wert vom Vortag
   - Wert der Vorwoche
   - Wert des Vormonats
   - Wert des Vorjahres
   - Jeweils mit prozentualer Veränderung und Hoch/Tief-Indikator (grün = Gewinn, rot = Verlust)
4. **Währungsanzeige:** Wert immer in Originalwährung der Börse mit Währungskennzeichen (z. B. USD, EUR, JPY)
5. **Direktlink zur Börse:** Der aktuelle Preis ist ein klickbarer Link zur jeweiligen Karte auf der Preisquelle/Börse
6. **Sortierbare Tabelle:** Initial absteigende Sortierung nach aktuellem Kartenwert; umschaltbar z. B. nach größtem Preisgewinn, Verlust, alphabetisch, Set, etc.
7. **Karten-Eingabe:** Über ein UI-Formular sowie über Excel-Import (Massenimport)
8. **OCR-Kartenscan-Plugin:** Ein Low-Cost-Plugin, das mittels OCR physische Karten digitalisiert und automatisch erkennt (Kartenname, Set, Nummer, Edition, Zustand)

---

## Anweisungen an Gemini Deep Search

Führe eine **tiefgreifende, lückenlose Recherche** zu allen unten aufgeführten Perspektiven und Themenbereichen durch. Dein Output soll so umfassend und detailliert sein, dass daraus direkt ein vollständiges Spezifikations- und Requirements-Dokument abgeleitet werden kann. Lasse **keinen** relevanten Aspekt aus. Strukturiere deine Ergebnisse klar nach den drei Perspektiven.

---

## PERSPEKTIVE 1: Pokémon-Karten-Experte & Marktanalyst

Recherchiere und beantworte aus der Sicht eines erfahrenen Pokémon-TCG-Sammlers und Marktkenners **alle** folgenden Punkte:

### 1.1 Pokémon-Karten-Identifikation & Taxonomie
- Wie sind Pokémon-Karten eindeutig identifizierbar? (Set-Nummer, Erweiterung, Edition, Sprache, Holografisch/Nicht-Holografisch, etc.)
- Welche Attribute definieren eine Karte vollständig? (Name, Pokémon-Nr., Set/Erweiterung, Kartennummer im Set, Seltenheitsstufe, Sprache, Edition [1st Edition, Unlimited, etc.], Druckvariante [Holo, Reverse Holo, Full Art, Secret Rare, etc.], Illustrator)
- Wie viele Pokémon-TCG-Erweiterungen/Sets gibt es aktuell? Wie sind sie strukturiert (Serien/Generationen)?
- Was sind die wichtigsten Seltenheitsstufen und wie beeinflussen sie den Wert?
- Welche Rolle spielen Grading-Dienste (PSA, BGS/Beckett, CGC)? Welche Grading-Skalen gibt es? Wie massiv beeinflusst der Zustand/Grade den Preis?
- Gibt es regionale Unterschiede (japanische vs. englische vs. deutsche Karten) hinsichtlich Wert und Identifikation?

### 1.2 Pokémon-Karten-Börsen & Preisquellen
- Welche sind die maßgeblichen Pokémon-Karten-Preisbörsen und Marktplätze weltweit? (z. B. TCGPlayer, Cardmarket, eBay, PriceCharting, PSA Card Values, etc.)
- Welche dieser Plattformen bieten **öffentliche APIs** oder zumindest strukturierte Daten für Preisabfragen?
- Wie wird der "Marktwert" einer Karte typischerweise berechnet? (Market Price, Mid Price, Low Price, Median der letzten Verkäufe, Trending Price, etc.)
- Welche Preis-Kategorien gibt es pro Karte? (Near Mint, Lightly Played, Moderately Played, Heavily Played, Damaged – jeweils mit eigenem Preis?)
- In welcher Währung liefern die verschiedenen Börsen ihre Preise?
- Wie häufig werden Preise aktualisiert? (Echtzeit, täglich, etc.)
- Gibt es kostenlose vs. kostenpflichtige API-Zugänge? Rate Limits? Nutzungsbedingungen für kommerzielle/private Nutzung?
- Welche Preisquelle gilt in der Community als am zuverlässigsten?

### 1.3 Marktdynamik & Werttreiber
- Was sind die wichtigsten Faktoren, die den Wert einer Pokémon-Karte beeinflussen? (Seltenheit, Zustand, Meta-Relevanz im Spiel, Nostalgie, Influencer-Hype, Turniere, Reprints, etc.)
- Wie volatil ist der Pokémon-Karten-Markt? Gibt es typische saisonale Schwankungen?
- Welche Karten/Sets sind aktuell die wertvollsten? (Top-10 teuerste Karten als Orientierung)
- Wie verhält sich der Markt bei Neuerscheinungen vs. Vintage-Karten?

### 1.4 Kartenerkennung & Zustand
- Wie erkennt man Pokémon-Karten visuell? Welche visuellen Merkmale sind für OCR/Bilderkennung relevant? (Set-Symbol, Kartennummer unten links/rechts, Name oben, HP, etc.)
- Wo stehen auf der physischen Karte die identifizierenden Informationen (Set-Nummer, Edition-Symbol, Erweiterungs-Symbol)?
- Wie wird der Zustand einer Karte bewertet (Centering, Ecken, Oberfläche, Kanten)?
- Gibt es Open-Source-Datensätze oder APIs für Kartenbilder und -daten? (z. B. pokemontcg.io, PokéAPI, etc.)

---

## PERSPEKTIVE 2: Erfahrener Fullstack-Softwareentwickler

Recherchiere und beantworte aus der Sicht eines Senior Fullstack-Entwicklers **alle** folgenden Punkte:

### 2.1 Technologie-Stack-Analyse
- Welche modernen Web-Frameworks eignen sich für ein solches Projekt? Bewerte:
  - **Frontend:** React, Vue.js, Svelte, Angular, Next.js, Nuxt.js – Vor-/Nachteile für diesen Use Case
  - **Backend:** Node.js (Express/Fastify/NestJS), Python (FastAPI/Django), Go, .NET – Vor-/Nachteile
  - **Datenbank:** PostgreSQL, MongoDB, SQLite, Supabase, PlanetScale – was eignet sich für Kartendaten + historische Preisdaten?
  - **Full-Stack-Frameworks:** Next.js, Nuxt.js, SvelteKit, T3 Stack, Remix – Bewertung für Solo-Entwickler/Kleinprojekt
- Welche Low-Cost/Free-Tier Hosting-Optionen gibt es? (Vercel, Netlify, Railway, Fly.io, Supabase, PlanetScale Free Tier, etc.)
- Welche ORM/Datenbank-Tools sind empfehlenswert? (Prisma, Drizzle, TypeORM, Sequelize, SQLAlchemy)

### 2.2 API-Integration & Preisdaten
- Wie kann man Preisdaten von TCGPlayer, Cardmarket, PriceCharting etc. technisch abrufen?
  - Offizielle APIs: Dokumentation, Auth-Methoden, Rate Limits, Kosten
  - Inoffizielle Methoden: Web Scraping (rechtliche Aspekte!), RSS-Feeds, etc.
- Welche Pokemon-TCG-Daten-APIs gibt es? (pokemontcg.io API – Features, Limits, Datenumfang)
- Wie strukturiert man eine Datenbank für historische Preisdaten effizient? (Zeitreihendaten, Aggregation, Speicherbedarf)
- Welche Caching-Strategien sind sinnvoll um API-Calls zu minimieren?
- Wie implementiert man einen zuverlässigen Preis-Sync-Job? (Cron Jobs, Background Workers, Queues)

### 2.3 OCR & Kartenerkennung (Low-Cost)
- Welche OCR-Engines/Bibliotheken eignen sich? (Tesseract, Google Cloud Vision, AWS Textract, Apple Vision Framework, EasyOCR, PaddleOCR)
- Gibt es spezialisierte Pokémon-Karten-Erkennungs-Projekte oder ML-Modelle auf GitHub/HuggingFace?
- Wie kann man mit Computer Vision den Kartennamen, die Set-Nummer und das Set-Symbol erkennen?
- Welche Low-Cost-Varianten gibt es? (On-Device OCR im Browser via WASM, Tesseract.js, etc.)
- Wie zuverlässig ist OCR bei verschiedenen Kartenlayouts (alte vs. neue Karten, verschiedene Sprachen)?
- Könnte man ein vortrainiertes Modell (z. B. YOLO, TensorFlow.js) für Kartenerkennung einsetzen?
- Mobile Kamera-Integration: Wie realisiert man einen Karten-Scan via Smartphone-Kamera im Browser?

### 2.4 Excel-Import/Export
- Welche Libraries eignen sich für Excel-Parsing? (SheetJS/xlsx, ExcelJS, Papa Parse für CSV, openpyxl für Python)
- Wie sollte das Excel-Template strukturiert sein? (Pflichtfelder, Validierung, Fehlerbehandlung)
- Wie geht man mit fehlerhaften/unvollständigen Daten beim Import um?
- Soll auch ein Export (z. B. Portfolio als Excel/CSV) möglich sein?

### 2.5 Authentifizierung & Nutzerverwaltung
- Welche Auth-Lösungen eignen sich für ein Kleinprojekt? (NextAuth/Auth.js, Clerk, Supabase Auth, Firebase Auth, Lucia)
- Braucht man Rollen (Admin, Nutzer)? Multi-Tenancy?
- Datenschutz (DSGVO) bei Nutzerdaten und Sammlungsdaten

### 2.6 UI/UX-Patterns
- Welche UI-Component-Libraries eignen sich? (shadcn/ui, Radix, MUI, Ant Design, Mantine, DaisyUI)
- Best Practices für Finanz-/Börsen-Dashboards (Farben, Indikatoren, Responsive Design)
- Wie stellt man Kursverläufe visuell dar? (Sparklines, Mini-Charts, Farbindikatoren)
- Tabellen-Libraries für sortier-/filterbare Tabellen? (TanStack Table, AG Grid, DataTables)
- Mobile Responsiveness für Karten-Scan-Feature

---

## PERSPEKTIVE 3: Erfahrener Software Engineer – Requirements & Spezifikation

Recherchiere und erarbeite aus der Sicht eines erfahrenen Software Engineers **alle** folgenden Punkte:

### 3.1 Funktionale Anforderungen (Functional Requirements)
Erstelle eine **vollständige, nummerierte Liste** aller funktionalen Anforderungen, gruppiert nach Feature-Bereichen:

- **FR-USR:** Nutzerverwaltung (Registrierung, Login, Profil, Rollen)
- **FR-CRD:** Kartenverwaltung (CRUD, Attribute, Validierung, Duplikaterkennung)
- **FR-PRC:** Preisdaten (Abfrage, Historisierung, Caching, Währung, Quellenangabe, Verlinkung)
- **FR-PRT:** Portfolio/Sammlung (Zuordnung Nutzer↔Karten, Gesamtwert, Wertentwicklung)
- **FR-TBL:** Tabellen-/Listenansicht (Sortierung, Filterung, Paginierung, Spaltenauswahl)
- **FR-IMP:** Import/Export (Excel-Import, Template-Download, Validierungsfeedback, Export)
- **FR-OCR:** Kartenscan (Kamera-Zugriff, OCR-Verarbeitung, Ergebnisvorschau, Bestätigung)
- **FR-DSH:** Dashboard (Übersicht, Gesamtwert, Top-Gewinner, Top-Verlierer, Statistiken)

### 3.2 Nicht-Funktionale Anforderungen (Non-Functional Requirements)
- **NFR-PERF:** Performance-Anforderungen (Ladezeiten, API-Response-Zeiten, Skalierbarkeit)
- **NFR-SEC:** Sicherheit (Authentifizierung, Autorisierung, Inputvalidierung, SQL Injection Prevention, XSS, CSRF)
- **NFR-UX:** Usability (Responsiveness, Barrierefreiheit, Offline-Fähigkeit)
- **NFR-REL:** Zuverlässigkeit (Fehlerbehandlung, Fallback bei API-Ausfall, Datenintegrität)
- **NFR-MNT:** Wartbarkeit (Code-Qualität, Testing, CI/CD, Dokumentation)
- **NFR-SCL:** Skalierbarkeit (Wie viele Karten/Nutzer soll das System unterstützen?)
- **NFR-CST:** Kosten (Monatliche Hosting/API-Kosten unter einem Budget halten, z. B. < 20€/Monat)
- **NFR-LEG:** Rechtliches (Nutzung von Preisdaten, Kartenbildern, Pokémon-Marken, Scraping-Legalität)

### 3.3 Datenmodell
- Entwirf ein vollständiges **Entity-Relationship-Modell** mit allen Entitäten:
  - User, Card, CardEdition, CardSet, Series, PriceHistory, UserCard (Zuordnung), PriceSource, Currency
- Definiere alle Attribute pro Entität mit Datentypen
- Definiere alle Beziehungen (1:n, n:m) und Kardinalitäten
- Berücksichtige die effiziente Speicherung von Zeitreihendaten (Preishistorie)

### 3.4 API-Design
- Entwirf die **REST-API-Endpunkte** (oder GraphQL Schema) mit:
  - Alle CRUD-Endpunkte für Karten, Nutzer, Sammlungen
  - Such- und Filter-Endpunkte
  - Preis-Sync-Endpunkte
  - Import/Export-Endpunkte
  - OCR-Endpunkte
- Definiere Request/Response-Formate (JSON-Beispiele)
- Pagination, Sorting, Filtering Patterns

### 3.5 Systemarchitektur
- Erstelle einen **Architekturvorschlag** (Diagramm-Beschreibung):
  - Frontend ↔ Backend ↔ Database
  - Externe APIs (Preisdaten, Kartendaten, OCR)
  - Background Jobs (Preis-Synchronisation)
  - Caching Layer
- Deployment-Architektur (für Low-Cost Self-Hosting oder Cloud)

### 3.6 Arbeitspakete (Work Packages)
Erstelle eine **priorisierte Liste von Arbeitspaketen** mit:
- **ID, Titel, Beschreibung, Abhängigkeiten, Geschätzte Komplexität (S/M/L/XL), Priorität (Must/Should/Could/Won't)**
- Gruppiert in **Phasen/Meilensteine:**
  - **Phase 1 – MVP:** Grundlegende Kartenverwaltung + Preisanzeige
  - **Phase 2 – Portfolio:** Nutzerverwaltung + Sammlungen + Dashboard
  - **Phase 3 – Import:** Excel-Import/Export
  - **Phase 4 – OCR:** Karten-Scan-Plugin
  - **Phase 5 – Polish:** UX-Verbesserungen, Performance, Mobile Optimierung

### 3.7 Risiken & offene Fragen
- Identifiziere alle technischen und fachlichen **Risiken**
- Liste alle **offenen Fragen**, die vor Projektstart geklärt werden müssen
- Lizenz- und rechtliche Risiken (Pokémon-IP, API-Nutzungsbedingungen, DSGVO)

---

## Output-Anforderungen an Gemini

1. **Vollständigkeit:** Lasse keinen der oben genannten Punkte aus. Recherchiere zu jedem Punkt gründlich.
2. **Quellenangaben:** Gib zu jeder Recherche-Erkenntnis die Quelle an (URL, API-Dokumentation, etc.)
3. **Aktualität:** Stelle sicher, dass alle Informationen aktuell sind (Stand 2025/2026)
4. **Strukturierung:** Halte dich exakt an die oben vorgegebene Gliederung (Perspektive 1/2/3 mit Unterpunkten)
5. **Praxis-Relevanz:** Gib konkrete Empfehlungen, nicht nur theoretische Optionen
6. **Vergleichstabellen:** Erstelle wo sinnvoll Vergleichstabellen (z. B. API-Vergleich, Framework-Vergleich, Hosting-Vergleich)
7. **Sprache:** Deutsch

---

*Diese Prompt wurde erstellt als Grundlage für das Projekt "Pokémon Card Portfolio Tracker" – ein Tool zur Verwaltung und Wertüberwachung von Pokémon-Sammelkarten mit Echtzeit-Börsendaten.*
