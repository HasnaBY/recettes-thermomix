'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ADMIN_SECTIONS } from '@/lib/adminNav'
import { createClient } from '@/lib/supabase/client'

export default function AdminNav() {
  const [open, setOpen] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const pathname = usePathname()
  const supabase = createClient()

  const close = () => setOpen(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <>
      <div className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-40">
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 text-sm font-medium">
          ☰ Menu admin
        </button>
        <Link href="/" className="text-xs text-gray-300 underline">
          ← Voir le site
        </Link>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/40" onClick={close} />

          <div className="absolute top-0 left-0 h-full w-[85%] max-w-sm bg-white shadow-xl overflow-y-auto">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <span className="font-bold text-gray-900">Administration</span>
              <button onClick={close} className="text-2xl text-gray-500 px-2" aria-label="Fermer">
                ✕
              </button>
            </div>

            <div className="py-2">
              {ADMIN_SECTIONS.map((section) => {
                const isExpanded = expandedSection === section.title
                const containsCurrent = section.links.some((l) => l.href === pathname)

                return (
                  <div key={section.title} className="border-b border-gray-100">
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : section.title)}
                      className={`w-full flex justify-between items-center px-5 py-3 text-left text-sm font-semibold ${
                        containsCurrent ? 'text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      {section.title}
                      <span className="text-xs">{isExpanded ? '▲' : '▼'}</span>
                    </button>
                    {isExpanded && (
                      <div className="pb-2">
                        {section.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={close}
                            className={`block px-8 py-2 text-sm no-underline ${
                              pathname === link.href
                                ? 'text-gray-900 font-medium bg-gray-100'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="p-5 border-t border-gray-200">
              <button onClick={handleLogout} className="text-sm text-red-600 underline">
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}