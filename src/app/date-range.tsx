"use client";

import { useEffect, useState } from "react";
import { getTodayInSantiago } from "../lib/dates";

export default function DateRange() {
  const [today] = useState(getTodayInSantiago);

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
