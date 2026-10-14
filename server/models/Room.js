import mongoose from 'mongoose';

// D6: the capacity a room may have depends on its type.
const CAPACITY_BY_TYPE = {
  single: { min: 1, max: 1 },
  double: { min: 2, max: 2 },
  shared: { min: 3, max: 20 },
};

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true, trim: true, maxlength: 30 },
    floor: { type: String, required: true, trim: true, maxlength: 50 },
    roomType: { type: String, required: true, enum: ['single', 'double', 'shared'] },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
      validate: {
        // A normal function (not an arrow) so `this` is the room being saved and we can read its roomType.
        // Room updates must therefore use room.save(), not findByIdAndUpdate().
        validator: function (capacity) {
          const limits = CAPACITY_BY_TYPE[this.roomType];
          if (!limits) return true; // an invalid roomType is already reported by its enum check
          return capacity >= limits.min && capacity <= limits.max;
        },
        message: 'capacity must match roomType: single = 1, double = 2, shared = 3 to 20',
      },
    },
    monthlyRate: { type: Number, required: true, min: 0 },
    amenities: { type: [{ type: String, trim: true }], default: [] },
    conditionStatus: { type: String, enum: ['active', 'maintenance', 'inactive'], default: 'active' },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

const Room = mongoose.model('Room', roomSchema);

export default Room;
