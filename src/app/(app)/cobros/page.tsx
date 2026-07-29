import Link from "next/link";
import { BotonCobrado } from "@/components/boton-cobrado";
import { BotonGuardar } from "@/components/boton-guardar";
import { Encabezado } from "@/components/encabezado";
import { SelectorMes } from "@/components/selector-mes";
import { Badge, Card, EmptyState, Input, Stat, Table, Td, Th } from "@/components/ui";
import { guardarCobros, saldarPendientes } from "@/lib/actions";
import { etiquetaPeriodo, fechaInput, kwh, money } from "@/lib/format";
import { resolverMes } from "@/lib/periodo";
import { getCobros, type FilaCobro } from "@/lib/queries";

export const dynamic = "force-dynamic";

function estado(fila: FilaCobro) {
  if (fila.total <= 0) return <Badge tone="neutral">Sin cargos</Badge>;
  if (fila.saldo <= 0.009) return <Badge tone="ok">Pagado</Badge>;
  if (fila.pagado > 0) return <Badge tone="aviso">Parcial</Badge>;
  return <Badge tone="alerta">Pendiente</Badge>;
}

export default async function CobrosPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; mes?: string }>;
}) {
  const { anio, mes } = resolverMes(await searchParams);
  const cobros = await getCobros(anio, mes);

  const total = cobros.reduce((acc, c) => acc + c.total, 0);
  const cobrado = cobros.reduce((acc, c) => acc + c.pagado, 0);
  const totalLuz = cobros.reduce((acc, c) => acc + c.importe_luz, 0);
  const totalAgua = cobros.reduce((acc, c) => acc + c.importe_agua, 0);
  const totalAlquiler = cobros.reduce((acc, c) => acc + c.monto_alquiler, 0);
  const pendientes = cobros.filter((c) => c.saldo > 0.009).length;
  const ids = cobros.map((c) => c.inquilino_id).join(",");

  return (
    <>
      <Encabezado
        titulo="Cobros del mes"
        subtitulo={`Alquiler, luz y agua de ${etiquetaPeriodo(anio, mes)}`}
        acciones={<SelectorMes anio={anio} mes={mes} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total a cobrar" value={money(total)} tone="marca" />
        <Stat label="Cobrado" value={money(cobrado)} tone="ok" />
        <Stat
          label="Pendiente"
          value={money(total - cobrado)}
          hint={`${pendientes} inquilinos con saldo`}
          tone={total - cobrado > 0.009 ? "alerta" : "ok"}
        />
        <Stat
          label="Servicios del mes"
          value={money(totalLuz + totalAgua)}
          hint={`${money(totalLuz)} de luz · ${money(totalAgua)} de agua`}
        />
      </div>

      <Card
        title="Detalle por inquilino"
        description="Escribí lo que cobraste en la columna Pagado y guardá todo de una vez."
        actions={
          pendientes > 0 ? (
            <form action={saldarPendientes}>
              <input type="hidden" name="anio" value={anio} />
              <input type="hidden" name="mes" value={mes} />
              <BotonGuardar variant="secundario" size="sm" enCurso="Saldando…">
                {`Marcar los ${pendientes} pendientes como pagados`}
              </BotonGuardar>
            </form>
          ) : undefined
        }
      >
        {cobros.length === 0 ? (
          <EmptyState
            title="No hay inquilinos activos"
            description="Cargá inquilinos para empezar a registrar los cobros del mes."
            action={
              <Link href="/inquilinos" className="text-sm font-medium text-marca hover:underline">
                Ir a inquilinos →
              </Link>
            }
          />
        ) : (
          <form action={guardarCobros}>
            <input type="hidden" name="anio" value={anio} />
            <input type="hidden" name="mes" value={mes} />
            <input type="hidden" name="ids" value={ids} />

            <Table>
              <thead>
                <tr>
                  <Th>Inquilino</Th>
                  <Th align="right">Alquiler</Th>
                  <Th align="right">Luz</Th>
                  <Th align="right">Agua</Th>
                  <Th align="right">Extras</Th>
                  <Th align="right">Total</Th>
                  <Th align="right">Pagado</Th>
                  <Th align="right">Saldo</Th>
                  <Th>Estado</Th>
                  <Th align="right" className="no-print" />
                </tr>
              </thead>
              <tbody>
                {cobros.map((fila) => (
                  <tr key={fila.inquilino_id} className="hover:bg-lienzo/60">
                    <Td>
                      <span className="font-medium text-tinta">{fila.inquilino_nombre}</span>
                      <span className="block text-xs text-tenue">
                        {fila.propiedad_nombre ?? "Sin propiedad"}
                      </span>
                    </Td>
                    <Td align="right">
                      <Input
                        name={`monto_alquiler_${fila.inquilino_id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={fila.monto_alquiler}
                        className="tabular w-28 text-right"
                      />
                    </Td>
                    <Td align="right" className="tabular">
                      <span className="font-medium">{money(fila.importe_luz)}</span>
                      <span className="block text-xs text-tenue">{kwh(fila.consumo)}</span>
                    </Td>
                    <Td align="right" className="tabular font-medium">
                      {money(fila.importe_agua)}
                    </Td>
                    <Td align="right">
                      <Input
                        name={`extras_${fila.inquilino_id}`}
                        type="number"
                        step="0.01"
                        defaultValue={fila.extras}
                        className="tabular w-24 text-right"
                      />
                    </Td>
                    <Td align="right" className="tabular font-semibold">
                      {money(fila.total)}
                    </Td>
                    <Td align="right">
                      <Input
                        id={`pagado-${fila.inquilino_id}`}
                        name={`pagado_${fila.inquilino_id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={fila.pagado}
                        className="tabular w-28 text-right"
                      />
                      <input
                        type="hidden"
                        name={`fecha_pago_${fila.inquilino_id}`}
                        value={fechaInput(fila.fecha_pago) || new Date().toISOString().slice(0, 10)}
                      />
                    </Td>
                    <Td
                      align="right"
                      className={`tabular font-medium ${
                        fila.saldo > 0.009 ? "text-alerta" : "text-ok"
                      }`}
                    >
                      {money(fila.saldo)}
                    </Td>
                    <Td>{estado(fila)}</Td>
                    <Td align="right" className="no-print">
                      {fila.saldo > 0.009 && (
                        <BotonCobrado
                          inputId={`pagado-${fila.inquilino_id}`}
                          total={fila.total}
                        />
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-lienzo/70">
                  <Td className="font-semibold">Total</Td>
                  <Td align="right" className="tabular font-semibold">
                    {money(totalAlquiler)}
                  </Td>
                  <Td align="right" className="tabular font-semibold">
                    {money(totalLuz)}
                  </Td>
                  <Td align="right" className="tabular font-semibold">
                    {money(totalAgua)}
                  </Td>
                  <Td />
                  <Td align="right" className="tabular font-semibold">
                    {money(total)}
                  </Td>
                  <Td align="right" className="tabular font-semibold">
                    {money(cobrado)}
                  </Td>
                  <Td align="right" className="tabular font-semibold">
                    {money(total - cobrado)}
                  </Td>
                  <Td />
                  <Td className="no-print" />
                </tr>
              </tfoot>
            </Table>

            <div className="no-print flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <p className="text-xs text-tenue">
                Los importes de luz y agua salen de sus páginas: acá solo se muestran.
              </p>
              <BotonGuardar>Guardar todos los cobros</BotonGuardar>
            </div>
          </form>
        )}
      </Card>
    </>
  );
}
