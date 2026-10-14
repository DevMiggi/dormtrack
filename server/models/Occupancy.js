import mongoose from 'mongoose';

// One tenant assigned to one room.
const occupancySchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    bedLabel: { type: String, trim: true, maxlength: 50 },
    moveInDate: { type: Date, required: true },
    expectedMoveOutDate: { type: Date },
    actualMoveOutDate: { type: Date },
    depositAmount: { type: Number, min: 0, default: 0 },
    agreedMonthlyRate: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

// Speed up the two questions asked most: "active occupancies in this room" and "this tenant's active occupancy".
occupancySchema.index({ room: 1, status: 1 });
occupancySchema.index({ tenant: 1, status: 1 });

const Occupancy = mongoose.model('Occupancy', occupancySchema);

export default Occupancy;
