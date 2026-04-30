import { NextResponse } from 'next/server'
import { getAllReceipts, createReceipt, initDB } from '@/lib/db'
import type { Category } from '@/lib/types'

export async function GET() {
  try {
    await initDB()
    const receipts = await getAllReceipts()
    return NextResponse.json(receipts)
  } catch (err) {
    console.error('GET /api/receipts error:', err)
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await initDB()
    const body = await request.json()

    const receipt = await createReceipt({
      date:      body.date,
      vendor:    body.vendor || null,
      subtotal:  body.subtotal != null ? parseFloat(body.subtotal) : null,
      gst:       parseFloat(body.gst ?? 0),
      pst:       parseFloat(body.pst ?? 0),
      total:     parseFloat(body.total),
      category:  (body.category as Category) || 'other',
      notes:     body.notes || null,
      image_url: body.image_url || null,
    })

    return NextResponse.json(receipt, { status: 201 })
  } catch (err) {
    console.error('POST /api/receipts error:', err)
    return NextResponse.json({ error: 'Failed to create receipt' }, { status: 500 })
  }
}
