import type { ReactNode } from 'react'

// success = available/paid, warning = partial/near full, danger = overdue/full, neutral = maintenance
export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'primary'

const toneClasses: Record<BadgeTone, string> = {
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
  neutral: 'bg-neutral-light text-neutral',
  primary: 'bg-primary-light text-primary',
}

type BadgeProps = {
  tone?: BadgeTone
  children: ReactNode
}

function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}

export default Badge
