export function formatDateRange(
  date: string,
  returnDate: string | null | undefined,
  opts: Intl.DateTimeFormatOptions
): string {
  const from = new Date(date).toLocaleDateString('sk-SK', opts);
  if (!returnDate) return from;

  const to = new Date(returnDate).toLocaleDateString('sk-SK', opts);
  if (to === from) return from;

  return `${from} – ${to}`;
}
