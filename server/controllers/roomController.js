import Room from '../models/Room.js';
import * as roomService from '../services/roomService.js';
import httpError from '../utils/httpError.js';
import { parseSort, pickFields } from '../utils/requestHelpers.js';

const ROOM_FIELDS = ['roomNumber', 'floor', 'roomType', 'capacity', 'monthlyRate', 'amenities', 'conditionStatus', 'notes'];

// GET /api/rooms?search=&roomType=&conditionStatus=&sort=
export async function listRooms(req, res) {
  const { search, roomType, conditionStatus, sort } = req.query;
  const filter = {};
  if (search) {
    // RegExp.escape makes characters like ( or * match literally.
    const pattern = new RegExp(RegExp.escape(String(search)), 'i');
    filter.$or = [{ roomNumber: pattern }, { floor: pattern }];
  }
  if (roomType) filter.roomType = roomType;
  if (conditionStatus) filter.conditionStatus = conditionStatus;

  const rooms = await Room.find(filter).sort(parseSort(sort, 'roomNumber'));
  res.json(await roomService.withAvailability(rooms));
}

// GET /api/rooms/availability?roomType=&minAvailableSlots=&sort=
export async function getAvailability(req, res) {
  const { roomType, minAvailableSlots, sort } = req.query;
  let minSlots;
  if (minAvailableSlots !== undefined) {
    minSlots = Number(minAvailableSlots);
    if (!Number.isInteger(minSlots) || minSlots < 0) {
      throw httpError(400, 'minAvailableSlots must be a whole number, 0 or more');
    }
  }

  const rooms = await roomService.getActiveRoomsAvailability({
    roomType,
    minAvailableSlots: minSlots,
    sort: parseSort(sort, 'roomNumber'),
  });
  res.json(rooms);
}

// GET /api/rooms/:id/availability
export async function getRoomAvailability(req, res) {
  res.json(await roomService.getRoomAvailability(req.params.id));
}

// GET /api/rooms/:id
export async function getRoom(req, res) {
  res.json(await roomService.getRoomDetails(req.params.id));
}

// POST /api/rooms
export async function createRoom(req, res) {
  const room = await Room.create(pickFields(req.body, ROOM_FIELDS));
  const [result] = await roomService.withAvailability([room]);
  res.status(201).json(result);
}

// PUT /api/rooms/:id
export async function updateRoom(req, res) {
  res.json(await roomService.updateRoom(req.params.id, pickFields(req.body, ROOM_FIELDS)));
}

// DELETE /api/rooms/:id
export async function deleteRoom(req, res) {
  await roomService.deleteRoom(req.params.id);
  res.json({ message: 'Room deleted' });
}
