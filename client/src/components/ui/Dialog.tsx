import { X } from 'lucide-react'
import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react'

type DialogProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

// Uses the browser's built-in <dialog>. showModal() adds the dark backdrop,
// keeps keyboard focus inside the dialog, and closes it when Escape is pressed.
function Dialog({ open, title, onClose, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // A press directly on the <dialog> element (not its content) is a press on the backdrop.
  function handleBackdropPress(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onMouseDown={handleBackdropPress}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl bg-white p-0 text-ink shadow-xl backdrop:bg-ink/50"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1 text-ink-muted hover:bg-surface hover:text-ink"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      {/* Content only exists while open, so a form inside starts fresh every time. */}
      <div className="max-h-[75dvh] overflow-y-auto px-5 py-4">{open && children}</div>
    </dialog>
  )
}

export default Dialog
