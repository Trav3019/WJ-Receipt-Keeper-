'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const path = usePathname()

  const links = [
    { href: '/',          label: 'Dashboard' },
    { href: '/receipts',  label: 'Receipts'  },
  ]

  return (
    <header className="bg-brand-800 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center h-14 gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight text-white">
            <svg className="w-6 h-6 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
            <span>WJ Receipt Keeper</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1 ml-2">
            {links.map(({ href, label }) => {
              const active = href === '/' ? path === '/' : path.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                    ${active
                      ? 'bg-brand-600 text-white'
                      : 'text-brand-200 hover:bg-brand-700 hover:text-white'}`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* CTA */}
          <div className="ml-auto">
            <Link
              href="/receipts/new"
              className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-400 text-white px-3 py-1.5 rounded-md text-sm font-semibold transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Receipt
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
