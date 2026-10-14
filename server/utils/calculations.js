import { daysBetween } from './dates.js';

// D2: money is rounded to 2 decimals.
export function roundMoney(amount) {
  return Math.round(amount * 100) / 100;
}

// D8: total = rent + utilities + other charges - discount
export function calculateBillTotal(bill) {
  return roundMoney(bill.rentAmount + bill.utilityAmount + bill.otherCharges - bill.discount);
}

// D9: the values every bill gets on every read. None of them are stored.
export function deriveBillFields(bill, totalPaid, today = new Date()) {
  const total = calculateBillTotal(bill);
  const paid = roundMoney(totalPaid);
  const remainingBalance = Math.max(0, roundMoney(total - paid));
  const daysPastDue = daysBetween(bill.dueDate, today); // above 0 once the due date has passed

  let status;
  if (remainingBalance === 0) status = 'paid';
  else if (daysPastDue > 0) status = 'overdue';
  else if (paid > 0) status = 'partial';
  else status = 'unpaid';

  return {
    total,
    totalPaid: paid,
    remainingBalance,
    status,
    daysOverdue: status === 'overdue' ? daysPastDue : 0,
  };
}
