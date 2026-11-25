import "server-only";

export type UfObservation = {
  indexDateString: string;
  value: string;
  statusCode: string;
};

export async function getUfSeries(startDate: string, endDate: string): Promise<UfObservation[]> {
  const url = new URL("https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx");
  url.search = new URLSearchParams({
    token: process.env.BCCH_API_TOKEN!,
    function: "GetSeries",
    timeseries: "F073.UFF.PRE.Z.D",
    firstdate: startDate,
    lastdate: endDate,
  }).toString();
  const response = await fetch(url);
  const data = await response.json();
  const observations: UfObservation[] = data.Series.Obs;
  return observations.filter(({ statusCode, value }) =>
    statusCode === "OK" && typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)),
  );
}
