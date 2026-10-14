import { LoaderCircle } from 'lucide-react'

type LoadingStateProps = {
  label?: string
}

function LoadingState({ label = 'Loading...' }: LoadingStateProps) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-ink-muted">
      <LoaderCircle className="size-6 animate-spin text-primary" aria-hidden="true" />
      {label}
    </div>
  )
}

export default LoadingState
