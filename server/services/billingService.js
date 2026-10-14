import Billing from '../models/Billing.js';
import Occupancy from '../models/Occupancy.js';
import Payment from '../models/Payment.js';
import '../models/Room.js'; // the populates below only work once Room and Tenant are loaded
import '../models/Tenant.js';
import { calculateBillTotal, deriveBillFields } from '../utils/calculations.js';
import { startOfDay } from '../utils/dates.js';
import httpError from '../utils/httpError.js';
import { pickFields } from '../utils/requestHelpers.js';
import validateId from '../utils/validateId.js';

const AMOUNT_FIELDS = ['rentAmount', 'utilityAmount', 'otherCharges', 'discount'];

// What PUT may change. occupancy, tenant and billingPeriod stay fixed.
const EDITABLE_FIELDS = [...AMOUNT_FIELDS, 'dueDate'];

// Bills are returned with the tenant's name and the room number.
const WITH_TENANT_AND_ROOM = [
  { path: 'tenant', select: 'firstName lastName' },
  { path: 'occupancy', select: 'room', populate: { path: 'room', select: 'roomNumber' } },
];

// 400 for an invalid id, 404 if no bill has it.
export async function findBillingOrFail(id) {
  validateId(id);
  const bill = await Billing.findById(id);
  if (!bill) throw httpError(404, 'Bill not found');
  return bill;
}

// Sum of payments for each bill, as a Map from bill id to amount paid.
async function getTotalsPaid(billIds) {
  const sums = await Payment.aggregate([
    { $match: { billing: { $in: billIds } } },
    { $group: { _id: '$billing', totalPaid: { $sum: '$amount' } } },
  ]);
  return new Map(sums.map((row) => [String(row._id), row.totalPaid]));
}

// D9: returns the bills as plain objects with total, totalPaid, remainingBalance, status and daysOverdue added.
export async function withBalances(bills) {
  const totalsPaid = await getTotalsPaid(bills.map((bill) => bill._id));
  return bills.map((bill) => ({
    ...bill.toJSON(),
    ...deriveBillFields(bill, totalsPaid.get(String(bill._id)) ?? 0),
  }));
}

export async function withBalance(bill) {
  const [result] = await withBalances([bill]);
  return result;
}

// D17 filters: billingPeriod, tenant, and status (D9: status is filtered after deriving it).
export async function listBillings({ billingPeriod, status, tenant, sort }) {
  const filter = {};
  if (billingPeriod) filter.billingPeriod = billingPeriod;
  if (tenant) {
    validateId(tenant);
    filter.tenant = tenant;
  }

  const bills = await Billing.find(filter).populate(WITH_TENANT_AND_ROOM).sort(sort);
  const billsWithBalances = await withBalances(bills);
  return status ? billsWithBalances.filter((bill) => bill.status === status) : billsWithBalances;
}

export async function getBilling(id) {
  const bill = await findBillingOrFail(id);
  return withBalance(await bill.populate(WITH_TENANT_AND_ROOM));
}

// D9: only overdue bills, most overdue first.
export async function getOverdueBills() {
  // Only bills due before today can be overdue, so skip the rest in the query.
  const bills = await Billing.find({ dueDate: { $lt: startOfDay(new Date()) } }).populate(WITH_TENANT_AND_ROOM);

  const billsWithBalances = await withBalances(bills);
  return billsWithBalances
    .filter((bill) => bill.status === 'overdue')
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
}

function checkTotalNotNegative(bill) {
  if (calculateBillTotal(bill) < 0) {
    throw httpError(400, 'Discount cannot exceed total charges');
  }
}

// D8: create a monthly bill for an active occupancy.
export async function createBilling(data = {}) {
  if (!data.occupancy) throw httpError(400, 'occupancy is required');
  validateId(data.occupancy);
  const occupancy = await Occupancy.findById(data.occupancy);
  if (!occupancy) throw httpError(404, 'Occupancy not found');
  if (occupancy.status !== 'active') {
    throw httpError(400, 'Bills can only be created for active occupancies');
  }

  const bill = new Billing({
    ...pickFields(data, AMOUNT_FIELDS),
    occupancy: occupancy._id,
    tenant: occupancy.tenant, // copied from the occupancy, never sent by the client
    billingPeriod: data.billingPeriod,
    dueDate: data.dueDate,
    rentAmount: data.rentAmount ?? occupancy.agreedMonthlyRate, // D8 default
  });
  await bill.validate();
  checkTotalNotNegative(bill);
  if (await Billing.exists({ occupancy: bill.occupancy, billingPeriod: bill.billingPeriod })) {
    throw httpError(400, 'A bill for this period already exists');
  }

  await bill.save();
  return withBalance(await bill.populate(WITH_TENANT_AND_ROOM));
}

// D10: once a bill has a payment, its amounts are locked. dueDate can still change.
export async function updateBilling(id, data) {
  const bill = await findBillingOrFail(id);
  bill.set(pickFields(data, EDITABLE_FIELDS));
  await bill.validate();

  // isModified() is true only if the new value is different, so resending the same amounts is fine.
  const amountChanged = AMOUNT_FIELDS.some((field) => bill.isModified(field));
  if (amountChanged && (await Payment.exists({ billing: bill._id }))) {
    throw httpError(400, 'Amounts cannot change after a payment has been recorded. Only dueDate can change.');
  }
  checkTotalNotNegative(bill);

  await bill.save();
  return withBalance(await bill.populate(WITH_TENANT_AND_ROOM));
}

// D10: a bill with payments cannot be deleted.
export async function deleteBilling(id) {
  const bill = await findBillingOrFail(id);
  if (await Payment.exists({ billing: bill._id })) {
    throw httpError(400, 'A bill with payments cannot be deleted');
  }
  await bill.deleteOne();
  return bill;
}

// D11: record a payment. It may not exceed the bill's remaining balance.
export async function createPayment(data) {
  if (!data.billing) throw httpError(400, 'billing is required');
  const bill = await findBillingOrFail(data.billing);
  const { remainingBalance } = await withBalance(bill);
  if (remainingBalance === 0) throw httpError(400, 'This bill is already fully paid');

  const payment = new Payment({
    billing: bill._id,
    tenant: bill.tenant, // copied from the bill, never sent by the client
    amount: data.amount,
    paymentDate: data.paymentDate,
    method: data.method,
    referenceNumber: data.referenceNumber,
    notes: data.notes,
  });
  await payment.validate(); // amount at least 0.01, date not in the future, valid method

  if (payment.amount > remainingBalance) {
    const balanceText = remainingBalance.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
    throw httpError(400, `Amount cannot exceed the remaining balance of ${balanceText}`);
  }

  await payment.save();
  return { payment, billing: await withBalance(bill) };
}
