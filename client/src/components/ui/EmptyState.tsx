import { Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import Card from './Card'

type EmptyStateProps = {
  title: string
  message?: string
  icon?: LucideIcon
  action?: ReactNode // e.g. an "Add room" button
}

function EmptyState({ title, message, icon: Icon = Inbox, action }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center gap-3 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary-light text-primary">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {message && <p className="max-w-md text-sm text-ink-muted">{message}</p>}
      {action}
    </Card>
  )
}

export default EmptyState
