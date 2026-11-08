import { Reparacion } from './modelos';

export const API_TECNICO = '/api/tecnico';

export function nombresTecnicos(reparacion: Reparacion): string {
  return reparacion.tecnicos.map((t) => t.nombre).join(', ');
}

export function participo(reparacion: Reparacion, idEmpleado: number | undefined): boolean {
  return reparacion.tecnicos.some((t) => t.idEmpleado === idEmpleado);
}

export function enRango(fecha: string, desde: string, hasta: string): boolean {
  return (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
}

export function totalReparaciones(reparaciones: readonly Reparacion[]): number {
  return reparaciones.reduce((total, r) => total + Number(r.costoTotal), 0);
}
