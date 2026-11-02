import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api/errores';
import { Reparacion } from '../../core/api/modelos';
import { valorDe } from '../../core/api/recurso';
import { API_TECNICO } from '../../core/api/tecnico-api';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { TarjetaReparacion } from './tarjeta-reparacion';

@Component({
  selector: 'app-mis-trabajos',
  imports: [RouterLink, Esqueleto, EstadoError, EstadoVacio, TarjetaReparacion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina' },
  template: `
    <h1>Mis trabajos</h1>
    @if (trabajos.isLoading()) {
      <app-esqueleto etiqueta="Cargando tus trabajos" forma="filas" [cantidad]="3" />
    } @else if (trabajos.error()) {
      <app-estado-error
        titulo="No se pudieron cargar tus trabajos."
        [mensaje]="mensajeError()"
        (reintentar)="trabajos.reload()"
      />
    } @else if (lista().length === 0) {
      <app-estado-vacio
        titulo="Aún no has tomado reparaciones."
        mensaje="Cuando tomes una cita de la agenda aparecerá aquí con su estado."
        icono="taller"
      >
        <a class="btn btn--primario" routerLink="/tecnico">Ver la agenda</a>
      </app-estado-vacio>
    } @else {
      @if (enCurso().length > 0) {
        <section class="cuenta__seccion" aria-labelledby="titulo-trabajos-curso">
          <h2 id="titulo-trabajos-curso">En curso</h2>
          <ul class="tarjetas-cuenta">
            @for (reparacion of enCurso(); track reparacion.idReparacion) {
              <li><app-tarjeta-reparacion [reparacion]="reparacion" /></li>
            }
          </ul>
        </section>
      }
      @if (terminados().length > 0) {
        <section class="cuenta__seccion" aria-labelledby="titulo-trabajos-terminados">
          <h2 id="titulo-trabajos-terminados">Terminados</h2>
          <ul class="tarjetas-cuenta">
            @for (reparacion of terminados(); track reparacion.idReparacion) {
              <li><app-tarjeta-reparacion [reparacion]="reparacion" /></li>
            }
          </ul>
        </section>
      }
    }
  `,
})
export default class MisTrabajos {
  protected readonly trabajos = httpResource<Reparacion[]>(() => `${API_TECNICO}/asignadas`);
  protected readonly mensajeError = computed(() => mensajeDeError(this.trabajos.error()));
  protected readonly lista = computed(() => valorDe(this.trabajos) ?? []);
  protected readonly enCurso = computed(() =>
    this.lista().filter((r) => r.estado === 'EN_PROCESO'),
  );
  protected readonly terminados = computed(() =>
    this.lista().filter((r) => r.estado !== 'EN_PROCESO'),
  );
}
