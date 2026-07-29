"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const enlaces = [
  { href: "/", label: "Panel", icono: "◱" },
  { href: "/cobros", label: "Cobros del mes", icono: "◧" },
  { href: "/luz", label: "Luz / kWh", icono: "◔" },
  { href: "/inquilinos", label: "Inquilinos", icono: "◇" },
  { href: "/propiedades", label: "Propiedades", icono: "◻" },
];

export function Nav() {
  const ruta = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col">
      {enlaces.map((enlace) => {
        const activo =
          enlace.href === "/" ? ruta === "/" : ruta.startsWith(enlace.href);

        return (
          <Link
            key={enlace.href}
            href={enlace.href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activo
                ? "bg-marca-suave text-marca"
                : "text-tenue hover:bg-lienzo hover:text-tinta"
            }`}
          >
            <span aria-hidden className="text-base leading-none">
              {enlace.icono}
            </span>
            {enlace.label}
          </Link>
        );
      })}
    </nav>
  );
}
