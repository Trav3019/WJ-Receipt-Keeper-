import postgres from 'postgres'
import type { Receipt, Category, MonthlyTotals } from './types'
import { format, parseISO } from 'date-fns'

let _sql: ReturnType<typeof postgres> | null = null

function getSQL() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set')
  if (!_sql) {
    _sql = postgres(process.env.DATABASE_URL, {
      max: 1,
      prepare: false, // required for Supabase connection pooler (PgBouncer)
    })
  }
  return _sql
}

export async function initDB() {
  const sql = getSQL()
  await sql`
    CREATE TABLE IF NOT EXISTS receipts (
      id           SERIAL PRIMARY KEY,
      date         DATE        NOT NULL,
      vendor       VARCHAR(255),
      subtotal     DECIMAL(10,2),
      gst          DECIMAL(10,2) NOT NULL DEFAULT 0,
      pst          DECIMAL(10,2) NOT NULL DEFAULT 0,
      total        DECIMAL(10,2) NOT NULL,
      category     VARCHAR(50)   NOT NULL DEFAULT 'other',
      notes        TEXT,
      image_url    TEXT,
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `
}

export async function getAllReceipts(): Promise<Receipt[]> {
  const sql = getSQL()
  const rows = await sql<Receipt[]>`
    SELECT * FROM receipts ORDER BY date DESC, created_at DESC
  `
  return rows
}

export async function getReceiptsByMonth(month?: string): Promise<Receipt[]> {
  if (month) {
    const sql = getSQL()
    const rows = await sql<Receipt[]>`
      SELECT * FROM receipts
      WHERE TO_CHAR(date, 'YYYY-MM') = ${month}
      ORDER BY date DESC
    `
    return rows
  }
  return getAllReceipts()
}

export async function getReceiptById(id: number): Promise<Receipt | null> {
  const sql = getSQL()
  const rows = await sql<Receipt[]>`SELECT * FROM receipts WHERE id = ${id}`
  return rows[0] ?? null
}

export async function createReceipt(data: {
  date: string
  vendor: string | null
  subtotal: number | null
  gst: number
  pst: number
  total: number
  category: Category
  notes: string | null
  image_url: string | null
}): Promise<Receipt> {
  const sql = getSQL()
  const rows = await sql<Receipt[]>`
    INSERT INTO receipts (date, vendor, subtotal, gst, pst, total, category, notes, image_url)
    VALUES (
      ${data.date},
      ${data.vendor},
      ${data.subtotal},
      ${data.gst},
      ${data.pst},
      ${data.total},
      ${data.category},
      ${data.notes},
      ${data.image_url}
    )
    RETURNING *
  `
  return rows[0]
}

export async function updateReceipt(
  id: number,
  data: {
    date: string
    vendor: string | null
    subtotal: number | null
    gst: number
    pst: number
    total: number
    category: Category
    notes: string | null
    image_url: string | null
  }
): Promise<Receipt | null> {
  const sql = getSQL()
  const rows = await sql<Receipt[]>`
    UPDATE receipts
    SET
      date       = ${data.date},
      vendor     = ${data.vendor},
      subtotal   = ${data.subtotal},
      gst        = ${data.gst},
      pst        = ${data.pst},
      total      = ${data.total},
      category   = ${data.category},
      notes      = ${data.notes},
      image_url  = ${data.image_url},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return rows[0] ?? null
}

export async function deleteReceipt(id: number): Promise<boolean> {
  const sql = getSQL()
  const result = await sql`DELETE FROM receipts WHERE id = ${id}`
  return result.count > 0
}

export async function getMonthlyTotals(): Promise<MonthlyTotals[]> {
  const sql = getSQL()
  const rows = await sql<{
    month: string
    total: string
    gst: string
    pst: string
    subtotal: string
    count: string
    fuel: string
    food: string
    tools: string
    shop: string
    other: string
  }[]>`
    SELECT
      TO_CHAR(date, 'YYYY-MM') AS month,
      SUM(total)::text    AS total,
      SUM(gst)::text      AS gst,
      SUM(pst)::text      AS pst,
      SUM(COALESCE(subtotal, total - gst - pst))::text AS subtotal,
      COUNT(*)::text      AS count,
      SUM(CASE WHEN category = 'fuel'  THEN total ELSE 0 END)::text AS fuel,
      SUM(CASE WHEN category = 'food'  THEN total ELSE 0 END)::text AS food,
      SUM(CASE WHEN category = 'tools' THEN total ELSE 0 END)::text AS tools,
      SUM(CASE WHEN category = 'shop'  THEN total ELSE 0 END)::text AS shop,
      SUM(CASE WHEN category = 'other' THEN total ELSE 0 END)::text AS other
    FROM receipts
    GROUP BY TO_CHAR(date, 'YYYY-MM')
    ORDER BY month DESC
  `

  return rows.map((r) => ({
    month: r.month,
    label: format(parseISO(`${r.month}-01`), 'MMMM yyyy'),
    total:    parseFloat(r.total),
    gst:      parseFloat(r.gst),
    pst:      parseFloat(r.pst),
    subtotal: parseFloat(r.subtotal),
    count:    parseInt(r.count),
    byCategory: {
      fuel:  parseFloat(r.fuel),
      food:  parseFloat(r.food),
      tools: parseFloat(r.tools),
      shop:  parseFloat(r.shop),
      other: parseFloat(r.other),
    },
  }))
}
