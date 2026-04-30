export type Category = 'fuel' | 'food' | 'tools' | 'shop' | 'other'

export const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: 'fuel',  label: 'Fuel',  color: 'bg-orange-100 text-orange-800' },
  { value: 'food',  label: 'Food',  color: 'bg-yellow-100 text-yellow-800' },
  { value: 'tools', label: 'Tools', color: 'bg-blue-100 text-blue-800'   },
  { value: 'shop',  label: 'Shop',  color: 'bg-purple-100 text-purple-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800'   },
]

export interface Receipt {
  id: number
  date: string         // YYYY-MM-DD
  vendor: string | null
  subtotal: number | null
  gst: number
  pst: number
  total: number
  category: Category
  notes: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface ScanResult {
  date: string | null
  vendor: string | null
  subtotal: number | null
  gst: number | null
  pst: number | null
  total: number | null
  items: string | null
  imageUrl: string
}

export interface MonthlyTotals {
  month: string       // YYYY-MM
  label: string       // e.g. "January 2025"
  total: number
  gst: number
  pst: number
  subtotal: number
  count: number
  byCategory: Record<Category, number>
}

export interface ReceiptFormData {
  date: string
  vendor: string
  subtotal: string
  gst: string
  pst: string
  total: string
  category: Category
  notes: string
  image_url: string
}
