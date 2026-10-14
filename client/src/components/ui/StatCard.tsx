import type { LucideIcon } from 'lucide-react'
import type { BadgeTone } from './Badge'
import Card from './Card'

const iconToneClasses: Record<BadgeTone, string> = {
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
  neutral: 'bg-neutral-light text-neutral',
  primary: 'bg-primary-light text-primary',
}

type StatCardProps = {
  label: string
  value: string | number
  icon: LucideIcon
  hint?: string // small line under the value, e.g. "3 urgent"
  tone?: BadgeTone
}

function StatCard({ label, value, icon: Icon, hint, tone = 'primary' }: StatCardProps) {
  return (
    <Card className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
        {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      </div>
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconToneClasses[tone]}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
    </Card>
  )
}

export default StatCard
