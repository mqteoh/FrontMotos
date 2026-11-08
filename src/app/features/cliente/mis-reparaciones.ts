import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { API_CLIENTE } from '../../core/api/cliente-api';
import { mensajeDeError } from '../../core/api/errores';
import { Reparacion } from '../../core/api/modelos';
import { valorDe } from '../../core/api/recurso';
import { FechaPipe } from '../../shared/formato/fecha.pipe';
import { PesosPipe } from '../../shared/formato/pesos.pipe';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { Placa } from '../../shared/ui/placa/placa';

@Component({
  selector: 'app-mis-reparaciones',
  imports: [Esqueleto, EstadoError, EstadoVacio, Placa, FechaPipe, PesosPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina' },
  templateUrl: './mis-reparaciones.html',
})
export default class MisReparaciones {
  protected readonly reparaciones = httpResource<Reparacion[]>(() => `${API_CLIENTE}/reparaciones`);
  protected readonly mensajeError = computed(() => mensajeDeError(this.reparaciones.error()));
  protected readonly lista = computed(() => valorDe(this.reparaciones) ?? []);
  protected readonly totalGastado = computed(() =>
    this.lista().reduce((total, r) => total + Number(r.costoTotal), 0),
  );

  protected nombresTecnicos(reparacion: Reparacion): string {
    return reparacion.tecnicos.map((t) => t.nombre).join(', ');
  }
}
