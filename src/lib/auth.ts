/**
 * Autenticación mínima: una sola contraseña de administrador.
 *
 * La sesión es una cookie firmada con HMAC-SHA256, así que no hace falta
 * guardar nada en la base. Se usa Web Crypto para que funcione igual en el
 * middleware y en las Server Actions.
 *
 * Variables de entorno necesarias:
 *   ADMIN_PASSWORD  la contraseña para entrar
 *   AUTH_SECRET     clave larga y aleatoria con la que se firma la cookie
 */

export const COOKIE_SESION = "sesion";

/** Duración de la sesión: 30 días. */
export const DURACION_SESION_SEG = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

function secreto() {
  const valor = process.env.AUTH_SECRET?.trim();
  if (!valor || valor.length < 16) {
    throw new Error(
      "Falta AUTH_SECRET (mínimo 16 caracteres) para poder firmar la sesión."
    );
  }
  return valor;
}

async function clave() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secreto()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

/** Hex sin depender de Buffer: el middleware puede correr fuera de Node. */
function aHex(datos: ArrayBuffer) {
  return Array.from(new Uint8Array(datos))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function firmar(mensaje: string) {
  const firma = await crypto.subtle.sign("HMAC", await clave(), encoder.encode(mensaje));
  return aHex(firma);
}

/** Comparación en tiempo constante de dos cadenas de igual propósito. */
function iguales(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) {
    diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferencia === 0;
}

/**
 * Compara la contraseña recibida con la configurada. Se firman las dos con
 * HMAC antes de comparar: así los digests tienen siempre el mismo largo y la
 * comparación no filtra información por el tiempo que tarda.
 */
export async function passwordCorrecta(candidata: string) {
  const esperada = process.env.ADMIN_PASSWORD;
  if (!esperada) {
    throw new Error(
      "Falta ADMIN_PASSWORD: sin esa variable no se puede entrar a la aplicación."
    );
  }

  const [a, b] = await Promise.all([firmar(candidata), firmar(esperada)]);
  return iguales(a, b);
}

/** Crea el token de sesión: vencimiento + firma. */
export async function crearSesion() {
  const vence = Date.now() + DURACION_SESION_SEG * 1000;
  return `${vence}.${await firmar(String(vence))}`;
}

/** Valida el token de sesión de la cookie. */
export async function sesionValida(token: string | undefined | null) {
  if (!token) return false;

  const separador = token.lastIndexOf(".");
  if (separador <= 0) return false;

  const vence = token.slice(0, separador);
  const firma = token.slice(separador + 1);

  const vencimiento = Number(vence);
  if (!Number.isFinite(vencimiento) || vencimiento < Date.now()) return false;

  return iguales(firma, await firmar(vence));
}
