import { Encabezado } from "@/components/encabezado";
import { SelectorMes } from "@/components/selector-mes";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Stat,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { guardarFactura, guardarLectura } from "@/lib/actions";
import { etiquetaPeriodo, fechaInput, kwh, money, num } from "@/lib/format";
import { resolverMes } from "@/lib/periodo";
import { getLecturas, getPeriodo, precioKwh } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function LuzPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; mes?: string }>;
}) {
  const { anio, mes } = resolverMes(await searchParams);
  const [periodo, lecturas] = await Promise.all([getPeriodo(anio, mes), getLecturas(anio, mes)]);

  const precio = precioKwh(periodo);
  const consumoTotal = lecturas.reduce((acc, l) => acc + l.consumo, 0);
  const importeTotal = lecturas.reduce((acc, l) => acc + l.importe, 0);
  const cargadas = lecturas.filter((l) => l.lectura_actual !== null).length;
  const diferencia = (periodo?.importe_factura ?? 0) - importeTotal;

  return (
    <>
      <Encabezado
        titulo="Luz / consumo por medidor"
        subtitulo={`Factura y lecturas de ${etiquetaPeriodo(anio, mes)}`}
        acciones={<SelectorMes anio={anio} mes={mes} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Precio por kWh"
          value={precio > 0 ? money(precio) : "—"}
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

      <Card
        className="mb-6"
        title="Factura del mes"
        description="Cargá el total que llegó y los kWh facturados: el precio por kWh sale solo."
      >
        <form action={guardarFactura} className="grid gap-4 px-5 py-5 sm:grid-cols-2 xl:grid-cols-5">
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

          <Field label="Precio por kWh (manual)" hint="Solo si no cargás importe y kWh.">
            <Input
              name="precio_kwh"
              type="number"
              step="0.0001"
              min="0"
              defaultValue={periodo?.precio_kwh ?? ""}
              placeholder="0.0000"
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
            <Button type="submit" variant="primario" className="w-full">
              Guardar factura
            </Button>
          </div>

          <Field label="Notas" className="sm:col-span-2 xl:col-span-5">
            <Input name="notas" defaultValue={periodo?.notas ?? ""} placeholder="Opcional" />
          </Field>
        </form>
      </Card>

      <Card
        title="Lecturas de medidores"
        description="La lectura anterior se completa sola con la del mes pasado. Escribí la actual y guardá."
      >
        {lecturas.length === 0 ? (
          <EmptyState
            title="No hay inquilinos activos"
            description="Cargá inquilinos con su medidor para registrar el consumo."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Inquilino</Th>
                <Th>Medidor</Th>
                <Th align="right">Lectura anterior</Th>
                <Th align="right">Lectura actual</Th>
                <Th align="right">Consumo</Th>
                <Th align="right">Importe</Th>
                <Th align="right" className="no-print" />
              </tr>
            </thead>
            <tbody>
              {lecturas.map((fila) => (
                <tr key={fila.inquilino_id} className="hover:bg-lienzo/60">
                  <Td>
                    <span className="font-medium text-tinta">{fila.inquilino_nombre}</span>
                    <span className="block text-xs text-tenue">
                      {fila.propiedad_nombre ?? "Sin propiedad"}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-sm text-tenue">{fila.medidor || "—"}</span>
                  </Td>
                  <Td align="right">
                    <Input
                      form={`lectura-${fila.inquilino_id}`}
                      name="lectura_anterior"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={fila.lectura_anterior}
                      className="tabular w-28 text-right"
                    />
                  </Td>
                  <Td align="right">
                    <Input
                      form={`lectura-${fila.inquilino_id}`}
                      name="lectura_actual"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={fila.lectura_actual ?? ""}
                      placeholder="—"
                      className="tabular w-28 text-right"
                    />
                  </Td>
                  <Td align="right" className="tabular">
                    {fila.lectura_actual === null ? (
                      <span className="text-tenue">—</span>
                    ) : (
                      <span className="font-medium">{num(fila.consumo)}</span>
                    )}
                  </Td>
                  <Td align="right" className="tabular font-medium">
                    {fila.lectura_actual === null || precio === 0 ? (
                      <span className="text-tenue">—</span>
                    ) : (
                      money(fila.importe)
                    )}
                  </Td>
                  <Td align="right" className="no-print">
                    <form id={`lectura-${fila.inquilino_id}`} action={guardarLectura}>
                      <input type="hidden" name="anio" value={anio} />
                      <input type="hidden" name="mes" value={mes} />
                      <input type="hidden" name="inquilino_id" value={fila.inquilino_id} />
                      <Button type="submit" size="sm">
                        Guardar
                      </Button>
                    </form>
                  </Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-lienzo/70">
                <Td className="font-semibold">Total</Td>
                <Td />
                <Td />
                <Td />
                <Td align="right" className="tabular font-semibold">
                  {num(consumoTotal)}
                </Td>
                <Td align="right" className="tabular font-semibold">
                  {money(importeTotal)}
                </Td>
                <Td className="no-print" />
              </tr>
            </tfoot>
          </Table>
        )}

        {precio === 0 && lecturas.length > 0 && (
          <div className="px-5 py-4">
            <Badge tone="aviso">
              Falta el precio por kWh: cargá la factura de arriba para ver los importes.
            </Badge>
          </div>
        )}
      </Card>
    </>
  );
}
