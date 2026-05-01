'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteReceiptButton({ id }: { id: number }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this receipt? This cannot be undone.')) return
    setDeleting(true)
    await fetch(`/api/receipts/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-red-500 hover:text-red-700 text-xs font-semibold disabled:opacity-40"
    >
      {deleting ? '…' : 'Delete'}
    </button>
  )
}
