import { createClient } from '@supabase/supabase-js'
import type { Receipt, Category, MonthlyTotals } from './types'
import { format, parseISO } from 'date-fns'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function normalize(row: Record<string, unknown>): Receipt {
  return {
    ...row,
    subtotal:     row.subtotal != null ? Number(row.subtotal) : null,
    gst:          Number(row.gst   ?? 0),
    pst:          Number(row.pst   ?? 0),
    total:        Number(row.total ?? 0),
    submitted_by: (row.submitted_by as string) ?? null,
  } as Receipt
}

export async function initDB() {
  // Table is managed via Supabase dashboard
}

export async function getAllReceipts(): Promise<Receipt[]> {
  const { data, error } = await getSupabase()
    .from('receipts')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => normalize(r as Record<string, unknown>))
}

export async function getReceipts(filters: { month?: string; submitter?: string }): Promise<Receipt[]> {
  let query = getSupabase().from('receipts').select('*')

  if (filters.month) {
    const [y, m] = filters.month.split('-').map(Number)
    const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`
    query = query.gte('date', `${filters.month}-01`).lt('date', nextMonth)
  }
  if (filters.submitter) {
    query = query.eq('submitted_by', filters.submitter)
  }

  const { data, error } = await query
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => normalize(r as Record<string, unknown>))
}

export async function getReceiptsByMonth(month?: string): Promise<Receipt[]> {
  return getReceipts({ month })
}

export async function getAvailableMonths(): Promise<{ month: string; label: string }[]> {
  const { data, error } = await getSupabase()
    .from('receipts')
    .select('date')
    .order('date', { ascending: false })
  if (error) throw error

  const seen = new Set<string>()
  ;(data ?? []).forEach((r) => { if (r.date) seen.add(String(r.date).slice(0, 7)) })

  return Array.from(seen).sort().reverse().map((m) => ({
    month: m,
    label: format(parseISO(`${m}-01`), 'MMMM yyyy'),
  }))
}

export async function getReceiptById(id: number): Promise<Receipt | null> {
  const { data, error } = await getSupabase()
    .from('receipts')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return normalize(data as Record<string, unknown>)
}

export async function createReceipt(data: {
  date: string; vendor: string | null; subtotal: number | null
  gst: number; pst: number; total: number; category: Category
  notes: string | null; image_url: string | null; submitted_by: string | null
}): Promise<Receipt> {
  const { data: row, error } = await getSupabase()
    .from('receipts')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return normalize(row as Record<string, unknown>)
}

export async function updateReceipt(id: number, data: {
  date: string; vendor: string | null; subtotal: number | null
  gst: number; pst: number; total: number; category: Category
  notes: string | null; image_url: string | null; submitted_by: string | null
}): Promise<Receipt | null> {
  const { data: row, error } = await getSupabase()
    .from('receipts')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) return null
  return normalize(row as Record<string, unknown>)
}

export async function deleteReceipt(id: number): Promise<boolean> {
  const { error } = await getSupabase()
    .from('receipts')
    .delete()
    .eq('id', id)
  return !error
}

export async function getMonthlyTotals(): Promise<MonthlyTotals[]> {
  const { data, error } = await getSupabase()
    .from('receipts')
    .select('date, total, gst, pst, subtotal, category')
  if (error) throw error

  const byMonth = new Map<string, {
    total: number; gst: number; pst: number; subtotal: number; count: number
    byCategory: Record<Category, number>
  }>()

  ;(data ?? []).forEach((r) => {
    const month = r.date ? String(r.date).slice(0, 7) : null
    if (!month) return
    if (!byMonth.has(month)) {
      byMonth.set(month, {
        total: 0, gst: 0, pst: 0, subtotal: 0, count: 0,
        byCategory: { fuel: 0, food: 0, tools: 0, shop: 0, other: 0 },
      })
    }
    const m = byMonth.get(month)!
    const total    = Number(r.total   ?? 0)
    const gst      = Number(r.gst     ?? 0)
    const pst      = Number(r.pst     ?? 0)
    const subtotal = r.subtotal != null ? Number(r.subtotal) : total - gst - pst
    m.total    += total
    m.gst      += gst
    m.pst      += pst
    m.subtotal += subtotal
    m.count++
    const cat = r.category as Category
    m.byCategory[cat] = (m.byCategory[cat] ?? 0) + total
  })

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, totals]) => ({
      month,
      label: format(parseISO(`${month}-01`), 'MMMM yyyy'),
      ...totals,
    }))
}
