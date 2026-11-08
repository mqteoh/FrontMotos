import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api/errores';
import { FiltrosCatalogo, Sucursal } from '../../core/api/modelos';
import { API_PUBLICO, direccionSede } from '../../core/api/publico-api';
import { valorDe } from '../../core/api/recurso';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { Icono } from '../../shared/ui/icono/icono';

interface SedeVista extends Sucursal {
  direccion: string;
  disponibles: number | null;
}

@Component({
  selector: 'app-sedes',
  imports: [RouterLink, Esqueleto, EstadoError, EstadoVacio, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pagina-lista' },
  template: `
    <header>
      <h1>Sedes</h1>
      <p class="muted">
        En cada sede puedes ver las motos, cerrar la compra de tu reserva y llevar tu moto al
        taller.
      </p>
    </header>
    @if (sucursales.isLoading()) {
      <app-esqueleto etiqueta="Cargando sedes" forma="filas" [cantidad]="4" />
    } @else if (sucursales.error()) {
      <app-estado-error
        titulo="No se pudieron cargar las sedes."
        [mensaje]="mensajeError()"
        (reintentar)="sucursales.reload()"
      />
    } @else if (ciudades().length === 0) {
      <app-estado-vacio
        titulo="Aún no hay sedes registradas."
        mensaje="Cuando el concesionario abra una sede aparecerá aquí con su dirección."
      />
    } @else {
      @for (grupo of ciudades(); track grupo.ciudad) {
        <section class="sedes__ciudad" [attr.aria-labelledby]="'ciudad-' + $index">
          <h2 [id]="'ciudad-' + $index">{{ grupo.ciudad }}</h2>
          <ul class="sedes__lista">
            @for (sede of grupo.sedes; track sede.idSucursal) {
              <li class="sede">
                <h3 class="sede__nombre"><app-icono nombre="sede" />{{ sede.nombre }}</h3>
                <p class="sede__direccion">{{ sede.direccion }}</p>
                @if (sede.disponibles !== null) {
                  <p class="sede__motos">
                    <span class="dato">{{ sede.disponibles }}</span>
                    {{ sede.disponibles === 1 ? 'moto disponible' : 'motos disponibles' }}
                  </p>
                }
                @if (sede.disponibles !== 0) {
                  <a routerLink="/" [queryParams]="{ sede: sede.idSucursal }">
                    Ver las motos de {{ sede.nombre }}
                  </a>
                }
              </li>
            }
          </ul>
        </section>
      }
    }
  `,
})
export default class Sedes {
  protected readonly sucursales = httpResource<Sucursal[]>(() => `${API_PUBLICO}/sucursales`);
  private readonly filtros = httpResource<FiltrosCatalogo>(() => `${API_PUBLICO}/motos/filtros`);
  protected readonly mensajeError = computed(() => mensajeDeError(this.sucursales.error()));

  protected readonly ciudades = computed(() => {
    const conteo = new Map(
      (valorDe(this.filtros)?.sedes ?? []).map((sede) => [sede.idSucursal, sede.disponibles]),
    );
    const grupos = new Map<string, SedeVista[]>();
    for (const sucursal of valorDe(this.sucursales) ?? []) {
      const sede: SedeVista = {
        ...sucursal,
        direccion: direccionSede(sucursal),
        disponibles: this.filtros.hasValue() ? (conteo.get(sucursal.idSucursal) ?? 0) : null,
      };
      grupos.set(sucursal.ciudad, [...(grupos.get(sucursal.ciudad) ?? []), sede]);
    }
    return [...grupos.entries()]
      .sort(([a], [b]) => a.localeCompare(b, 'es'))
      .map(([ciudad, sedes]) => ({ ciudad, sedes }));
  });
}
