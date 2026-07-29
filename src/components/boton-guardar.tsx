"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

/**
 * Botón de envío que se deshabilita y avisa mientras la acción está en curso.
 * Debe usarse dentro de un <form>.
 */
export function BotonGuardar({
  children = "Guardar",
  enCurso = "Guardando…",
  variant = "primario",
  size = "md",
  className = "",
  disabled = false,
}: {
  children?: string;
  enCurso?: string;
  variant?: "primario" | "secundario" | "fantasma" | "peligro";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || pending}
    >
      {pending ? enCurso : children}
    </Button>
  );
}
