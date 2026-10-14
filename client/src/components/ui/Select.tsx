import { useId, type ComponentProps } from 'react'
import FieldError from './FieldError'

type SelectProps = ComponentProps<'select'> & {
  label: string
  error?: string
}

// Same look and React Hook Form support as Input. Pass the <option> elements as children.
function Select({ label, error, id, className = '', children, ...props }: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const errorId = `${selectId}-error`

  return (
    <div className={className}>
      <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${error ? 'border-danger' : 'border-line'}`}
        {...props}
      >
        {children}
      </select>
      <FieldError id={errorId} message={error} />
    </div>
  )
}

export default Select
