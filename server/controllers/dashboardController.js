import Billing from '../models/Billing.js';
import MaintenanceRequest from '../models/MaintenanceRequest.js';
import Payment from '../models/Payment.js';
import Room from '../models/Room.js';
import { withBalances } from '../services/billingService.js';
import { withAvailability } from '../services/roomService.js';
import { roundMoney } from '../utils/calculations.js';

// part as a percentage of whole, 2 decimals. 0 when whole is 0.
function toPercent(part, whole) {
  return whole === 0 ? 0 : Math.round((part / whole) * 100 * 100) / 100;
}

// Sum of payments dated in the current calendar month.
async function getCollectionsThisMonth() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [row] = await Payment.aggregate([
    { $match: { paymentDate: { $gte: monthStart, $lt: nextMonthStart } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return roundMoney(row?.total ?? 0);
}

// GET /api/dashboard/summary (D15)
export async function getSummary(req, res) {
  // Capacity numbers count active rooms only.
  const activeRooms = await withAvailability(await Room.find({ conditionStatus: 'active' }).sort('roomNumber'));
  const totalCapacity = activeRooms.reduce((sum, room) => sum + room.capacity, 0);
  const occupiedSlots = activeRooms.reduce((sum, room) => sum + room.activeOccupants, 0);

  const bills = await withBalances(await Billing.find());
  const totalOutstanding = roundMoney(bills.reduce((sum, bill) => sum + bill.remainingBalance, 0));
  const overdueCount = bills.filter((bill) => bill.status === 'overdue').length;

  // "Open" maintenance means open or in_progress.
  const openFilter = { status: { $in: ['open', 'in_progress'] } };
  const [openTotal, openUrgent] = await Promise.all([
    MaintenanceRequest.countDocuments(openFilter),
    MaintenanceRequest.countDocuments({ ...openFilter, priority: 'urgent' }),
  ]);

  // Rooms that are at least 75% full but still have a free slot.
  const roomsNearCapacity = activeRooms
    .filter((room) => room.occupancyRate >= 75 && room.availableSlots > 0)
    .map((room) => ({
      _id: room._id,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      capacity: room.capacity,
      activeOccupants: room.activeOccupants,
      availableSlots: room.availableSlots,
      occupancyRate: room.occupancyRate,
    }));

  res.json({
    totalRooms: activeRooms.length,
    totalCapacity,
    occupiedSlots,
    vacantSlots: totalCapacity - occupiedSlots,
    occupancyRate: toPercent(occupiedSlots, totalCapacity),
    collectionsThisMonth: await getCollectionsThisMonth(),
    totalOutstanding,
    overdueCount,
    openMaintenance: { total: openTotal, urgent: openUrgent },
    roomsNearCapacity,
  });
}
