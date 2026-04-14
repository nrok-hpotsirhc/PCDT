<div align="center">

# Pokémon Card Portfolio Tracker (PCDT)

Track your Pokémon card collection's market value with live Cardmarket (EUR) prices.

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

</div>

---

## What is this?

A **zero-cost**, serverless web app for tracking Pokémon TCG card portfolios. It runs entirely as a static site on GitHub Pages with daily automated price updates via GitHub Actions.

**Key features:**

- Live card search via [pokemontcg.io](https://pokemontcg.io/) API (17,000+ cards)
- Cardmarket prices in EUR (trend price, average, low)
- Search by card name **or** set code + number (e.g. `PAL 072`, `BS 4`)
- Sortable/filterable portfolio table with price trends
- Dashboard with total portfolio value and top gainers/losers
- Excel/CSV import & export
- OCR card scanner (camera-based, runs in-browser)
- Dark mode (auto-detected from OS)
- Bilingual UI: German (default) and English

---

## Prerequisites

- [Node.js](https://nodejs.org/) **>= 20**
- npm >= 10
- A [GitHub](https://github.com/) account (for deployment)

---

## Deploy your own instance

### 1. Fork or clone the repository

```bash
# Option A: Fork on GitHub, then clone your fork
git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
cd <YOUR_REPO_NAME>

# Option B: Clone directly and push to your own repo
git clone https://github.com/nrok-hpotsirhc/PCDT.git my-pokemon-tracker
cd my-pokemon-tracker
git remote set-url origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

### 2. Update the base path

`app/vite.config.ts` already uses a relative base so the build keeps working even if you rename the repository:

```ts
export default defineConfig({
  // ...
  base: './',
});
```

### 3. Install dependencies & verify locally

```bash
cd app
npm install
npm run dev
```

Open `http://localhost:5173/<YOUR_REPO_NAME>/` in your browser.

### 4. Enable GitHub Pages

1. Go to your repo on GitHub → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Push to `main` — the included `.github/workflows/deploy.yml` will build and deploy automatically

Your site will be live at `https://<YOUR_USERNAME>.github.io/<YOUR_REPO_NAME>/`.

### 5. Enable daily price sync (optional)

The repository includes a GitHub Actions workflow (`.github/workflows/price-sync.yml`) that updates card prices daily at 06:00 UTC.

- It runs automatically once GitHub Actions is enabled on your fork
- You can also trigger it manually: **Actions** → **Daily Price Sync** → **Run workflow**
- Prices are committed to `data/prices-latest.json` and archived under `data/prices/`

---

## Usage guide

### Adding cards

1. Click the **+** / **Add card** button
2. Type a card name (e.g. `Charizard`) or a **set code + number** (e.g. `PAL 072`)
3. Select from the dropdown — click **"+N more"** to see all results
4. Set condition, variant, quantity, owner, and optional purchase info
5. Save

### Search syntax

| Input | Effect |
|-------|--------|
| `Pikachu` | Searches by card name |
| `PAL 072` | Searches by set code (PTCGO code) + collector number |
| `BS 4` | Base Set card #4 |

### Portfolio table

- Click column headers to **sort**
- Use the search bar to **filter** across all columns
- Price columns show: From (lowest listing), Trend, Ø 1d, Ø 7d, Ø 30d

### Excel import

- Drag & drop an `.xlsx` or `.csv` file, or click to browse
- Download the template first for the expected column format
- Existing cards are matched by card ID; new ones are added

### Language

Click the **DE / EN** toggle button in the top-right header to switch between German and English.

---

## Deploy on a Raspberry Pi (self-hosted)

You can host the app on a Raspberry Pi in your local network. Every device on your Wi-Fi can then open it in the browser — no GitHub Pages needed.

### What you need

- Raspberry Pi (any model with network, e.g. Pi 3 / 4 / 5 / Zero 2 W)
- Raspberry Pi OS (Lite or Desktop) installed and connected to your network
- SSH access **or** keyboard + monitor attached

### Step 1 — Install Node.js on the Pi

Connect to your Pi via SSH (or open a terminal on the Pi):

```bash
ssh pi@raspberrypi.local
# Default password: raspberry (change it with `passwd` if you haven't)
```

Install Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
```

Verify:

```bash
node -v   # should print v20.x.x
npm -v    # should print 10.x.x
```

### Step 2 — Clone the repository

```bash
cd ~
git clone https://github.com/nrok-hpotsirhc/PCDT.git
cd PCDT
```

> If you have your own fork, replace the URL with your fork's URL.

### Step 3 — Verify the base path

The default config already uses a relative base, so you can leave it as-is:

```bash
nano app/vite.config.ts
```

```ts
  base: './',
```

Save with `Ctrl+O`, `Enter`, then exit with `Ctrl+X`.

### Step 4 — Build the app

```bash
cd app
npm install
npm run build
```

This creates a `dist/` folder with the finished website files.

### Step 5 — Install and configure Nginx

```bash
sudo apt-get install -y nginx
```

Create a config file for the app:

```bash
sudo nano /etc/nginx/sites-available/pokemon-tracker
```

Paste this (replace `pi` with your username if different):

```nginx
server {
    listen 80;
    server_name _;

    root /home/pi/PCDT/app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

Enable the site and disable the default:

```bash
sudo ln -sf /etc/nginx/sites-available/pokemon-tracker /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t            # should say "syntax is ok"
sudo systemctl restart nginx
```

### Step 6 — Open in your browser

Find your Pi's IP address:

```bash
hostname -I
# Example output: 192.168.1.42
```

On **any device** in your network, open:

```
http://192.168.1.42
```

or if mDNS works on your network:

```
http://raspberrypi.local
```

Done! The Pokémon Card Tracker is now running on your Pi.

### Step 7 — Auto-start on boot (already done)

Nginx starts automatically on boot by default. Your app is a static site — no extra process to manage.

### Updating the app later

```bash
cd ~/PCDT
git pull
cd app
npm install
npm run build
# That's it — Nginx serves the new files immediately
```

### Optional: access from the internet

If you want to access your Pi from outside your home network:

1. Set up **port forwarding** on your router (forward port 80 to your Pi's IP)
2. Use a **free dynamic DNS** service like [DuckDNS](https://www.duckdns.org/) so you don't need to remember your IP
3. For HTTPS, install [Certbot](https://certbot.eff.org/): `sudo apt install certbot python3-certbot-nginx` then `sudo certbot --nginx`

> **Security note:** Exposing a Pi to the internet requires keeping the OS and Nginx updated. For home use, local-only access is recommended.

---

## Project structure

```
├── app/                        # React SPA (Vite)
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # API client, i18n, types, utilities
│   │   └── styles/             # Global CSS (Tailwind)
│   └── vite.config.ts          # Vite config (base path here)
├── data/                       # JSON data (served as static files)
│   ├── user-cards.json         # Your card collection
│   ├── prices-latest.json      # Latest price snapshot
│   └── prices/                 # Daily price archives
├── scripts/
│   └── sync-prices.ts          # Price sync script (used by Actions)
└── .github/workflows/
    ├── deploy.yml              # Build & deploy to GitHub Pages
    └── price-sync.yml          # Daily price sync cron (06:00 UTC)
```

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19, TypeScript 5.8, Vite 6 |
| Styling | Tailwind CSS 4 |
| Table | TanStack Table v8 |
| Prices | [pokemontcg.io](https://pokemontcg.io/) API (Cardmarket EUR) |
| OCR | Tesseract.js (WASM, browser-only) |
| Import/Export | SheetJS (xlsx) |
| Hosting | GitHub Pages (free) |
| CI/CD | GitHub Actions |

---

## License

MIT — see [LICENSE](LICENSE).

> Pokémon and all related trademarks are property of The Pokémon Company. Prices are sourced from Cardmarket via pokemontcg.io. This project is not officially affiliated.

</div>
