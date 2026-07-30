import Link from "next/link";
import { BotonGuardar } from "@/components/boton-guardar";
import { Encabezado } from "@/components/encabezado";
import { SelectorMes } from "@/components/selector-mes";
import { Badge, Card, EmptyState, Field, Input, Stat, Table, Td, Th } from "@/components/ui";
import { guardarFactura, guardarLecturas } from "@/lib/actions";
import { etiquetaPeriodo, fechaInput, kwh, money, moneyFino, num } from "@/lib/format";
import { resolverMes } from "@/lib/periodo";
import { getLecturas, getPeriodo, precioKwh } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function LuzPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; mes?: string; ajustar?: string }>;
}) {
  const params = await searchParams;
  const { anio, mes } = resolverMes(params);
  const ajustar = params.ajustar === "1";

  const [periodo, lecturas] = await Promise.all([getPeriodo(anio, mes), getLecturas(anio, mes)]);

  const precio = precioKwh(periodo);
  const consumoTotal = lecturas.reduce((acc, l) => acc + l.consumo, 0);
  const importeTotal = lecturas.reduce((acc, l) => acc + l.importe, 0);
  const cargadas = lecturas.filter((l) => l.lectura_actual !== null).length;
  const diferencia = (periodo?.importe_factura ?? 0) - importeTotal;
  const ids = lecturas.map((l) => l.inquilino_id).join(",");

  return (
    <>
      <Encabezado
        titulo="Luz"
        subtitulo={`Factura y medidores de ${etiquetaPeriodo(anio, mes)}`}
        acciones={<SelectorMes anio={anio} mes={mes} />}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat
          label="Precio por kWh"
          value={precio > 0 ? moneyFino(precio) : "—"}
          hint={
            periodo?.importe_factura && periodo?.kwh_factura
              ? "Calculado desde la factura"
              : precio > 0
                ? "Cargado a mano"
                : "Cargá la factura para calcularlo"
          }
          tone="marca"
        />
        <Stat
          label="Consumo repartido"
          value={kwh(consumoTotal)}
          hint={`${cargadas} de ${lecturas.length} medidores con lectura`}
        />
        <Stat label="A cobrar por luz" value={money(importeTotal)} tone="ok" />
        <Stat
          label="Diferencia vs. factura"
          value={periodo?.importe_factura ? money(diferencia) : "—"}
          hint="Consumo común / no asignado"
          tone={diferencia < -0.5 ? "alerta" : "neutral"}
        />
      </div>

      {/* Paso 1 */}
      <Card
        className="mb-6"
        title="1 · La factura que llegó"
        description="Poné el importe total y los kWh facturados: el precio por kWh se calcula solo."
      >
        <form action={guardarFactura} className="grid gap-4 px-5 py-5 sm:grid-cols-2 xl:grid-cols-4">
          <input type="hidden" name="anio" value={anio} />
          <input type="hidden" name="mes" value={mes} />

          <Field label="Importe total de la factura">
            <Input
              name="importe_factura"
              type="number"
              step="0.01"
              min="0"
              defaultValue={periodo?.importe_factura ?? ""}
              placeholder="0.00"
            />
          </Field>

          <Field label="kWh totales facturados">
            <Input
              name="kwh_factura"
              type="number"
              step="0.01"
              min="0"
              defaultValue={periodo?.kwh_factura ?? ""}
              placeholder="0"
            />
          </Field>

          <Field label="Fecha de la factura">
            <Input
              name="fecha_factura"
              type="date"
              defaultValue={fechaInput(periodo?.fecha_factura)}
            />
          </Field>

          <div className="flex items-end">
            <BotonGuardar className="w-full">Guardar factura</BotonGuardar>
          </div>

          <details className="sm:col-span-2 xl:col-span-4">
            <summary className="cursor-pointer text-xs font-medium text-tenue hover:text-tinta">
              Opciones avanzadas
            </summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field
                label="Precio por kWh a mano"
                hint="Solo si no cargás importe y kWh totales."
              >
                <Input
                  name="precio_kwh"
                  type="number"
                  step="0.0001"
                  min="0"
                  defaultValue={periodo?.precio_kwh ?? ""}
                  placeholder="0.0000"
                />
              </Field>
              <Field label="Notas">
                <Input name="notas" defaultValue={periodo?.notas ?? ""} placeholder="Opcional" />
              </Field>
            </div>
          </details>
        </form>
      </Card>

      {/* Paso 2 */}
      <Card
        title="2 · Lecturas de los medidores"
        description="Solo escribí el número que marca hoy cada medidor. Lo demás se calcula solo."
        actions={
          <Link
            href={`/luz?anio=${anio}&mes=${mes}${ajustar ? "" : "&ajustar=1"}`}
            className="text-sm font-medium text-marca hover:underline"
          >
            {ajustar ? "Listo" : "Corregir lecturas anteriores"}
          </Link>
        }
      >
        {lecturas.length === 0 ? (
          <EmptyState
            title="No hay inquilinos activos"
            description="Cargá inquilinos con su medidor para poder registrar el consumo."
            action={
              <Link
                href="/inquilinos"
                className="text-sm font-medium text-marca hover:underline"
              >
                Ir a inquilinos →
              </Link>
            }
          />
        ) : (
          <form action={guardarLecturas}>
            <input type="hidden" name="anio" value={anio} />
            <input type="hidden" name="mes" value={mes} />
            <input type="hidden" name="ids" value={ids} />

            <Table cards>
              <thead>
                <tr>
                  <Th>Inquilino</Th>
                  <Th align="right">Lectura anterior</Th>
                  <Th align="right">Lectura de hoy</Th>
                  <Th align="right">Consumo</Th>
                  <Th align="right">Importe</Th>
                </tr>
              </thead>
              <tbody>
                {lecturas.map((fila) => (
                  <tr key={fila.inquilino_id} className="hover:bg-lienzo/60">
                    <Td titulo>
                      <span className="font-medium text-tinta">{fila.inquilino_nombre}</span>
                      <span className="block text-xs text-tenue">
                        {fila.medidor ? `Medidor ${fila.medidor}` : "Sin medidor"}
                        {fila.propiedad_nombre ? ` · ${fila.propiedad_nombre}` : ""}
                      </span>
                    </Td>
                    <Td align="right" label="Lectura anterior">
                      {ajustar ? (
                        <Input
                          name={`lectura_anterior_${fila.inquilino_id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={fila.lectura_anterior}
                          className="tabular w-28 text-right"
                        />
                      ) : (
                        <>
                          <input
                            type="hidden"
                            name={`lectura_anterior_${fila.inquilino_id}`}
                            value={fila.lectura_anterior}
                          />
                          <span className="tabular text-tenue">{num(fila.lectura_anterior)}</span>
                        </>
                      )}
                    </Td>
                    <Td align="right" label="Lectura de hoy">
                      <Input
                        name={`lectura_actual_${fila.inquilino_id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={fila.lectura_actual ?? ""}
                        placeholder="—"
                        className="tabular w-32 text-right"
                      />
                    </Td>
                    <Td align="right" className="tabular" label="Consumo">
                      {fila.lectura_actual === null ? (
                        <span className="text-tenue">—</span>
                      ) : (
                        <span className="font-medium">{kwh(fila.consumo)}</span>
                      )}
                    </Td>
                    <Td align="right" className="tabular font-medium" label="Importe">
                      {fila.lectura_actual === null || precio === 0 ? (
                        <span className="text-tenue">—</span>
                      ) : (
                        money(fila.importe)
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-lienzo/70">
                  <Td titulo className="font-semibold">
                    Total del mes
                  </Td>
                  <Td />
                  <Td />
                  <Td align="right" className="tabular font-semibold" label="Consumo">
                    {kwh(consumoTotal)}
                  </Td>
                  <Td align="right" className="tabular font-semibold" label="Importe">
                    {money(importeTotal)}
                  </Td>
                </tr>
              </tfoot>
            </Table>

            <div className="no-print flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <p className="text-xs text-tenue">
                Si dejás una lectura vacía, ese inquilino queda sin consumo este mes.
              </p>
              <BotonGuardar>Guardar todas las lecturas</BotonGuardar>
            </div>
          </form>
        )}

        {precio === 0 && lecturas.length > 0 && (
          <div className="border-t border-borde px-5 py-4">
            <Badge tone="aviso">
              Falta el precio por kWh: completá la factura de arriba para ver los importes.
            </Badge>
          </div>
        )}
      </Card>
    </>
  );
}
