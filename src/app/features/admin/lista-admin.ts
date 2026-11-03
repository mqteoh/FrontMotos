import { HttpClient, httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { tieneDependientes } from '../../core/api/admin-api';
import { mensajeDeError } from '../../core/api/errores';
import { valorDe } from '../../core/api/recurso';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmacionService } from '../../shared/ui/confirmacion/confirmacion.service';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { Icono } from '../../shared/ui/icono/icono';
import { Tabla } from '../../shared/ui/tabla/tabla';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { CatalogosAdmin } from './catalogos-admin';
import {
  AccionRecurso,
  Fila,
  FiltroRecurso,
  Recurso,
  conMayuscula,
  participio,
  textoDe,
  urlEliminar,
} from './recurso';

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function mismosValores(a: Record<string, string>, b: Record<string, string>): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

@Component({
  selector: 'app-lista-admin',
  imports: [RouterLink, Esqueleto, EstadoError, EstadoVacio, Icono, Tabla],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina cuenta__pagina--ancha' },
  templateUrl: './lista-admin.html',
})
export default class ListaAdmin {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly catalogos = inject(CatalogosAdmin);
  private readonly injector = inject(Injector);

  protected readonly recurso = this.ruta.snapshot.data['recurso'] as Recurso;
  protected readonly filtros = this.recurso.filtros ?? [];
  protected readonly editable = Boolean(this.recurso.campos) && this.recurso.editable !== false;
  protected readonly articulo = this.recurso.genero === 'f' ? 'la' : 'el';

  private readonly titulo = viewChild<ElementRef<HTMLElement>>('titulo');
  private readonly alerta = viewChild<ElementRef<HTMLElement>>('alerta');
  private readonly buscador = viewChild<ElementRef<HTMLInputElement>>('buscador');

  private readonly parametros = toSignal(this.ruta.queryParamMap, {
    initialValue: this.ruta.snapshot.queryParamMap,
  });
  protected readonly busqueda = computed(() => this.parametros().get('q') ?? '');
  protected readonly valoresFiltro = computed<Record<string, string>>(
    () =>
      Object.fromEntries(
        this.filtros.map((filtro) => [filtro.clave, this.parametros().get(filtro.clave) ?? '']),
      ),
    { equal: mismosValores },
  );
  private readonly parametrosServidor = computed<Record<string, string>>(
    () =>
      Object.fromEntries(
        this.filtros
          .filter((filtro) => !filtro.local && this.valoresFiltro()[filtro.clave])
          .map((filtro) => [filtro.clave, this.valoresFiltro()[filtro.clave]]),
      ),
    { equal: mismosValores },
  );
  protected readonly hayFiltros = computed(
    () => Boolean(this.busqueda()) || Object.values(this.valoresFiltro()).some(Boolean),
  );

  protected readonly datos = httpResource<Fila[]>(() => ({
    url: this.recurso.url,
    params: this.parametrosServidor(),
  }));
  protected readonly mensajeError = computed(() => mensajeDeError(this.datos.error()));
  protected readonly filas = computed(() => {
    const locales = this.filtros.filter(
      (filtro) => filtro.local && this.valoresFiltro()[filtro.clave],
    );
    const consulta = normalizar(this.busqueda());
    return (valorDe(this.datos) ?? [])
      .filter((fila) =>
        locales.every(
          (filtro) => textoDe(fila[filtro.clave]) === this.valoresFiltro()[filtro.clave],
        ),
      )
      .map((fila) => this.recurso.vista?.(fila) ?? fila)
      .filter(
        (fila) =>
          !consulta ||
          normalizar(
            this.recurso.columnas.map((col) => textoDe(fila[col.clave])).join(' '),
          ).includes(consulta),
      );
  });
  protected readonly conteo = computed(() => {
    const cantidad = this.filas().length;
    return `${cantidad} ${cantidad === 1 ? this.recurso.singular : this.recurso.titulo.toLowerCase()}`;
  });

