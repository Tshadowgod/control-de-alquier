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

  // Alto cómodo para el dedo en el teléfono, más ajustado en pantallas grandes.
  const control =
    "rounded-lg border border-borde bg-panel px-3 py-2 text-sm font-medium text-tinta outline-none focus:border-marca focus:ring-2 focus:ring-marca/15 sm:px-2.5 sm:py-1.5";

  return (
    <div className="no-print flex w-full items-center gap-2 sm:w-auto">
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
        className={`${control} flex-1 cursor-pointer sm:flex-none`}
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
        className={`${control} shrink-0 cursor-pointer`}
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
