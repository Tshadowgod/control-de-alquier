const LOCALE = "es-AR";
const MONEDA = "ARS";

const dinero = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: MONEDA,
  maximumFractionDigits: 2,
});

const numero = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export function money(valor: number | null | undefined) {
  return dinero.format(valor ?? 0);
}

export function num(valor: number | null | undefined, decimales = 2) {
  return new Intl.NumberFormat(LOCALE, {
    maximumFractionDigits: decimales,
  }).format(valor ?? 0);
}

export function kwh(valor: number | null | undefined) {
  return `${numero.format(valor ?? 0)} kWh`;
}

export function nombreMes(mes: number) {
  return MESES[mes - 1] ?? "";
}

export function etiquetaPeriodo(anio: number, mes: number) {
  return `${nombreMes(mes)} ${anio}`;
}

export function fecha(valor: string | Date | null | undefined) {
  if (!valor) return "—";
  const d = typeof valor === "string" ? new Date(valor) : valor;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeZone: "UTC" }).format(d);
}

/** Devuelve "YYYY-MM-DD" a partir de un valor de fecha de Postgres. */
export function fechaInput(valor: string | Date | null | undefined) {
  if (!valor) return "";
  const d = typeof valor === "string" ? new Date(valor) : valor;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}
