import {
  BedDouble,
  ChartColumn,
  KeyRound,
  LayoutDashboard,
  ReceiptText,
  Users,
  Wallet,
  Wrench,
  X,
} from 'lucide-react'
import { Link, NavLink } from 'react-router'
import Logo from './Logo'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/rooms', label: 'Rooms', icon: BedDouble },
  { to: '/tenants', label: 'Tenants', icon: Users },
  { to: '/occupancies', label: 'Occupancies', icon: KeyRound },
  { to: '/billing', label: 'Billing', icon: ReceiptText },
  { to: '/payments', label: 'Payments', icon: Wallet },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/reports', label: 'Reports', icon: ChartColumn },
]

type SidebarProps = {
  onClose?: () => void // only given in the mobile menu: shows the X button and closes after a link is clicked
}

function Sidebar({ onClose }: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-primary">
      <div className="flex items-center justify-between gap-2 px-5 py-5">
        <Link to="/" onClick={onClose} className="rounded-lg">
          <Logo onDark />
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-white/75 hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          // NavLink knows when its page is open; /rooms also stays active on /rooms/:id.
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-white/10 text-white' : 'text-white/75 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`size-5 shrink-0 ${isActive ? 'text-accent' : ''}`} aria-hidden="true" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <p className="px-5 py-4 text-xs text-white/75">Dormitory and Boarding House Management System</p>
    </div>
  )
}

export default Sidebar
