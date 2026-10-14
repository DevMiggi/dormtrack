import MaintenanceRequest from '../models/MaintenanceRequest.js';
import Payment from '../models/Payment.js';
import Room from '../models/Room.js';
import { buildPaymentDateFilter, listBillings } from '../services/billingService.js';
import { withAvailability } from '../services/roomService.js';
import { roundMoney } from '../utils/calculations.js';

// GET /api/reports/revenue?from=&to= (D16): total collected, by month and by payment method.
export async function getRevenueReport(req, res) {
  const { from, to } = req.query;
  const filter = {};
  const dateRange = buildPaymentDateFilter(from, to); // 400 for invalid or reversed dates
  if (dateRange) filter.paymentDate = dateRange;
  const payments = await Payment.find(filter).sort('paymentDate');

  // Group by calendar month ("YYYY-MM") in the server's local time (D2).
  const totalsByMonth = new Map();
  for (const payment of payments) {
    const date = payment.paymentDate;
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    totalsByMonth.set(month, (totalsByMonth.get(month) ?? 0) + payment.amount);
  }
  const byMonth = [...totalsByMonth].map(([month, total]) => ({ month, total: roundMoney(total) }));

  // Every payment method is listed, even with no payments.
  const byMethod = Payment.schema.path('method').enumValues.map((method) => {
    const paymentsWithMethod = payments.filter((payment) => payment.method === method);
    const total = paymentsWithMethod.reduce((sum, payment) => sum + payment.amount, 0);
    return { method, total: roundMoney(total), count: paymentsWithMethod.length };
  });

  const totalCollected = roundMoney(payments.reduce((sum, payment) => sum + payment.amount, 0));
  res.json({ totalCollected, byMonth, byMethod });
}

// GET /api/reports/outstanding (D16): every bill with a balance, most overdue first, then the biggest balance.
export async function getOutstandingReport(req, res) {
  const bills = await listBillings({ sort: 'dueDate' });
  const unpaidBills = bills
    .filter((bill) => bill.remainingBalance > 0)
    .sort((a, b) => b.daysOverdue - a.daysOverdue || b.remainingBalance - a.remainingBalance)
    .map((bill) => ({
      _id: bill._id,
      tenantName: bill.tenant?.fullName,
      roomNumber: bill.occupancy?.room?.roomNumber,
      billingPeriod: bill.billingPeriod,
      dueDate: bill.dueDate,
      total: bill.total,
      totalPaid: bill.totalPaid,
      remainingBalance: bill.remainingBalance,
      status: bill.status,
      daysOverdue: bill.daysOverdue,
    }));

  const totalOutstanding = roundMoney(unpaidBills.reduce((sum, bill) => sum + bill.remainingBalance, 0));
  res.json({ totalOutstanding, bills: unpaidBills });
}

// part as a percentage of whole, 2 decimals. 0 when whole is 0.
function toPercent(part, whole) {
  return whole === 0 ? 0 : Math.round((part / whole) * 100 * 100) / 100;
}

// Counts documents per value of `field`. Every allowed value is listed, even with a count of 0,
// so report charts always show the same bars.
async function countByField(field) {
  const rows = await MaintenanceRequest.aggregate([{ $group: { _id: `$${field}`, count: { $sum: 1 } } }]);
  const counts = new Map(rows.map((row) => [row._id, row.count]));
  const allowedValues = MaintenanceRequest.schema.path(field).enumValues;
  return allowedValues.map((value) => ({ [field]: value, count: counts.get(value) ?? 0 }));
}

// GET /api/reports/occupancy (D16): per active room, per room type, and overall.
export async function getOccupancyReport(req, res) {
  const activeRooms = await withAvailability(await Room.find({ conditionStatus: 'active' }).sort('roomNumber'));

  const rooms = activeRooms.map((room) => ({
    _id: room._id,
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    capacity: room.capacity,
    activeOccupants: room.activeOccupants,
    occupancyRate: room.occupancyRate,
  }));

  const byRoomType = Room.schema.path('roomType').enumValues.map((roomType) => {
    const roomsOfType = rooms.filter((room) => room.roomType === roomType);
    const capacity = roomsOfType.reduce((sum, room) => sum + room.capacity, 0);
    const activeOccupants = roomsOfType.reduce((sum, room) => sum + room.activeOccupants, 0);
    return { roomType, rooms: roomsOfType.length, capacity, activeOccupants, occupancyRate: toPercent(activeOccupants, capacity) };
  });

  const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
  const totalOccupants = rooms.reduce((sum, room) => sum + room.activeOccupants, 0);

  res.json({
    overallRate: toPercent(totalOccupants, totalCapacity),
    totalCapacity,
    totalOccupants,
    byRoomType,
    rooms,
  });
}

// GET /api/reports/maintenance (D16): counts by status and priority, and the average days to resolve.
export async function getMaintenanceReport(req, res) {
  const [byStatus, byPriority, resolved] = await Promise.all([
    countByField('status'),
    countByField('priority'),
    MaintenanceRequest.find({ status: 'resolved', resolvedAt: { $exists: true } }),
  ]);

  // averageResolutionDays = average of (resolvedAt - dateReported), 1 decimal, or null if nothing is resolved.
  let averageResolutionDays = null;
  if (resolved.length > 0) {
    const oneDay = 24 * 60 * 60 * 1000;
    const totalDays = resolved.reduce((sum, request) => sum + (request.resolvedAt - request.dateReported) / oneDay, 0);
    averageResolutionDays = Math.round((totalDays / resolved.length) * 10) / 10;
  }

  res.json({ byStatus, byPriority, averageResolutionDays, resolvedCount: resolved.length });
}
