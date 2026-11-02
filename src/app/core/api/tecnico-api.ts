import { fechaIso, sumarDias } from './cliente-api';
import { Reparacion } from './modelos';

export const API_TECNICO = '/api/tecnico';

export type VistaAgenda = 'hoy' | 'semana' | 'pendientes';

const FORMATO_DIA = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export function diaDe(fechaHora: string): string {
  return fechaHora.slice(0, 10);
}

export function rangoSemana(hoy = new Date()): [string, string] {
  const desdeLunes = (hoy.getDay() + 6) % 7;
  const lunes = sumarDias(hoy, -desdeLunes);
  return [fechaIso(lunes), fechaIso(sumarDias(lunes, 6))];
}

export function esAtrasada(reparacion: Reparacion, hoy = new Date()): boolean {
  return reparacion.estado === 'AGENDADA' && diaDe(reparacion.fechaAgendada) < fechaIso(hoy);
}

export function filtrarVista(
  reparaciones: readonly Reparacion[],
  vista: VistaAgenda,
  hoy = new Date(),
): Reparacion[] {
  if (vista === 'pendientes') {
    return [...reparaciones];
  }
  const [desde, hasta] = vista === 'hoy' ? [fechaIso(hoy), fechaIso(hoy)] : rangoSemana(hoy);
  return reparaciones.filter((r) => {
    const dia = diaDe(r.fechaAgendada);
    return dia >= desde && dia <= hasta;
  });
}

export function agruparPorDia(
  reparaciones: readonly Reparacion[],
): { dia: string; titulo: string; reparaciones: Reparacion[] }[] {
  const grupos = new Map<string, Reparacion[]>();
  for (const reparacion of [...reparaciones].sort((a, b) =>
    a.fechaAgendada.localeCompare(b.fechaAgendada),
  )) {
    const dia = diaDe(reparacion.fechaAgendada);
    grupos.set(dia, [...(grupos.get(dia) ?? []), reparacion]);
  }
  return [...grupos.entries()].map(([dia, lista]) => {
    const [anio, mes, numero] = dia.split('-').map(Number);
    const titulo = FORMATO_DIA.format(new Date(anio, mes - 1, numero));
    return {
      dia,
      titulo: titulo.charAt(0).toUpperCase() + titulo.slice(1),
      reparaciones: lista,
    };
  });
}

export function hora(fechaHora: string): string {
  const [horas, minutos] = fechaHora.slice(11, 16).split(':').map(Number);
  const sufijo = horas < 12 ? 'a. m.' : 'p. m.';
  const hora12 = horas % 12 === 0 ? 12 : horas % 12;
  return `${hora12}:${String(minutos).padStart(2, '0')} ${sufijo}`;
}
