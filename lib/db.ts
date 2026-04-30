import { neon } from '@neondatabase/serverless'
import type { Receipt, Category, MonthlyTotals } from './types'
import { format, parseISO } from 'date-fns'

function getSQL() {
  if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL is not set')
  return neon(process.env.POSTGRES_URL, { fullResults: true })
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
  const result = await sql`
    SELECT * FROM receipts ORDER BY date DESC, created_at DESC
  `
  return result.rows as Receipt[]
}

export async function getReceiptsByMonth(month?: string): Promise<Receipt[]> {
  if (month) {
    const sql = getSQL()
    const result = await sql`
      SELECT * FROM receipts
      WHERE TO_CHAR(date, 'YYYY-MM') = ${month}
      ORDER BY date DESC
    `
    return result.rows as Receipt[]
  }
  return getAllReceipts()
}

export async function getReceiptById(id: number): Promise<Receipt | null> {
  const sql = getSQL()
  const result = await sql`SELECT * FROM receipts WHERE id = ${id}`
  return (result.rows[0] as Receipt) ?? null
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
  const result = await sql`
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
  return result.rows[0] as Receipt
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
  const result = await sql`
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
  return (result.rows[0] as Receipt) ?? null
}

export async function deleteReceipt(id: number): Promise<boolean> {
  const sql = getSQL()
  const result = await sql`DELETE FROM receipts WHERE id = ${id}`
  return (result.rowCount ?? 0) > 0
}

export async function getMonthlyTotals(): Promise<MonthlyTotals[]> {
  const sql = getSQL()
  const result = await sql`
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

  return result.rows.map((r: Record<string, string>) => ({
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
