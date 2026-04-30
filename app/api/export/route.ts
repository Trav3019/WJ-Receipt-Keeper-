import { NextResponse } from 'next/server'
import { getReceiptsByMonth, getAllReceipts } from '@/lib/db'
import ExcelJS from 'exceljs'
import { format, parseISO } from 'date-fns'
import type { Receipt } from '@/lib/types'
import { CATEGORIES } from '@/lib/types'

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF166534' },
}
const MONTH_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFdcfce7' },
}
const SUBTOTAL_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFbbf7d0' },
}
const GRAND_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF16a34a' },
}

function money(ws: ExcelJS.Worksheet, row: ExcelJS.Row, cols: number[]) {
  cols.forEach((c) => {
    const cell = row.getCell(c)
    cell.numFmt = '$#,##0.00'
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') ?? undefined

  const receipts: Receipt[] = month
    ? await getReceiptsByMonth(month)
    : await getAllReceipts()

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'WJ Receipt Keeper'
  workbook.created = new Date()

  // ── Sheet 1: All Receipts ──────────────────────────────────────────────
  const ws = workbook.addWorksheet('Receipts')

  // Title
  const titleRow = ws.addRow(['WJ Receipt Keeper — ' + (month
    ? format(parseISO(`${month}-01`), 'MMMM yyyy')
    : 'All Receipts')])
  titleRow.font = { bold: true, size: 16, color: { argb: 'FF166534' } }
  ws.mergeCells(`A1:I1`)
  ws.addRow([])

  // Column headers
  ws.columns = [
    { key: 'date',     width: 14 },
    { key: 'vendor',   width: 28 },
    { key: 'category', width: 12 },
    { key: 'items',    width: 36 },
    { key: 'subtotal', width: 12 },
    { key: 'gst',      width: 10 },
    { key: 'pst',      width: 10 },
    { key: 'total',    width: 12 },
    { key: 'notes',    width: 30 },
  ]

  const headerRow = ws.addRow([
    'Date', 'Vendor', 'Category', 'Items / Description',
    'Subtotal', 'GST', 'PST', 'Total', 'Notes',
  ])
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF166534' } },
    }
  })

  // Group receipts by month
  const byMonth = new Map<string, Receipt[]>()
  receipts.forEach((r) => {
    const m = r.date.toString().slice(0, 7)
    if (!byMonth.has(m)) byMonth.set(m, [])
    byMonth.get(m)!.push(r)
  })

  const sortedMonths = Array.from(byMonth.keys()).sort().reverse()

  let grandTotal = 0, grandGst = 0, grandPst = 0, grandSubtotal = 0

  for (const m of sortedMonths) {
    const mReceipts = byMonth.get(m)!

    // Month header row
    const mLabel = format(parseISO(`${m}-01`), 'MMMM yyyy')
    const mRow = ws.addRow([mLabel, '', '', '', '', '', '', '', ''])
    ws.mergeCells(`A${mRow.number}:I${mRow.number}`)
    mRow.getCell(1).fill = MONTH_FILL
    mRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF166534' } }

    let mTotal = 0, mGst = 0, mPst = 0, mSubtotal = 0

    for (const r of mReceipts) {
      const subtotal = r.subtotal ?? (r.total - r.gst - r.pst)
      const cat = CATEGORIES.find((c) => c.value === r.category)?.label ?? r.category
      const dataRow = ws.addRow([
        format(parseISO(r.date.toString()), 'MMM d, yyyy'),
        r.vendor ?? '',
        cat,
        r.notes ?? '',
        subtotal,
        r.gst,
        r.pst,
        r.total,
        '',
      ])
      money(ws, dataRow, [5, 6, 7, 8])
      dataRow.eachCell((cell) => {
        cell.alignment = { vertical: 'middle' }
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFe2e8f0' } } }
      })

      mTotal    += r.total
      mGst      += r.gst
      mPst      += r.pst
      mSubtotal += subtotal
    }

    // Month subtotal row
    const subRow = ws.addRow([
      `${mLabel} Subtotal (${mReceipts.length} receipt${mReceipts.length !== 1 ? 's' : ''})`,
      '', '', '',
      mSubtotal, mGst, mPst, mTotal, '',
    ])
    ws.mergeCells(`A${subRow.number}:D${subRow.number}`)
    subRow.eachCell((cell) => { cell.fill = SUBTOTAL_FILL; cell.font = { bold: true } })
    money(ws, subRow, [5, 6, 7, 8])
    ws.addRow([])

    grandTotal    += mTotal
    grandGst      += mGst
    grandPst      += mPst
    grandSubtotal += mSubtotal
  }

  // Grand total row
  const grandRow = ws.addRow([
    `GRAND TOTAL (${receipts.length} receipts)`, '', '', '',
    grandSubtotal, grandGst, grandPst, grandTotal, '',
  ])
  ws.mergeCells(`A${grandRow.number}:D${grandRow.number}`)
  grandRow.eachCell((cell) => {
    cell.fill = GRAND_FILL
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }
  })
  money(ws, grandRow, [5, 6, 7, 8])

  // ── Sheet 2: Monthly Summary ──────────────────────────────────────────
  const ws2 = workbook.addWorksheet('Monthly Summary')
  ws2.columns = [
    { key: 'month',    width: 18 },
    { key: 'receipts', width: 10 },
    { key: 'fuel',     width: 12 },
    { key: 'food',     width: 12 },
    { key: 'tools',    width: 12 },
    { key: 'shop',     width: 12 },
    { key: 'other',    width: 12 },
    { key: 'subtotal', width: 12 },
    { key: 'gst',      width: 10 },
    { key: 'pst',      width: 10 },
    { key: 'total',    width: 12 },
  ]

  const t2 = ws2.addRow(['WJ Receipt Keeper — Monthly Summary'])
  t2.font = { bold: true, size: 16, color: { argb: 'FF166534' } }
  ws2.mergeCells(`A1:K1`)
  ws2.addRow([])

  const h2 = ws2.addRow([
    'Month', '# Receipts', 'Fuel', 'Food', 'Tools', 'Shop', 'Other',
    'Subtotal', 'GST', 'PST', 'Total',
  ])
  h2.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { horizontal: 'center' }
  })

  let s2Total = 0, s2Gst = 0, s2Pst = 0, s2Subtotal = 0
  const s2Cat: Record<string, number> = { fuel: 0, food: 0, tools: 0, shop: 0, other: 0 }

  for (const m of sortedMonths) {
    const mR = byMonth.get(m)!
    const mLabel = format(parseISO(`${m}-01`), 'MMMM yyyy')
    const cat: Record<string, number> = { fuel: 0, food: 0, tools: 0, shop: 0, other: 0 }
    let mTotal = 0, mGst = 0, mPst = 0, mSub = 0
    mR.forEach((r) => {
      cat[r.category] = (cat[r.category] ?? 0) + r.total
      mTotal += r.total
      mGst   += r.gst
      mPst   += r.pst
      mSub   += r.subtotal ?? (r.total - r.gst - r.pst)
      s2Cat[r.category] = (s2Cat[r.category] ?? 0) + r.total
    })
    s2Total += mTotal; s2Gst += mGst; s2Pst += mPst; s2Subtotal += mSub

    const dr = ws2.addRow([
      mLabel, mR.length,
      cat.fuel, cat.food, cat.tools, cat.shop, cat.other,
      mSub, mGst, mPst, mTotal,
    ])
    money(ws2, dr, [3, 4, 5, 6, 7, 8, 9, 10, 11])
    dr.eachCell((c) => { c.alignment = { vertical: 'middle' } })
  }

  const gr2 = ws2.addRow([
    'GRAND TOTAL', receipts.length,
    s2Cat.fuel, s2Cat.food, s2Cat.tools, s2Cat.shop, s2Cat.other,
    s2Subtotal, s2Gst, s2Pst, s2Total,
  ])
  gr2.eachCell((c) => {
    c.fill = GRAND_FILL
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  })
  money(ws2, gr2, [3, 4, 5, 6, 7, 8, 9, 10, 11])

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  const filename = month
    ? `receipts-${month}.xlsx`
    : `receipts-all.xlsx`

  return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
