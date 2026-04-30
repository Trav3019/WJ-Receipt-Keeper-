import { NextResponse } from 'next/server'
import { initDB } from '@/lib/db'

// Call GET /api/setup once after first deployment to create database tables.
export async function GET() {
  try {
    await initDB()
    return NextResponse.json({ success: true, message: 'Database initialized' })
  } catch (err) {
    console.error('Setup error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
