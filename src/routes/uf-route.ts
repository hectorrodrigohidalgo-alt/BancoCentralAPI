import { getUfSeries } from "../lib/uf.ts";
import { getTodayInSantiago } from "../lib/dates.ts";
import { validateDateRange } from "../lib/date-range-validation.ts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate")!;
  const endDate = searchParams.get("endDate")!;
  const validationError = validateDateRange(startDate, endDate, getTodayInSantiago());
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }
  try {
    return Response.json(await getUfSeries(startDate, endDate));
  } catch {
    return Response.json(
      { error: "No fue posible consultar la UF. Intenta nuevamente." },
      { status: 502 },
    );
  }
}
