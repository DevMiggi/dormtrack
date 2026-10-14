import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router'
import type { LayoutContext } from '../../types/layout'
import Toast, { type ToastTone } from '../ui/Toast'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

type ToastMessage = {
  id: number // a new id makes a new Toast (and a fresh 3-second timer), even for the same text
  message: string
  tone: ToastTone
}

// The frame around every page except the landing and 404 pages:
// sidebar on desktop, top bar with a slide-in menu on phones, and one shared toast.
function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const hideToast = useCallback(() => setToast(null), [])
  const showToast = useCallback((message: string, tone: ToastTone = 'success') => {
    setToast({ id: Date.now(), message, tone })
  }, [])

  // While the mobile menu is open, the Escape key closes it.
  useEffect(() => {
    if (!menuOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  const pageContext: LayoutContext = { showToast }

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 md:block">
        <Sidebar />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={closeMenu} aria-hidden="true" />
          <aside id="mobile-menu" className="relative h-full w-64 max-w-[80%] shadow-xl">
            <Sidebar onClose={closeMenu} />
          </aside>
        </div>
      )}

      <div className="md:pl-64">
        <Topbar menuOpen={menuOpen} onMenuClick={() => setMenuOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
          <Outlet context={pageContext} />
        </main>
      </div>

      {toast && <Toast key={toast.id} message={toast.message} tone={toast.tone} onClose={hideToast} />}
    </div>
  )
}

export default AppLayout
