type AvailabilityBarProps = {
  occupied: number
  capacity: number
  muted?: boolean // true for rooms in maintenance or inactive: the bar turns slate
}

// Shows how full a room is: green, amber at 75% or more, red when full.
function AvailabilityBar({ occupied, capacity, muted = false }: AvailabilityBarProps) {
  const percent = capacity > 0 ? Math.min(100, (occupied / capacity) * 100) : 0
  const slotsLeft = Math.max(0, capacity - occupied)

  let color = 'bg-success'
  if (muted) color = 'bg-neutral'
  else if (slotsLeft === 0) color = 'bg-danger'
  else if (percent >= 75) color = 'bg-warning'

  return (
    <div className="min-w-0">
      <div
        className="h-2 overflow-hidden rounded-full bg-surface"
        role="meter"
        aria-label="Room occupancy"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={occupied}
      >
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-xs text-ink-muted">
        {occupied} of {capacity} occupied · {slotsLeft === 0 ? 'full' : `${slotsLeft} ${slotsLeft === 1 ? 'slot' : 'slots'} left`}
      </p>
    </div>
  )
}

export default AvailabilityBar
