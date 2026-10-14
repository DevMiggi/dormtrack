import Occupancy from '../models/Occupancy.js';
import Room from '../models/Room.js';
import Tenant from '../models/Tenant.js';
import { isAfterToday, startOfDay } from '../utils/dates.js';
import httpError from '../utils/httpError.js';
import validateId from '../utils/validateId.js';
import { calculateAvailability } from './roomService.js';

// The only fields PUT may change (D5). Tenant, room and status are never changed by PUT.
const EDITABLE_FIELDS = ['bedLabel', 'expectedMoveOutDate', 'depositAmount', 'agreedMonthlyRate', 'notes'];

// Copies the listed fields that were sent, and ignores everything else.
function pickFields(data, fields) {
  const picked = {};
  for (const field of fields) {
    if (data[field] !== undefined) picked[field] = data[field];
  }
  return picked;
}

// 400 for an invalid id, 404 if no occupancy has it.
export async function findOccupancyOrFail(id) {
  validateId(id);
  const occupancy = await Occupancy.findById(id);
  if (!occupancy) throw httpError(404, 'Occupancy not found');
  return occupancy;
}

function checkExpectedMoveOut(occupancy) {
  const { expectedMoveOutDate, moveInDate } = occupancy;
  if (expectedMoveOutDate && startOfDay(expectedMoveOutDate) < startOfDay(moveInDate)) {
    throw httpError(400, 'expectedMoveOutDate cannot be before moveInDate');
  }
}

// D5: completed and cancelled occupancies are final.
function checkIsActive(occupancy, action) {
  if (occupancy.status !== 'active') {
    throw httpError(400, `Only active occupancies can be ${action}. This one is already ${occupancy.status}.`);
  }
}

// D4: assign a tenant to a room.
export async function createOccupancy(data) {
  if (!data.room || !data.tenant) throw httpError(400, 'room and tenant are required');
  validateId(data.room);
  validateId(data.tenant);

  const room = await Room.findById(data.room);
  if (!room) throw httpError(404, 'Room not found');
  const tenant = await Tenant.findById(data.tenant);
  if (!tenant) throw httpError(404, 'Tenant not found');

  const occupancy = new Occupancy({
    ...pickFields(data, EDITABLE_FIELDS),
    room: room._id,
    tenant: tenant._id,
    moveInDate: data.moveInDate,
    agreedMonthlyRate: data.agreedMonthlyRate ?? room.monthlyRate, // D4 default
  });
  // Check required fields, types and limits first, so the client gets field-level messages.
  await occupancy.validate();

  // The D4 rules, in the order D4 lists them.
  if (room.conditionStatus !== 'active') {
    throw httpError(400, `Room ${room.roomNumber} is not active (it is ${room.conditionStatus})`);
  }
  const activeOccupants = await Occupancy.countDocuments({ room: room._id, status: 'active' });
  if (calculateAvailability(room, activeOccupants).availableSlots === 0) {
    throw httpError(400, `Room ${room.roomNumber} is full (${activeOccupants} of ${room.capacity} slots taken)`);
  }
  if (tenant.status !== 'active') {
    throw httpError(400, `${tenant.fullName} is not an active tenant`);
  }
  if (await Occupancy.exists({ tenant: tenant._id, status: 'active' })) {
    throw httpError(400, `${tenant.fullName} already has an active occupancy`);
  }
  checkExpectedMoveOut(occupancy);

  return occupancy.save();
}

// D5: PUT changes only the editable fields.
export async function updateOccupancy(id, data) {
  const occupancy = await findOccupancyOrFail(id);
  occupancy.set(pickFields(data, EDITABLE_FIELDS));
  await occupancy.validate();
  checkExpectedMoveOut(occupancy);
  return occupancy.save();
}

// D5: move-out. Needs a move-out date on or after move-in and not in the future.
export async function completeOccupancy(id, actualMoveOutDate) {
  const occupancy = await findOccupancyOrFail(id);
  checkIsActive(occupancy, 'completed');
  if (!actualMoveOutDate) throw httpError(400, 'actualMoveOutDate is required');

  occupancy.set({ actualMoveOutDate, status: 'completed' });
  await occupancy.validate(); // turns an unreadable date into a 400

  if (startOfDay(occupancy.actualMoveOutDate) < startOfDay(occupancy.moveInDate)) {
    throw httpError(400, 'actualMoveOutDate cannot be before moveInDate');
  }
  if (isAfterToday(occupancy.actualMoveOutDate)) {
    throw httpError(400, 'actualMoveOutDate cannot be in the future');
  }
  return occupancy.save();
}

// D5: cancel an assignment.
export async function cancelOccupancy(id) {
  const occupancy = await findOccupancyOrFail(id);
  checkIsActive(occupancy, 'cancelled');
  occupancy.status = 'cancelled';
  return occupancy.save();
}
