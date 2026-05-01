'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CATEGORIES, SUBMITTERS } from '@/lib/types'
import type { Category, ReceiptFormData } from '@/lib/types'

const empty: ReceiptFormData = {
  date: new Date().toISOString().slice(0, 10),
  vendor: '',
  subtotal: '',
  gst: '',
  pst: '',
  total: '',
  category: 'other',
  notes: '',
  image_url: '',
  submitted_by: '',
}

export default function NewReceiptPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview]    = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [scanning, setScanning]  = useState(false)
  const [saving, setSaving]      = useState(false)
  const [form, setForm]          = useState<ReceiptFormData>(empty)
  const [error, setError]        = useState<string | null>(null)
  const [scanned, setScanned]    = useState(false)
  const [dragging, setDragging]  = useState(false)

  const handleFile = useCallback((file: File) => {
    setImageFile(file)
    setScanned(false)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }

  const handleScan = async () => {
    if (!imageFile) return
    setScanning(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('image', imageFile)
      const res = await fetch('/api/scan', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setForm((prev) => ({
        ...prev,
        date:      data.date      ?? prev.date,
        vendor:    data.vendor    ?? prev.vendor,
        subtotal:  data.subtotal  != null ? String(data.subtotal) : prev.subtotal,
        gst:       data.gst       != null ? String(data.gst)      : prev.gst,
        pst:       data.pst       != null ? String(data.pst)      : prev.pst,
        total:     data.total     != null ? String(data.total)    : prev.total,
        notes:     data.items     ?? prev.notes,
        image_url: data.imageUrl  ?? prev.image_url,
      }))
      setScanned(true)
    } catch (e) {
      setError(String(e))
    } finally {
      setScanning(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.total) { setError('Total is required'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(await res.text())
      router.push('/receipts')
      router.refresh()
    } catch (e) {
      setError(String(e))
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-brand-600 hover:text-brand-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-brand-800">Add Receipt</h1>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Image Upload */}
        <div className="space-y-4">
          <div
            className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer
              ${dragging ? 'border-brand-500 bg-brand-50' : 'border-brand-300 hover:border-brand-400'}
              ${preview ? 'p-2' : 'p-8'}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !preview && fileRef.current?.click()}
          >
            {preview ? (
              <div className="relative">
                <Image
                  src={preview}
                  alt="Receipt preview"
                  width={600}
                  height={800}
                  className="w-full h-auto rounded-lg object-contain max-h-96"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setPreview(null); setImageFile(null); setScanned(false) }}
                  className="absolute top-2 right-2 rounded-full bg-white shadow p-1 hover:bg-red-50 text-stone-500 hover:text-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="text-center">
                <svg className="w-12 h-12 text-brand-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-brand-700 font-semibold">Drop receipt here or tap to upload</p>
                <p className="text-xs text-stone-400 mt-1">JPG, PNG, WEBP — up to 4 MB</p>
              </div>
            )}
          </div>

          {/* Hidden file inputs — one for gallery, one for camera */}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          <input id="cameraInput" type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn-secondary flex-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {preview ? 'Change' : 'Gallery'}
            </button>

            <button
              type="button"
              onClick={() => document.getElementById('cameraInput')?.click()}
              className="btn-secondary flex-1 sm:hidden"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Camera
            </button>

            <button
              type="button"
              onClick={handleScan}
              disabled={!imageFile || scanning}
              className="btn-primary flex-1"
            >
              {scanning ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Scanning…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {scanned ? 'Re-scan' : 'Scan'}
                </>
              )}
            </button>
          </div>

          {scanned && (
            <div className="rounded-lg bg-brand-50 border border-brand-200 px-4 py-3 text-sm text-brand-700 font-medium">
              ✓ Receipt scanned — review and confirm the fields below
            </div>
          )}
        </div>

        {/* Right: Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Category *</label>
              <select name="category" value={form.category} onChange={handleChange} className="input">
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Submitted By</label>
            <select name="submitted_by" value={form.submitted_by} onChange={handleChange} className="input">
              <option value="">— Select name —</option>
              {SUBMITTERS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Vendor / Store</label>
            <input
              name="vendor"
              type="text"
              value={form.vendor}
              onChange={handleChange}
              placeholder="e.g. Co-op, UFA, Home Hardware"
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Subtotal</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                <input name="subtotal" type="number" step="0.01" min="0" value={form.subtotal} onChange={handleChange} className="input pl-6" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="label">Total *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                <input name="total" type="number" step="0.01" min="0" value={form.total} onChange={handleChange} required className="input pl-6" placeholder="0.00" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">GST</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                <input name="gst" type="number" step="0.01" min="0" value={form.gst} onChange={handleChange} className="input pl-6" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="label">PST</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                <input name="pst" type="number" step="0.01" min="0" value={form.pst} onChange={handleChange} className="input pl-6" placeholder="0.00" />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Items / Description</label>
            <textarea
              name="notes"
              rows={3}
              value={form.notes}
              onChange={handleChange}
              placeholder="e.g. Diesel fuel, engine oil, work gloves"
              className="input resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !form.total}
            className="btn-primary w-full justify-center py-3"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </>
            ) : (
              'Save Receipt'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
