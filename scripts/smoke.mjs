// Prueba de humo: ejercita las Server Actions vía HTTP y verifica los cálculos.
// Trabaja en el período ficticio 2099-03 y limpia todo lo que crea al terminar.
// No depende de los datos reales que ya haya en la base.
import { neon } from "@neondatabase/serverless";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: [join(root, ".env.local"), join(root, ".env")], quiet: true });
const sql = neon(process.env.DATABASE_URL);
const BASE = process.env.SMOKE_BASE ?? "http://localhost:3000";

const fallos = [];
function check(nombre, condicion, detalle = "") {
  if (condicion) console.log(`  ok    ${nombre}`);
  else {
    console.log(`  FALLA ${nombre} ${detalle}`);
    fallos.push(nombre);
  }
}

/** Igual que money() de la app, pero solo la parte numérica: "12.000,00". */
const fmt = (n) =>
  new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

async function getHtml(ruta) {
  const res = await fetch(BASE + ruta);
  if (!res.ok) throw new Error(`${ruta} -> ${res.status}`);
  return res.text();
}

/** $ACTION_ID_ en orden de aparición en el documento. */
function actionIds(html) {
  return [...html.matchAll(/\$ACTION_ID_[a-f0-9]+/g)].map((m) => m[0]);
}

async function postAction(ruta, actionId, campos) {
  const fd = new FormData();
  fd.set(actionId, "");
  for (const [k, v] of Object.entries(campos)) fd.set(k, String(v));
  // En producción Next.js rechaza las Server Actions sin cabecera Origin.
  const res = await fetch(BASE + ruta, {
    method: "POST",
    body: fd,
    headers: { Origin: new URL(BASE).origin },
  });
  if (!res.ok) throw new Error(`POST ${ruta} -> ${res.status}`);
  await res.text();
}

async function limpiar() {
  await sql`delete from inquilinos where nombre like 'PRUEBA %'`;
  await sql`delete from propiedades where nombre = 'PRUEBA Unidad'`;
  await sql`delete from periodos where anio = 2099`;
  await sql`delete from pagos where anio = 2099`;
}

await limpiar();

const LUZ = "/luz?anio=2099&mes=3";
const AGUA = "/agua?anio=2099&mes=3";
const COBROS = "/cobros?anio=2099&mes=3";

console.log("\n1) Alta de propiedad e inquilinos");
{
  const idProp = actionIds(await getHtml("/propiedades"))[0];
  await postAction("/propiedades", idProp, {
    nombre: "PRUEBA Unidad",
    monto_alquiler: "100000",
    activa: "on",
  });
  const [{ id: propiedadId }] =
    await sql`select id from propiedades where nombre = 'PRUEBA Unidad'`;

  for (const [nombre, lecturaInicial] of [
    ["PRUEBA Ana", "1000"],
    ["PRUEBA Beto", "5000"],
  ]) {
    const idInq = actionIds(await getHtml("/inquilinos"))[0];
    await postAction("/inquilinos", idInq, {
      nombre,
      propiedad_id: String(propiedadId),
      medidor: nombre.slice(-3),
      lectura_inicial: lecturaInicial,
      deposito: "0",
      monto_alquiler: "",
      activo: "on",
    });
  }

  const filas = await sql`select nombre from inquilinos where nombre like 'PRUEBA %'`;
  check("dos inquilinos dados de alta", filas.length === 2, JSON.stringify(filas));
}

const inquilinos = await sql`select id, nombre from inquilinos where nombre like 'PRUEBA %'`;
const ana = inquilinos.find((i) => i.nombre === "PRUEBA Ana").id;
const beto = inquilinos.find((i) => i.nombre === "PRUEBA Beto").id;
const ids = `${ana},${beto}`;

// Cantidad real de inquilinos activos: el reparto del agua depende de esto.
const [{ n: activos }] =
  await sql`select count(*)::int as n from inquilinos where activo`;

