import { Link, useLocation } from 'react-router'
import Logo from '../components/layout/Logo'

// Shown for any URL that matches no route.
function NotFoundPage() {
  const location = useLocation()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center">
      <Link to="/" className="mb-12 rounded-lg">
        <Logo />
      </Link>

      <p className="text-7xl font-bold tracking-tight text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Page not found</h1>
      <p className="mt-3 max-w-md text-sm text-ink-muted">
        There is no page at <span className="break-all font-mono text-ink">{location.pathname}</span>. Check the
        address, or use one of the links below.
      </p>

      {/* These links are styled like the primary and secondary Button. */}
      <div className="mt-8 flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
        <Link
          to="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Go to dashboard
        </Link>
        <Link
          to="/"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Back to home
        </Link>
      </div>
    </main>
  )
}

export default NotFoundPage
