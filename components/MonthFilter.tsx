'use client'

import { useRouter } from 'next/navigation'

export default function MonthFilter({
  months,
  selected,
}: {
  months: { month: string; label: string }[]
  selected: string
}) {
  const router = useRouter()
  return (
    <select
      value={selected}
      onChange={(e) =>
        router.push(e.target.value ? `/receipts?month=${e.target.value}` : '/receipts')
      }
      className="input w-auto"
    >
      <option value="">All Months</option>
      {months.map((m) => (
        <option key={m.month} value={m.month}>
          {m.label}
        </option>
      ))}
    </select>
  )
}