  protected readonly anuncio = computed(() => {
    if (!this.datos.hasValue()) {
      return '';
    }
    if (this.filas().length > 0) {
      return `${this.conteo()}.`;
    }
    return this.hayFiltros() ? 'Ningún registro coincide con la búsqueda.' : this.recurso.vacio;
  });

  protected readonly eliminando = signal<string | null>(null);
  protected readonly ejecutando = signal(false);
  protected readonly aviso = signal<string | null>(null);
  protected readonly clave = (fila: Fila) => this.recurso.id(fila);

  constructor() {
    this.catalogos.usar(this.recurso.catalogos ?? []);
  }

  protected get volver(): string {
    return this.router.url;
  }

  protected opcionesFiltro(filtro: FiltroRecurso) {
    return filtro.opciones({ catalogos: this.catalogos, idEditado: null }) ?? [];
  }

  protected puedeEliminar(fila: Fila): boolean {
    return (
      this.recurso.eliminable !== false &&
      (this.recurso.puedeEliminar?.(fila, this.auth.usuario()?.id) ?? true)
    );
  }

  protected buscar(evento: Event): void {
    this.navegar({ q: (evento.target as HTMLInputElement).value.trim() || null });
  }

  protected filtrar(clave: string, evento: Event): void {
    this.aviso.set(null);
    this.navegar({ [clave]: (evento.target as HTMLSelectElement).value || null });
  }

  protected quitarFiltros(): void {
    const vacios = Object.fromEntries([['q', null], ...this.filtros.map((f) => [f.clave, null])]);
    this.navegar(vacios);
    const buscador = this.buscador()?.nativeElement;
    if (buscador) {
      buscador.value = '';
      buscador.focus();
    }
  }

  protected async eliminar(fila: Fila): Promise<void> {
    this.aviso.set(null);
    const { singular } = this.recurso;
    const nombre = this.recurso.nombre(fila);
    const confirmado = await this.confirmacion.confirmar({
      titulo: `¿Eliminar ${this.articulo} ${singular} ${nombre}?`,
      mensaje: this.recurso.avisoEliminar ?? 'Esta acción no se puede deshacer.',
      accion: `Eliminar ${singular}`,
      peligro: true,
    });
    if (!confirmado) {
      return;
    }
    const id = this.recurso.id(fila);
    const { url, params } = urlEliminar(this.recurso, fila);
    this.eliminando.set(id);
    this.http.delete(url, { params }).subscribe({
      next: () => {
        this.eliminando.set(null);
        this.datos.update((lista) => lista?.filter((f) => this.recurso.id(f) !== id));
        this.catalogos.recargar(this.recurso.alimenta ?? []);
        this.toast.exito(
          `${conMayuscula(singular)} ${nombre} ${participio(this.recurso, 'eliminad')}.`,
        );
        this.enfocar(this.titulo);
      },
      error: (error: unknown) => {
        this.eliminando.set(null);
        const causa =
          tieneDependientes(error) && this.recurso.bloqueo
            ? this.recurso.bloqueo
            : mensajeDeError(error);
        this.aviso.set(`No se pudo eliminar ${this.articulo} ${singular} ${nombre}. ${causa}`);
        this.enfocar(this.alerta);
      },
    });
  }

  protected async ejecutarAccion(accion: AccionRecurso): Promise<void> {
    this.aviso.set(null);
    const confirmado = await this.confirmacion.confirmar({
      titulo: accion.titulo,
      mensaje: accion.mensaje,
      accion: accion.etiqueta,
    });
    if (!confirmado) {
      return;
    }
    this.ejecutando.set(true);
    this.http.post(accion.url, null).subscribe({
      next: (respuesta) => {
        this.ejecutando.set(false);
        this.toast.exito(accion.resultado(respuesta));
        this.datos.reload();
      },
      error: (error: unknown) => {
        this.ejecutando.set(false);
        this.aviso.set(mensajeDeError(error));
        this.enfocar(this.alerta);
      },
    });
  }

  private navegar(cambios: Record<string, string | null>): void {
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: cambios,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private enfocar(destino: () => ElementRef<HTMLElement> | undefined): void {
    afterNextRender(() => destino()?.nativeElement.focus(), { injector: this.injector });
  }
}
