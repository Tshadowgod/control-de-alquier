import { Shell } from "@/components/shell";
import { Button } from "@/components/ui";
import { cerrarSesion } from "@/lib/auth-actions";

export default function LayoutApp({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Shell
      salir={
        <form action={cerrarSesion}>
          <Button type="submit" variant="fantasma" size="sm" className="w-full">
            Salir
          </Button>
        </form>
      }
    >
      {children}
    </Shell>
  );
}
