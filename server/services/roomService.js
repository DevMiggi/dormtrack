import MaintenanceRequest from '../models/MaintenanceRequest.js';
import Occupancy from '../models/Occupancy.js';
import Room from '../models/Room.js';
import '../models/Tenant.js'; // populate('tenant') below only works once the Tenant model is loaded
import httpError from '../utils/httpError.js';
import validateId from '../utils/validateId.js';

// D3: room availability is computed from active occupancies every time. It is never stored.

// Returns the D3 availability fields for one room, given how many active occupancies it has.
export function calculateAvailability(room, activeOccupants) {
  const availableSlots = Math.max(0, room.capacity - activeOccupants);
  const rate = (activeOccupants / room.capacity) * 100;
  const occupancyRate = Math.round(rate * 100) / 100; // 2 decimals, e.g. 66.67
  const isAvailable = room.conditionStatus === 'active' && availableSlots > 0;

  return { activeOccupants, availableSlots, occupancyRate, isAvailable };
}

// 400 for an invalid id, 404 if no room has it.
export async function findRoomOrFail(id) {
  validateId(id);
  const room = await Room.findById(id);
  if (!room) throw httpError(404, 'Room not found');
  return room;
}

// Number of active occupancies in each room, as a Map from room id to count.
async function countActiveOccupants(roomIds) {
  const rows = await Occupancy.aggregate([
    { $match: { room: { $in: roomIds }, status: 'active' } },
    { $group: { _id: '$room', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), row.count]));
}

// Returns the rooms as plain objects with the D3 availability fields added.
export async function withAvailability(rooms) {
  const counts = await countActiveOccupants(rooms.map((room) => room._id));
  return rooms.map((room) => ({
    ...room.toJSON(),
    ...calculateAvailability(room, counts.get(String(room._id)) ?? 0),
  }));
}

// D3: every active room with its availability. Optional filters: roomType, minAvailableSlots.
export async function getActiveRoomsAvailability({ roomType, minAvailableSlots, sort }) {
  const filter = { conditionStatus: 'active' };
  if (roomType) filter.roomType = roomType;

  const rooms = await withAvailability(await Room.find(filter).sort(sort));
  if (minAvailableSlots === undefined) return rooms;
  return rooms.filter((room) => room.availableSlots >= minAvailableSlots);
}

// The room's active occupancies, each with its tenant.
function getCurrentTenants(roomId) {
  return Occupancy.find({ room: roomId, status: 'active' })
    .populate('tenant', 'firstName lastName phone')
    .sort('moveInDate');
}

// D3: one room's availability plus its current tenants.
export async function getRoomAvailability(id) {
  const room = await findRoomOrFail(id);
  const [roomWithAvailability] = await withAvailability([room]);
  return { ...roomWithAvailability, currentTenants: await getCurrentTenants(room._id) };
}

// D14: the room, its availability, current tenants, occupancy history and maintenance history.
export async function getRoomDetails(id) {
  const room = await findRoomOrFail(id);
  const [roomWithAvailability] = await withAvailability([room]);
  const [currentTenants, occupancyHistory, maintenanceHistory] = await Promise.all([
    getCurrentTenants(room._id),
    Occupancy.find({ room: room._id }).populate('tenant', 'firstName lastName').sort('-moveInDate'),
    MaintenanceRequest.find({ room: room._id }).populate('tenant', 'firstName lastName').sort('-dateReported'),
  ]);
  return { ...roomWithAvailability, currentTenants, occupancyHistory, maintenanceHistory };
}

// D6: on update, capacity cannot drop below the room's current active occupants.
export async function updateRoom(id, data) {
  const room = await findRoomOrFail(id);
  room.set(data);
  await room.validate(); // includes the capacity-matches-roomType rule

  const activeOccupants = await Occupancy.countDocuments({ room: room._id, status: 'active' });
  if (room.capacity < activeOccupants) {
    throw httpError(400, `capacity cannot be lower than the ${activeOccupants} current occupants`);
  }

  await room.save();
  const [result] = await withAvailability([room]);
  return result;
}

// D6: a room with any occupancy or maintenance history is kept for the records.
export async function deleteRoom(id) {
  const room = await findRoomOrFail(id);
  const hasHistory =
    (await Occupancy.exists({ room: room._id })) || (await MaintenanceRequest.exists({ room: room._id }));
  if (hasHistory) {
    throw httpError(400, `Room ${room.roomNumber} has occupancy or maintenance history. Set the room to inactive instead`);
  }
  await room.deleteOne();
}
