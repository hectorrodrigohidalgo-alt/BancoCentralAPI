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
