import httpError from './httpError.js';

// D13: which status may come next. resolved and cancelled are final.
const ALLOWED_TRANSITIONS = {
  open: ['in_progress', 'cancelled'],
  in_progress: ['resolved', 'cancelled'],
  resolved: [],
  cancelled: [],
};

export function getAllowedNextStatuses(status) {
  return ALLOWED_TRANSITIONS[status] ?? [];
}

// Moves a maintenance request to nextStatus following D13, or throws a 400.
// It only changes the request object; the caller saves it.
export function applyStatusChange(request, nextStatus, resolutionNotes) {
  if (!nextStatus) throw httpError(400, 'status is required');

  const allowed = getAllowedNextStatuses(request.status);
  if (!allowed.includes(nextStatus)) {
    const allowedText = allowed.length > 0 ? allowed.join(', ') : `none (${request.status} is final)`;
    throw httpError(400, `Cannot change status from ${request.status} to ${nextStatus}. Allowed next statuses: ${allowedText}`);
  }

  // Resolving needs notes and records when it was resolved.
  if (nextStatus === 'resolved') {
    if (typeof resolutionNotes !== 'string' || resolutionNotes.trim() === '') {
      throw httpError(400, 'resolutionNotes is required to resolve a request');
    }
    request.resolutionNotes = resolutionNotes;
    request.resolvedAt = new Date();
  }

  request.status = nextStatus;
}
