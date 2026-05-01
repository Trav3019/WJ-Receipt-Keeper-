'use client'

import { useRouter } from 'next/navigation'
import { SUBMITTERS } from '@/lib/types'

export default function ReceiptFilters({
  months,
  selectedMonth,
  selectedSubmitter,
}: {
  months: { month: string; label: string }[]
  selectedMonth: string
  selectedSubmitter: string
}) {
  const router = useRouter()

  const update = (month: string, submitter: string) => {
    const params = new URLSearchParams()
    if (month) params.set('month', month)
    if (submitter) params.set('submitter', submitter)
    const qs = params.toString()
    router.push(qs ? `/receipts?${qs}` : '/receipts')
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <select
        value={selectedMonth}
        onChange={(e) => update(e.target.value, selectedSubmitter)}
        className="input w-auto text-sm"
      >
        <option value="">All Months</option>
        {months.map((m) => (
          <option key={m.month} value={m.month}>{m.label}</option>
        ))}
      </select>

      <select
        value={selectedSubmitter}
        onChange={(e) => update(selectedMonth, e.target.value)}
        className="input w-auto text-sm"
      >
        <option value="">All People</option>
        {SUBMITTERS.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    </div>
  )
}
