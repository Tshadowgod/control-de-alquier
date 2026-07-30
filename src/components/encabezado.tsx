import type { ReactNode } from "react";

export function Encabezado({
  titulo,
  subtitulo,
  acciones,
}: {
  titulo: string;
  subtitulo?: ReactNode;
  acciones?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6 sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-tinta sm:text-2xl">{titulo}</h1>
        {subtitulo && <p className="mt-0.5 text-sm text-tenue sm:mt-1">{subtitulo}</p>}
      </div>
      {acciones && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{acciones}</div>
      )}
    </header>
  );
}
