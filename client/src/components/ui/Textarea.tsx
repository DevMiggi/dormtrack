import { useId, type ComponentProps } from 'react'
import FieldError from './FieldError'

type TextareaProps = ComponentProps<'textarea'> & {
  label: string
  error?: string
}

// Same look and React Hook Form support as Input, for long text such as notes and descriptions.
function Textarea({ label, error, id, className = '', rows = 3, ...props }: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  const errorId = `${textareaId}-error`

  return (
    <div className={className}>
      <label htmlFor={textareaId} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${error ? 'border-danger' : 'border-line'}`}
        {...props}
      />
      <FieldError id={errorId} message={error} />
    </div>
  )
}

export default Textarea
