import "server-only";

export type DollarObservation = {
  indexDateString: string;
  value: string;
  statusCode: string;
};

export async function getDollarSeries(startDate: string, endDate: string): Promise<DollarObservation[]> {
  const url = new URL("https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx");
  url.search = new URLSearchParams({
    token: process.env.BCCH_API_TOKEN!,
    function: "GetSeries",
    timeseries: "F073.TCO.PRE.Z.D",
    firstdate: startDate,
    lastdate: endDate,
  }).toString();
  const response = await fetch(url);
  const data = await response.json();
  // HTTP 200 no garantiza éxito: solo aceptamos el código 0 del Banco Central.
  if (data.Codigo !== 0) {
    throw new Error("Error en la consulta al Banco Central");
  }
  // Una respuesta exitosa sin observaciones se representa como una lista vacía.
  const observations: DollarObservation[] = data.Series.Obs ?? [];
  // Los vacíos y null se descartan antes de convertir: Number podría interpretarlos como cero.
  return observations.filter(({ statusCode, value }) =>
    statusCode === "OK" && typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)),
  );
}
