// app/dashboard/RodGrid.tsx
"use client";

import { useState } from "react";
import RodCard, { RodCardProps } from "./RodCard";

export default function RodGrid({ rods }: { rods: RodCardProps[] }) {
  const [cols, setCols] = useState(3);

  return (
    <div>
      <div className="bg-green-800 rounded-xl mb-4 p-2 w-1/5 mr-auto justify-self-start">
        <label>Columns: {cols}</label>
        <input type="range" min="1" max="6" onChange={(e) => setCols(Number(e.target.value))}/>
      </div>

      <div className={`grid bg-gray-300 gap-2 p-4`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {rods.map((rod) => (
          <RodCard key={rod.id} {...rod}/>
        ))}
      </div>
    </div>
  );
}

