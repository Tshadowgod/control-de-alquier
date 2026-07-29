import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, sesionValida } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_SESION)?.value;

  if (await sesionValida(token)) {
    return NextResponse.next();
  }

  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";

  // Se recuerda a dónde quería entrar para volver ahí después de la contraseña.
  const destino = request.nextUrl.pathname + request.nextUrl.search;
  if (destino !== "/") {
    login.searchParams.set("destino", destino);
  }

  return NextResponse.redirect(login);
}

export const config = {
  // Todo queda protegido salvo el login y los archivos estáticos.
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
