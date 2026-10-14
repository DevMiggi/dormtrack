import mongoose from 'mongoose';
import httpError from './httpError.js';

// Throws 400 "Invalid ID" unless the value is a 24-character hex ObjectId.
// Used for IDs in params, body references and query filters.
function validateId(id) {
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw httpError(400, 'Invalid ID');
  }
}

export default validateId;
