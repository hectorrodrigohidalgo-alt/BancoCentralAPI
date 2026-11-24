export function validateDateRange(startDate: string, endDate: string, today: string): string | null {
  // El orden se comprueba primero para conservar la prioridad del mensaje en ambas capas.
  if (startDate > endDate) {
    return "La fecha inicial no puede ser posterior a la fecha final";
  }
  if (startDate > today || endDate > today) {
    return "Las fechas no pueden ser posteriores a hoy";
  }
  return null;
}

export function validateFullMonthRange(startDate: string, endDate: string): string | null {
  const yearMonth = startDate.slice(0, 7);
  const monthEnd = new Date(`${yearMonth}-01T00:00:00Z`);
  // El día 0 del mes siguiente es el último del mes solicitado, también en años bisiestos.
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1, 0);
  if (startDate !== `${yearMonth}-01` || endDate !== `${yearMonth}-${monthEnd.getUTCDate()}`) {
    return "Selecciona un mes calendario completo, desde el día 1 hasta el último día del mes.";
  }
  return null;
}
