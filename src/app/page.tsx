import Link from "next/link";
import { Encabezado } from "@/components/encabezado";
import { SelectorMes } from "@/components/selector-mes";
import { Badge, Card, EmptyState, Stat, Table, Td, Th } from "@/components/ui";
import { etiquetaPeriodo, kwh, money } from "@/lib/format";
import { resolverMes } from "@/lib/periodo";
import { getCobros, getResumen } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; mes?: string }>;
}) {
  const { anio, mes } = resolverMes(await searchParams);
  const [resumen, cobros] = await Promise.all([getResumen(anio, mes), getCobros(anio, mes)]);

  const pendientes = cobros.filter((c) => c.saldo > 0.009).sort((a, b) => b.saldo - a.saldo);

  return (
    <>
      <Encabezado
        titulo="Panel"
        subtitulo={etiquetaPeriodo(anio, mes)}
        acciones={<SelectorMes anio={anio} mes={mes} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="A cobrar este mes"
          value={money(resumen.aCobrar)}
          hint={`${resumen.inquilinosActivos} inquilinos activos`}
          tone="marca"
        />
        <Stat
          label="Cobrado"
          value={money(resumen.cobrado)}
          hint={`${resumen.alDia} al día`}
          tone="ok"
        />
        <Stat
          label="Pendiente"
          value={money(resumen.pendiente)}
          hint={`${pendientes.length} con saldo`}
          tone={resumen.pendiente > 0.009 ? "alerta" : "ok"}
        />
        <Stat
          label="Consumo del mes"
          value={kwh(resumen.consumoTotal)}
          hint={
            resumen.hayFactura
              ? `${money(resumen.importeLuz)} · ${money(resumen.precioKwh)}/kWh`
              : "Falta cargar la factura"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Saldos pendientes"
          description="Quién debe y cuánto en este mes."
          actions={
            <Link
              href={`/cobros?anio=${anio}&mes=${mes}`}
              className="text-sm font-medium text-marca hover:underline"
            >
              Ir a cobros →
            </Link>
          }
        >
          {pendientes.length === 0 ? (
            <EmptyState
              title={
                cobros.length === 0
                  ? "Todavía no hay inquilinos activos"
                  : "Todo cobrado en este mes"
              }
              description={
                cobros.length === 0
                  ? "Cargá propiedades e inquilinos para empezar."
                  : "No queda ningún saldo pendiente."
              }
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Inquilino</Th>
                  <Th align="right">Alquiler</Th>
                  <Th align="right">Luz</Th>
                  <Th align="right">Total</Th>
                  <Th align="right">Pagado</Th>
                  <Th align="right">Saldo</Th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map((fila) => (
                  <tr key={fila.inquilino_id} className="hover:bg-lienzo/60">
                    <Td>
                      <span className="font-medium text-tinta">{fila.inquilino_nombre}</span>
                      <span className="block text-xs text-tenue">
                        {fila.propiedad_nombre ?? "Sin propiedad"}
                      </span>
                    </Td>
                    <Td align="right" className="tabular">
                      {money(fila.monto_alquiler)}
                    </Td>
                    <Td align="right" className="tabular">
                      {money(fila.importe_luz)}
                    </Td>
                    <Td align="right" className="tabular">
                      {money(fila.total)}
                    </Td>
                    <Td align="right" className="tabular">
                      {money(fila.pagado)}
                    </Td>
                    <Td align="right" className="tabular font-semibold text-alerta">
                      {money(fila.saldo)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card
          title="Estado de la luz"
          description="Resumen del período eléctrico."
          actions={
            <Link
              href={`/luz?anio=${anio}&mes=${mes}`}
              className="text-sm font-medium text-marca hover:underline"
            >
              Cargar →
            </Link>
          }
        >
          <div className="space-y-4 px-5 py-5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-tenue">Factura del mes</span>
              {resumen.hayFactura ? <Badge tone="ok">Cargada</Badge> : <Badge tone="aviso">Falta</Badge>}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-tenue">Precio por kWh</span>
              <span className="tabular font-medium">
                {resumen.precioKwh > 0 ? money(resumen.precioKwh) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-tenue">Consumo repartido</span>
              <span className="tabular font-medium">{kwh(resumen.consumoTotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-borde pt-4">
              <span className="text-tenue">A cobrar por luz</span>
              <span className="tabular font-semibold">{money(resumen.importeLuz)}</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
