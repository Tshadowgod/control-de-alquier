# Control de alquileres

Aplicación para llevar los alquileres mes a mes y repartir las facturas de luz y
agua entre los inquilinos. Importes en bolivianos (Bs).

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Neon (PostgreSQL) · Vercel

## Qué hace

- **Panel** — cuánto hay que cobrar, cuánto se cobró y quién debe, mes por mes.
  Si la base está vacía, muestra una guía de primeros pasos.
- **Cobros del mes** — alquiler + luz + agua + extras por inquilino, con saldo y
  estado (pagado / parcial / pendiente). Se guarda toda la tabla de una vez.
- **Luz / kWh** — la factura del mes y la lectura de cada medidor.
- **Agua** — la factura del mes, repartida en partes iguales o a mano.
- **Inquilinos** — datos, alquiler, depósito, medidor y lectura inicial.
- **Propiedades** — las unidades y su alquiler de referencia.

### Cómo se calcula la luz

1. Cuando llega la factura se cargan **importe total** y **kWh facturados**.
   De ahí sale el **precio por kWh** (`importe / kWh`). Si preferís, se puede
   cargar el precio por kWh a mano en "Opciones avanzadas".
2. Para cada inquilino se anota la **lectura de hoy** del medidor. La **lectura
   anterior** se muestra ya resuelta con la del mes pasado (o con la lectura
   inicial que se cargó al darlo de alta); se puede corregir con el enlace
   "Corregir lecturas anteriores".
3. `consumo = lectura de hoy − lectura anterior` y `importe = consumo × precio por kWh`.
4. La tarjeta **"Diferencia vs. factura"** muestra lo que no quedó asignado a
   ningún medidor: típicamente el consumo de espacios comunes.

Si se deja una lectura vacía, ese inquilino queda sin consumo en el mes.

### Cómo se calcula el agua

Se carga el importe total de la factura y se elige el reparto:

- **Partes iguales** — se divide entre los inquilinos activos. Ojo: es un cálculo
  vivo, así que si activás o desactivás un inquilino, el reparto del mes se
  recalcula. El total siempre coincide con la factura.
- **Un importe por inquilino** — se escribe cuánto paga cada uno. Queda fijo.

Los importes de luz y agua se suman automáticamente al cobro del mes.

## Acceso

La aplicación entera está detrás de una contraseña de administrador. Un
middleware protege todas las rutas: sin sesión, cualquier página redirige a
`/login`.

- `ADMIN_PASSWORD` — la contraseña para entrar.
- `AUTH_SECRET` — clave aleatoria con la que se firma la cookie de sesión.

La sesión es una cookie `httpOnly` firmada con HMAC-SHA256 que dura 30 días; no
se guarda nada en la base. Para cambiar la contraseña se cambia la variable de
entorno y se vuelve a desplegar. Si se cambia `AUTH_SECRET`, todas las sesiones
abiertas se invalidan.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completar DATABASE_URL, ADMIN_PASSWORD y AUTH_SECRET
npm run db:setup             # crea las tablas
npm run dev                  # http://localhost:3000
```

`npm run db:setup` aplica `db/schema.sql` y se puede ejecutar las veces que haga
falta: no borra datos.

## Datos de ejemplo

Para ver el sistema funcionando sin cargar nada a mano:

```bash
npm run demo:cargar     # 3 propiedades, 3 inquilinos y dos meses cerrados (mayo y junio 2026)
npm run demo:limpiar    # borra todo lo que empieza con "DEMO "
```

Solo crea filas con el prefijo `DEMO ` y nunca sobrescribe la factura de un mes
que ya tenga algo cargado, así que no toca datos propios.

## Prueba de humo

```bash
npm run dev             # en otra terminal
npm run test:humo
```

Recorre el circuito completo (altas, factura de luz, lecturas, agua en sus dos
modos, cobros parciales y saldar pendientes) contra el servidor local y verifica
los cálculos. Trabaja en el período ficticio 2099-03 con filas `PRUEBA ` y borra
todo lo que crea.

## Deploy en Vercel

1. Importar el repositorio en Vercel (detecta Next.js solo).
2. En **Settings → Environment Variables** agregar `DATABASE_URL`, `ADMIN_PASSWORD`
   y `AUTH_SECRET` para los entornos Production, Preview y Development.
3. Deploy.

Desde el CLI, ojo con dos cosas: usá `--value` (no un pipe) y tené en cuenta que
el entorno Development no acepta variables sensibles, así que va aparte:

```bash
vercel env add ADMIN_PASSWORD production,preview --value "..." --force --yes
vercel env add ADMIN_PASSWORD development --value "..." --no-sensitive --force --yes
```

> `.env.local` está en `.gitignore`: la contraseña de la base nunca se sube al repo.

## Estructura

```
db/schema.sql          Esquema de la base
scripts/db-setup.mjs   Aplica el esquema sobre Neon
scripts/demo.mjs       Carga y borra los datos de ejemplo
scripts/smoke.mjs      Prueba de humo de punta a punta
src/middleware.ts      Exige sesión en todas las rutas menos /login
src/lib/auth.ts        Firma y validación de la sesión
src/lib/auth-actions.ts  Entrar y salir
src/lib/db.ts          Cliente de Neon
src/lib/format.ts      Formato de importes (Bs), fechas y kWh
src/lib/queries.ts     Consultas y cálculos (consumo, reparto, saldos)
src/lib/actions.ts     Server Actions (altas, ediciones, bajas)
src/components/        Componentes de interfaz
src/app/login/         Pantalla de contraseña
src/app/(app)/         Panel, cobros, luz, agua, inquilinos, propiedades
```

Para cambiar la moneda, tocá `SIMBOLO` y `LOCALE` en `src/lib/format.ts`.
