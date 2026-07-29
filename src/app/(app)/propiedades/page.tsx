import { Encabezado } from "@/components/encabezado";
import {
  Badge,
  Button,
  Card,
  Disclosure,
  EmptyState,
  Field,
  Input,
} from "@/components/ui";
import { eliminarPropiedad, guardarPropiedad } from "@/lib/actions";
import { money } from "@/lib/format";
import { getPropiedades, type Propiedad } from "@/lib/queries";

export const dynamic = "force-dynamic";

function FormularioPropiedad({ propiedad }: { propiedad?: Propiedad }) {
  return (
    <form action={guardarPropiedad} className="grid gap-4 sm:grid-cols-2">
      {propiedad && <input type="hidden" name="id" value={propiedad.id} />}

      <Field label="Nombre / identificación" className="sm:col-span-1">
        <Input
          name="nombre"
          required
          defaultValue={propiedad?.nombre}
          placeholder="Depto 1 – planta baja"
        />
      </Field>

      <Field label="Dirección">
        <Input
          name="direccion"
          defaultValue={propiedad?.direccion ?? ""}
          placeholder="Av. Siempre Viva 742"
        />
      </Field>

      <Field label="Alquiler mensual" hint="Valor por defecto para los inquilinos de esta unidad.">
        <Input
          name="monto_alquiler"
          type="number"
          step="0.01"
          min="0"
          defaultValue={propiedad?.monto_alquiler ?? ""}
          placeholder="0.00"
        />
      </Field>

      <Field label="Notas">
        <Input name="notas" defaultValue={propiedad?.notas ?? ""} placeholder="Opcional" />
      </Field>

      <label className="flex items-center gap-2 text-sm text-tinta sm:col-span-2">
        <input
          type="checkbox"
          name="activa"
          defaultChecked={propiedad ? propiedad.activa : true}
          className="h-4 w-4 accent-[var(--color-marca)]"
        />
        Unidad activa
      </label>

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" variant="primario">
          {propiedad ? "Guardar cambios" : "Agregar propiedad"}
        </Button>
      </div>
    </form>
  );
}

export default async function PropiedadesPage() {
  const propiedades = await getPropiedades();

  return (
    <>
      <Encabezado
        titulo="Propiedades"
        subtitulo="Las unidades que alquilás y su valor de referencia."
      />

      <div className="mb-6">
        <Disclosure label="+ Nueva propiedad" tone="primario">
          <Card title="Nueva propiedad">
            <div className="px-5 py-5">
              <FormularioPropiedad />
            </div>
          </Card>
        </Disclosure>
      </div>

      {propiedades.length === 0 ? (
        <Card>
          <EmptyState
            title="Todavía no cargaste ninguna propiedad"
            description="Empezá por acá: después vas a poder asignarle inquilinos a cada unidad."
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {propiedades.map((propiedad) => (
            <Card key={propiedad.id} className="flex flex-col">
              <div className="flex flex-1 flex-col gap-3 px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-tinta">{propiedad.nombre}</h3>
                    <p className="text-sm text-tenue">{propiedad.direccion || "Sin dirección"}</p>
                  </div>
                  {propiedad.activa ? (
                    <Badge tone="ok">Activa</Badge>
                  ) : (
                    <Badge tone="neutral">Inactiva</Badge>
                  )}
                </div>

                <dl className="grid grid-cols-2 gap-3 border-t border-borde pt-3 text-sm">
                  <div>
                    <dt className="text-xs text-tenue">Alquiler</dt>
                    <dd className="tabular font-medium">{money(propiedad.monto_alquiler)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-tenue">Inquilinos activos</dt>
                    <dd className="tabular font-medium">{propiedad.inquilinos}</dd>
                  </div>
                </dl>

                {propiedad.notas && <p className="text-sm text-tenue">{propiedad.notas}</p>}
              </div>

              <div className="no-print border-t border-borde px-5 py-3">
                <Disclosure label="Editar">
                  <FormularioPropiedad propiedad={propiedad} />
                  <form
                    action={eliminarPropiedad}
                    className="mt-4 flex items-center justify-between gap-3 border-t border-borde pt-3"
                  >
                    <input type="hidden" name="id" value={propiedad.id} />
                    <span className="text-xs text-tenue">
                      Sus inquilinos quedan sin propiedad asignada.
                    </span>
                    <Button type="submit" variant="peligro" size="sm">
                      Eliminar
                    </Button>
                  </form>
                </Disclosure>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
