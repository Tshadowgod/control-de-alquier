import Link from "next/link";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui";
import { cerrarSesion } from "@/lib/auth-actions";

export default function LayoutApp({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col lg:flex-row">
      <aside className="no-print flex flex-col border-b border-borde bg-panel px-4 py-4 lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0 lg:py-6">
        <Link href="/" className="mb-5 flex items-center gap-2.5 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-marca text-sm font-bold text-white">
            A
          </span>
          <span className="text-sm leading-tight font-semibold text-tinta">
            Control de
            <br />
            alquileres
          </span>
        </Link>

        <Nav />

        <form action={cerrarSesion} className="mt-4 lg:mt-auto lg:pt-4">
          <Button type="submit" variant="fantasma" size="sm" className="w-full">
            Salir
          </Button>
        </form>
      </aside>

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
