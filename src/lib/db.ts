import { neon } from "@neondatabase/serverless";

// Se limpian espacios y comillas por si la variable se pegó con ellos: es el
// error más común al configurarla a mano o desde una terminal.
const url = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, "");

if (!url) {
  throw new Error(
    "Falta la variable de entorno DATABASE_URL con la cadena de conexión de Neon."
  );
}

export const sql = neon(url);
