import { NextResponse } from 'next/server'
import postgres from 'postgres'

export async function GET() {
  const url = process.env.DATABASE_URL
  console.log('DATABASE_URL:', url ? 'set' : 'NOT SET')
  
  if (!url) {
    return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 })
  }
  
  const sql = postgres(url, { max: 1, prepare: false })
  
  try {
    const result = await sql`SELECT 1 as test`
    await sql.end()
    console.log('Query result:', result)
    return NextResponse.json({ success: true, result: JSON.stringify(result) })
  } catch (e: any) {
    console.error('Database error:', e)
    await sql.end()
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
  }
}