import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { NOMBRE_APP } from '../../core/app-info';
import { mensajeDeError } from '../../core/api/errores';
import { Reparacion as DatosReparacion } from '../../core/api/modelos';
import { valorDe } from '../../core/api/recurso';
import { API_TECNICO, nombresTecnicos, participo } from '../../core/api/tecnico-api';
import { AuthService } from '../../core/auth/auth.service';
import { FechaPipe } from '../../shared/formato/fecha.pipe';
import { PesosPipe } from '../../shared/formato/pesos.pipe';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { Icono } from '../../shared/ui/icono/icono';
import { Placa } from '../../shared/ui/placa/placa';

@Component({
  selector: 'app-reparacion',
  imports: [RouterLink, Esqueleto, EstadoError, Icono, Placa, FechaPipe, PesosPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina' },
  templateUrl: './reparacion.html',
})
export default class Reparacion {
  readonly idReparacion = input.required<string>();

  private readonly auth = inject(AuthService);

  protected readonly reparacion = httpResource<DatosReparacion>(
    () => `${API_TECNICO}/reparaciones/${this.idReparacion()}`,
  );
  protected readonly datos = computed(() => valorDe(this.reparacion));
  protected readonly mensajeCarga = computed(() => mensajeDeError(this.reparacion.error()));
  protected readonly tecnicos = computed(() => {
    const datos = this.datos();
    return datos ? nombresTecnicos(datos) : '';
  });
  protected readonly puedeCorregir = computed(() => {
    const datos = this.datos();
    const usuario = this.auth.usuario();
    if (!datos) {
      return false;
    }
    return usuario?.rol === 'DUENO' || participo(datos, usuario?.id);
  });

  constructor() {
    const titulo = inject(Title);
    effect(() => {
      const datos = this.datos();
      if (datos) {
        titulo.setTitle(`Reparación N.º ${datos.idReparacion}, ${datos.placa} | ${NOMBRE_APP}`);
      }
    });
  }
}
