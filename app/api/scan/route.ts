import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File | null

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await image.arrayBuffer())
    const base64 = buffer.toString('base64')
    const mediaType = (image.type || 'image/jpeg') as
      | 'image/jpeg'
      | 'image/png'
      | 'image/webp'
      | 'image/gif'

    // Upload image to Supabase Storage
    const filename = `${Date.now()}-${image.name.replace(/\s+/g, '-')}`
    const supabase = getSupabase()

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filename, buffer, { contentType: image.type, upsert: true })

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`)

    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(filename)

    // Scan receipt with Claude vision
    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `Analyze this receipt image and extract data as JSON only (no other text, no markdown code blocks).
Return exactly this structure:
{
  "date": "YYYY-MM-DD or null",
  "vendor": "store/vendor name or null",
  "subtotal": number or null,
  "gst": number or null,
  "pst": number or null,
  "total": number or null,
  "items": "brief comma-separated list of items or null"
}
All monetary values must be numbers (no $ symbols). If a field is not visible, use null.
GST is typically 5% in Canada. PST varies by province (0-10%).`,
            },
          ],
        },
      ],
    })

    const text =
      message.content[0].type === 'text' ? message.content[0].text.trim() : '{}'

    let extracted: Record<string, unknown> = {}
    try {
      extracted = JSON.parse(text)
    } catch {
      const cleaned = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim()
      try { extracted = JSON.parse(cleaned) } catch { /* leave empty */ }
    }

    return NextResponse.json({ ...extracted, imageUrl: publicUrl })
  } catch (err) {
    console.error('Scan error:', err)
    return NextResponse.json(
      { error: 'Failed to scan receipt' },
      { status: 500 }
    )
  }
}
