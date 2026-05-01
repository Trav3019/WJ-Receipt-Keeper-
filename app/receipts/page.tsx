export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getReceiptsByMonth, getAvailableMonths } from '@/lib/db'
import { CATEGORIES } from '@/lib/types'
import type { Receipt } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import MonthFilter from '@/components/MonthFilter'

function fmt(n: number) {
  return n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })
}

function fmtDate(date: string | null) {
  if (!date) return '—'
  try { return format(parseISO(date), 'MMM d, yyyy') } catch { return '—' }
}

function CategoryBadge({ category }: { category: string }) {
  const cat = CATEGORIES.find((c) => c.value === category)
  return <span className={`badge ${cat?.color ?? 'bg-gray-100 text-gray-800'}`}>{cat?.label ?? category}</span>
}

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month } = await searchParams
  let receipts: Receipt[] = []
  let months: { month: string; label: string }[] = []

  try {
    ;[receipts, months] = await Promise.all([
      getReceiptsByMonth(month),
      getAvailableMonths(),
    ])
  } catch {
    // DB not yet configured
  }

  // Group by month
  const byMonth = new Map<string, Receipt[]>()
  receipts.forEach((r) => {
    const m = r.date ? r.date.slice(0, 7) : 'unknown'
    if (!byMonth.has(m)) byMonth.set(m, [])
    byMonth.get(m)!.push(r)
  })
  const monthKeys = Array.from(byMonth.keys()).sort().reverse()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-brand-800">All Receipts</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <MonthFilter months={months} selected={month ?? ''} />
          <a href="/api/export" className="btn-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Export</span>
          </a>
          <Link href="/receipts/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add Receipt</span>
          </Link>
        </div>
      </div>

      {monthKeys.length === 0 ? (
        <div className="card text-center py-16">
          <svg className="w-12 h-12 text-brand-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
          <p className="text-stone-400 text-lg mb-4">No receipts found</p>
          <Link href="/receipts/new" className="btn-primary">Scan your first receipt</Link>
        </div>
      ) : (
        monthKeys.map((m) => {
          const mReceipts = byMonth.get(m)!
          const mLabel = m === 'unknown' ? 'Unknown Date' : format(parseISO(`${m}-01`), 'MMMM yyyy')
          const mTotal = mReceipts.reduce((s, r) => s + r.total, 0)
          const mGst   = mReceipts.reduce((s, r) => s + r.gst, 0)
          const mPst   = mReceipts.reduce((s, r) => s + r.pst, 0)

          return (
            <div key={m} className="space-y-2">
              <div className="bg-brand-700 text-white rounded-lg px-4 py-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span className="font-bold text-lg">{mLabel}</span>
                    <span className="ml-3 text-brand-200 text-sm">{mReceipts.length} receipt{mReceipts.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm flex-wrap">
                    <span className="text-brand-200">GST: <strong className="text-white">{fmt(mGst)}</strong></span>
                    <span className="text-brand-200">PST: <strong className="text-white">{fmt(mPst)}</strong></span>
                    <span className="font-bold text-lg">{fmt(mTotal)}</span>
                    <a href={`/api/export?month=${m}`} className="bg-brand-600 hover:bg-brand-500 rounded-md px-3 py-1 text-xs font-semibold transition-colors">
                      Export
                    </a>
                  </div>
                </div>
              </div>

              {/* Mobile card list */}
              <div className="sm:hidden card p-0 overflow-hidden divide-y divide-stone-100">
                {mReceipts.map((r) => (
                  <Link key={r.id} href={`/receipts/${r.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-brand-50 transition-colors">
                    <div className="min-w-0 mr-3">
                      <p className="font-medium text-sm truncate">{r.vendor ?? '—'}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-stone-400">{fmtDate(r.date)}</span>
                        <CategoryBadge category={r.category} />
                        {r.submitted_by && <span className="text-xs text-stone-400">{r.submitted_by}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-brand-700 text-sm">{fmt(r.total)}</p>
                      <p className="text-xs text-stone-400">GST {fmt(r.gst)}</p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        {['Date', 'Vendor', 'Submitted By', 'Category', 'GST', 'PST', 'Total', ''].map((h) => (
                          <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {mReceipts.map((r) => (
                        <tr key={r.id} className="hover:bg-brand-50 transition-colors">
                          <td className="px-4 py-3 text-stone-500 whitespace-nowrap">{fmtDate(r.date)}</td>
                          <td className="px-4 py-3 font-medium">{r.vendor ?? '—'}</td>
                          <td className="px-4 py-3 text-stone-500">{r.submitted_by ?? '—'}</td>
                          <td className="px-4 py-3"><CategoryBadge category={r.category} /></td>
                          <td className="px-4 py-3">{fmt(r.gst)}</td>
                          <td className="px-4 py-3">{fmt(r.pst)}</td>
                          <td className="px-4 py-3 font-semibold text-brand-700">{fmt(r.total)}</td>
                          <td className="px-4 py-3">
                            <Link href={`/receipts/${r.id}`} className="text-brand-600 hover:text-brand-800 text-xs font-semibold">View</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
