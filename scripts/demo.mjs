// Carga datos de ejemplo para probar el sistema.
//
//   npm run demo:cargar    agrega propiedades, inquilinos, facturas y cobros DEMO
//   npm run demo:limpiar   borra todo lo que empieza con "DEMO "
//
// Nunca toca datos propios: solo crea filas con el prefijo "DEMO " y no
// sobrescribe una factura de un mes que ya tenga algo cargado.
import { neon } from "@neondatabase/serverless";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: [join(root, ".env.local"), join(root, ".env")], quiet: true });

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const bs = (n) => `Bs ${n.toFixed(2)}`;
const redondear = (n) => Math.round(n * 100) / 100;

/* --------------------------------- Limpieza -------------------------------- */

async function limpiar() {
  // Borrar inquilinos arrastra sus lecturas, su agua y sus pagos (on delete cascade).
  const inq = await sql`delete from inquilinos where nombre like 'DEMO %' returning id`;
  const prop = await sql`delete from propiedades where nombre like 'DEMO %' returning id`;

  // Los períodos son globales: solo se borran si quedaron completamente vacíos.
  const periodos = await sql`
    delete from periodos p
     where p.notas = 'DEMO'
       and not exists (select 1 from lecturas l where l.periodo_id = p.id)
       and not exists (select 1 from agua_inquilino a where a.periodo_id = p.id)
    returning anio, mes`;

  console.log(
    `Borrados: ${inq.length} inquilinos, ${prop.length} propiedades, ${periodos.length} períodos DEMO.`
  );
}

if (process.argv.includes("--limpiar")) {
  await limpiar();
  process.exit(0);
}

/* ---------------------------------- Carga ---------------------------------- */

await limpiar();

const propiedades = [
  { nombre: "DEMO Depto 1 · planta baja", direccion: "Av. Ballivián 1234", alquiler: 2500 },
  { nombre: "DEMO Depto 2 · primer piso", direccion: "Av. Ballivián 1234", alquiler: 2800 },
  { nombre: "DEMO Local comercial", direccion: "Calle Comercio 45", alquiler: 4000 },
];

const idsPropiedades = [];
for (const p of propiedades) {
  const [fila] = await sql`
    insert into propiedades (nombre, direccion, monto_alquiler, notas)
    values (${p.nombre}, ${p.direccion}, ${p.alquiler}, 'Datos de ejemplo')
    returning id`;
  idsPropiedades.push(fila.id);
}
console.log(`✓ ${propiedades.length} propiedades`);

const inquilinos = [
  {
    nombre: "DEMO María Quispe",
    documento: "4821996 LP",
    telefono: "700 11 223",
    propiedad: 0,
    medidor: "M-101",
    lecturaInicial: 12500,
    deposito: 2500,
    alquilerPropio: null,
    inicio: "2025-03-01",
  },
  {
    nombre: "DEMO Carlos Rojas",
    documento: "6127384 CB",
    telefono: "700 44 556",
    propiedad: 1,
    medidor: "M-102",
    lecturaInicial: 8300,
    deposito: 2800,
    alquilerPropio: null,
    inicio: "2024-09-15",
  },
  {
    nombre: "DEMO Lucía Fernández",
    documento: "5390118 SC",
    telefono: "700 77 889",
    propiedad: 2,
    medidor: "M-103",
    lecturaInicial: 21400,
    deposito: 4000,
    // Alquiler propio distinto al de la propiedad: muestra que se puede pisar.
    alquilerPropio: 3800,
    inicio: "2025-01-10",
  },
];

const idsInquilinos = [];
for (const i of inquilinos) {
  const [fila] = await sql`
    insert into inquilinos (nombre, documento, telefono, propiedad_id, fecha_inicio,
                            deposito, monto_alquiler, medidor, lectura_inicial, notas)
    values (${i.nombre}, ${i.documento}, ${i.telefono}, ${idsPropiedades[i.propiedad]},
            ${i.inicio}, ${i.deposito}, ${i.alquilerPropio}, ${i.medidor},
            ${i.lecturaInicial}, 'Datos de ejemplo')
    returning id`;
  idsInquilinos.push(fila.id);
}
console.log(`✓ ${inquilinos.length} inquilinos con medidor`);

/**
 * Dos meses cerrados. Las lecturas de cada mes arrancan donde terminó el
 * anterior, igual que hace la aplicación.
 */
