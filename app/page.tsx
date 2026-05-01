export const revalidate = 60

import Link from 'next/link'
import { getMonthlyTotals, getAllReceipts } from '@/lib/db'
import { CATEGORIES } from '@/lib/types'
import type { Receipt } from '@/lib/types'
import { format, parseISO } from 'date-fns'

function fmt(n: number) {
  return n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })
}

function CategoryBadge({ category }: { category: string }) {
  const cat = CATEGORIES.find((c) => c.value === category)
  return <span className={`badge ${cat?.color ?? 'bg-gray-100 text-gray-800'}`}>{cat?.label ?? category}</span>
}

function fmtDate(date: string | null) {
  if (!date) return '—'
  try { return format(parseISO(date), 'MMM d, yyyy') } catch { return '—' }
}

export default async function DashboardPage() {
  let monthly: Awaited<ReturnType<typeof getMonthlyTotals>> = []
  let recent: Receipt[] = []

  try {
    ;[monthly, recent] = await Promise.all([
      getMonthlyTotals(),
      getAllReceipts().then((r) => r.slice(0, 8)),
    ])
  } catch {
    // DB not yet configured
  }

  const current = monthly[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Dashboard</h1>
        <p className="text-sm text-stone-500">WJ Farming — Receipt Tracker</p>
      </div>

      {current ? (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500 mb-3">{current.label}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card text-center">
              <p className="label">Total</p>
              <p className="text-2xl font-bold text-brand-700">{fmt(current.total)}</p>
              <p className="text-xs text-stone-400">{current.count} receipts</p>
            </div>
            <div className="card text-center">
              <p className="label">GST Paid</p>
              <p className="text-xl font-bold text-stone-700">{fmt(current.gst)}</p>
            </div>
            <div className="card text-center">
              <p className="label">PST Paid</p>
              <p className="text-xl font-bold text-stone-700">{fmt(current.pst)}</p>
            </div>
            <div className="card text-center">
              <p className="label">Subtotal</p>
              <p className="text-xl font-bold text-stone-700">{fmt(current.subtotal)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3">
            {CATEGORIES.map((cat) => (
              <div key={cat.value} className="card text-center">
                <span className={`badge ${cat.color} mb-1`}>{cat.label}</span>
                <p className="text-lg font-bold text-stone-700 mt-1">{fmt(current.byCategory[cat.value] ?? 0)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-stone-400 text-lg mb-4">No receipts yet.</p>
          <Link href="/receipts/new" className="btn-primary">Scan your first receipt</Link>
        </div>
      )}

      {monthly.length > 1 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500 mb-3">Monthly History</h2>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead className="bg-brand-700 text-white">
                  <tr>
                    {['Month', 'Receipts', 'Subtotal', 'GST', 'PST', 'Total', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {monthly.map((m) => (
                    <tr key={m.month} className="hover:bg-brand-50 transition-colors">
                      <td className="px-4 py-3 font-medium">{m.label}</td>
                      <td className="px-4 py-3 text-stone-500">{m.count}</td>
                      <td className="px-4 py-3">{fmt(m.subtotal)}</td>
                      <td className="px-4 py-3">{fmt(m.gst)}</td>
                      <td className="px-4 py-3">{fmt(m.pst)}</td>
                      <td className="px-4 py-3 font-semibold text-brand-700">{fmt(m.total)}</td>
                      <td className="px-4 py-3">
                        <a href={`/api/export?month=${m.month}`} className="text-brand-600 hover:text-brand-800 text-xs font-semibold">Export</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Recent Receipts</h2>
            <Link href="/receipts" className="text-sm text-brand-600 hover:text-brand-800 font-semibold">View all →</Link>
          </div>

          <div className="sm:hidden card p-0 overflow-hidden divide-y divide-stone-100">
            {recent.map((r) => (
              <Link key={r.id} href={`/receipts/${r.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-brand-50 transition-colors">
                <div>
                  <p className="font-medium text-sm">{r.vendor ?? '—'}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{fmtDate(r.date)}</p>
                </div>
                <span className="font-semibold text-brand-700 text-sm">{fmt(r.total)}</span>
              </Link>
            ))}
          </div>

          <div className="hidden sm:block card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    {['Date', 'Vendor', 'Submitted By', 'Category', 'Total', ''].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recent.map((r) => (
                    <tr key={r.id} className="hover:bg-brand-50 transition-colors">
                      <td className="px-4 py-3 text-stone-500 whitespace-nowrap">{fmtDate(r.date)}</td>
                      <td className="px-4 py-3 font-medium">{r.vendor ?? '—'}</td>
                      <td className="px-4 py-3 text-stone-500">{r.submitted_by ?? '—'}</td>
                      <td className="px-4 py-3"><CategoryBadge category={r.category} /></td>
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
      )}
    </div>
  )
}
