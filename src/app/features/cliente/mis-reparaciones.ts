import { HttpClient, httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_CLIENTE } from '../../core/api/cliente-api';
import { mensajeDeError } from '../../core/api/errores';
import { Reparacion } from '../../core/api/modelos';
import { valorDe } from '../../core/api/recurso';
import { FechaPipe } from '../../shared/formato/fecha.pipe';
import { NumeroPipe } from '../../shared/formato/numero.pipe';
import { PesosPipe } from '../../shared/formato/pesos.pipe';
import { ChipEstado } from '../../shared/ui/chip-estado/chip-estado';
import { ConfirmacionService } from '../../shared/ui/confirmacion/confirmacion.service';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { Placa } from '../../shared/ui/placa/placa';
import { ToastService } from '../../shared/ui/toast/toast.service';

const PENDIENTES = ['AGENDADA', 'EN_PROCESO'];

@Component({
  selector: 'app-mis-reparaciones',
  imports: [
    RouterLink,
    ChipEstado,
    Esqueleto,
    EstadoError,
    EstadoVacio,
    Placa,
    FechaPipe,
    NumeroPipe,
    PesosPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina' },
  templateUrl: './mis-reparaciones.html',
})
export default class MisReparaciones {
  private readonly http = inject(HttpClient);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly toast = inject(ToastService);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly reparaciones = httpResource<Reparacion[]>(() => `${API_CLIENTE}/reparaciones`);
  protected readonly mensajeError = computed(() => mensajeDeError(this.reparaciones.error()));
  protected readonly lista = computed(() => {
    const todas = valorDe(this.reparaciones) ?? [];
    return [
      ...todas.filter((r) => PENDIENTES.includes(r.estado)),
      ...todas.filter((r) => !PENDIENTES.includes(r.estado)),
    ];
  });

  protected async cancelar(reparacion: Reparacion): Promise<void> {
    const confirmado = await this.confirmacion.confirmar({
      titulo: `¿Cancelar la cita de la moto ${reparacion.placa}?`,
      mensaje: `El taller de ${reparacion.sucursal} deja de esperar tu moto. Si la necesitas revisar después, tendrás que agendar otra cita.`,
      accion: 'Cancelar cita',
      volver: 'Mantener cita',
      peligro: true,
    });
    if (!confirmado) {
      return;
    }
    this.http
      .patch<Reparacion>(`${API_CLIENTE}/reparaciones/${reparacion.idReparacion}/cancelar`, null)
      .subscribe({
        next: (cancelada) => {
          this.reparaciones.update((lista) =>
            (lista ?? []).map((r) => (r.idReparacion === cancelada.idReparacion ? cancelada : r)),
          );
          this.toast.exito(`Cita del taller para la moto ${reparacion.placa} cancelada.`);
          afterNextRender(
            () =>
              this.elemento.nativeElement
                .querySelector<HTMLElement>(`#reparacion-${cancelada.idReparacion}`)
                ?.focus(),
            { injector: this.injector },
          );
        },
        error: (error: unknown) => this.toast.error(mensajeDeError(error)),
      });
  }
}
