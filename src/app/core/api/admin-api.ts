import { HttpErrorResponse } from '@angular/common/http';
import { mensajeDeError } from './errores';
import { OrigenMoto, Suministro, TipoEmpleado } from './modelos';

export const API_ADMIN = '/api/admin';

export const TIPOS_EMPLEADO: Record<TipoEmpleado, string> = {
  DUENO: 'Dueño',
  VENDEDOR: 'Vendedor',
  TECNICO: 'Técnico',
};

export const ORIGENES_MOTO: Record<OrigenMoto, string> = {
  INVENTARIO: 'Inventario del concesionario',
  EXTERNA: 'Moto de un cliente',
};

const CON_DEPENDIENTES = 'No se puede eliminar porque otros registros dependen de él.';

export function tieneDependientes(error: unknown): boolean {
  return (
    error instanceof HttpErrorResponse &&
    error.status === 409 &&
    mensajeDeError(error) === CON_DEPENDIENTES
  );
}

export function parametrosSuministro(suministro: Suministro): Record<string, string> {
  return {
    nit: suministro.nit,
    idRepuesto: String(suministro.idRepuesto),
    idSucursal: String(suministro.idSucursal),
    fecha: suministro.fechaSuministro,
  };
}
