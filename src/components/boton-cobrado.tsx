"use client";

import { Button } from "@/components/ui";

/**
 * Completa la casilla "Pagado" de una fila con el total adeudado.
 * No guarda: el usuario marca las filas que cobró y guarda todo junto.
 */
export function BotonCobrado({ inputId, total }: { inputId: string; total: number }) {
  return (
    <Button
      type="button"
      size="sm"
      title="Poner el total como cobrado"
      onClick={() => {
        const input = document.getElementById(inputId) as HTMLInputElement | null;
        if (!input) return;
        input.value = total.toFixed(2);
        input.focus();
      }}
    >
      Cobré todo
    </Button>
  );
}
