"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESION, DURACION_SESION_SEG, crearSesion, passwordCorrecta } from "@/lib/auth";

/** Rutas internas hacia las que se permite volver después de entrar. */
function destinoSeguro(valor: string) {
  // Solo rutas propias: nunca una URL absoluta ni un "//host".
  if (!valor.startsWith("/") || valor.startsWith("//")) return "/";
  return valor;
}

function volverAlLogin(motivo: string, destino: string) {
  const params = new URLSearchParams({ error: motivo });
  if (destino !== "/") params.set("destino", destino);
  redirect(`/login?${params}`);
}

export async function iniciarSesion(data: FormData) {
  const password = String(data.get("password") ?? "");
  const destino = destinoSeguro(String(data.get("destino") ?? "/") || "/");

  if (password.length === 0) {
    volverAlLogin("vacia", destino);
  }

  let correcta: boolean;
  try {
    correcta = await passwordCorrecta(password);
  } catch {
    volverAlLogin("configuracion", destino);
    return;
  }

  if (!correcta) {
    // Pequeña demora para que probar contraseñas al voleo sea más lento.
    await new Promise((resolve) => setTimeout(resolve, 600));
    volverAlLogin("incorrecta", destino);
  }

  const almacen = await cookies();
  almacen.set(COOKIE_SESION, await crearSesion(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SESION_SEG,
  });

  redirect(destino);
}

export async function cerrarSesion() {
  const almacen = await cookies();
  almacen.delete(COOKIE_SESION);
  redirect("/login");
}
