import type { ComponentProps, ReactNode } from "react";

/* --------------------------------- Tarjeta -------------------------------- */

export function Card({
  title,
  description,
  actions,
  children,
  className = "",
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-borde bg-panel shadow-[0_1px_2px_rgba(16,24,40,0.05)] ${className}`}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-borde px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-tinta">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-tenue">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

/* --------------------------------- Métrica -------------------------------- */

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "ok" | "alerta" | "marca";
}) {
  const tonos = {
    neutral: "text-tinta",
    ok: "text-ok",
    alerta: "text-alerta",
    marca: "text-marca",
  } as const;

  return (
    <div className="rounded-xl border border-borde bg-panel px-5 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
      <p className="text-xs font-medium uppercase tracking-wide text-tenue">{label}</p>
      <p className={`tabular mt-1.5 text-2xl font-semibold ${tonos[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-tenue">{hint}</p>}
    </div>
  );
}

/* --------------------------------- Etiqueta ------------------------------- */

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "ok" | "alerta" | "aviso" | "marca";
}) {
  const tonos = {
    neutral: "bg-lienzo text-tenue border-borde",
    ok: "bg-ok-suave text-ok border-transparent",
    alerta: "bg-alerta-suave text-alerta border-transparent",
    aviso: "bg-aviso-suave text-aviso border-transparent",
    marca: "bg-marca-suave text-marca border-transparent",
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${tonos[tone]}`}
    >
      {children}
    </span>
  );
}

/* --------------------------------- Botón ---------------------------------- */

type BotonProps = ComponentProps<"button"> & {
  variant?: "primario" | "secundario" | "fantasma" | "peligro";
  size?: "sm" | "md";
};

export function Button({
  variant = "secundario",
  size = "md",
  className = "",
  ...props
}: BotonProps) {
  const variantes = {
    primario: "bg-marca text-white border-marca hover:bg-[#1a51e0]",
    secundario: "bg-panel text-tinta border-borde hover:bg-lienzo",
    fantasma: "bg-transparent text-tenue border-transparent hover:bg-lienzo hover:text-tinta",
    peligro: "bg-panel text-alerta border-borde hover:bg-alerta-suave",
  } as const;

  const tamanos = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3.5 py-2 text-sm",
  } as const;

  return (
    <button
      {...props}
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantes[variant]} ${tamanos[size]} ${className}`}
    />
  );
}

/* --------------------------------- Campos --------------------------------- */

const campoBase =
  "w-full rounded-lg border border-borde bg-panel px-3 py-2 text-sm text-tinta outline-none transition-colors placeholder:text-tenue/70 focus:border-marca focus:ring-2 focus:ring-marca/15";

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-tenue">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-tenue">{hint}</span>}
    </label>
  );
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input {...props} className={`${campoBase} ${className}`} />;
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select {...props} className={`${campoBase} ${className}`} />;
}

export function Textarea({ className = "", ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={`${campoBase} ${className}`} />;
}

/* --------------------------------- Tabla ---------------------------------- */

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">{children}</table>
    </div>
  );
}

const alineacion = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

type Alineacion = keyof typeof alineacion;

export function Th({
  children,
  align = "left",
  className = "",
}: {
  children?: ReactNode;
  align?: Alineacion;
  className?: string;
}) {
  return (
    <th
      className={`border-b border-borde px-4 py-3 text-xs font-medium uppercase tracking-wide text-tenue ${alineacion[align]} ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className = "",
}: {
  children?: ReactNode;
  align?: Alineacion;
  className?: string;
}) {
  return (
    <td
      className={`border-b border-borde px-4 py-3 align-middle ${alineacion[align]} ${className}`}
    >
      {children}
    </td>
  );
}

/* --------------------------------- Vacío ---------------------------------- */

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <p className="text-sm font-medium text-tinta">{title}</p>
      {description && <p className="max-w-md text-sm text-tenue">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ------------------------ Panel desplegable (sin JS) ---------------------- */

export function Disclosure({
  label,
  children,
  tone = "secundario",
}: {
  label: string;
  children: ReactNode;
  tone?: "primario" | "secundario";
}) {
  const estilo =
    tone === "primario"
      ? "bg-marca text-white border-marca hover:bg-[#1a51e0]"
      : "bg-panel text-tinta border-borde hover:bg-lienzo";

  return (
    <details className="group">
      <summary
        className={`inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${estilo}`}
      >
        <span className="hidden group-open:inline">Cerrar</span>
        <span className="group-open:hidden">{label}</span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}
