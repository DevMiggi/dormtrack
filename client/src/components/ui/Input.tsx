import { useId, type ComponentProps } from 'react'
import FieldError from './FieldError'

type InputProps = ComponentProps<'input'> & {
  label: string
  error?: string
}

// Works with React Hook Form: <Input label="Room number" {...register('roomNumber')} error={errors.roomNumber?.message} />
// register() passes name, onChange, onBlur and ref, which all reach the <input> through ...props.
function Input({ label, error, id, className = '', ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-ink placeholder:text-ink-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${error ? 'border-danger' : 'border-line'}`}
        {...props}
      />
      <FieldError id={errorId} message={error} />
    </div>
  )
}

export default Input
