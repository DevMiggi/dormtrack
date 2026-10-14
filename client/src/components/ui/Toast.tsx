import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { useEffect } from 'react'

export type ToastTone = 'success' | 'error'

type ToastProps = {
  message: string
  tone?: ToastTone
  onClose: () => void // pass a stable function (useCallback), or the timer restarts on every render
}

function Toast({ message, tone = 'success', onClose }: ToastProps) {
  // Hide the toast automatically after 3 seconds.
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-50 flex items-start gap-3 rounded-xl border border-line bg-white p-4 shadow-lg sm:left-auto sm:right-6 sm:bottom-6 sm:w-96"
    >
      {tone === 'success' ? (
        <CircleCheck className="size-5 shrink-0 text-success" aria-hidden="true" />
      ) : (
        <CircleAlert className="size-5 shrink-0 text-danger" aria-hidden="true" />
      )}
      <p className="flex-1 text-sm text-ink">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="rounded p-0.5 text-ink-muted hover:bg-surface hover:text-ink"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export default Toast
