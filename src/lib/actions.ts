"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";

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

/** Guarda la lectura del medidor de un inquilino en el mes indicado. */
export async function guardarLectura(data: FormData) {
  const anio = entero(data, "anio");
  const mes = entero(data, "mes");
  const inquilinoId = entero(data, "inquilino_id");
  if (!anio || !mes || !inquilinoId) return;

  const periodoId = await asegurarPeriodo(anio, mes);
  const anterior = numero(data, "lectura_anterior");
  const actual = numero(data, "lectura_actual");

  await sql`
    insert into lecturas (periodo_id, inquilino_id, lectura_anterior, lectura_actual, notas)
    values (${periodoId}, ${inquilinoId}, ${anterior}, ${actual}, ${texto(data, "notas")})
    on conflict (periodo_id, inquilino_id) do update
       set lectura_anterior = excluded.lectura_anterior,
           lectura_actual = excluded.lectura_actual,
           notas = excluded.notas
  `;

  refrescarTodo();
}

export async function borrarLectura(data: FormData) {
  const id = entero(data, "lectura_id");
  if (id) await sql`delete from lecturas where id = ${id}`;
  refrescarTodo();
}

/* -------------------------------- Cobros ---------------------------------- */

/** Registra el cobro del mes de un inquilino (alquiler, extras y lo pagado). */
export async function guardarCobro(data: FormData) {
  const anio = entero(data, "anio");
  const mes = entero(data, "mes");
  const inquilinoId = entero(data, "inquilino_id");
  if (!anio || !mes || !inquilinoId) return;

  await sql`
    insert into pagos (inquilino_id, anio, mes, monto_alquiler, extras,
                       concepto_extra, pagado, fecha_pago, notas)
    values (${inquilinoId}, ${anio}, ${mes}, ${numero(data, "monto_alquiler")},
            ${numero(data, "extras")}, ${texto(data, "concepto_extra")},
            ${numero(data, "pagado")}, ${texto(data, "fecha_pago")},
            ${texto(data, "notas")})
    on conflict (inquilino_id, anio, mes) do update
       set monto_alquiler = excluded.monto_alquiler,
           extras = excluded.extras,
           concepto_extra = excluded.concepto_extra,
           pagado = excluded.pagado,
           fecha_pago = excluded.fecha_pago,
           notas = excluded.notas
  `;

  refrescarTodo();
}

/** Marca el mes como saldado: lo pagado pasa a ser el total adeudado. */
export async function marcarPagado(data: FormData) {
  const anio = entero(data, "anio");
  const mes = entero(data, "mes");
  const inquilinoId = entero(data, "inquilino_id");
  const total = numero(data, "total");
  if (!anio || !mes || !inquilinoId) return;

  const hoy = new Date().toISOString().slice(0, 10);

  await sql`
    insert into pagos (inquilino_id, anio, mes, monto_alquiler, extras, pagado, fecha_pago)
    values (${inquilinoId}, ${anio}, ${mes}, ${numero(data, "monto_alquiler")},
            ${numero(data, "extras")}, ${total}, ${hoy})
    on conflict (inquilino_id, anio, mes) do update
       set pagado = ${total},
           fecha_pago = ${hoy}
  `;

  refrescarTodo();
}

export async function borrarCobro(data: FormData) {
  const id = entero(data, "pago_id");
  if (id) await sql`delete from pagos where id = ${id}`;
  refrescarTodo();
}
