// Creates an error that the error handler turns into { message } with this status code.
// Usage: throw httpError(404, 'Room not found');
function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export default httpError;
