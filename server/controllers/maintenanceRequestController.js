import MaintenanceRequest from '../models/MaintenanceRequest.js';
import Room from '../models/Room.js';
import Tenant from '../models/Tenant.js';
import httpError from '../utils/httpError.js';
import { applyStatusChange } from '../utils/maintenanceTransitions.js';
import { parseSort, pickFields } from '../utils/requestHelpers.js';
import validateId from '../utils/validateId.js';

// What POST and PUT may set. status and resolvedAt change only through PATCH /:id/status (D13).
const REQUEST_FIELDS = ['room', 'tenant', 'category', 'description', 'priority', 'dateReported', 'resolutionNotes'];

// Requests are returned with the room number and the tenant's name.
const WITH_ROOM_AND_TENANT = [
  { path: 'room', select: 'roomNumber floor' },
  { path: 'tenant', select: 'firstName lastName' },
];

// 400 for an invalid id, 404 if no request has it.
async function findRequestOrFail(id) {
  validateId(id);
  const request = await MaintenanceRequest.findById(id);
  if (!request) throw httpError(404, 'Maintenance request not found');
  return request;
}

// The room must exist, and a tenant, when one is given, must exist too (D13).
async function checkRoomAndTenant(data) {
  if (data.room !== undefined) {
    validateId(data.room);
    if (!(await Room.exists({ _id: data.room }))) throw httpError(404, 'Room not found');
  }
  if (data.tenant) {
    validateId(data.tenant);
    if (!(await Tenant.exists({ _id: data.tenant }))) throw httpError(404, 'Tenant not found');
  }
}

// GET /api/maintenance-requests?status=&priority=&room=&sort=
export async function listMaintenanceRequests(req, res) {
  const { status, priority, room, sort } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (room) {
    validateId(room);
    filter.room = room;
  }

  const requests = await MaintenanceRequest.find(filter)
    .populate(WITH_ROOM_AND_TENANT)
    .sort(parseSort(sort, '-dateReported'));
  res.json(requests);
}

// GET /api/maintenance-requests/:id
export async function getMaintenanceRequest(req, res) {
  const request = await findRequestOrFail(req.params.id);
  res.json(await request.populate(WITH_ROOM_AND_TENANT));
}

// POST /api/maintenance-requests. A new request always starts as "open".
export async function createMaintenanceRequest(req, res) {
  const data = pickFields(req.body, REQUEST_FIELDS);
  await checkRoomAndTenant(data);
  const request = await MaintenanceRequest.create(data);
  res.status(201).json(await request.populate(WITH_ROOM_AND_TENANT));
}

// PUT /api/maintenance-requests/:id. Never changes status (D13).
export async function updateMaintenanceRequest(req, res) {
  const request = await findRequestOrFail(req.params.id);
  const data = pickFields(req.body, REQUEST_FIELDS);
  await checkRoomAndTenant(data);
  request.set(data);
  await request.save();
  res.json(await request.populate(WITH_ROOM_AND_TENANT));
}

// PATCH /api/maintenance-requests/:id/status with { status, resolutionNotes } (D13)
export async function changeMaintenanceStatus(req, res) {
  const request = await findRequestOrFail(req.params.id);
  applyStatusChange(request, req.body?.status, req.body?.resolutionNotes);
  await request.save();
  res.json(await request.populate(WITH_ROOM_AND_TENANT));
}

// DELETE /api/maintenance-requests/:id
export async function deleteMaintenanceRequest(req, res) {
  const request = await findRequestOrFail(req.params.id);
  await request.deleteOne();
  res.json({ message: 'Maintenance request deleted' });
}
