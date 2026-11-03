import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NumeroPipe } from '../../formato/numero.pipe';
import { PesosPipe } from '../../formato/pesos.pipe';

export interface CategoriaGrafico {
  etiqueta: string;
  detalle?: string;
  completa?: string;
  valores: readonly number[];
}

export type FormatoGrafico = 'pesos' | 'unidades';

const COMPACTO = new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 });
const ANCHO_TOOLTIP = 240;

export function escalaAgradable(maximo: number, enteros: boolean, marcas = 4): number[] {
  if (maximo <= 0) {
    return [0, 1];
  }
  const aproximado = maximo / marcas;
  const potencia = 10 ** Math.floor(Math.log10(aproximado));
  const paso = Math.max(
    [1, 2, 2.5, 5, 10].map((factor) => factor * potencia).find((p) => p >= aproximado) ?? potencia,
    enteros ? 1 : 0,
  );
  const cantidad = Math.ceil(maximo / paso);
  return Array.from({ length: cantidad + 1 }, (_, i) => i * paso);
}

export function compacto(valor: number, formato: FormatoGrafico): string {
  const texto = COMPACTO.format(valor);
  return formato === 'pesos' ? `$ ${texto}` : texto;
}

@Component({
  selector: 'app-grafico-barras',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grafico', '[class.grafico--vertical]': "orientacion() === 'vertical'" },
  template: `
    @if (series().length > 1) {
      <ul class="grafico__leyenda" aria-hidden="true">
        @for (serie of series(); track serie; let s = $index) {
          <li><span [class]="'grafico__clave serie-' + (s + 1)"></span>{{ serie }}</li>
        }
      </ul>
    }
    <div
      #lienzo
      class="grafico__lienzo"
      role="img"
      [attr.aria-label]="descripcion()"
      (pointerleave)="activo.set(null)"
    >
      @if (orientacion() === 'horizontal') {
        <div class="grafico-h" [style.--filas]="categorias().length">
          <div class="grafico-h__rejilla">
            @for (marca of marcas(); track marca) {
              <span class="grafico__linea" [style.--pos]="marca / tope()"></span>
            }
          </div>
          @for (categoria of categorias(); track categoria.etiqueta; let i = $index) {
            <div
              class="grafico-h__fila"
              [class.grafico__atenuada]="activo() !== null && activo() !== i"
              [style.--fila]="i + 1"
              (pointermove)="mover(i, $event)"
            >
              <span class="grafico-h__etiqueta">
                {{ categoria.etiqueta }}
                @if (categoria.detalle) {
                  <span class="grafico__detalle">{{ categoria.detalle }}</span>
                }
              </span>
              <span class="grafico-h__pista">
                @if (modo() === 'agrupado') {
                  @for (valor of categoria.valores; track s; let s = $index) {
                    <span class="grafico-h__serie grafico-h__serie--agrupada">
                      <span class="grafico-h__barra" [style.--fraccion]="valor / tope()">
                        @if (valor > 0) {
                          <span [class]="'grafico__segmento serie-' + (s + 1)"></span>
                        }
                      </span>
                      <span class="grafico-h__valor">{{ corto(valor) }}</span>
                    </span>
                  }
                } @else {
                  <span class="grafico-h__serie">
                    <span class="grafico-h__barra" [style.--fraccion]="totales()[i] / tope()">
                      @for (valor of categoria.valores; track s; let s = $index) {
                        @if (valor > 0) {
                          <span
                            [class]="'grafico__segmento serie-' + (s + 1)"
                            [style.flex-grow]="valor"
                          ></span>
                        }
                      }
                    </span>
                    <span class="grafico-h__valor">{{ corto(totales()[i]) }}</span>
                  </span>
                }
              </span>
            </div>
          }
          <div class="grafico-h__eje">
            @for (marca of marcas(); track marca) {
              <span class="grafico__marca" [style.--pos]="marca / tope()">{{ corto(marca) }}</span>
            }
          </div>
        </div>
      } @else {
        <div class="grafico-v">
          <div class="grafico-v__eje-y">
            <div class="grafico-v__plano">
              @for (marca of marcas(); track marca) {
                <span class="grafico__marca" [style.--pos]="marca / tope()">{{
                  corto(marca)
                }}</span>
              }
            </div>
          </div>
          <div class="grafico-v__area">
            <div class="grafico-v__plano">
              @for (marca of marcas(); track marca) {
                <span class="grafico__linea" [style.--pos]="marca / tope()"></span>
              }
              <div class="grafico-v__columnas" [style.--columnas]="categorias().length">
                @for (categoria of categorias(); track categoria.etiqueta; let i = $index) {
                  <div
                    class="grafico-v__columna"
                    [class.grafico__atenuada]="activo() !== null && activo() !== i"
                    (pointermove)="mover(i, $event)"
                  >
                    @if (i === mayor() && totales()[i] > 0) {
                      <span class="grafico-v__valor">{{ corto(totales()[i]) }}</span>
                    }
                    <span class="grafico-v__barra" [style.--fraccion]="totales()[i] / tope()">
                      @for (valor of categoria.valores; track s; let s = $index) {
                        @if (valor > 0) {
                          <span
                            [class]="'grafico__segmento serie-' + (s + 1)"
                            [style.flex-grow]="valor"
                          ></span>
                        }
                      }
                    </span>
                  </div>
                }
              </div>
            </div>
          </div>
          <div class="grafico-v__eje-x" [style.--columnas]="categorias().length">
            @for (categoria of categorias(); track categoria.etiqueta) {
              <span>{{ categoria.etiqueta }}</span>
            }
          </div>
        </div>
      }

      @if (activo() !== null) {
        @let indice = activo() ?? 0;
        @let categoria = categorias()[indice];
        <div
          class="grafico__tooltip"
          aria-hidden="true"
          [style.left.px]="posicion().x"
          [style.top.px]="posicion().y"
        >
          <p class="grafico__tooltip-titulo">{{ categoria.completa ?? categoria.etiqueta }}</p>
          @for (serie of series(); track serie; let s = $index) {
            <p class="grafico__tooltip-fila">
              <span [class]="'grafico__linea-clave serie-' + (s + 1)"></span>
              <strong>{{ completo(categoria.valores[s] ?? 0) }}</strong>
              <span>{{ serie }}</span>
            </p>
          }
          @if (series().length > 1 && modo() === 'apilado') {
            <p class="grafico__tooltip-fila grafico__tooltip-total">
              <strong>{{ completo(totales()[indice]) }}</strong
              ><span>Total</span>
            </p>
          }
        </div>
      }
    </div>
  `,
})
export class GraficoBarras {
  readonly descripcion = input.required<string>();
  readonly series = input.required<readonly string[]>();
  readonly categorias = input.required<readonly CategoriaGrafico[]>();
  readonly orientacion = input<'horizontal' | 'vertical'>('horizontal');
  readonly formato = input<FormatoGrafico>('pesos');
  readonly modo = input<'apilado' | 'agrupado'>('apilado');