const meses = [
  {
    anio: 2026,
    mes: 5,
    luz: { importe: 1780, kwh: 1250, fecha: "2026-05-08" },
    agua: { importe: 400, fecha: "2026-05-10" },
    lecturas: [
      { anterior: 12500, actual: 12690 },
      { anterior: 8300, actual: 8505 },
      { anterior: 21400, actual: 21935 },
    ],
    // Mes cobrado por completo.
    cobros: ["total", "total", "total"],
    fechaPago: "2026-05-12",
  },
  {
    anio: 2026,
    mes: 6,
    luz: { importe: 2100, kwh: 1480, fecha: "2026-06-09" },
    agua: { importe: 455, fecha: "2026-06-11" },
    lecturas: [
      { anterior: 12690, actual: 12885 },
      { anterior: 8505, actual: 8742 },
      { anterior: 21935, actual: 22540 },
    ],
    // Uno pagó todo, otro a medias y el tercero no pagó: se ven los tres estados.
    cobros: ["total", 2000, "nada"],
    fechaPago: "2026-06-14",
  },
];

// El agua en partes iguales se divide entre TODOS los inquilinos activos,
// no solo los de ejemplo: se lee la cantidad real para que los totales cierren.
const [{ activos }] = await sql`select count(*)::int as activos from inquilinos where activo`;

for (const m of meses) {
  const etiqueta = `${String(m.mes).padStart(2, "0")}/${m.anio}`;

  const existente = await sql`
    select id, importe_factura, importe_agua from periodos where anio = ${m.anio} and mes = ${m.mes}`;

  if (existente.length > 0 && (existente[0].importe_factura !== null || existente[0].importe_agua !== null)) {
    console.log(`  ⚠ ${etiqueta} ya tenía una factura cargada: no se toca.`);
    continue;
  }

  const [periodo] = await sql`
    insert into periodos (anio, mes, importe_factura, kwh_factura, fecha_factura,
                          importe_agua, reparto_agua, fecha_factura_agua, notas)
    values (${m.anio}, ${m.mes}, ${m.luz.importe}, ${m.luz.kwh}, ${m.luz.fecha},
            ${m.agua.importe}, 'partes_iguales', ${m.agua.fecha}, 'DEMO')
    on conflict (anio, mes) do update
       set importe_factura = excluded.importe_factura,
           kwh_factura = excluded.kwh_factura,
           fecha_factura = excluded.fecha_factura,
           importe_agua = excluded.importe_agua,
           reparto_agua = excluded.reparto_agua,
           fecha_factura_agua = excluded.fecha_factura_agua,
           notas = excluded.notas
    returning id`;

  const precioKwh = m.luz.importe / m.luz.kwh;
  const aguaPorInquilino = m.agua.importe / activos;

  for (let k = 0; k < idsInquilinos.length; k++) {
    const lectura = m.lecturas[k];
    await sql`
      insert into lecturas (periodo_id, inquilino_id, lectura_anterior, lectura_actual)
      values (${periodo.id}, ${idsInquilinos[k]}, ${lectura.anterior}, ${lectura.actual})
      on conflict (periodo_id, inquilino_id) do update
         set lectura_anterior = excluded.lectura_anterior,
             lectura_actual = excluded.lectura_actual`;

    const alquiler = inquilinos[k].alquilerPropio ?? propiedades[inquilinos[k].propiedad].alquiler;
    const consumo = lectura.actual - lectura.anterior;
    const total = redondear(alquiler + consumo * precioKwh + aguaPorInquilino);

    const instruccion = m.cobros[k];
    if (instruccion === "nada") continue;
    const pagado = instruccion === "total" ? total : instruccion;

    await sql`
      insert into pagos (inquilino_id, anio, mes, monto_alquiler, pagado, fecha_pago)
      values (${idsInquilinos[k]}, ${m.anio}, ${m.mes}, ${alquiler}, ${pagado}, ${m.fechaPago})
      on conflict (inquilino_id, anio, mes) do update
         set monto_alquiler = excluded.monto_alquiler,
             pagado = excluded.pagado,
             fecha_pago = excluded.fecha_pago`;
  }

  console.log(
    `✓ ${etiqueta}: luz ${bs(m.luz.importe)} / ${m.luz.kwh} kWh = ${bs(precioKwh)} por kWh · ` +
      `agua ${bs(m.agua.importe)} entre ${activos} = ${bs(aguaPorInquilino)} c/u`
  );
}

console.log("\nListo. Entrá a Mayo o Junio 2026 para ver un mes completo.");
console.log("Para borrar los datos de ejemplo: npm run demo:limpiar\n");
