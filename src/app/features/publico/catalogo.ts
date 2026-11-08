import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { mensajeDeError } from '../../core/api/errores';
import { FiltrosCatalogo, MotoCatalogo, Pagina } from '../../core/api/modelos';
import { valorDe } from '../../core/api/recurso';
import {
  API_PUBLICO,
  BUSQUEDA_INICIAL,
  Busqueda,
  ORDENES,
  aParametrosUrl,
  contarFiltros,
  leerBusqueda,
  solicitudMotos,
} from '../../core/api/publico-api';
import { PesosPipe } from '../../shared/formato/pesos.pipe';
import { nombreTipoMoto } from '../../shared/formato/tipos-moto';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { Icono } from '../../shared/ui/icono/icono';
import { Paginacion } from '../../shared/ui/paginacion/paginacion';
import { TarjetaMoto } from '../../shared/ui/tarjeta-moto/tarjeta-moto';
import { UltimaBusqueda } from './ultima-busqueda';

@Component({
  selector: 'app-catalogo',
  imports: [Esqueleto, EstadoError, EstadoVacio, Icono, Paginacion, PesosPipe, TarjetaMoto],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'catalogo' },
  templateUrl: './catalogo.html',
})
export default class Catalogo {
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly textoEscrito = new Subject<string>();
  private readonly conteo = viewChild<ElementRef<HTMLElement>>('conteo');
  private readonly campoTexto = viewChild.required<ElementRef<HTMLInputElement>>('campoTexto');
  private readonly campoMin = viewChild.required<ElementRef<HTMLInputElement>>('campoMin');
  private readonly campoMax = viewChild.required<ElementRef<HTMLInputElement>>('campoMax');

  protected readonly ordenes = ORDENES;
  protected readonly nombreTipo = nombreTipoMoto;
  protected readonly busqueda = toSignal(this.ruta.queryParams.pipe(map(leerBusqueda)), {
    initialValue: BUSQUEDA_INICIAL,
  });
  protected readonly cantidadFiltros = computed(() => contarFiltros(this.busqueda()));
  protected readonly conFiltros = computed(() => this.cantidadFiltros() > 0);
  protected readonly filtrosAbiertos = signal(false);
  protected readonly errorPrecio = signal<string | null>(null);

  protected readonly filtros = httpResource<FiltrosCatalogo>(() => `${API_PUBLICO}/motos/filtros`);
  protected readonly motos = httpResource<Pagina<MotoCatalogo>>(() =>
    solicitudMotos(this.busqueda()),
  );
  protected readonly opciones = computed(() => valorDe(this.filtros));
  protected readonly pagina = computed(() => valorDe(this.motos));
  protected readonly mensajeError = computed(() => mensajeDeError(this.motos.error()));
  protected readonly resumen = computed(() => {
    const pagina = this.pagina();
    if (!pagina) {
      return '';
    }
    const total = pagina.totalElementos;
    const motos = total === 1 ? '1 moto' : `${total} motos`;
    return pagina.totalPaginas > 1
      ? `${motos} · página ${pagina.pagina + 1} de ${pagina.totalPaginas}`
      : motos;
  });

  constructor() {
    const ultima = inject(UltimaBusqueda);
    effect(() =>
      ultima.url.set(
        this.router.createUrlTree(['/'], { queryParams: aParametrosUrl(this.busqueda()) }),
      ),
    );
    this.textoEscrito
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((texto) => this.actualizar({ texto: texto.trim() }, true));
  }

  protected escribirTexto(evento: Event): void {
    this.textoEscrito.next((evento.target as HTMLInputElement).value);
  }

  protected elegir(campo: 'marca' | 'tipo' | 'orden', evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value;
    this.actualizar({ [campo]: valor } as Partial<Busqueda>);
  }

  protected elegirSede(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value;
    this.actualizar({ sede: valor ? Number(valor) : null });
  }

  protected cambiarPrecio(campo: 'precioMin' | 'precioMax', evento: Event): void {
    const texto = (evento.target as HTMLInputElement).value.trim();
    const valor = texto === '' ? null : Math.round(Number(texto));
    if (valor !== null && (Number.isNaN(valor) || valor < 0)) {
      this.errorPrecio.set('Escribe el precio en pesos, solo con números.');
      return;
    }
    const nueva = { ...this.busqueda(), [campo]: valor };
    if (nueva.precioMin !== null && nueva.precioMax !== null && nueva.precioMin > nueva.precioMax) {
      this.errorPrecio.set('El precio mínimo no puede ser mayor que el máximo.');
      return;
    }
    this.errorPrecio.set(null);
    this.actualizar({ [campo]: valor });
  }

  protected quitarFiltros(): void {
    this.errorPrecio.set(null);
    for (const campo of [this.campoTexto(), this.campoMin(), this.campoMax()]) {
      campo.nativeElement.value = '';
    }
    this.campoTexto().nativeElement.focus();
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: aParametrosUrl({ ...BUSQUEDA_INICIAL, orden: this.busqueda().orden }),
    });
  }

  protected irAResultados(): void {
    this.conteo()?.nativeElement.focus();
    this.conteo()?.nativeElement.scrollIntoView({ block: 'start' });
  }

  private actualizar(cambios: Partial<Busqueda>, reemplazar = false): void {
    const nueva: Busqueda = { ...this.busqueda(), ...cambios, pagina: 1 };
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: aParametrosUrl(nueva),
      replaceUrl: reemplazar,
    });
  }
}
