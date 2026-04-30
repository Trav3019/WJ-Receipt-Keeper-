# WJ Receipt Keeper

Receipt management tool for WJ Farming. Upload or photograph receipts, let AI extract the data, organize by month, and export clean Excel reports.

## Features

- **AI Receipt Scanning** — Upload a photo and Claude automatically extracts date, vendor, subtotal, GST, PST, and total
- **Category Tracking** — Organize receipts as Fuel, Food, Tools, Shop, or Other
- **Monthly Dashboard** — Totals by month with per-category breakdown
- **Excel Export** — Export any month (or all receipts) to a formatted `.xlsx` file with two sheets: detailed receipts and monthly summary
- **Image Storage** — Receipt photos stored securely in Vercel Blob

## Setup

### 1. Deploy to Vercel

Push this repo to GitHub, then import it at [vercel.com/new](https://vercel.com/new).

### 2. Add Vercel Integrations

In your Vercel project dashboard → **Storage**:

1. **Postgres** — Create a Postgres database and link it to your project
2. **Blob** — Create a Blob store and link it to your project

These automatically populate the `POSTGRES_*` and `BLOB_READ_WRITE_TOKEN` environment variables.

### 3. Add Anthropic API Key

In Vercel → **Settings → Environment Variables**, add:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Get your key at [console.anthropic.com](https://console.anthropic.com).

### 4. Initialize the Database

After first deployment, visit once:

```
https://your-app.vercel.app/api/setup
```

This creates the `receipts` table. You only need to do this once.

### 5. Local Development

```bash
npm install

# Copy env vars from Vercel (or fill in .env.local manually)
cp .env.example .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. **Add Receipt** — Click "Add Receipt", upload or drag a photo, then click "Scan Receipt"
2. **Review** — Claude fills in the form fields automatically; correct anything it missed
3. **Save** — Pick the category and save
4. **Export** — Click "Export" next to any month, or "Export All" for everything

## Excel Export Format

The exported `.xlsx` file contains two sheets:
- **Receipts** — All receipts grouped by month with subtotals and a grand total
- **Monthly Summary** — One row per month showing totals broken down by category (Fuel / Food / Tools / Shop / Other)

## Tech Stack

- [Next.js 14](https://nextjs.org) (App Router) — framework
- [Vercel Postgres](https://vercel.com/storage/postgres) — receipt data
- [Vercel Blob](https://vercel.com/storage/blob) — receipt images
- [Claude claude-sonnet-4-6](https://anthropic.com) — AI receipt scanning
- [ExcelJS](https://github.com/exceljs/exceljs) — Excel generation
- [Tailwind CSS](https://tailwindcss.com) — styling
