import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { aCsv, descargarCsv } from '../../shared/formato/csv';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { Icono } from '../../shared/ui/icono/icono';
import { Columna, Tabla } from '../../shared/ui/tabla/tabla';
import { Fila } from './recurso';

let siguienteReporte = 0;

@Component({
  selector: 'app-seccion-reporte',
  imports: [Esqueleto, EstadoError, EstadoVacio, Icono, Tabla],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'reporte', role: 'region', '[attr.aria-labelledby]': 'idTitulo' },
  template: `
    <header class="reporte__cabecera">
      <div>
        <h2 [id]="idTitulo">{{ titulo() }}</h2>
        <p class="muted">{{ descripcion() }}</p>
      </div>
      <div class="reporte__controles">
        <ng-content select="[controles]" />
        <button
          type="button"
          class="btn btn--secundario"
          [disabled]="cargando() || !!error() || vacio()"
          (click)="descargar()"
        >
          <app-icono nombre="descargar" />Descargar CSV<span class="sr-only"> de este reporte</span>
        </button>
      </div>
    </header>

    @if (cargando()) {
      <div [style.min-height]="altoCarga()">
        <app-esqueleto [etiqueta]="'Cargando: ' + titulo()" forma="filas" [cantidad]="4" />
      </div>
    } @else if (error()) {
      <app-estado-error
        titulo="No se pudo cargar este reporte."
        [mensaje]="error() ?? ''"
        (reintentar)="reintentar.emit()"
      />
    } @else if (vacio()) {
      <app-estado-vacio [titulo]="mensajeVacio()" [mensaje]="ayudaVacio()" icono="grafico" />
    } @else {
      <ng-content />
      <details class="reporte__datos">
        <summary>Ver los datos en una tabla</summary>
        <app-tabla
          [titulo]="titulo()"
          [tituloOculto]="true"
          [columnas]="columnas()"
          [filas]="filas()"
          [claveFila]="claveFila()"
        />
      </details>
    }
  `,
})
export class SeccionReporte {
  readonly titulo = input.required<string>();
  readonly descripcion = input.required<string>();
  readonly archivo = input.required<string>();
  readonly columnas = input.required<readonly Columna<Fila>[]>();
  readonly filas = input.required<readonly Fila[]>();
  readonly claveFila = input.required<(fila: Fila) => string | number>();
  readonly cargando = input(false);
  readonly altoCarga = input('20rem');
  readonly error = input<string | null>(null);
  readonly vacio = input(false);
  readonly mensajeVacio = input('Aún no hay datos para este reporte.');
  readonly ayudaVacio = input('Las cifras aparecerán cuando haya registros.');
  readonly reintentar = output();

  protected readonly idTitulo = `reporte-${++siguienteReporte}`;

  protected descargar(): void {
    descargarCsv(this.archivo(), aCsv(this.columnas(), this.filas()));
  }
}
