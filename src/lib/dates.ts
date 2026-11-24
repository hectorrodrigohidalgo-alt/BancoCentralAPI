export function getTodayInSantiago(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function getPreviousMonthRange(today: string): { startDate: string; endDate: string } {
  const [year, month] = today.split("-").map(Number);
  // Date.UTC admite el mes anterior a enero y el día 0 (último día del mes previo).
  return {
    startDate: new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 10),
    endDate: new Date(Date.UTC(year, month - 1, 0)).toISOString().slice(0, 10),
  };
}
