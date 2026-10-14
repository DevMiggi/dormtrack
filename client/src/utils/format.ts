const pesoFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

const dateFormatter = new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })

const percentFormatter = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 1 })

// 12500.5 -> "₱12,500.50"
export function formatPeso(amount: number) {
  return pesoFormatter.format(amount)
}

// "2026-10-14T00:00:00.000Z" -> "Oct 14, 2026"
export function formatDate(value: string | Date) {
  return dateFormatter.format(new Date(value))
}

// "2026-10" -> "October 2026"
export function formatBillingPeriod(period: string) {
  const [year, month] = period.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
}

// A date -> "2026-10-14", the value format of <input type="date">
export function toDateInputValue(value: string | Date) {
  const date = new Date(value)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

// 66.666 -> "66.7%" (the API already sends rates as 0 to 100)
export function formatPercent(value: number) {
  return `${percentFormatter.format(value)}%`
}

// "bank_transfer" -> "Bank transfer", "in_progress" -> "In progress"
export function formatLabel(value: string) {
  const words = value.replaceAll('_', ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
