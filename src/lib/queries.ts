import { sql } from "@/lib/db";

export type Propiedad = {
  id: number;
  nombre: string;
  direccion: string | null;
  monto_alquiler: number;
  notas: string | null;
  activa: boolean;
  inquilinos: number;
};

export type Inquilino = {
  id: number;
  nombre: string;
  documento: string | null;
  telefono: string | null;
  email: string | null;
  propiedad_id: number | null;
  propiedad_nombre: string | null;
  fecha_inicio: string | null;
  deposito: number;
  monto_alquiler: number | null;
  medidor: string | null;
  lectura_inicial: number;
  activo: boolean;
  notas: string | null;
  /** Alquiler efectivo: el propio del inquilino o, si no tiene, el de la propiedad. */
  alquiler_vigente: number;
};

export type Periodo = {
  id: number;
  anio: number;
  mes: number;
  importe_factura: number | null;
  kwh_factura: number | null;
  precio_kwh: number | null;
  fecha_factura: string | null;
  notas: string | null;
};

export type FilaLectura = {
  inquilino_id: number;
  inquilino_nombre: string;
  medidor: string | null;
  propiedad_nombre: string | null;
  lectura_id: number | null;
  lectura_anterior: number;
  lectura_actual: number | null;
  consumo: number;
  importe: number;
};

export type FilaCobro = {
  inquilino_id: number;
  inquilino_nombre: string;
  propiedad_nombre: string | null;
  pago_id: number | null;
  monto_alquiler: number;
  extras: number;
  concepto_extra: string | null;
  pagado: number;
  fecha_pago: string | null;
  notas: string | null;
  consumo: number;
  importe_luz: number;
  total: number;
  saldo: number;
};

/** Precio por kWh del período: el de la factura (importe/kWh) o el cargado a mano. */
export function precioKwh(periodo: Periodo | null): number {
  if (!periodo) return 0;
  if (periodo.importe_factura && periodo.kwh_factura && periodo.kwh_factura > 0) {
    return periodo.importe_factura / periodo.kwh_factura;
  }
  return periodo.precio_kwh ?? 0;
}

export async function getPropiedades(): Promise<Propiedad[]> {
  return (await sql`
    select p.id,
           p.nombre,
           p.direccion,
           p.monto_alquiler::float8 as monto_alquiler,
           p.notas,
           p.activa,
           count(i.id) filter (where i.activo)::int as inquilinos
      from propiedades p
      left join inquilinos i on i.propiedad_id = p.id
     group by p.id
     order by p.activa desc, p.nombre
  `) as Propiedad[];
}

export async function getInquilinos(soloActivos = false): Promise<Inquilino[]> {
  return (await sql`
    select i.id,
           i.nombre,
           i.documento,
           i.telefono,
           i.email,
           i.propiedad_id,
           p.nombre as propiedad_nombre,
           i.fecha_inicio,
           i.deposito::float8 as deposito,
           i.monto_alquiler::float8 as monto_alquiler,
           i.medidor,
           i.lectura_inicial::float8 as lectura_inicial,
           i.activo,
           i.notas,
           coalesce(i.monto_alquiler, p.monto_alquiler, 0)::float8 as alquiler_vigente
      from inquilinos i
      left join propiedades p on p.id = i.propiedad_id
     where (${soloActivos}::boolean = false or i.activo)
     order by i.activo desc, i.nombre
  `) as Inquilino[];
}

export async function getPeriodos(): Promise<Periodo[]> {
  return (await sql`
    select id,
           anio,
           mes,
           importe_factura::float8 as importe_factura,
           kwh_factura::float8 as kwh_factura,
           precio_kwh::float8 as precio_kwh,
           fecha_factura,
           notas
      from periodos
     order by anio desc, mes desc
  `) as Periodo[];
}

export async function getPeriodo(anio: number, mes: number): Promise<Periodo | null> {
  const filas = (await sql`
    select id,
           anio,
           mes,
           importe_factura::float8 as importe_factura,
           kwh_factura::float8 as kwh_factura,
           precio_kwh::float8 as precio_kwh,
           fecha_factura,
           notas
      from periodos
     where anio = ${anio} and mes = ${mes}
  `) as Periodo[];
  return filas[0] ?? null;
}

/**
 * Lectura de arranque para un inquilino en un período: la última lectura
 * registrada en un período anterior, o la lectura inicial de su medidor.
 */
async function lecturasPrevias(anio: number, mes: number) {
  return (await sql`
    select distinct on (l.inquilino_id)
           l.inquilino_id,
           l.lectura_actual::float8 as lectura
      from lecturas l
      join periodos p on p.id = l.periodo_id
     where (p.anio * 12 + p.mes) < ${anio * 12 + mes}
     order by l.inquilino_id, p.anio desc, p.mes desc
  `) as { inquilino_id: number; lectura: number }[];
}

