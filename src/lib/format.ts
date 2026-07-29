const LOCALE = "es-BO";

/** Símbolo de la moneda. Cambiá esta constante si algún día usás otra. */
const SIMBOLO = "Bs";

const dosDecimales = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const hastaCuatroDecimales = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
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

/**
 * Evita que los residuos de redondeo se muestren como "-0,00": todo lo que
 * queda por debajo de medio centavo se trata como cero.
 */
function sinCeroNegativo(valor: number | null | undefined) {
  const n = valor ?? 0;
  return Math.abs(n) < 0.005 ? 0 : n;
}

/** Importe en bolivianos: "Bs 2.500,00". */
export function money(valor: number | null | undefined) {
  return `${SIMBOLO} ${dosDecimales.format(sinCeroNegativo(valor))}`;
}

/**
 * Importe con más precisión, para valores chicos como el precio por kWh:
 * "Bs 1,4189".
 */
export function moneyFino(valor: number | null | undefined) {
  return `${SIMBOLO} ${hastaCuatroDecimales.format(sinCeroNegativo(valor))}`;
}

export function num(valor: number | null | undefined, decimales = 2) {
  return new Intl.NumberFormat(LOCALE, {
    maximumFractionDigits: decimales,
  }).format(sinCeroNegativo(valor));
}

export function kwh(valor: number | null | undefined) {
  return `${numero.format(sinCeroNegativo(valor))} kWh`;
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
