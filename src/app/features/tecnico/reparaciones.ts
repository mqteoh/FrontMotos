import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api/errores';
import { Reparacion, Sucursal } from '../../core/api/modelos';
import { API_PUBLICO } from '../../core/api/publico-api';
import { valorDe } from '../../core/api/recurso';
import { API_TECNICO, enRango, totalReparaciones } from '../../core/api/tecnico-api';
import { AuthService } from '../../core/auth/auth.service';
import { PesosPipe } from '../../shared/formato/pesos.pipe';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { Icono } from '../../shared/ui/icono/icono';
import { TarjetaReparacion } from './tarjeta-reparacion';

@Component({
  selector: 'app-reparaciones',
  imports: [RouterLink, Esqueleto, EstadoError, EstadoVacio, Icono, TarjetaReparacion, PesosPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina cuenta__pagina--ancha' },
  templateUrl: './reparaciones.html',
})
export default class Reparaciones {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly esDueno = computed(() => this.auth.usuario()?.rol === 'DUENO');

  private readonly parametros = toSignal(this.ruta.queryParamMap, {
    initialValue: this.ruta.snapshot.queryParamMap,
  });
  protected readonly mias = computed(
    () => !this.esDueno() && this.parametros().get('vista') === 'mias',
  );
  protected readonly desde = computed(() => this.parametros().get('desde') ?? '');
  protected readonly hasta = computed(() => this.parametros().get('hasta') ?? '');
  protected readonly idSede = computed(() =>
    this.esDueno() ? (this.parametros().get('sede') ?? '') : '',
  );
  protected readonly errorRango = computed(() =>
    this.desde() && this.hasta() && this.desde() > this.hasta()
      ? 'La fecha «Desde» no puede ser posterior a «Hasta».'
      : null,
  );
  protected readonly hayFiltros = computed(
    () => Boolean(this.desde() || this.hasta() || this.idSede()) || this.mias(),
  );

  protected readonly sedes = httpResource<Sucursal[]>(() => `${API_PUBLICO}/sucursales`);
  protected readonly listaSedes = computed(() => valorDe(this.sedes) ?? []);
  protected readonly sede = computed(() => {
    if (this.esDueno()) {
      return 'Todas las sedes';
    }
    const id = this.auth.usuario()?.idSucursal;
    return this.listaSedes().find((s) => s.idSucursal === id)?.nombre ?? 'Tu sede';
  });

  protected readonly datos = httpResource<Reparacion[]>(() => {
    if (this.errorRango()) {
      return undefined;
    }
    if (this.mias()) {
      return { url: `${API_TECNICO}/mis-reparaciones` };
    }
    const params: Record<string, string> = {};
    if (this.desde()) params['desde'] = this.desde();
    if (this.hasta()) params['hasta'] = this.hasta();
    if (this.idSede()) params['idSucursal'] = this.idSede();
    return { url: `${API_TECNICO}/reparaciones`, params };
  });
  protected readonly mensajeError = computed(() => mensajeDeError(this.datos.error()));
  protected readonly lista = computed(() =>
    (valorDe(this.datos) ?? []).filter((r) => enRango(r.fecha, this.desde(), this.hasta())),
  );
  protected readonly total = computed(() => totalReparaciones(this.lista()));
  protected readonly anuncio = computed(() => {
    if (!this.datos.hasValue()) {
      return '';
    }
    const cantidad = this.lista().length;
    if (cantidad === 0) {
      return 'No hay reparaciones con esos filtros.';
    }
    return cantidad === 1 ? '1 reparación encontrada.' : `${cantidad} reparaciones encontradas.`;
  });

  protected verMias(mias: boolean): void {
    this.navegar({ vista: mias ? 'mias' : null });
  }

  protected filtrar(clave: string, evento: Event): void {
    this.navegar({
      [clave]: (evento.target as HTMLInputElement | HTMLSelectElement).value || null,
    });
  }

  protected quitarFiltros(): void {
    this.navegar({ vista: null, desde: null, hasta: null, sede: null });
  }

  private navegar(cambios: Record<string, string | null>): void {
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: cambios,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
