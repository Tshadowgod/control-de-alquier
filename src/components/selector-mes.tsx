"use client";

import { usePathname, useRouter } from "next/navigation";
import { MESES } from "@/lib/format";
import { desplazarMes } from "@/lib/periodo";

export function SelectorMes({ anio, mes }: { anio: number; mes: number }) {
  const router = useRouter();
  const ruta = usePathname();

  function ir(siguiente: { anio: number; mes: number }) {
    router.push(`${ruta}?anio=${siguiente.anio}&mes=${siguiente.mes}`);
  }

  const anioActual = new Date().getFullYear();
  const anios = Array.from({ length: 9 }, (_, i) => anioActual - 5 + i);

  const control =
    "rounded-lg border border-borde bg-panel px-2.5 py-1.5 text-sm font-medium text-tinta outline-none focus:border-marca focus:ring-2 focus:ring-marca/15";

  return (
    <div className="no-print flex items-center gap-2">
      <button
        type="button"
        aria-label="Mes anterior"
        onClick={() => ir(desplazarMes(anio, mes, -1))}
        className={`${control} cursor-pointer hover:bg-lienzo`}
      >
        ‹
      </button>

      <select
        value={mes}
        onChange={(e) => ir({ anio, mes: Number(e.target.value) })}
        className={`${control} cursor-pointer`}
        aria-label="Mes"
      >
        {MESES.map((nombre, i) => (
          <option key={nombre} value={i + 1}>
            {nombre}
          </option>
        ))}
      </select>

      <select
        value={anio}
        onChange={(e) => ir({ anio: Number(e.target.value), mes })}
        className={`${control} cursor-pointer`}
        aria-label="Año"
      >
        {anios.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <button
        type="button"
        aria-label="Mes siguiente"
        onClick={() => ir(desplazarMes(anio, mes, 1))}
        className={`${control} cursor-pointer hover:bg-lienzo`}
      >
        ›
      </button>
    </div>
  );
}
