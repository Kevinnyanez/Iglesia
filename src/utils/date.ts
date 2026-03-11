export function formatTimeAgo(dateInput: string): string {
  const target = new Date(dateInput).getTime();
  if (Number.isNaN(target)) return '';

  const diffMs = target - Date.now();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

  if (Math.abs(diffMs) < hour) {
    return rtf.format(Math.round(diffMs / minute), 'minute');
  }
  if (Math.abs(diffMs) < day) {
    return rtf.format(Math.round(diffMs / hour), 'hour');
  }
  if (Math.abs(diffMs) < week) {
    return rtf.format(Math.round(diffMs / day), 'day');
  }
  if (Math.abs(diffMs) < month) {
    return rtf.format(Math.round(diffMs / week), 'week');
  }
  if (Math.abs(diffMs) < year) {
    return rtf.format(Math.round(diffMs / month), 'month');
  }
  return rtf.format(Math.round(diffMs / year), 'year');
}
