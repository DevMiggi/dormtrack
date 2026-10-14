import Occupancy from '../models/Occupancy.js';
import * as occupancyService from '../services/occupancyService.js';
import { parseSort } from '../utils/requestHelpers.js';
import validateId from '../utils/validateId.js';

// Every occupancy response includes the tenant's name and the room number.
const WITH_TENANT_AND_ROOM = [
  { path: 'tenant', select: 'firstName lastName phone' },
  { path: 'room', select: 'roomNumber floor roomType' },
];

// GET /api/occupancies?status=&room=&tenant=&sort=
export async function listOccupancies(req, res) {
  const { status, room, tenant, sort } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (room) {
    validateId(room);
    filter.room = room;
  }
  if (tenant) {
    validateId(tenant);
    filter.tenant = tenant;
  }

  const occupancies = await Occupancy.find(filter)
    .populate(WITH_TENANT_AND_ROOM)
    .sort(parseSort(sort, '-moveInDate'));
  res.json(occupancies);
}

// GET /api/occupancies/:id
export async function getOccupancy(req, res) {
  const occupancy = await occupancyService.findOccupancyOrFail(req.params.id);
  res.json(await occupancy.populate(WITH_TENANT_AND_ROOM));
}

// POST /api/occupancies (D4)
export async function createOccupancy(req, res) {
  const occupancy = await occupancyService.createOccupancy(req.body);
  res.status(201).json(await occupancy.populate(WITH_TENANT_AND_ROOM));
}

// PUT /api/occupancies/:id (D5)
export async function updateOccupancy(req, res) {
  const occupancy = await occupancyService.updateOccupancy(req.params.id, req.body);
  res.json(await occupancy.populate(WITH_TENANT_AND_ROOM));
}

// PATCH /api/occupancies/:id/complete (D5) with { actualMoveOutDate }
export async function completeOccupancy(req, res) {
  const occupancy = await occupancyService.completeOccupancy(req.params.id, req.body?.actualMoveOutDate);
  res.json(await occupancy.populate(WITH_TENANT_AND_ROOM));
}

// PATCH /api/occupancies/:id/cancel (D5)
export async function cancelOccupancy(req, res) {
  const occupancy = await occupancyService.cancelOccupancy(req.params.id);
  res.json(await occupancy.populate(WITH_TENANT_AND_ROOM));
}

// DELETE /api/occupancies/:id (D5)
export async function deleteOccupancy(req, res) {
  await occupancyService.deleteOccupancy(req.params.id);
  res.json({ message: 'Occupancy deleted' });
}
