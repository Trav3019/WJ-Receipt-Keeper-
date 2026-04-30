'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { CATEGORIES } from '@/lib/types'
import type { Receipt, Category, ReceiptFormData } from '@/lib/types'
import { format, parseISO } from 'date-fns'

function fmt(n: number) {
  return n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })
}

export default function ReceiptDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState<ReceiptFormData | null>(null)
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/receipts/${id}`)
      .then((r) => r.json())
      .then((data) => { setReceipt(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const startEdit = () => {
    if (!receipt) return
    setForm({
      date:      receipt.date.toString().slice(0, 10),
      vendor:    receipt.vendor    ?? '',
      subtotal:  receipt.subtotal  != null ? String(receipt.subtotal) : '',
      gst:       String(receipt.gst),
      pst:       String(receipt.pst),
      total:     String(receipt.total),
      category:  receipt.category as Category,
      notes:     receipt.notes     ?? '',
      image_url: receipt.image_url ?? '',
    })
    setEditing(true)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => prev ? { ...prev, [e.target.name]: e.target.value } : prev)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/receipts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(await res.text())
      const updated = await res.json()
      setReceipt(updated)
      setEditing(false)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this receipt? This cannot be undone.')) return
    setDeleting(true)
    try {
      await fetch(`/api/receipts/${id}`, { method: 'DELETE' })
      router.push('/receipts')
      router.refresh()
    } catch {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-16 text-stone-400">Loading…</div>
  }
  if (!receipt) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-400 mb-4">Receipt not found.</p>
        <Link href="/receipts" className="btn-secondary">Back to Receipts</Link>
      </div>
    )
  }

  const cat = CATEGORIES.find((c) => c.value === receipt.category)
  const subtotal = receipt.subtotal ?? (receipt.total - receipt.gst - receipt.pst)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <Link href="/receipts" className="hover:text-brand-700">Receipts</Link>
          <span>/</span>
          <span className="text-stone-700 font-medium">{receipt.vendor ?? `Receipt #${receipt.id}`}</span>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <>
              <button onClick={startEdit} className="btn-secondary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Receipt Image */}
        <div>
          {receipt.image_url ? (
            <div className="card p-2">
              <Image
                src={receipt.image_url}
                alt="Receipt"
                width={600}
                height={800}
                className="w-full h-auto rounded-lg object-contain max-h-[600px]"
                unoptimized
              />
            </div>
          ) : (
            <div className="card flex items-center justify-center h-64 bg-stone-50">
              <div className="text-center text-stone-300">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No image</p>
              </div>
            </div>
          )}
        </div>

        {/* Details / Edit form */}
        <div>
          {editing && form ? (
            <form onSubmit={handleSave} className="card space-y-4">
              <h2 className="text-lg font-bold text-brand-800">Edit Receipt</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date</label>
                  <input name="date" type="date" value={form.date} onChange={handleChange} required className="input" />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select name="category" value={form.category} onChange={handleChange} className="input">
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Vendor</label>
                <input name="vendor" type="text" value={form.vendor} onChange={handleChange} className="input" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Subtotal</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                    <input name="subtotal" type="number" step="0.01" value={form.subtotal} onChange={handleChange} className="input pl-6" />
                  </div>
                </div>
                <div>
                  <label className="label">Total *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                    <input name="total" type="number" step="0.01" value={form.total} onChange={handleChange} required className="input pl-6" />
                  </div>
                </div>
                <div>
                  <label className="label">GST</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                    <input name="gst" type="number" step="0.01" value={form.gst} onChange={handleChange} className="input pl-6" />
                  </div>
                </div>
                <div>
                  <label className="label">PST</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                    <input name="pst" type="number" step="0.01" value={form.pst} onChange={handleChange} className="input pl-6" />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Notes / Items</label>
                <textarea name="notes" rows={3} value={form.notes} onChange={handleChange} className="input resize-none" />
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="card space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-stone-800">{receipt.vendor ?? 'Unknown Vendor'}</h2>
                  <p className="text-stone-500 text-sm mt-0.5">
                    {format(parseISO(receipt.date.toString()), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
                <span className={`badge ${cat?.color ?? 'bg-gray-100 text-gray-700'}`}>{cat?.label}</span>
              </div>

              <div className="divide-y divide-stone-100">
                {[
                  { label: 'Subtotal', value: fmt(subtotal) },
                  { label: 'GST',      value: fmt(receipt.gst) },
                  { label: 'PST',      value: fmt(receipt.pst) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2.5 text-sm">
                    <span className="text-stone-500">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between py-3">
                  <span className="font-bold text-stone-700">Total</span>
                  <span className="text-xl font-bold text-brand-700">{fmt(receipt.total)}</span>
                </div>
              </div>

              {receipt.notes && (
                <div>
                  <p className="label">Items / Description</p>
                  <p className="text-sm text-stone-700 bg-stone-50 rounded-lg p-3">{receipt.notes}</p>
                </div>
              )}

              <div className="text-xs text-stone-400 pt-2 border-t border-stone-100">
                Added {format(parseISO(receipt.created_at), 'MMM d, yyyy \'at\' h:mm a')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
