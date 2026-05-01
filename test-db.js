const postgres = require('postgres')

async function test() {
  const url = process.env.DATABASE_URL
  console.log('DATABASE_URL:', url ? 'set' : 'NOT SET')
  
  if (!url) {
    console.error('DATABASE_URL is not set!')
    process.exit(1)
  }
  
  const sql = postgres(url, { max: 1, prepare: false })
  
  try {
    const result = await sql`SELECT 1 as test`
    console.log('Connected! Result:', result)
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await sql.end()
  }
}

test()