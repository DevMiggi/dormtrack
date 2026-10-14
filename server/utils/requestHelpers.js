import httpError from './httpError.js';

// Copies only the listed fields that were sent. Anything else in the body
// (_id, createdAt, status, ...) is ignored, so the client cannot set it.
export function pickFields(data = {}, fields) {
  const picked = {};
  for (const field of fields) {
    if (data[field] !== undefined) picked[field] = data[field];
  }
  return picked;
}

// The `sort` query value: one field name, optionally starting with "-" for descending.
export function parseSort(sort, defaultSort) {
  if (sort === undefined || sort === '') return defaultSort;
  if (typeof sort !== 'string' || !/^-?[A-Za-z]+$/.test(sort)) {
    throw httpError(400, 'sort must be one field name, optionally starting with -');
  }
  return sort;
}
