import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export type MensajesPropios = Partial<Record<string, string>>;

export function mensajeError(
  control: AbstractControl | null,
  propios: MensajesPropios = {},
): string | null {
  if (!control?.errors || !control.touched) {
    return null;
  }
  const errores = control.errors;
  if (typeof errores['servidor'] === 'string') {
    return errores['servidor'];
  }
  const propio = Object.keys(errores)
    .map((clave) => propios[clave])
    .find(Boolean);
  if (propio) {
    return propio;
  }
  if (errores['required']) {
    return 'Este campo es obligatorio.';
  }
  if (errores['email']) {
    return 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  }
  if (errores['minlength']) {
    return `Escribe al menos ${errores['minlength'].requiredLength} caracteres.`;
  }
  if (errores['maxlength']) {
    return `Usa como máximo ${errores['maxlength'].requiredLength} caracteres.`;
  }
  if (errores['min']) {
    return `El valor mínimo es ${errores['min'].min}.`;
  }
  if (errores['max']) {
    return `El valor máximo es ${errores['max'].max}.`;
  }
  return 'Revisa el formato de este campo.';
}

export function hoyIso(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

export const fechaPasada: ValidatorFn = (control): ValidationErrors | null => {
  const valor = control.value as string | null;
  return valor && valor >= hoyIso() ? { fechaPasada: true } : null;
};

export function enfocarPrimerInvalido(raiz: HTMLElement): void {
  raiz.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}
