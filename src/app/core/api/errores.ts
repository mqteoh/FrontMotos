import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { ErrorApi } from './modelos';

const SIN_CONEXION =
  'No pudimos conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.';

function cuerpoError(error: unknown): ErrorApi | null {
  if (!(error instanceof HttpErrorResponse)) {
    return null;
  }
  const cuerpo = error.error as Partial<ErrorApi> | null;
  return cuerpo && typeof cuerpo.mensaje === 'string' ? (cuerpo as ErrorApi) : null;
}

export function mensajeDeError(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return SIN_CONEXION;
  }
  return cuerpoError(error)?.mensaje ?? 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}

export function aplicarErroresDeCampos(formulario: FormGroup, error: unknown): boolean {
  const campos = cuerpoError(error)?.campos ?? [];
  let aplicados = false;
  for (const { campo, mensaje } of campos) {
    const control = formulario.get(campo);
    if (control) {
      control.setErrors({ ...control.errors, servidor: mensaje });
      control.markAsTouched();
      aplicados = true;
    }
  }
  return aplicados;
}
