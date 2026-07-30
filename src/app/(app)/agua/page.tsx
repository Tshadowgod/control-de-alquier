import Link from "next/link";
import { BotonGuardar } from "@/components/boton-guardar";
import { Encabezado } from "@/components/encabezado";
import { SelectorMes } from "@/components/selector-mes";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  Stat,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { guardarAgua } from "@/lib/actions";
import { etiquetaPeriodo, fechaInput, money } from "@/lib/format";
import { resolverMes } from "@/lib/periodo";
import { getAgua, getPeriodo } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AguaPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; mes?: string }>;
}) {
  const { anio, mes } = resolverMes(await searchParams);
  const [periodo, agua] = await Promise.all([getPeriodo(anio, mes), getAgua(anio, mes)]);

  const manual = periodo?.reparto_agua === "manual";
  const repartido = agua.reduce((acc, a) => acc + a.importe, 0);
  const factura = periodo?.importe_agua ?? 0;
  const diferencia = factura - repartido;
  const ids = agua.map((a) => a.inquilino_id).join(",");

  return (
    <>
      <Encabezado
        titulo="Agua"
        subtitulo={`Factura y reparto de ${etiquetaPeriodo(anio, mes)}`}
        acciones={<SelectorMes anio={anio} mes={mes} />}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat
          label="Factura del mes"
          value={factura > 0 ? money(factura) : "—"}
          hint={periodo?.fecha_factura_agua ? "Cargada" : "Sin cargar"}
          tone="marca"
        />
        <Stat
          label="Reparto"
          value={manual ? "Manual" : "Partes iguales"}
          hint={
            manual
              ? "Un importe por inquilino"
              : `${agua.length} inquilinos · ${money(agua[0]?.importe ?? 0)} c/u`
          }
        />
        <Stat label="Total repartido" value={money(repartido)} tone="ok" />
        <Stat
          label="Diferencia vs. factura"
          value={factura > 0 ? money(diferencia) : "—"}
          hint="Lo que no quedó asignado"
          tone={Math.abs(diferencia) > 0.5 ? "alerta" : "neutral"}
        />
      </div>

      <Card
        className="mb-6"
        title="1 · La factura de agua"
        description="Cargá el total y elegí cómo repartirlo entre los inquilinos."
      >
        <form action={guardarAgua} id="form-agua" className="grid gap-4 px-5 py-5 sm:grid-cols-2 xl:grid-cols-4">
          <input type="hidden" name="anio" value={anio} />
          <input type="hidden" name="mes" value={mes} />
          <input type="hidden" name="ids" value={ids} />

          <Field label="Importe total de la factura">
            <Input
              name="importe_agua"
              type="number"
              step="0.01"
              min="0"
              defaultValue={periodo?.importe_agua ?? ""}
              placeholder="0.00"
            />
          </Field>

          <Field
            label="Cómo se reparte"
            hint="En partes iguales se divide entre los inquilinos activos."
          >
            <Select name="reparto_agua" defaultValue={periodo?.reparto_agua ?? "partes_iguales"}>
              <option value="partes_iguales">Partes iguales</option>
              <option value="manual">Un importe por inquilino</option>
            </Select>
          </Field>

          <Field label="Fecha de la factura">
            <Input
              name="fecha_factura_agua"
              type="date"
              defaultValue={fechaInput(periodo?.fecha_factura_agua)}
            />
          </Field>

          <div className="flex items-end">
            <BotonGuardar className="w-full">Guardar</BotonGuardar>
          </div>
        </form>
      </Card>

      <Card
        title="2 · Cuánto le toca a cada uno"
        description={
          manual
            ? "Escribí el importe de cada inquilino y guardá."
            : "Se reparte solo en partes iguales. Cambiá el modo arriba si querés cargarlo a mano."
        }
      >
        {agua.length === 0 ? (
          <EmptyState
            title="No hay inquilinos activos"
            description="Cargá inquilinos para poder repartir la factura de agua."
            action={
              <Link href="/inquilinos" className="text-sm font-medium text-marca hover:underline">
                Ir a inquilinos →
              </Link>
            }
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Inquilino</Th>
                  <Th>Propiedad</Th>
                  <Th align="right">Importe de agua</Th>
                </tr>
              </thead>
              <tbody>
                {agua.map((fila) => (
                  <tr key={fila.inquilino_id} className="hover:bg-lienzo/60">
                    <Td>
                      <span className="font-medium text-tinta">{fila.inquilino_nombre}</span>
                    </Td>
                    <Td>
                      <span className="text-sm text-tenue">
                        {fila.propiedad_nombre ?? "Sin propiedad"}
                      </span>
                    </Td>
                    <Td align="right">
                      {manual ? (
                        <Input
                          form="form-agua"
                          name={`agua_${fila.inquilino_id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={fila.importe || ""}
                          placeholder="0.00"
                          className="tabular w-32 text-right"
                        />
                      ) : (
                        <span className="tabular font-medium">{money(fila.importe)}</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-lienzo/70">
                  <Td className="font-semibold">Total</Td>
                  <Td />
                  <Td align="right" className="tabular font-semibold">
                    {money(repartido)}
                  </Td>
                </tr>
              </tfoot>
            </Table>

            {manual && (
              <div className="no-print flex flex-wrap items-center justify-between gap-3 border-t border-borde px-5 py-4">
                <p className="text-xs text-tenue">
                  Se guarda junto con los datos de la factura de arriba.
                </p>
                <Button type="submit" form="form-agua" variant="primario">
                  Guardar importes
                </Button>
              </div>
            )}

            {factura === 0 && (
              <div className="border-t border-borde px-5 py-4">
                <Badge tone="aviso">
                  Todavía no cargaste la factura de agua de este mes.
                </Badge>
              </div>
            )}
          </>
        )}
      </Card>
    </>
  );
}
