import { BotonGuardar } from "@/components/boton-guardar";
import { Field, Input } from "@/components/ui";
import { iniciarSesion } from "@/lib/auth-actions";

export const metadata = { title: "Entrar · Control de alquileres" };

const MENSAJES: Record<string, string> = {
  incorrecta: "Contraseña incorrecta.",
  vacia: "Escribí la contraseña.",
  configuracion:
    "La aplicación no tiene contraseña configurada. Hay que definir ADMIN_PASSWORD y AUTH_SECRET.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string; error?: string }>;
}) {
  const { destino, error } = await searchParams;
  const mensaje = error ? (MENSAJES[error] ?? "No se pudo entrar.") : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-marca text-lg font-bold text-white">
            A
          </span>
          <div>
            <h1 className="text-lg font-semibold text-tinta">Control de alquileres</h1>
            <p className="text-sm text-tenue">Ingresá la contraseña de administrador.</p>
          </div>
        </div>

        <div className="rounded-xl border border-borde bg-panel px-5 py-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
          <form action={iniciarSesion} className="space-y-4">
            <input type="hidden" name="destino" value={destino ?? "/"} />

            <Field label="Contraseña">
              <Input
                name="password"
                type="password"
                autoComplete="current-password"
                autoFocus
                required
                placeholder="••••••••"
              />
            </Field>

            {mensaje && (
              <p
                role="alert"
                className="rounded-lg bg-alerta-suave px-3 py-2 text-sm font-medium text-alerta"
              >
                {mensaje}
              </p>
            )}

            <BotonGuardar className="w-full" enCurso="Entrando…">
              Entrar
            </BotonGuardar>
          </form>
        </div>
      </div>
    </main>
  );
}
