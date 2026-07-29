import { Encabezado } from "@/components/encabezado";
import { SelectorMes } from "@/components/selector-mes";
import { Badge, Button, Card, EmptyState, Input, Stat, Table, Td, Th } from "@/components/ui";
import { guardarCobro, marcarPagado } from "@/lib/actions";
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
  const totalAlquiler = cobros.reduce((acc, c) => acc + c.monto_alquiler, 0);

  return (
    <>
      <Encabezado
        titulo="Cobros del mes"
        subtitulo={`Alquiler + luz de ${etiquetaPeriodo(anio, mes)}`}
        acciones={<SelectorMes anio={anio} mes={mes} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total a cobrar" value={money(total)} tone="marca" />
        <Stat label="Cobrado" value={money(cobrado)} tone="ok" />
        <Stat
          label="Pendiente"
          value={money(total - cobrado)}
          tone={total - cobrado > 0.009 ? "alerta" : "ok"}
        />
        <Stat
          label="Desglose"
          value={money(totalAlquiler)}
          hint={`Alquileres · ${money(totalLuz)} de luz`}
        />
      </div>

      <Card
        title="Detalle por inquilino"
        description="Editá el alquiler o los extras del mes y anotá lo que se cobró."
      >
        {cobros.length === 0 ? (
          <EmptyState
            title="No hay inquilinos activos"
            description="Cargá inquilinos para empezar a registrar los cobros del mes."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Inquilino</Th>
                <Th align="right">Alquiler</Th>
                <Th align="right">Luz</Th>
                <Th align="right">Extras</Th>
                <Th align="right">Total</Th>
                <Th align="right">Pagado</Th>
                <Th align="right">Saldo</Th>
                <Th>Estado</Th>
                <Th align="right" className="no-print" />
              </tr>
            </thead>
            <tbody>
              {cobros.map((fila) => {
                const formId = `cobro-${fila.inquilino_id}`;
                return (
                  <tr key={fila.inquilino_id} className="hover:bg-lienzo/60">
                    <Td>
                      <span className="font-medium text-tinta">{fila.inquilino_nombre}</span>
                      <span className="block text-xs text-tenue">
                        {fila.propiedad_nombre ?? "Sin propiedad"}
                      </span>
                    </Td>
                    <Td align="right">
                      <Input
                        form={formId}
                        name="monto_alquiler"
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
                    <Td align="right">
                      <Input
                        form={formId}
                        name="extras"
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
                        form={formId}
                        name="pagado"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={fila.pagado}
                        className="tabular w-28 text-right"
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
                      <div className="flex justify-end gap-2">
                        <form id={formId} action={guardarCobro} className="contents">
                          <input type="hidden" name="anio" value={anio} />
                          <input type="hidden" name="mes" value={mes} />
                          <input type="hidden" name="inquilino_id" value={fila.inquilino_id} />
                          <Input
                            type="date"
                            name="fecha_pago"
                            defaultValue={fechaInput(fila.fecha_pago)}
                            className="w-36"
                          />
                          <Button type="submit" size="sm">
                            Guardar
                          </Button>
                        </form>
                        <form action={marcarPagado}>
                          <input type="hidden" name="anio" value={anio} />
                          <input type="hidden" name="mes" value={mes} />
                          <input type="hidden" name="inquilino_id" value={fila.inquilino_id} />
                          <input type="hidden" name="monto_alquiler" value={fila.monto_alquiler} />
                          <input type="hidden" name="extras" value={fila.extras} />
                          <input type="hidden" name="total" value={fila.total} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="primario"
                            disabled={fila.saldo <= 0.009}
                          >
                            Saldar
                          </Button>
                        </form>
                      </div>
                    </Td>
                  </tr>
                );
              })}
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
        )}
      </Card>
    </>
  );
}
