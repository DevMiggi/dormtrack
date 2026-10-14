import mongoose from 'mongoose';

// D1: Philippine mobile number, e.g. 09171234567.
const PH_MOBILE = /^09\d{9}$/;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const tenantSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [EMAIL_FORMAT, 'email must be a valid email address'],
      // unique + sparse: emails that are given must be unique, but many tenants may have no email.
      unique: true,
      sparse: true,
      // A blank email means "no email". Saving '' would count as a value and clash with the next blank one.
      set: (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [PH_MOBILE, 'phone must be 11 digits starting with 09'],
    },
    address: { type: String, trim: true, maxlength: 300 },
    emergencyContactName: { type: String, required: true, trim: true, maxlength: 160 },
    emergencyContactPhone: {
      type: String,
      required: true,
      trim: true,
      match: [PH_MOBILE, 'emergencyContactPhone must be 11 digits starting with 09'],
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // include fullName in API responses
    id: false, // do not add an extra "id" copy of _id
  }
);

tenantSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

const Tenant = mongoose.model('Tenant', tenantSchema);

export default Tenant;
