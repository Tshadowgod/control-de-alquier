-- Esquema de la aplicación de control de alquileres y consumo eléctrico.
-- Idempotente: se puede ejecutar tantas veces como haga falta.

create table if not exists propiedades (
  id              serial primary key,
  nombre          text not null,
  direccion       text,
  monto_alquiler  numeric(12,2) not null default 0,
  notas           text,
  activa          boolean not null default true,
  creado_en       timestamptz not null default now()
);

create table if not exists inquilinos (
  id              serial primary key,
  nombre          text not null,
  documento       text,
  telefono        text,
  email           text,
  propiedad_id    integer references propiedades(id) on delete set null,
  fecha_inicio    date,
  deposito        numeric(12,2) not null default 0,
  monto_alquiler  numeric(12,2),
  medidor         text,
  lectura_inicial numeric(12,2) not null default 0,
  activo          boolean not null default true,
  notas           text,
  creado_en       timestamptz not null default now()
);

-- Un período = un mes de facturación de luz (la factura que llega).
create table if not exists periodos (
  id              serial primary key,
  anio            integer not null,
  mes             integer not null check (mes between 1 and 12),
  importe_factura numeric(12,2),
  kwh_factura     numeric(12,2),
  precio_kwh      numeric(12,4),
  fecha_factura   date,
  notas           text,
  creado_en       timestamptz not null default now(),
  unique (anio, mes)
);

-- Lectura del medidor de cada inquilino dentro de un período.
create table if not exists lecturas (
  id               serial primary key,
  periodo_id       integer not null references periodos(id) on delete cascade,
  inquilino_id     integer not null references inquilinos(id) on delete cascade,
  lectura_anterior numeric(12,2) not null default 0,
  lectura_actual   numeric(12,2) not null default 0,
  notas            text,
  unique (periodo_id, inquilino_id)
);

-- Cobro mensual del alquiler. El importe de luz se calcula desde `lecturas`.
create table if not exists pagos (
  id             serial primary key,
  inquilino_id   integer not null references inquilinos(id) on delete cascade,
  anio           integer not null,
  mes            integer not null check (mes between 1 and 12),
  monto_alquiler numeric(12,2) not null default 0,
  extras         numeric(12,2) not null default 0,
  concepto_extra text,
  pagado         numeric(12,2) not null default 0,
  fecha_pago     date,
  notas          text,
  unique (inquilino_id, anio, mes)
);

-- Agua: la factura del mes se reparte entre los inquilinos, en partes iguales
-- o con un importe cargado a mano para cada uno.
alter table periodos add column if not exists importe_agua numeric(12,2);
alter table periodos add column if not exists reparto_agua text not null default 'partes_iguales';
alter table periodos add column if not exists fecha_factura_agua date;

create table if not exists agua_inquilino (
  id           serial primary key,
  periodo_id   integer not null references periodos(id) on delete cascade,
  inquilino_id integer not null references inquilinos(id) on delete cascade,
  importe      numeric(12,2) not null default 0,
  unique (periodo_id, inquilino_id)
);

create index if not exists idx_inquilinos_propiedad on inquilinos (propiedad_id);
create index if not exists idx_lecturas_periodo on lecturas (periodo_id);
create index if not exists idx_pagos_mes on pagos (anio, mes);
