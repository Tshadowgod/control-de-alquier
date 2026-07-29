"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getCobros } from "@/lib/queries";

function texto(data: FormData, campo: string): string | null {
  const valor = data.get(campo);
  if (typeof valor !== "string") return null;
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : null;
}

function requerido(data: FormData, campo: string): string {
  const valor = texto(data, campo);
  if (!valor) throw new Error(`El campo "${campo}" es obligatorio`);
  return valor;
}

function numero(data: FormData, campo: string): number {
  const valor = texto(data, campo);
  if (!valor) return 0;
  const n = Number(valor.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function numeroOpcional(data: FormData, campo: string): number | null {
  const valor = texto(data, campo);
  if (!valor) return null;
  const n = Number(valor.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function entero(data: FormData, campo: string): number | null {
  const valor = texto(data, campo);
  if (!valor) return null;
  const n = Number.parseInt(valor, 10);
  return Number.isFinite(n) ? n : null;
}

function booleano(data: FormData, campo: string): boolean {
  return data.get(campo) === "on" || data.get(campo) === "true";
}

function refrescarTodo() {
  revalidatePath("/", "layout");
}

/* ------------------------------- Propiedades ------------------------------ */

export async function guardarPropiedad(data: FormData) {
  const id = entero(data, "id");
  const nombre = requerido(data, "nombre");
  const direccion = texto(data, "direccion");
  const montoAlquiler = numero(data, "monto_alquiler");
  const notas = texto(data, "notas");
  const activa = booleano(data, "activa");

  if (id) {
    await sql`
      update propiedades
         set nombre = ${nombre},
             direccion = ${direccion},
             monto_alquiler = ${montoAlquiler},
             notas = ${notas},
             activa = ${activa}
       where id = ${id}
    `;
  } else {
    await sql`
      insert into propiedades (nombre, direccion, monto_alquiler, notas)
      values (${nombre}, ${direccion}, ${montoAlquiler}, ${notas})
    `;
  }

  refrescarTodo();
}

export async function eliminarPropiedad(data: FormData) {
  const id = entero(data, "id");
  if (id) await sql`delete from propiedades where id = ${id}`;
  refrescarTodo();
}

/* -------------------------------- Inquilinos ------------------------------ */

export async function guardarInquilino(data: FormData) {
  const id = entero(data, "id");
  const nombre = requerido(data, "nombre");
  const documento = texto(data, "documento");
  const telefono = texto(data, "telefono");
  const email = texto(data, "email");
  const propiedadId = entero(data, "propiedad_id");
  const fechaInicio = texto(data, "fecha_inicio");
  const deposito = numero(data, "deposito");
  const montoAlquiler = numeroOpcional(data, "monto_alquiler");
  const medidor = texto(data, "medidor");
  const lecturaInicial = numero(data, "lectura_inicial");
  const activo = booleano(data, "activo");
  const notas = texto(data, "notas");

  if (id) {
    await sql`
      update inquilinos
         set nombre = ${nombre},
             documento = ${documento},
             telefono = ${telefono},
             email = ${email},
             propiedad_id = ${propiedadId},
             fecha_inicio = ${fechaInicio},
             deposito = ${deposito},
             monto_alquiler = ${montoAlquiler},
             medidor = ${medidor},
             lectura_inicial = ${lecturaInicial},
             activo = ${activo},
             notas = ${notas}
       where id = ${id}
    `;
  } else {
    await sql`
      insert into inquilinos (nombre, documento, telefono, email, propiedad_id,
                              fecha_inicio, deposito, monto_alquiler, medidor,
                              lectura_inicial, notas)
      values (${nombre}, ${documento}, ${telefono}, ${email}, ${propiedadId},
              ${fechaInicio}, ${deposito}, ${montoAlquiler}, ${medidor},
              ${lecturaInicial}, ${notas})
    `;
  }

  refrescarTodo();
}

export async function eliminarInquilino(data: FormData) {
  const id = entero(data, "id");
  if (id) await sql`delete from inquilinos where id = ${id}`;
  refrescarTodo();
}

/* --------------------------------- Luz ------------------------------------ */

async function asegurarPeriodo(anio: number, mes: number): Promise<number> {
  const filas = (await sql`
    insert into periodos (anio, mes)
    values (${anio}, ${mes})
    on conflict (anio, mes) do update set anio = excluded.anio
    returning id
  `) as { id: number }[];
  return filas[0].id;
}

/** Carga los datos de la factura del mes (importe total y kWh, o precio manual). */
export async function guardarFactura(data: FormData) {
  const anio = entero(data, "anio");
  const mes = entero(data, "mes");
  if (!anio || !mes) return;

  const periodoId = await asegurarPeriodo(anio, mes);

  await sql`
    update periodos
       set importe_factura = ${numeroOpcional(data, "importe_factura")},
           kwh_factura = ${numeroOpcional(data, "kwh_factura")},
           precio_kwh = ${numeroOpcional(data, "precio_kwh")},
           fecha_factura = ${texto(data, "fecha_factura")},
           notas = ${texto(data, "notas")}
     where id = ${periodoId}
  `;

  refrescarTodo();
}

/** Ids de las filas que envía una tabla de carga masiva. */
function idsDeFilas(data: FormData): number[] {
  return (texto(data, "ids") ?? "")
    .split(",")
    .map((x) => Number.parseInt(x, 10))
    .filter((x) => Number.isFinite(x));
}

/**
 * Guarda de una sola vez las lecturas de todos los medidores del mes.
 * Las filas que quedan sin lectura actual se borran.
 */
export async function guardarLecturas(data: FormData) {
  const anio = entero(data, "anio");
  const mes = entero(data, "mes");
  const ids = idsDeFilas(data);
  if (!anio || !mes || ids.length === 0) return;

  const periodoId = await asegurarPeriodo(anio, mes);

  const conLectura = ids.filter((id) => texto(data, `lectura_actual_${id}`) !== null);
  const sinLectura = ids.filter((id) => texto(data, `lectura_actual_${id}`) === null);

  if (conLectura.length > 0) {
    const valores = conLectura
      .map((_, i) => `($${i * 4 + 1}::int, $${i * 4 + 2}::int, $${i * 4 + 3}::numeric, $${i * 4 + 4}::numeric)`)
      .join(", ");
    const params = conLectura.flatMap((id) => [
      periodoId,
      id,
      numero(data, `lectura_anterior_${id}`),
      numero(data, `lectura_actual_${id}`),
    ]);

    await sql.query(
      `insert into lecturas (periodo_id, inquilino_id, lectura_anterior, lectura_actual)
       values ${valores}
       on conflict (periodo_id, inquilino_id) do update
          set lectura_anterior = excluded.lectura_anterior,
              lectura_actual = excluded.lectura_actual`,
      params
    );
  }

  if (sinLectura.length > 0) {
    await sql`
      delete from lecturas
       where periodo_id = ${periodoId}
         and inquilino_id = any(${sinLectura}::int[])
    `;
  }

  refrescarTodo();
}

/* --------------------------------- Agua ----------------------------------- */

/** Carga la factura de agua del mes y, si el reparto es manual, cada importe. */
export async function guardarAgua(data: FormData) {
  const anio = entero(data, "anio");
  const mes = entero(data, "mes");
  if (!anio || !mes) return;

  const periodoId = await asegurarPeriodo(anio, mes);
  const reparto = texto(data, "reparto_agua") === "manual" ? "manual" : "partes_iguales";

  await sql`
    update periodos
       set importe_agua = ${numeroOpcional(data, "importe_agua")},
           reparto_agua = ${reparto},
           fecha_factura_agua = ${texto(data, "fecha_factura_agua")}
     where id = ${periodoId}
  `;

  const ids = idsDeFilas(data);

  if (reparto === "manual" && ids.length > 0) {
    const valores = ids
      .map((_, i) => `($${i * 3 + 1}::int, $${i * 3 + 2}::int, $${i * 3 + 3}::numeric)`)
      .join(", ");
    const params = ids.flatMap((id) => [periodoId, id, numero(data, `agua_${id}`)]);

    await sql.query(
      `insert into agua_inquilino (periodo_id, inquilino_id, importe)
       values ${valores}
       on conflict (periodo_id, inquilino_id) do update set importe = excluded.importe`,
      params
    );
  }

  refrescarTodo();
}

/* -------------------------------- Cobros ---------------------------------- */

/** Guarda de una sola vez los cobros de todos los inquilinos del mes. */
export async function guardarCobros(data: FormData) {
  const anio = entero(data, "anio");
  const mes = entero(data, "mes");
  const ids = idsDeFilas(data);
  if (!anio || !mes || ids.length === 0) return;

  const valores = ids
    .map(
      (_, i) =>
        `($${i * 7 + 1}::int, $${i * 7 + 2}::int, $${i * 7 + 3}::int, $${i * 7 + 4}::numeric,` +
        ` $${i * 7 + 5}::numeric, $${i * 7 + 6}::numeric, $${i * 7 + 7}::date)`
    )
    .join(", ");

  const params = ids.flatMap((id) => [
    id,
    anio,
    mes,
    numero(data, `monto_alquiler_${id}`),
    numero(data, `extras_${id}`),
    numero(data, `pagado_${id}`),
    texto(data, `fecha_pago_${id}`),
  ]);

  await sql.query(
    `insert into pagos (inquilino_id, anio, mes, monto_alquiler, extras, pagado, fecha_pago)
     values ${valores}
     on conflict (inquilino_id, anio, mes) do update
        set monto_alquiler = excluded.monto_alquiler,
            extras = excluded.extras,
            pagado = excluded.pagado,
            fecha_pago = excluded.fecha_pago`,
    params
  );

  refrescarTodo();
}

/** Da por cobrado todo lo que queda pendiente en el mes. */
export async function saldarPendientes(data: FormData) {
  const anio = entero(data, "anio");
  const mes = entero(data, "mes");
  if (!anio || !mes) return;

  const pendientes = (await getCobros(anio, mes)).filter((c) => c.saldo > 0.009);
  if (pendientes.length === 0) return;

  const hoy = new Date().toISOString().slice(0, 10);
  const valores = pendientes
    .map(
      (_, i) =>
        `($${i * 7 + 1}::int, $${i * 7 + 2}::int, $${i * 7 + 3}::int, $${i * 7 + 4}::numeric,` +
        ` $${i * 7 + 5}::numeric, $${i * 7 + 6}::numeric, $${i * 7 + 7}::date)`
    )
    .join(", ");

  const params = pendientes.flatMap((c) => [
    c.inquilino_id,
    anio,
    mes,
    c.monto_alquiler,
    c.extras,
    c.total,
    hoy,
  ]);

  await sql.query(
    `insert into pagos (inquilino_id, anio, mes, monto_alquiler, extras, pagado, fecha_pago)
     values ${valores}
     on conflict (inquilino_id, anio, mes) do update
        set pagado = excluded.pagado,
            fecha_pago = excluded.fecha_pago`,
    params
  );

  refrescarTodo();
}

export async function borrarCobro(data: FormData) {
  const id = entero(data, "pago_id");
  if (id) await sql`delete from pagos where id = ${id}`;
  refrescarTodo();
}
