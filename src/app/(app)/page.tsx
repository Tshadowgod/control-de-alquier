import Link from "next/link";
import { Encabezado } from "@/components/encabezado";
import { SelectorMes } from "@/components/selector-mes";
import { Badge, Card, EmptyState, Stat, Table, Td, Th } from "@/components/ui";
import { etiquetaPeriodo, kwh, money, moneyFino } from "@/lib/format";
import { resolverMes } from "@/lib/periodo";
import { getCobros, getPrimerosPasos, getResumen } from "@/lib/queries";

export const dynamic = "force-dynamic";

function Paso({
  numero,
  titulo,
  descripcion,
  href,
  cta,
  hecho,
}: {
  numero: number;
  titulo: string;
  descripcion: string;
  href: string;
  cta: string;
  hecho: boolean;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          hecho ? "bg-ok-suave text-ok" : "bg-marca-suave text-marca"
        }`}
      >
        {hecho ? "✓" : numero}
      </span>
      <div>
        <p className="font-medium text-tinta">{titulo}</p>
        <p className="text-sm text-tenue">{descripcion}</p>
        {!hecho && (
          <Link
            href={href}
            className="mt-1 inline-block text-sm font-medium text-marca hover:underline"
          >
            {cta} →
          </Link>
        )}
      </div>
    </li>
  );
}

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; mes?: string }>;
}) {
  const { anio, mes } = resolverMes(await searchParams);
  const [resumen, cobros, pasos] = await Promise.all([
    getResumen(anio, mes),
    getCobros(anio, mes),
    getPrimerosPasos(),
  ]);

  const pendientes = cobros.filter((c) => c.saldo > 0.009).sort((a, b) => b.saldo - a.saldo);
  const mostrarGuia = pasos.propiedades === 0 || pasos.inquilinos === 0;

  if (mostrarGuia) {
    return (
      <>
        <Encabezado titulo="Panel" subtitulo="Vamos a dejar todo listo en dos pasos." />
        <Card title="Primeros pasos" description="Con esto ya podés arrancar a cobrar.">
          <ol className="space-y-5 px-5 py-5">
            <Paso
              numero={1}
              titulo="Cargá tus propiedades"
              descripcion="Cada unidad que alquilás, con su alquiler de referencia."
              href="/propiedades"
              cta="Cargar propiedades"
              hecho={pasos.propiedades > 0}
            />
            <Paso
              numero={2}
              titulo="Cargá tus inquilinos"
              descripcion="Con su medidor de luz y la lectura que marcaba cuando entraron."
              href="/inquilinos"
              cta="Cargar inquilinos"
              hecho={pasos.inquilinos > 0}
            />
            <Paso
              numero={3}
              titulo="Cuando lleguen las facturas"
              descripcion="Cargá la de luz y la de agua: los importes se reparten solos y aparecen en los cobros del mes."
              href="/luz"
              cta="Ir a Luz"
              hecho={false}
            />
          </ol>
        </Card>
      </>
    );
  }

  return (
    <>
      <Encabezado
        titulo="Panel"
        subtitulo={etiquetaPeriodo(anio, mes)}
        acciones={<SelectorMes anio={anio} mes={mes} />}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
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
          label="Servicios"
          value={money(resumen.importeLuz + resumen.importeAgua)}
          hint={`${money(resumen.importeLuz)} de luz · ${money(resumen.importeAgua)} de agua`}
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
              title="Todo cobrado en este mes"
              description="No queda ningún saldo pendiente."
            />
          ) : (
            <Table cards>
              <thead>
                <tr>
                  <Th>Inquilino</Th>
                  <Th align="right">Alquiler</Th>
                  <Th align="right">Luz</Th>
                  <Th align="right">Agua</Th>
                  <Th align="right">Total</Th>
                  <Th align="right">Pagado</Th>
                  <Th align="right">Saldo</Th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map((fila) => (
                  <tr key={fila.inquilino_id} className="hover:bg-lienzo/60">
                    <Td titulo>
                      <span className="font-medium text-tinta">{fila.inquilino_nombre}</span>
                      <span className="block text-xs text-tenue">
                        {fila.propiedad_nombre ?? "Sin propiedad"}
                      </span>
                    </Td>
                    <Td align="right" className="tabular" label="Alquiler">
                      {money(fila.monto_alquiler)}
                    </Td>
                    <Td align="right" className="tabular" label="Luz">
                      {money(fila.importe_luz)}
                    </Td>
                    <Td align="right" className="tabular" label="Agua">
                      {money(fila.importe_agua)}
                    </Td>
                    <Td align="right" className="tabular" label="Total">
                      {money(fila.total)}
                    </Td>
                    <Td align="right" className="tabular" label="Pagado">
                      {money(fila.pagado)}
                    </Td>
                    <Td align="right" className="tabular font-semibold text-alerta" label="Saldo">
                      {money(fila.saldo)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card title="Facturas del mes" description="Qué falta cargar.">
          <div className="space-y-5 px-5 py-5 text-sm">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-tinta">Luz</span>
                {resumen.hayFacturaLuz ? (
                  <Badge tone="ok">Cargada</Badge>
                ) : (
                  <Link href={`/luz?anio=${anio}&mes=${mes}`}>
                    <Badge tone="aviso">Falta cargar →</Badge>
                  </Link>
                )}
              </div>
              <dl className="mt-2 space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-tenue">Precio por kWh</dt>
                  <dd className="tabular font-medium">
                    {resumen.precioKwh > 0 ? moneyFino(resumen.precioKwh) : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-tenue">Consumo repartido</dt>
                  <dd className="tabular font-medium">{kwh(resumen.consumoTotal)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-tenue">A cobrar</dt>
                  <dd className="tabular font-medium">{money(resumen.importeLuz)}</dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-borde pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-tinta">Agua</span>
                {resumen.hayFacturaAgua ? (
                  <Badge tone="ok">Cargada</Badge>
                ) : (
                  <Link href={`/agua?anio=${anio}&mes=${mes}`}>
                    <Badge tone="aviso">Falta cargar →</Badge>
                  </Link>
                )}
              </div>
              <dl className="mt-2 space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-tenue">A cobrar</dt>
                  <dd className="tabular font-medium">{money(resumen.importeAgua)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
