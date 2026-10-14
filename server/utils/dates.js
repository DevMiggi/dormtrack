// D2: dates are compared by calendar day (in the server's local time), not by the exact time.

// The same date at 00:00, so two times on the same day compare as equal.
export function startOfDay(value) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// "In the future" means after today (D2). Later today is not the future.
export function isAfterToday(value) {
  return startOfDay(value) > startOfDay(new Date());
}

// Whole calendar days from `from` to `to`. Negative if `to` is the earlier day.
export function daysBetween(from, to) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(to) - startOfDay(from)) / oneDay);
}