console.log("\n2) Factura de luz: $50.000 / 500 kWh = $100 por kWh");
{
  const [idFactura] = actionIds(await getHtml(LUZ));
  await postAction(LUZ, idFactura, {
    anio: "2099",
    mes: "3",
    importe_factura: "50000",
    kwh_factura: "500",
    fecha_factura: "2099-03-10",
  });
  check("precio por kWh calculado", (await getHtml(LUZ)).includes(fmt(100)), "");
}

console.log("\n3) Lecturas en lote (un solo guardado)");
{
  const idLecturas = actionIds(await getHtml(LUZ))[1];
  // Ana 1000 -> 1120 = 120 kWh = $12.000 | Beto 5000 -> 5050 = 50 kWh = $5.000
  await postAction(LUZ, idLecturas, {
    anio: "2099",
    mes: "3",
    ids,
    [`lectura_anterior_${ana}`]: "1000",
    [`lectura_actual_${ana}`]: "1120",
    [`lectura_anterior_${beto}`]: "5000",
    [`lectura_actual_${beto}`]: "5050",
  });
  const [{ n }] = await sql`
    select count(*)::int as n from lecturas l join periodos p on p.id = l.periodo_id
     where p.anio = 2099 and p.mes = 3 and l.inquilino_id = any(${[ana, beto]}::int[])`;
  check("las dos lecturas se guardaron de una vez", n === 2, `n=${n}`);

  const html = await getHtml(LUZ);
  check("importe de Ana ($12.000)", html.includes(fmt(12000)), "");
  check("importe de Beto ($5.000)", html.includes(fmt(5000)), "");
}

console.log("\n4) Borrado implícito: si se vacía la lectura, la fila desaparece");
{
  const idLecturas = actionIds(await getHtml(LUZ))[1];
  await postAction(LUZ, idLecturas, {
    anio: "2099",
    mes: "3",
    ids,
    [`lectura_anterior_${ana}`]: "1000",
    [`lectura_actual_${ana}`]: "1120",
    [`lectura_anterior_${beto}`]: "5000",
    [`lectura_actual_${beto}`]: "",
  });
  const [{ n }] = await sql`
    select count(*)::int as n from lecturas l join periodos p on p.id = l.periodo_id
     where p.anio = 2099 and p.mes = 3 and l.inquilino_id = any(${[ana, beto]}::int[])`;
  check("queda una sola lectura", n === 1, `n=${n}`);

  // Se restaura para el resto de la prueba.
  const idLecturas2 = actionIds(await getHtml(LUZ))[1];
  await postAction(LUZ, idLecturas2, {
    anio: "2099",
    mes: "3",
    ids,
    [`lectura_anterior_${ana}`]: "1000",
    [`lectura_actual_${ana}`]: "1120",
    [`lectura_anterior_${beto}`]: "5000",
    [`lectura_actual_${beto}`]: "5050",
  });
}

const IMPORTE_AGUA = 30000;
const aguaPorInquilino = IMPORTE_AGUA / activos;

console.log(`\n5) Agua en partes iguales: $${IMPORTE_AGUA} entre ${activos} activos`);
{
  const [idAgua] = actionIds(await getHtml(AGUA));
  await postAction(AGUA, idAgua, {
    anio: "2099",
    mes: "3",
    ids,
    importe_agua: String(IMPORTE_AGUA),
    reparto_agua: "partes_iguales",
    fecha_factura_agua: "2099-03-12",
  });
  const html = await getHtml(AGUA);
  check(`importe por inquilino ($${fmt(aguaPorInquilino)})`, html.includes(fmt(aguaPorInquilino)), "");
  check("total repartido igual a la factura", html.includes(fmt(IMPORTE_AGUA)), "");
}

console.log("\n6) Agua manual: importes distintos por inquilino");
{
  const [idAgua] = actionIds(await getHtml(AGUA));
  await postAction(AGUA, idAgua, {
    anio: "2099",
    mes: "3",
    ids,
    importe_agua: String(IMPORTE_AGUA),
    reparto_agua: "manual",
    [`agua_${ana}`]: "20000",
    [`agua_${beto}`]: "10000",
  });
  const filas = await sql`
    select a.importe::float8 as importe, a.inquilino_id
      from agua_inquilino a join periodos p on p.id = a.periodo_id
     where p.anio = 2099 and p.mes = 3`;
  check(
    "Ana paga $20.000 de agua",
    filas.find((f) => f.inquilino_id === ana)?.importe === 20000,
    JSON.stringify(filas)
  );

  // Se vuelve a partes iguales para el resto de la prueba.
  const [idAgua2] = actionIds(await getHtml(AGUA));
  await postAction(AGUA, idAgua2, {
    anio: "2099",
    mes: "3",
    ids,
    importe_agua: String(IMPORTE_AGUA),
    reparto_agua: "partes_iguales",
  });
}

