import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { mensajeDeError } from '../../core/api/errores';
import { Reparacion, Sucursal } from '../../core/api/modelos';
import { API_PUBLICO } from '../../core/api/publico-api';
import { valorDe } from '../../core/api/recurso';
import {
  API_TECNICO,
  VistaAgenda,
  agruparPorDia,
  esAtrasada,
  filtrarVista,
} from '../../core/api/tecnico-api';
import { AuthService } from '../../core/auth/auth.service';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { TarjetaReparacion } from './tarjeta-reparacion';

const VISTAS: { valor: VistaAgenda; etiqueta: string; vacio: string }[] = [
  { valor: 'hoy', etiqueta: 'Hoy', vacio: 'No hay citas para hoy.' },
  { valor: 'semana', etiqueta: 'Esta semana', vacio: 'No hay citas esta semana.' },
  { valor: 'pendientes', etiqueta: 'Todas las pendientes', vacio: 'No hay citas pendientes.' },
];

const FECHA_LARGA = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

@Component({
  selector: 'app-agenda',
  imports: [Esqueleto, EstadoError, EstadoVacio, TarjetaReparacion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina cuenta__pagina--ancha' },
  templateUrl: './agenda.html',
})
export default class Agenda {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly vistas = VISTAS;
  protected readonly esDueno = computed(() => this.auth.usuario()?.rol === 'DUENO');
  protected readonly hoy = (() => {
    const texto = FECHA_LARGA.format(new Date());
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  })();
  protected readonly vista = toSignal(
    this.ruta.queryParamMap.pipe(
      map((params) => VISTAS.find((v) => v.valor === params.get('vista'))?.valor ?? 'hoy'),
    ),
    { initialValue: 'hoy' as VistaAgenda },
  );

  protected readonly agenda = httpResource<Reparacion[]>(() => `${API_TECNICO}/agenda`);
  private readonly sedes = httpResource<Sucursal[]>(() => `${API_PUBLICO}/sucursales`);
  protected readonly mensajeError = computed(() => mensajeDeError(this.agenda.error()));
  private readonly lista = computed(() => valorDe(this.agenda) ?? []);

  protected readonly sede = computed(() => {
    if (this.esDueno()) {
      return 'Todas las sedes';
    }
    const id = this.auth.usuario()?.idSucursal;
    return (valorDe(this.sedes) ?? []).find((s) => s.idSucursal === id)?.nombre ?? 'Tu sede';
  });
  protected readonly enCurso = computed(() =>
    this.lista().filter(
      (r) => r.estado === 'EN_PROCESO' && r.idTecnico === this.auth.usuario()?.id,
    ),
  );
  protected readonly atrasadas = computed(() => this.lista().filter((r) => esAtrasada(r)));
  private readonly resto = computed(() => {
    const aparte = new Set([...this.enCurso(), ...this.atrasadas()].map((r) => r.idReparacion));
    return this.lista().filter((r) => !aparte.has(r.idReparacion));
  });
  protected readonly conteo = computed(() => ({
    hoy: filtrarVista(this.resto(), 'hoy').length,
    semana: filtrarVista(this.resto(), 'semana').length,
    pendientes: this.resto().length,
  }));
  protected readonly grupos = computed(() =>
    agruparPorDia(filtrarVista(this.resto(), this.vista())),
  );
  protected readonly mensajeVacio = computed(
    () => VISTAS.find((v) => v.valor === this.vista())?.vacio ?? '',
  );

  protected cambiarVista(vista: VistaAgenda): void {
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: { vista: vista === 'hoy' ? null : vista },
      replaceUrl: true,
    });
  }
}
