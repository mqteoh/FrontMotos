import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChild,
  input,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FechaPipe } from '../../formato/fecha.pipe';
import { PesosPipe } from '../../formato/pesos.pipe';
import { ChipEstado } from '../chip-estado/chip-estado';
import { Icono } from '../icono/icono';
import { NombreIcono } from '../icono/iconos';
import { Placa } from '../placa/placa';

export type TipoColumna =
  | 'texto'
  | 'numero'
  | 'pesos'
  | 'fecha'
  | 'fecha-hora'
  | 'placa'
  | 'estado';

export interface Columna<T> {
  clave: keyof T & string;
  titulo: string;
  tipo?: TipoColumna;
  ordenable?: boolean;
}

interface Orden {
  clave: string;
  direccion: 'ascending' | 'descending';
}

const NUMERICAS: readonly (TipoColumna | undefined)[] = ['numero', 'pesos'];
const DATOS: readonly (TipoColumna | undefined)[] = ['numero', 'pesos', 'fecha', 'fecha-hora'];

function comparar(a: unknown, b: unknown): number {
  if (a === null || a === undefined) {
    return b === null || b === undefined ? 0 : 1;
  }
  if (b === null || b === undefined) {
    return -1;
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  return String(a).localeCompare(String(b), 'es', { numeric: true });
}

@Component({
  selector: 'app-tabla',
  imports: [NgTemplateOutlet, ChipEstado, Icono, Placa, PesosPipe, FechaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <table class="tabla">
      <caption [class.sr-only]="tituloOculto()">{{ titulo() }}</caption>
      <thead>
        <tr>
          @for (col of columnas(); track col.clave) {
            <th scope="col" [class.num]="esNumerica(col)" [attr.aria-sort]="ariaSort(col)">
              @if (col.ordenable) {
                <button type="button" class="tabla__orden" (click)="ordenar(col)">
                  {{ col.titulo }}<app-icono [nombre]="iconoOrden(col)" />
                </button>
              } @else {
                {{ col.titulo }}
              }
            </th>
          }
          @if (acciones()) {
            <th scope="col" class="num">Acciones</th>
          }
        </tr>
      </thead>
      <tbody>
        @for (fila of filasOrdenadas(); track claveFila()(fila)) {
          <tr>
            @for (col of columnas(); track col.clave) {
              <td
                [attr.data-etiqueta]="col.titulo"
                [class.num]="esNumerica(col)"
                [class.dato]="esDato(col)"
              >
                @switch (col.tipo) {
                  @case ('placa') {
                    <app-placa [placa]="texto(fila, col)" />
                  }
                  @case ('estado') {
                    <app-chip-estado [estado]="texto(fila, col)" />
                  }
                  @case ('pesos') {
                    {{ texto(fila, col) | pesos }}
                  }
                  @case ('fecha') {
                    {{ texto(fila, col) | fecha }}
                  }
                  @case ('fecha-hora') {
                    {{ texto(fila, col) | fecha: true }}
                  }
                  @default {
                    {{ texto(fila, col) }}
                  }
                }
              </td>
            }
            @if (acciones(); as plantilla) {
              <td class="tabla__acciones" data-etiqueta="Acciones">
                <div class="acciones">
                  <ng-container *ngTemplateOutlet="plantilla; context: { $implicit: fila }" />
                </div>
              </td>
            }
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class Tabla<T extends object> {
  readonly titulo = input.required<string>();
  readonly tituloOculto = input(false);
  readonly columnas = input.required<readonly Columna<T>[]>();
  readonly filas = input.required<readonly T[]>();
  readonly claveFila = input.required<(fila: T) => string | number>();

  protected readonly acciones = contentChild<TemplateRef<{ $implicit: T }>>('acciones');
  protected readonly orden = signal<Orden | null>(null);

  protected readonly filasOrdenadas = computed(() => {
    const orden = this.orden();
    const filas = this.filas();
    if (!orden) {
      return filas;
    }
    const signo = orden.direccion === 'ascending' ? 1 : -1;
    const clave = orden.clave as keyof T;
    return [...filas].sort((a, b) => signo * comparar(a[clave], b[clave]));
  });

  protected ordenar(col: Columna<T>): void {
    const actual = this.orden();
    const direccion =
      actual?.clave === col.clave && actual.direccion === 'ascending' ? 'descending' : 'ascending';
    this.orden.set({ clave: col.clave, direccion });
  }

  protected ariaSort(col: Columna<T>): string | null {
    if (!col.ordenable) {
      return null;
    }
    const orden = this.orden();
    return orden?.clave === col.clave ? orden.direccion : 'none';
  }

  protected iconoOrden(col: Columna<T>): NombreIcono {
    const orden = this.orden();
    if (orden?.clave !== col.clave) {
      return 'ordenar';
    }
    return orden.direccion === 'ascending' ? 'caretArriba' : 'caretAbajo';
  }

  protected texto(fila: T, col: Columna<T>): string {
    const valor = fila[col.clave];
    return valor === null || valor === undefined ? '' : String(valor);
  }

  protected esNumerica(col: Columna<T>): boolean {
    return NUMERICAS.includes(col.tipo);
  }

  protected esDato(col: Columna<T>): boolean {
    return DATOS.includes(col.tipo);
  }
}
