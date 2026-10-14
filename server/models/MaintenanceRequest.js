import mongoose from 'mongoose';
import { isAfterToday } from '../utils/dates.js';

const maintenanceRequestSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      // Optional. A blank value from a form ("no tenant") is stored as no tenant instead of failing.
      set: (value) => (value === '' ? undefined : value),
    },
    category: {
      type: String,
      required: true,
      enum: ['plumbing', 'electrical', 'furniture', 'appliance', 'cleaning', 'other'],
    },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    // Changed only through the D13 state machine in utils/maintenanceTransitions.js.
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'cancelled'], default: 'open' },
    dateReported: {
      type: Date,
      default: Date.now,
      validate: { validator: (date) => !isAfterToday(date), message: 'dateReported cannot be in the future' },
    },
    resolvedAt: { type: Date },
    resolutionNotes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

// Mongoose stores this model in the "maintenancerequests" collection.
const MaintenanceRequest = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);

export default MaintenanceRequest;
