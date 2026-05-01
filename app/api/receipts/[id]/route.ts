import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getReceiptById, updateReceipt, deleteReceipt } from '@/lib/db'
import type { Category } from '@/lib/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const receipt = await getReceiptById(parseInt(id))
  if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(receipt)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const receipt = await updateReceipt(parseInt(id), {
      date:      body.date,
      vendor:    body.vendor || null,
      subtotal:  body.subtotal != null ? parseFloat(body.subtotal) : null,
      gst:       parseFloat(body.gst ?? 0),
      pst:       parseFloat(body.pst ?? 0),
      total:     parseFloat(body.total),
      category:     (body.category as Category) || 'other',
      notes:        body.notes || null,
      image_url:    body.image_url || null,
      submitted_by: body.submitted_by || null,
    })
    if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    revalidatePath('/')
    revalidatePath('/receipts')
    return NextResponse.json(receipt)
  } catch (err) {
    console.error('PUT /api/receipts/[id] error:', err)
    return NextResponse.json({ error: 'Failed to update receipt' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const deleted = await deleteReceipt(parseInt(id))
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  revalidatePath('/')
  revalidatePath('/receipts')
  return NextResponse.json({ success: true })
}
