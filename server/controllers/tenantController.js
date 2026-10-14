import Billing from '../models/Billing.js';
import Occupancy from '../models/Occupancy.js';
import Payment from '../models/Payment.js';
import '../models/Room.js'; // populate('room') below only works once the Room model is loaded
import Tenant from '../models/Tenant.js';
import { withBalances } from '../services/billingService.js';
import { roundMoney } from '../utils/calculations.js';
import httpError from '../utils/httpError.js';
import { parseSort, pickFields } from '../utils/requestHelpers.js';
import validateId from '../utils/validateId.js';

const TENANT_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'address',
  'emergencyContactName',
  'emergencyContactPhone',
  'status',
];

// 400 for an invalid id, 404 if no tenant has it.
async function findTenantOrFail(id) {
  validateId(id);
  const tenant = await Tenant.findById(id);
  if (!tenant) throw httpError(404, 'Tenant not found');
  return tenant;
}

// GET /api/tenants?search=&status=&sort=
export async function listTenants(req, res) {
  const { search, status, sort } = req.query;
  const filter = {};
  if (search) {
    // Every word must match the name, email or phone, so "juan cruz" finds Juan Dela Cruz.
    const words = String(search).trim().split(/\s+/);
    filter.$and = words.map((word) => {
      const pattern = new RegExp(RegExp.escape(word), 'i');
      return { $or: [{ firstName: pattern }, { lastName: pattern }, { email: pattern }, { phone: pattern }] };
    });
  }
  if (status) filter.status = status;

  res.json(await Tenant.find(filter).sort(parseSort(sort, 'lastName')));
}

// GET /api/tenants/:id (D7): the tenant, current occupancy, occupancy history, bills and total outstanding.
export async function getTenant(req, res) {
  const tenant = await findTenantOrFail(req.params.id);
  const [occupancies, bills] = await Promise.all([
    Occupancy.find({ tenant: tenant._id }).populate('room', 'roomNumber floor roomType').sort('-moveInDate'),
    Billing.find({ tenant: tenant._id })
      .populate({ path: 'occupancy', select: 'room', populate: { path: 'room', select: 'roomNumber' } })
      .sort('-billingPeriod'),
  ]);
  const billsWithBalances = await withBalances(bills);
  const totalOutstanding = roundMoney(billsWithBalances.reduce((sum, bill) => sum + bill.remainingBalance, 0));

  res.json({
    ...tenant.toJSON(),
    currentOccupancy: occupancies.find((occupancy) => occupancy.status === 'active') ?? null,
    occupancyHistory: occupancies,
    bills: billsWithBalances,
    totalOutstanding,
  });
}

// POST /api/tenants
export async function createTenant(req, res) {
  const tenant = await Tenant.create(pickFields(req.body, TENANT_FIELDS));
  res.status(201).json(tenant);
}

// PUT /api/tenants/:id
export async function updateTenant(req, res) {
  const tenant = await findTenantOrFail(req.params.id);
  tenant.set(pickFields(req.body, TENANT_FIELDS));
  await tenant.validate();

  // D7: a tenant who still lives in a room cannot be set to inactive.
  if (tenant.isModified('status') && tenant.status === 'inactive') {
    if (await Occupancy.exists({ tenant: tenant._id, status: 'active' })) {
      throw httpError(400, `${tenant.fullName} has an active occupancy. Complete or cancel it first.`);
    }
  }

  await tenant.save();
  res.json(tenant);
}

// DELETE /api/tenants/:id (D7): tenants with any history are kept for the records.
export async function deleteTenant(req, res) {
  const tenant = await findTenantOrFail(req.params.id);
  const hasHistory =
    (await Occupancy.exists({ tenant: tenant._id })) ||
    (await Billing.exists({ tenant: tenant._id })) ||
    (await Payment.exists({ tenant: tenant._id }));
  if (hasHistory) {
    throw httpError(400, `${tenant.fullName} has occupancy, billing or payment history. Set the tenant to inactive instead`);
  }

  await tenant.deleteOne();
  res.json({ message: 'Tenant deleted' });
}
