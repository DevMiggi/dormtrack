import Payment from '../models/Payment.js';
import * as billingService from '../services/billingService.js';
import httpError from '../utils/httpError.js';
import { parseSort } from '../utils/requestHelpers.js';
import validateId from '../utils/validateId.js';

// Payments are returned with the tenant's name and the bill's period.
const WITH_TENANT_AND_BILL = [
  { path: 'tenant', select: 'firstName lastName' },
  { path: 'billing', select: 'billingPeriod' },
];

// 400 for an invalid id, 404 if no payment has it.
async function findPaymentOrFail(id) {
  validateId(id);
  const payment = await Payment.findById(id);
  if (!payment) throw httpError(404, 'Payment not found');
  return payment;
}

// GET /api/payments?billing=&tenant=&method=&from=&to=&sort= (D12)
export async function listPayments(req, res) {
  const { billing, tenant, method, from, to, sort } = req.query;
  const filter = {};
  if (billing) {
    validateId(billing);
    filter.billing = billing;
  }
  if (tenant) {
    validateId(tenant);
    filter.tenant = tenant;
  }
  if (method) filter.method = method;
  const dateRange = billingService.buildPaymentDateFilter(from, to);
  if (dateRange) filter.paymentDate = dateRange;

  const payments = await Payment.find(filter)
    .populate(WITH_TENANT_AND_BILL)
    .sort(parseSort(sort, '-paymentDate'));
  res.json(payments);
}

// GET /api/payments/:id
export async function getPayment(req, res) {
  const payment = await findPaymentOrFail(req.params.id);
  res.json(await payment.populate(WITH_TENANT_AND_BILL));
}

// POST /api/payments (D11): responds with the payment and the recomputed bill.
export async function createPayment(req, res) {
  const { payment, billing } = await billingService.createPayment(req.body);
  res.status(201).json({ payment: await payment.populate(WITH_TENANT_AND_BILL), billing });
}

// DELETE /api/payments/:id (D11). There is no PUT: a wrong payment is deleted and recorded again.
// The bill's balance updates by itself, because it is always computed from its payments.
export async function deletePayment(req, res) {
  const payment = await findPaymentOrFail(req.params.id);
  await payment.deleteOne();
  res.json({ message: 'Payment deleted' });
}
