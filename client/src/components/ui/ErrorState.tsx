import { RotateCw, TriangleAlert } from 'lucide-react'
import Button from './Button'
import Card from './Card'

type ErrorStateProps = {
  title?: string
  message: string // show the server's message here
  onRetry?: () => void // usually the refetch from useApi
}

function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <Card role="alert" className="flex flex-col items-center gap-3 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-light text-danger">
        <TriangleAlert className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="max-w-md text-sm text-ink-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          <RotateCw className="size-4" aria-hidden="true" />
          Try again
        </Button>
      )}
    </Card>
  )
}

export default ErrorState
