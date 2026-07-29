export type ParamsMes = { anio?: string; mes?: string };

/** Lee ?anio=&mes= de la URL y, si no vienen, usa el mes actual. */
export function resolverMes(params: ParamsMes = {}) {
  const hoy = new Date();
  const anio = Number.parseInt(params.anio ?? "", 10);
  const mes = Number.parseInt(params.mes ?? "", 10);

  return {
    anio: Number.isFinite(anio) && anio > 1990 && anio < 2200 ? anio : hoy.getFullYear(),
    mes: Number.isFinite(mes) && mes >= 1 && mes <= 12 ? mes : hoy.getMonth() + 1,
  };
}

/** Mes anterior / siguiente, con vuelta de año. */
export function desplazarMes(anio: number, mes: number, delta: number) {
  const total = anio * 12 + (mes - 1) + delta;
  return { anio: Math.floor(total / 12), mes: (total % 12) + 1 };
}
