import mongoose from 'mongoose';

// One monthly bill for one occupancy.
// There is no stored status, total or balance: those are derived on every read (D9).
const billingSchema = new mongoose.Schema(
  {
    occupancy: { type: mongoose.Schema.Types.ObjectId, ref: 'Occupancy', required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true }, // copied from the occupancy (D8)
    billingPeriod: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'billingPeriod must be in YYYY-MM format, e.g. 2026-10'],
    },
    rentAmount: { type: Number, required: true, min: 0 },
    utilityAmount: { type: Number, min: 0, default: 0 },
    otherCharges: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true }
);

// One bill per occupancy per month (D8).
billingSchema.index({ occupancy: 1, billingPeriod: 1 }, { unique: true });

const Billing = mongoose.model('Billing', billingSchema);

export default Billing;
