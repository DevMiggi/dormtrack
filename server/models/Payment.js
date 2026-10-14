import mongoose from 'mongoose';
import { isAfterToday } from '../utils/dates.js';

// Payments have no PUT on purpose: a wrong payment is deleted and recorded again.
const paymentSchema = new mongoose.Schema(
  {
    billing: { type: mongoose.Schema.Types.ObjectId, ref: 'Billing', required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true }, // copied from the bill (D11)
    amount: { type: Number, required: true, min: 0.01 },
    paymentDate: {
      type: Date,
      required: true,
      validate: { validator: (date) => !isAfterToday(date), message: 'paymentDate cannot be in the future' },
    },
    method: { type: String, required: true, enum: ['cash', 'gcash', 'bank_transfer', 'other'] },
    referenceNumber: { type: String, trim: true, maxlength: 100 },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
