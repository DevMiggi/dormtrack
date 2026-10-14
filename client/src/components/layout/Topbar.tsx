import { Menu } from 'lucide-react'
import { Link } from 'react-router'
import Logo from './Logo'

type TopbarProps = {
  menuOpen: boolean
  onMenuClick: () => void
}

// Only shown below the md breakpoint, where the sidebar is hidden.
function Topbar({ menuOpen, onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-3 md:hidden">
      <Link to="/" className="rounded-lg">
        <Logo />
      </Link>
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        className="rounded-lg p-2 text-ink hover:bg-surface"
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>
    </header>
  )
}

export default Topbar
