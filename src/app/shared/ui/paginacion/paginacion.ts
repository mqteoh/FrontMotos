import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

export function paginasVisibles(actual: number, total: number): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const cercanas = new Set([1, total, actual - 1, actual, actual + 1]);
  const ordenadas = [...cercanas].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const resultado: (number | null)[] = [];
  ordenadas.forEach((pagina, i) => {
    if (i > 0 && pagina - ordenadas[i - 1] > 1) {
      resultado.push(null);
    }
    resultado.push(pagina);
  });
  return resultado;
}

@Component({
  selector: 'app-paginacion',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (total() > 1) {
      <nav class="paginacion" aria-label="Páginas de resultados">
        <ul>
          <li>
            @if (actual() > 1) {
              <a
                class="btn btn--secundario"
                routerLink="."
                [queryParams]="{ pagina: actual() - 1 }"
                queryParamsHandling="merge"
                (click)="cambio.emit()"
              >
                Anterior
              </a>
            }
          </li>
          @for (pagina of paginas(); track $index) {
            <li>
              @if (pagina === null) {
                <span class="paginacion__salto" aria-hidden="true">…</span>
              } @else {
                <a
                  class="paginacion__numero"
                  routerLink="."
                  [queryParams]="{ pagina: pagina }"
                  queryParamsHandling="merge"
                  [attr.aria-current]="pagina === actual() ? 'page' : null"
                  [attr.aria-label]="'Página ' + pagina"
                  (click)="cambio.emit()"
                >
                  {{ pagina }}
                </a>
              }
            </li>
          }
          <li>
            @if (actual() < total()) {
              <a
                class="btn btn--secundario"
                routerLink="."
                [queryParams]="{ pagina: actual() + 1 }"
                queryParamsHandling="merge"
                (click)="cambio.emit()"
              >
                Siguiente
              </a>
            }
          </li>
        </ul>
      </nav>
    }
  `,
})
export class Paginacion {
  readonly actual = input.required<number>();
  readonly total = input.required<number>();
  readonly cambio = output();
  protected readonly paginas = computed(() => paginasVisibles(this.actual(), this.total()));
}