  private readonly lienzo = viewChild.required<ElementRef<HTMLElement>>('lienzo');
  private readonly pesos = new PesosPipe();
  private readonly numero = new NumeroPipe();

  protected readonly activo = signal<number | null>(null);
  protected readonly posicion = signal({ x: 0, y: 0 });
  protected readonly totales = computed(() =>
    this.categorias().map((categoria) => categoria.valores.reduce((suma, v) => suma + v, 0)),
  );
  protected readonly marcas = computed(() => {
    const valores =
      this.modo() === 'agrupado'
        ? this.categorias().flatMap((categoria) => categoria.valores)
        : this.totales();
    return escalaAgradable(Math.max(0, ...valores), this.formato() === 'unidades');
  });
  protected readonly tope = computed(() => this.marcas().at(-1) || 1);
  protected readonly mayor = computed(() => {
    const totales = this.totales();
    return totales.indexOf(Math.max(...totales));
  });

  protected corto(valor: number): string {
    return compacto(valor, this.formato());
  }

  protected completo(valor: number): string {
    return this.formato() === 'pesos' ? this.pesos.transform(valor) : this.numero.transform(valor);
  }

  protected mover(indice: number, evento: PointerEvent): void {
    const caja = this.lienzo().nativeElement.getBoundingClientRect();
    const x = evento.clientX - caja.left + 16;
    this.activo.set(indice);
    this.posicion.set({
      x: Math.max(0, Math.min(x, caja.width - ANCHO_TOOLTIP)),
      y: evento.clientY - caja.top + 16,
    });
  }
}
