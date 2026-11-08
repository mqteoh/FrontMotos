import { Pipe, PipeTransform } from '@angular/core';

const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

const FORMATO_DIA = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const FORMATO_DIA_HORA = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function aFecha(valor: string): Date {
  if (SOLO_FECHA.test(valor)) {
    const [anio, mes, dia] = valor.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
  }
  return new Date(valor);
}

@Pipe({ name: 'fecha' })
export class FechaPipe implements PipeTransform {
  transform(valor: string | null | undefined, conHora = false): string {
    if (!valor) {
      return '';
    }
    const fecha = aFecha(valor);
    if (Number.isNaN(fecha.getTime())) {
      return valor;
    }
    return (conHora ? FORMATO_DIA_HORA : FORMATO_DIA).format(fecha);
  }
}
