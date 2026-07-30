"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const enlaces = [
  { href: "/", label: "Panel", icono: "◱" },
  { href: "/cobros", label: "Cobros del mes", icono: "◧" },
  { href: "/luz", label: "Luz / kWh", icono: "◔" },
  { href: "/agua", label: "Agua", icono: "◍" },
  { href: "/inquilinos", label: "Inquilinos", icono: "◇" },
  { href: "/propiedades", label: "Propiedades", icono: "◻" },
];

function esActivo(href: string, ruta: string) {
  return href === "/" ? ruta === "/" : ruta.startsWith(href);
}

function Marca({ compacto = false }: { compacto?: boolean }) {
  return (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-marca text-sm font-bold text-white">
        A
      </span>
      {compacto ? (
        <span className="truncate text-sm font-semibold text-tinta">Control de alquileres</span>
      ) : (
        <span className="text-sm leading-tight font-semibold text-tinta">
          Control de
          <br />
          alquileres
        </span>
      )}
    </>
  );
}

function Enlaces({ ruta, alNavegar }: { ruta: string; alNavegar?: () => void }) {
  return (
    <>
      {enlaces.map((enlace) => {
        const activo = esActivo(enlace.href, ruta);
        return (
          <Link
            key={enlace.href}
            href={enlace.href}
            onClick={alNavegar}
            aria-current={activo ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activo ? "bg-marca-suave text-marca" : "text-tenue hover:bg-lienzo hover:text-tinta"
            }`}
          >
            <span aria-hidden className="text-base leading-none">
              {enlace.icono}
            </span>
            {enlace.label}
          </Link>
        );
      })}
    </>
  );
}

/**
 * Armazón de la aplicación. En pantallas chicas el menú se despliega desde una
 * barra superior fija; a partir de `lg` vuelve a ser una barra lateral.
 * `salir` llega ya renderizado desde el servidor (es un formulario con acción).
 */
export function Shell({ salir, children }: { salir: ReactNode; children: ReactNode }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  // Con el menú abierto no se scrollea el fondo.
  useEffect(() => {
    if (!abierto) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col lg:flex-row">
      {/* Cabecera y menú desplegable — solo en pantallas chicas */}
      <div className="no-print sticky top-0 z-40 lg:hidden">
        <header className="flex items-center gap-3 border-b border-borde bg-panel px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <Marca compacto />
          </Link>

          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            className="ml-auto flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-borde px-3 py-2 text-sm font-medium text-tinta active:bg-lienzo"
          >
            <span aria-hidden className="text-base leading-none">
              {abierto ? "✕" : "☰"}
            </span>
            Menú
          </button>
        </header>

        {abierto && (
          <nav className="absolute inset-x-0 top-full max-h-[70vh] overflow-y-auto border-b border-borde bg-panel px-4 pt-3 pb-4 shadow-lg">
            <div className="flex flex-col gap-1">
              <Enlaces ruta={ruta} alNavegar={cerrar} />
            </div>
            <div className="mt-3 border-t border-borde pt-3">{salir}</div>
          </nav>
        )}
      </div>

      {/* Fondo que cierra el menú al tocarlo */}
      {abierto && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={cerrar}
          className="fixed inset-0 z-30 cursor-default bg-tinta/20 lg:hidden"
        />
      )}

      {/* Barra lateral — a partir de lg */}
      <aside className="no-print hidden border-borde bg-panel px-4 py-6 lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:border-r">
        <Link href="/" className="mb-5 flex items-center gap-2.5 px-2">
          <Marca />
        </Link>

        <nav className="flex flex-col gap-1">
          <Enlaces ruta={ruta} />
        </nav>

        <div className="mt-auto pt-4">{salir}</div>
      </aside>

      <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
