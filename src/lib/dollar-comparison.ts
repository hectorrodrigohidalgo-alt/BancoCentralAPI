import type { DollarObservation } from "./dollar";

export type DollarPeriod = { startDate: string; endDate: string };

export type DollarPeriodResult = {
  period: DollarPeriod;
  observations: DollarObservation[];
  failed: boolean;
};

export function getPeriodLabel(period: DollarPeriod, index: number): string {
  return `Período ${index + 1} (${period.startDate} a ${period.endDate})`;
}

export function toElapsedDayPoints(period: DollarPeriod, observations: DollarObservation[]) {
  const [year, month, day] = period.startDate.split("-").map(Number);
  const start = Date.UTC(year, month - 1, day);
  return observations.map((observation) => {
    const [day, month, year] = observation.indexDateString.split("-").map(Number);
    // Restamos fechas calendario en UTC: un cambio de hora local no acorta ni alarga el día.
    const elapsedDays = (Date.UTC(year, month - 1, day) - start) / 86_400_000;
    return {
      name: observation.indexDateString,
      value: [elapsedDays, Number(observation.value)] as [number, number],
    };
  }).sort((a, b) => a.value[0] - b.value[0]);
}
