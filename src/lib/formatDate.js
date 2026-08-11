/**
 * App-wide centralized date formatting utility.
 * Formats ISO or Date strings into 'DD-MM-YYYY' (e.g. '10-08-2026').
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

export default formatDate;
