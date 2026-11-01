import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-esqueleto',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="status">
      <span class="sr-only">{{ etiqueta() }}</span>
      <div aria-hidden="true">
        @switch (forma()) {
          @case ('tarjetas') {
            <div class="grid-motos">
              @for (i of items(); track i) {
                <div class="tarjeta">
                  <span class="esqueleto__bloque esqueleto__foto"></span>
                  <div class="tarjeta__cuerpo">
                    <span class="esqueleto__bloque esqueleto__placa"></span>
                    <span class="esqueleto__bloque esqueleto__linea esqueleto__linea--titulo"></span>
                    <span class="esqueleto__bloque esqueleto__linea"></span>
                    <span class="esqueleto__bloque esqueleto__linea esqueleto__linea--corta"></span>
                  </div>
                </div>
              }
            </div>
          }
          @case ('filas') {
            <div class="esqueleto__filas">
              @for (i of items(); track i) {
                <span class="esqueleto__bloque esqueleto__fila"></span>
              }
            </div>
          }
          @default {
            <div class="esqueleto__texto">
              <span class="esqueleto__bloque esqueleto__linea esqueleto__linea--titulo"></span>
              @for (i of items(); track i) {
                <span class="esqueleto__bloque esqueleto__linea"></span>
              }
              <span class="esqueleto__bloque esqueleto__linea esqueleto__linea--corta"></span>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class Esqueleto {
  readonly etiqueta = input.required<string>();
  readonly forma = input<'tarjetas' | 'filas' | 'texto'>('texto');
  readonly cantidad = input(3);
  protected readonly items = computed(() => Array.from({ length: this.cantidad() }, (_, i) => i));
}
