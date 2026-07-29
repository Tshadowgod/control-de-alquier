import { Encabezado } from "@/components/encabezado";
import {
  Badge,
  Button,
  Card,
  Disclosure,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { eliminarInquilino, guardarInquilino } from "@/lib/actions";
import { fecha, fechaInput, money, num } from "@/lib/format";
import { getInquilinos, getPropiedades, type Inquilino, type Propiedad } from "@/lib/queries";

export const dynamic = "force-dynamic";

function FormularioInquilino({
  inquilino,
  propiedades,
}: {
  inquilino?: Inquilino;
  propiedades: Propiedad[];
}) {
  return (
    <form action={guardarInquilino} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {inquilino && <input type="hidden" name="id" value={inquilino.id} />}

      <Field label="Nombre y apellido">
        <Input name="nombre" required defaultValue={inquilino?.nombre} placeholder="Juan Pérez" />
      </Field>

      <Field label="Documento">
        <Input name="documento" defaultValue={inquilino?.documento ?? ""} placeholder="DNI" />
      </Field>

      <Field label="Teléfono">
        <Input name="telefono" defaultValue={inquilino?.telefono ?? ""} placeholder="11 5555 5555" />
      </Field>

      <Field label="Email">
        <Input
          name="email"
          type="email"
          defaultValue={inquilino?.email ?? ""}
          placeholder="correo@ejemplo.com"
        />
      </Field>

      <Field label="Propiedad">
        <Select name="propiedad_id" defaultValue={inquilino?.propiedad_id ?? ""}>
          <option value="">— Sin asignar —</option>
          {propiedades.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Inicio del contrato">
        <Input
          name="fecha_inicio"
          type="date"
          defaultValue={fechaInput(inquilino?.fecha_inicio)}
        />
      </Field>

      <Field
        label="Alquiler propio"
        hint="Dejalo vacío para usar el valor de la propiedad."
      >
        <Input
          name="monto_alquiler"
          type="number"
          step="0.01"
          min="0"
          defaultValue={inquilino?.monto_alquiler ?? ""}
          placeholder="Hereda de la propiedad"
        />
      </Field>

      <Field label="Depósito en garantía">
        <Input
          name="deposito"
          type="number"
          step="0.01"
          min="0"
          defaultValue={inquilino?.deposito ?? ""}
          placeholder="0.00"
        />
      </Field>

      <Field label="N° / nombre del medidor">
        <Input name="medidor" defaultValue={inquilino?.medidor ?? ""} placeholder="Medidor A" />
      </Field>

      <Field
        label="Lectura inicial del medidor"
        hint="El número que marcaba el medidor cuando entró."
      >
        <Input
          name="lectura_inicial"
          type="number"
          step="0.01"
          min="0"
          defaultValue={inquilino?.lectura_inicial ?? ""}
          placeholder="0"
        />
      </Field>

      <Field label="Notas" className="sm:col-span-2">
        <Textarea name="notas" rows={2} defaultValue={inquilino?.notas ?? ""} />
      </Field>

      <label className="flex items-center gap-2 self-end pb-2 text-sm text-tinta">
        <input
          type="checkbox"
          name="activo"
          defaultChecked={inquilino ? inquilino.activo : true}
          className="h-4 w-4 accent-[var(--color-marca)]"
        />
        Inquilino activo
      </label>

      <div className="sm:col-span-2 lg:col-span-3">
        <Button type="submit" variant="primario">
          {inquilino ? "Guardar cambios" : "Agregar inquilino"}
        </Button>
      </div>
    </form>
  );
}

export default async function InquilinosPage() {
  const [inquilinos, propiedades] = await Promise.all([getInquilinos(), getPropiedades()]);

  return (
    <>
      <Encabezado
        titulo="Inquilinos"
        subtitulo="Datos de contacto, alquiler y medidor de cada uno."
      />

      <div className="mb-6">
        <Disclosure label="+ Nuevo inquilino" tone="primario">
          <Card title="Nuevo inquilino">
            <div className="px-5 py-5">
              <FormularioInquilino propiedades={propiedades} />
            </div>
          </Card>
        </Disclosure>
      </div>

      {inquilinos.length === 0 ? (
        <Card>
          <EmptyState
            title="Todavía no cargaste inquilinos"
            description="Cargá a cada persona con su medidor y su lectura inicial para poder calcular el consumo."
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {inquilinos.map((inquilino) => (
            <Card key={inquilino.id}>
              <div className="px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-tinta">{inquilino.nombre}</h3>
                    <p className="text-sm text-tenue">
                      {inquilino.propiedad_nombre ?? "Sin propiedad asignada"}
                    </p>
                  </div>
                  {inquilino.activo ? (
                    <Badge tone="ok">Activo</Badge>
                  ) : (
                    <Badge tone="neutral">Inactivo</Badge>
                  )}
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-borde pt-4 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-tenue">Alquiler</dt>
                    <dd className="tabular font-medium">{money(inquilino.alquiler_vigente)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-tenue">Depósito</dt>
                    <dd className="tabular font-medium">{money(inquilino.deposito)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-tenue">Medidor</dt>
                    <dd className="font-medium">{inquilino.medidor || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-tenue">Lectura inicial</dt>
                    <dd className="tabular font-medium">{num(inquilino.lectura_inicial)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-tenue">Contacto</dt>
                    <dd className="font-medium">
                      {inquilino.telefono || inquilino.email || "—"}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-tenue">Desde</dt>
                    <dd className="font-medium">{fecha(inquilino.fecha_inicio)}</dd>
                  </div>
                </dl>

                {inquilino.notas && (
                  <p className="mt-3 text-sm text-tenue">{inquilino.notas}</p>
                )}
              </div>

              <div className="no-print border-t border-borde px-5 py-3">
                <Disclosure label="Editar">
                  <FormularioInquilino inquilino={inquilino} propiedades={propiedades} />
                  <form
                    action={eliminarInquilino}
                    className="mt-4 flex items-center justify-between gap-3 border-t border-borde pt-3"
                  >
                    <input type="hidden" name="id" value={inquilino.id} />
                    <span className="text-xs text-tenue">
                      Se borran también sus lecturas y cobros. Para conservar el historial,
                      desmarcá &quot;activo&quot;.
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
