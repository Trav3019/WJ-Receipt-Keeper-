<<<<<<< HEAD
import { createClient } from '@supabase/supabase-js'
import type { Receipt, Category, MonthlyTotals } from './types'
import { format, parseISO } from 'date-fns'

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  if (!supabaseKey) throw new Error('SUPABASE_SERVICE_KEY is not set')
  
  return createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'public' }
  })
=======
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
>>>>>>> e159f88549132ef4081463b98d035cb7bc9f0c67
}

export async function initDB() {
  const supabase = getSupabase()
  // Create table if not exists using Supabase's SQL runner
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
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
  })
  if (error) console.error('initDB error:', error)
}

export async function getAllReceipts(): Promise<Receipt[]> {
<<<<<<< HEAD
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Receipt[]
=======
  const sql = getSQL()
  const rows = await sql<Receipt[]>`
    SELECT * FROM receipts ORDER BY date DESC, created_at DESC
  `
  return rows
>>>>>>> e159f88549132ef4081463b98d035cb7bc9f0c67
}

export async function getReceiptsByMonth(month?: string): Promise<Receipt[]> {
  const supabase = getSupabase()
  
  if (month) {
<<<<<<< HEAD
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .like('date', `${month}%`)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data as Receipt[]
=======
    const sql = getSQL()
    const rows = await sql<Receipt[]>`
      SELECT * FROM receipts
      WHERE TO_CHAR(date, 'YYYY-MM') = ${month}
      ORDER BY date DESC
    `
    return rows
>>>>>>> e159f88549132ef4081463b98d035cb7bc9f0c67
  }
  return getAllReceipts()
}

export async function getReceiptById(id: number): Promise<Receipt | null> {
<<<<<<< HEAD
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data as Receipt
=======
  const sql = getSQL()
  const rows = await sql<Receipt[]>`SELECT * FROM receipts WHERE id = ${id}`
  return rows[0] ?? null
>>>>>>> e159f88549132ef4081463b98d035cb7bc9f0c67
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
<<<<<<< HEAD
  const supabase = getSupabase()
  const { data: result, error } = await supabase
    .from('receipts')
    .insert({
      date: data.date,
      vendor: data.vendor,
      subtotal: data.subtotal,
      gst: data.gst,
      pst: data.pst,
      total: data.total,
      category: data.category,
      notes: data.notes,
      image_url: data.image_url,
    })
    .select()
    .single()
  
  if (error) throw error
  return result as Receipt
=======
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
>>>>>>> e159f88549132ef4081463b98d035cb7bc9f0c67
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
<<<<<<< HEAD
  const supabase = getSupabase()
  const { data: result, error } = await supabase
    .from('receipts')
    .update({
      date: data.date,
      vendor: data.vendor,
      subtotal: data.subtotal,
      gst: data.gst,
      pst: data.pst,
      total: data.total,
      category: data.category,
      notes: data.notes,
      image_url: data.image_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return result as Receipt
}

export async function deleteReceipt(id: number): Promise<boolean> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('receipts')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}

export async function getMonthlyTotals(): Promise<MonthlyTotals[]> {
  const supabase = getSupabase()
  
  // Use RPC to call a custom function for aggregation
  const { data, error } = await supabase.rpc('get_monthly_totals')
  
  if (error) {
    // Fallback: fetch all and aggregate in JS
    const receipts = await getAllReceipts()
    return aggregateMonthlyTotals(receipts)
  }
  
  return data.map((r: Record<string, string>) => ({
=======
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
>>>>>>> e159f88549132ef4081463b98d035cb7bc9f0c67
    month: r.month,
    label: format(parseISO(`${r.month}-01`), 'MMMM yyyy'),
    total: parseFloat(r.total),
    gst: parseFloat(r.gst),
    pst: parseFloat(r.pst),
    subtotal: parseFloat(r.subtotal),
    count: parseInt(r.count),
    byCategory: {
      fuel: parseFloat(r.fuel),
      food: parseFloat(r.food),
      tools: parseFloat(r.tools),
      shop: parseFloat(r.shop),
      other: parseFloat(r.other),
    },
  }))
}

function aggregateMonthlyTotals(receipts: Receipt[]): MonthlyTotals[] {
  const byMonth: Record<string, MonthlyTotals> = {}
  
  for (const receipt of receipts) {
    const month = receipt.date.substring(0, 7)
    if (!byMonth[month]) {
      byMonth[month] = {
        month,
        label: format(parseISO(`${month}-01`), 'MMMM yyyy'),
        total: 0,
        gst: 0,
        pst: 0,
        subtotal: 0,
        count: 0,
        byCategory: { fuel: 0, food: 0, tools: 0, shop: 0, other: 0 },
      }
    }
    
    const m = byMonth[month]
    m.total += receipt.total
    m.gst += receipt.gst
    m.pst += receipt.pst
    m.subtotal += receipt.subtotal ?? (receipt.total - receipt.gst - receipt.pst)
    m.count++
    m.byCategory[receipt.category] += receipt.total
  }
  
  return Object.values(byMonth).sort((a, b) => b.month.localeCompare(a.month))
}
