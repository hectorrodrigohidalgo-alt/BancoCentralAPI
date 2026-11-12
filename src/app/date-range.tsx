"use client";

import { useState } from "react";

export default function DateRange() {
  const [today] = useState(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
  });

  return (
    <>
      <label>
        Fecha inicial <input type="date" name="startDate" defaultValue={`${today.slice(0, 7)}-01`} />
      </label>
      <label>
        Fecha final <input type="date" name="endDate" defaultValue={today} />
      </label>
    </>
  );
}
