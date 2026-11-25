import { GET as getDollar } from "../../../routes/dollar-route.ts";
import { GET as getUf } from "../../../routes/uf-route.ts";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ indicator: string }> },
) {
  const { indicator } = await params;
  if (indicator === "dollar") return getDollar(request);
  if (indicator === "uf") return getUf(request);
  return Response.json({ error: "Indicador no encontrado" }, { status: 404 });
}
