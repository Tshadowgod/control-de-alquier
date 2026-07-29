# Control de alquileres

Aplicación para llevar los alquileres mes a mes y repartir la factura de luz
entre los inquilinos según el consumo de su propio medidor.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Neon (PostgreSQL) · Vercel

## Qué hace

- **Panel** — cuánto hay que cobrar, cuánto se cobró y quién debe, mes por mes.
- **Cobros del mes** — alquiler + luz + extras por inquilino, con saldo y estado
  (pagado / parcial / pendiente).
- **Luz / kWh** — se carga la factura del mes y la lectura de cada medidor.
- **Inquilinos** — datos, alquiler, depósito, medidor y lectura inicial.
- **Propiedades** — las unidades y su alquiler de referencia.

### Cómo se calcula la luz

1. Cuando llega la factura se cargan **importe total** y **kWh facturados**.
   De ahí sale el **precio por kWh** (`importe / kWh`). Si preferís, se puede
   cargar el precio por kWh a mano.
2. Para cada inquilino se anota la **lectura actual** del medidor. La **lectura
   anterior** se completa sola con la del mes pasado (o con la lectura inicial
   que se cargó al darlo de alta).
3. `consumo = lectura actual − lectura anterior` y `importe = consumo × precio por kWh`.
4. La tarjeta **"Diferencia vs. factura"** muestra lo que no quedó asignado a
   ningún medidor: típicamente el consumo de espacios comunes.

Ese importe de luz se suma automáticamente al cobro del mes de cada inquilino.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # y completar DATABASE_URL con la cadena de Neon
npm run db:setup             # crea las tablas
npm run dev                  # http://localhost:3000
```

`npm run db:setup` aplica `db/schema.sql` y se puede ejecutar las veces que haga
falta: no borra datos.

## Deploy en Vercel

1. Importar el repositorio en Vercel (detecta Next.js solo).
2. En **Settings → Environment Variables** agregar `DATABASE_URL` con la cadena
   de conexión de Neon, para los entornos Production, Preview y Development.
3. Deploy.

> `.env.local` está en `.gitignore`: la contraseña de la base nunca se sube al repo.

## Estructura

```
db/schema.sql          Esquema de la base
scripts/db-setup.mjs   Aplica el esquema sobre Neon
src/lib/db.ts          Cliente de Neon
src/lib/queries.ts     Consultas y cálculos (consumo, importes, saldos)
src/lib/actions.ts     Server Actions (altas, ediciones, bajas)
src/components/        Componentes de interfaz
src/app/               Panel, cobros, luz, inquilinos, propiedades
```
