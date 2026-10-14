import MaintenanceRequest from '../models/MaintenanceRequest.js';
import Room from '../models/Room.js';
import { withAvailability } from '../services/roomService.js';

// Revenue and outstanding reports are added in CP4.8.

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
