type LogoProps = {
  onDark?: boolean // true on the pine sidebar, false on light backgrounds
}

// The same house mark as public/favicon.svg, plus the name.
function Logo({ onDark = false }: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="7" className={onDark ? 'fill-white' : 'fill-primary'} />
        <path
          d="M8 15 16 8l8 7v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z"
          fill="none"
          strokeWidth="2.2"
          strokeLinejoin="round"
          className={onDark ? 'stroke-primary' : 'stroke-surface'}
        />
        <rect x="13.5" y="18" width="5" height="7" rx="1" className="fill-accent" />
      </svg>
      <span className={`text-lg font-semibold tracking-tight ${onDark ? 'text-white' : 'text-ink'}`}>DormTrack</span>
    </span>
  )
}

export default Logo