/** Filas de consumo eléctrico de un período (existan o no las lecturas todavía). */
export async function getLecturas(anio: number, mes: number): Promise<FilaLectura[]> {
  const [periodo, inquilinos, previas] = await Promise.all([
    getPeriodo(anio, mes),
    getInquilinos(true),
    lecturasPrevias(anio, mes),
  ]);

  const precio = precioKwh(periodo);
  const previaPorInquilino = new Map(previas.map((p) => [p.inquilino_id, p.lectura]));

  const guardadas = periodo
    ? ((await sql`
        select id,
               inquilino_id,
               lectura_anterior::float8 as lectura_anterior,
               lectura_actual::float8 as lectura_actual
          from lecturas
         where periodo_id = ${periodo.id}
      `) as {
        id: number;
        inquilino_id: number;
        lectura_anterior: number;
        lectura_actual: number;
      }[])
    : [];

  const guardadaPorInquilino = new Map(guardadas.map((l) => [l.inquilino_id, l]));

  return inquilinos.map((inq) => {
    const guardada = guardadaPorInquilino.get(inq.id);
    const anterior =
      guardada?.lectura_anterior ?? previaPorInquilino.get(inq.id) ?? inq.lectura_inicial;
    const actual = guardada ? guardada.lectura_actual : null;
    const consumo = actual === null ? 0 : Math.max(0, actual - anterior);

    return {
      inquilino_id: inq.id,
      inquilino_nombre: inq.nombre,
      medidor: inq.medidor,
      propiedad_nombre: inq.propiedad_nombre,
      lectura_id: guardada?.id ?? null,
      lectura_anterior: anterior,
      lectura_actual: actual,
      consumo,
      importe: consumo * precio,
    };
  });
}

/** Filas de cobro de un mes: alquiler + luz calculada + extras, contra lo pagado. */
export async function getCobros(anio: number, mes: number): Promise<FilaCobro[]> {
  const [inquilinos, lecturas] = await Promise.all([
    getInquilinos(true),
    getLecturas(anio, mes),
  ]);

  const pagos = (await sql`
    select id,
           inquilino_id,
           monto_alquiler::float8 as monto_alquiler,
           extras::float8 as extras,
           concepto_extra,
           pagado::float8 as pagado,
           fecha_pago,
           notas
      from pagos
     where anio = ${anio} and mes = ${mes}
  `) as {
    id: number;
    inquilino_id: number;
    monto_alquiler: number;
    extras: number;
    concepto_extra: string | null;
    pagado: number;
    fecha_pago: string | null;
    notas: string | null;
  }[];

  const pagoPorInquilino = new Map(pagos.map((p) => [p.inquilino_id, p]));
  const lecturaPorInquilino = new Map(lecturas.map((l) => [l.inquilino_id, l]));

  return inquilinos.map((inq) => {
    const pago = pagoPorInquilino.get(inq.id);
    const lectura = lecturaPorInquilino.get(inq.id);
    const montoAlquiler = pago?.monto_alquiler ?? inq.alquiler_vigente;
    const extras = pago?.extras ?? 0;
    const importeLuz = lectura?.importe ?? 0;
    const total = montoAlquiler + extras + importeLuz;
    const pagado = pago?.pagado ?? 0;

    return {
      inquilino_id: inq.id,
      inquilino_nombre: inq.nombre,
      propiedad_nombre: inq.propiedad_nombre,
      pago_id: pago?.id ?? null,
      monto_alquiler: montoAlquiler,
      extras,
      concepto_extra: pago?.concepto_extra ?? null,
      pagado,
      fecha_pago: pago?.fecha_pago ?? null,
      notas: pago?.notas ?? null,
      consumo: lectura?.consumo ?? 0,
      importe_luz: importeLuz,
      total,
      saldo: total - pagado,
    };
  });
}

export type ResumenMes = {
  aCobrar: number;
  cobrado: number;
  pendiente: number;
  consumoTotal: number;
  importeLuz: number;
  inquilinosActivos: number;
  alDia: number;
  precioKwh: number;
  hayFactura: boolean;
};

export async function getResumen(anio: number, mes: number): Promise<ResumenMes> {
  const [cobros, periodo] = await Promise.all([getCobros(anio, mes), getPeriodo(anio, mes)]);

  const aCobrar = cobros.reduce((acc, c) => acc + c.total, 0);
  const cobrado = cobros.reduce((acc, c) => acc + c.pagado, 0);

  return {
    aCobrar,
    cobrado,
    pendiente: aCobrar - cobrado,
    consumoTotal: cobros.reduce((acc, c) => acc + c.consumo, 0),
    importeLuz: cobros.reduce((acc, c) => acc + c.importe_luz, 0),
    inquilinosActivos: cobros.length,
    alDia: cobros.filter((c) => c.saldo <= 0.009 && c.total > 0).length,
    precioKwh: precioKwh(periodo),
    hayFactura: Boolean(periodo?.importe_factura || periodo?.precio_kwh),
  };
}
