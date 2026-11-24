import type { DollarObservation } from "./dollar";

export async function fetchDollarObservations(startDate: string, endDate: string): Promise<DollarObservation[]> {
  // Consultamos nuestra API; las credenciales del Banco Central permanecen en el servidor.
  const query = new URLSearchParams({ startDate, endDate });
  const response = await fetch(`/api/dollar?${query}`);
  // Dejamos que el llamador gestione los errores y el estado de cada consulta.
  if (!response.ok) throw new Error("Consulta fallida");
  const data = await response.json();
  return data ?? [];
}