const totalAna = 100000 + 12000 + aguaPorInquilino;
const totalBeto = 100000 + 5000 + aguaPorInquilino;

console.log(`\n7) Cobros: total de Ana $${fmt(totalAna)}, de Beto $${fmt(totalBeto)}`);
{
  const html = await getHtml(COBROS);
  check("total de Ana", html.includes(fmt(totalAna)), "");
  check("total de Beto", html.includes(fmt(totalBeto)), "");

  // En /cobros el 1er form es "saldar pendientes" y el 2º el de la tabla.
  const idsAccion = actionIds(html);
  await postAction(COBROS, idsAccion[1], {
    anio: "2099",
    mes: "3",
    ids,
    [`monto_alquiler_${ana}`]: "100000",
    [`extras_${ana}`]: "0",
    [`pagado_${ana}`]: "50000",
    [`fecha_pago_${ana}`]: "2099-03-15",
    [`monto_alquiler_${beto}`]: "100000",
    [`extras_${beto}`]: "0",
    [`pagado_${beto}`]: "0",
    [`fecha_pago_${beto}`]: "",
  });

  const html2 = await getHtml(COBROS);
  check("saldo de Ana", html2.includes(fmt(totalAna - 50000)), "");
  check("estado parcial", html2.includes("Parcial</span>"), "");
  check("estado pendiente", html2.includes("Pendiente</span>"), "");
}

console.log("\n8) Saldar todos los pendientes de una vez");
{
  const idsAccion = actionIds(await getHtml(COBROS));
  await postAction(COBROS, idsAccion[0], { anio: "2099", mes: "3" });

  const filas = await sql`
    select inquilino_id, pagado::float8 as pagado
      from pagos where anio = 2099 and mes = 3 and inquilino_id = any(${[ana, beto]}::int[])`;
  const pagadoAna = filas.find((f) => f.inquilino_id === ana)?.pagado;
  const pagadoBeto = filas.find((f) => f.inquilino_id === beto)?.pagado;
  check("Ana queda saldada", pagadoAna === totalAna, `pagado=${pagadoAna} esperado=${totalAna}`);
  check("Beto queda saldado", pagadoBeto === totalBeto, `pagado=${pagadoBeto} esperado=${totalBeto}`);

  // "Pendiente" también es el título de una métrica: se busca solo la etiqueta de estado.
  const html = await getHtml(COBROS);
  check("no quedan etiquetas de pendiente", !html.includes("Pendiente</span>"), "");
  check("no quedan etiquetas de parcial", !html.includes("Parcial</span>"), "");
}

console.log("\n9) La lectura anterior se autocompleta en abril");
{
  const html = await getHtml("/luz?anio=2099&mes=4");
  check("Ana arranca en 1120", html.includes('value="1120"'), "");
  check("Beto arranca en 5050", html.includes('value="5050"'), "");
}

console.log("\nLimpieza…");
await limpiar();

const restos = await sql`
  select (select count(*) from inquilinos where nombre like 'PRUEBA %')::int as inq,
         (select count(*) from propiedades where nombre = 'PRUEBA Unidad')::int as prop,
         (select count(*) from periodos where anio = 2099)::int as per,
         (select count(*) from pagos where anio = 2099)::int as pag`;
check("no quedan restos de la prueba", Object.values(restos[0]).every((v) => v === 0), JSON.stringify(restos));

console.log(fallos.length === 0 ? "\nTODO OK\n" : `\n${fallos.length} FALLAS: ${fallos.join(", ")}\n`);
process.exit(fallos.length === 0 ? 0 : 1);
