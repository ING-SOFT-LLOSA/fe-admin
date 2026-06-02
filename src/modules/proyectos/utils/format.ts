export function formatProjectDate(date: Date | string | null | undefined) {
  if (!date) return "-";
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsedDate.getTime())) return "-";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}
