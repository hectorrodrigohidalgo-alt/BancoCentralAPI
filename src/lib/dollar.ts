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
  return data.Series.Obs;
}
