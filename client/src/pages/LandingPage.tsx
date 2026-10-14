import { Link } from 'react-router'
import Logo from '../components/layout/Logo'

// Placeholder until CP6.1.
function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo />
      <p className="text-sm text-ink-muted">The landing page is built in CP6.1.</p>
      <Link to="/dashboard" className="text-sm font-medium text-primary hover:underline">
        Go to the dashboard
      </Link>
    </main>
  )
}

export default LandingPage
