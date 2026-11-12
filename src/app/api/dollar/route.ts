import { getDollarSeries } from "../../../lib/dollar.ts";
import { getTodayInSantiago } from "../../../lib/dates.ts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate")!;
  const endDate = searchParams.get("endDate")!;
  if (startDate > endDate) {
    return Response.json(
      { error: "La fecha inicial no puede ser posterior a la fecha final" },
      { status: 400 },
    );
  }
  const today = getTodayInSantiago();
  if (startDate > today || endDate > today) {
    return Response.json(
      { error: "Las fechas no pueden ser posteriores a hoy" },
      { status: 400 },
    );
  }
  const observations = await getDollarSeries(startDate, endDate);
  return Response.json(observations);
}
