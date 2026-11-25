import { getDollarSeries } from "../lib/dollar.ts";
import { getTodayInSantiago } from "../lib/dates.ts";
import { validateDateRange } from "../lib/date-range-validation.ts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate")!;
  const endDate = searchParams.get("endDate")!;
  const today = getTodayInSantiago();
  // Validamos también las solicitudes que llegan sin pasar por el formulario.
  const validationError = validateDateRange(startDate, endDate, today);
  if (validationError) {
    return Response.json(
      { error: validationError },
      { status: 400 },
    );
  }
  // Convertimos el fallo del proveedor en HTTP 502 sin exponer credenciales ni detalles internos.
  try {
    const observations = await getDollarSeries(startDate, endDate);
    return Response.json(observations);
  } catch {
    return Response.json(
      { error: "No fue posible consultar el dólar. Intenta nuevamente." },
      { status: 502 },
    );
  }
}
