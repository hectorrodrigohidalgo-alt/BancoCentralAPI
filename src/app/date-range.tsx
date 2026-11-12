"use client";

import { useEffect, useState } from "react";

export default function DateRange() {
  const [today] = useState(() => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Santiago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  });

  useEffect(() => {
    const query = new URLSearchParams({
      startDate: `${today.slice(0, 7)}-01`,
      endDate: today,
    });
    void fetch(`/api/dollar?${query}`);
  }, [today]);

  return (
    <>
      <label>
        Fecha inicial <input type="date" name="startDate" max={today} defaultValue={`${today.slice(0, 7)}-01`} />
      </label>
      <label>
        Fecha final <input type="date" name="endDate" max={today} defaultValue={today} />
      </label>
    </>
  );
}
