import * as billingService from '../services/billingService.js';
import { parseSort } from '../utils/requestHelpers.js';

// Every bill in a response includes total, totalPaid, remainingBalance, status and daysOverdue (D9).

// GET /api/billings?billingPeriod=&status=&tenant=&sort=
export async function listBillings(req, res) {
  const { billingPeriod, status, tenant, sort } = req.query;
  const bills = await billingService.listBillings({
    billingPeriod,
    status,
    tenant,
    sort: parseSort(sort, '-billingPeriod'),
  });
  res.json(bills);
}

// GET /api/billings/overdue
export async function getOverdueBillings(req, res) {
  res.json(await billingService.getOverdueBills());
}

// GET /api/billings/:id
export async function getBilling(req, res) {
  res.json(await billingService.getBilling(req.params.id));
}

// POST /api/billings (D8)
export async function createBilling(req, res) {
  res.status(201).json(await billingService.createBilling(req.body));
}

// PUT /api/billings/:id (D10)
export async function updateBilling(req, res) {
  res.json(await billingService.updateBilling(req.params.id, req.body));
}

// DELETE /api/billings/:id (D10)
export async function deleteBilling(req, res) {
  await billingService.deleteBilling(req.params.id);
  res.json({ message: 'Bill deleted' });
}
