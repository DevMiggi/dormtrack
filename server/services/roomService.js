// D3: room availability is computed from active occupancies every time. It is never stored.
// The database queries that count each room's active occupancies are added in CP4.1.

// Returns the D3 availability fields for one room, given how many active occupancies it has.
export function calculateAvailability(room, activeOccupants) {
  const availableSlots = Math.max(0, room.capacity - activeOccupants);
  const rate = (activeOccupants / room.capacity) * 100;
  const occupancyRate = Math.round(rate * 100) / 100; // 2 decimals, e.g. 66.67
  const isAvailable = room.conditionStatus === 'active' && availableSlots > 0;

  return { activeOccupants, availableSlots, occupancyRate, isAvailable };
}
