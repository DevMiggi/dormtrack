// Express treats a middleware as an error handler only when it has all four
// parameters, so `next` stays even though it is not used.
function errorHandler(err, req, res, next) {
  // Mongoose schema validation failed. Each message names its field.
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((fieldError) => fieldError.message);
    return res.status(400).json({ message: messages.join(' ') });
  }

  // A value could not be converted to the schema type, for example a bad ObjectId.
  if (err.name === 'CastError') {
    const message = err.kind === 'ObjectId' ? 'Invalid ID' : `Invalid value for ${err.path}`;
    return res.status(400).json({ message });
  }

  // Duplicate value in a unique field (MongoDB error code 11000).
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    return res.status(400).json({ message: `${fields || 'Value'} already exists` });
  }

  // express.json() could not parse the request body.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body is not valid JSON' });
  }

  // Errors made with httpError(), and other client errors such as a body that is too large.
  // The API only uses 400 and 404 (§6), so any other 4xx becomes 400.
  if (err.statusCode >= 400 && err.statusCode < 500) {
    const status = err.statusCode === 404 ? 404 : 400;
    return res.status(status).json({ message: err.message });
  }

  // Anything else is unexpected. Log the details on the server, never send the stack trace.
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
}

export default errorHandler;
