import { useEffect, useState } from 'react'

// Returns `value` only after it has stopped changing for `delay` ms.
// Used for search boxes, so the API is not called on every keystroke.
function useDebounce<T>(value: T, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export default useDebounce
