import { Pipe, PipeTransform } from '@angular/core';

const FORMATO_NUMERO = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

@Pipe({ name: 'numero' })
export class NumeroPipe implements PipeTransform {
  transform(valor: number | string | null | undefined): string {
    if (valor === null || valor === undefined || valor === '') {
      return '';
    }
    const numero = Number(valor);
    return Number.isNaN(numero) ? String(valor) : FORMATO_NUMERO.format(numero);
  }
}
