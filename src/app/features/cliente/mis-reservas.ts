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
import { API_CLIENTE, textoVencimiento } from '../../core/api/cliente-api';
import { mensajeDeError } from '../../core/api/errores';
import { Reserva } from '../../core/api/modelos';
import { valorDe } from '../../core/api/recurso';
import { FechaPipe } from '../../shared/formato/fecha.pipe';
import { PesosPipe } from '../../shared/formato/pesos.pipe';
import { ConfirmacionService } from '../../shared/ui/confirmacion/confirmacion.service';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { Placa } from '../../shared/ui/placa/placa';
import { Columna, Tabla } from '../../shared/ui/tabla/tabla';
import { ToastService } from '../../shared/ui/toast/toast.service';

type FilaReserva = Reserva & { moto: string };

@Component({
  selector: 'app-mis-reservas',
  imports: [RouterLink, Esqueleto, EstadoError, EstadoVacio, Placa, Tabla, FechaPipe, PesosPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina' },
  template: `
    <header class="cuenta__cabecera">
      <h1>Mis reservas</h1>
      <a class="btn btn--secundario" routerLink="/">Ver motos disponibles</a>
    </header>

    @if (reservas.isLoading()) {
      <app-esqueleto etiqueta="Cargando tus reservas" forma="filas" [cantidad]="3" />
    } @else if (reservas.error()) {
      <app-estado-error
        titulo="No se pudieron cargar tus reservas."
        [mensaje]="mensajeError()"
        (reintentar)="reservas.reload()"
      />
    } @else if (lista().length === 0) {
      <app-estado-vacio
        titulo="Aún no tienes reservas."
        mensaje="Cuando apartes una moto aparecerá aquí con su fecha de vencimiento."
        icono="moto"
      >
        <a class="btn btn--primario" routerLink="/">Ver motos disponibles</a>
      </app-estado-vacio>
    } @else {
      @if (activas().length > 0) {
        <section class="cuenta__seccion" aria-labelledby="titulo-activas">
          <h2 id="titulo-activas">Activas</h2>
          <ul class="tarjetas-cuenta">
            @for (reserva of activas(); track reserva.idReserva) {
              <li class="tarjeta-cuenta tarjeta-cuenta--destacada">
                <div class="tarjeta-cuenta__cabecera">
                  <app-placa [placa]="reserva.placa" />
                  <p class="tarjeta-cuenta__titulo">{{ reserva.marca }} {{ reserva.modelo }}</p>
                </div>
                <p class="tarjeta-cuenta__aviso">
                  Hasta el <strong class="dato">{{ reserva.fechaVencimiento | fecha }}</strong> ({{
                    vencimiento(reserva)
                  }})
                </p>
                <p class="muted">
                  Acércate a {{ reserva.sucursal }} con tu documento para comprarla por
                  <span class="dato">{{ reserva.precio | pesos }}</span
                  >.
                </p>
                <button type="button" class="btn btn--peligro" (click)="cancelar(reserva)">
                  Cancelar reserva
                </button>
              </li>
            }
          </ul>
        </section>
      }
      @if (historial().length > 0) {
        <section class="cuenta__seccion" aria-labelledby="titulo-historial">
          <h2 id="titulo-historial" tabindex="-1">Historial</h2>
          <app-tabla
            titulo="Reservas anteriores"
            [tituloOculto]="true"
            [columnas]="columnas"
            [filas]="historial()"
            [claveFila]="clave"
          />
        </section>
      }
    }
  `,
})
export default class MisReservas {
  private readonly http = inject(HttpClient);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly toast = inject(ToastService);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly reservas = httpResource<Reserva[]>(() => `${API_CLIENTE}/reservas`);
  protected readonly lista = computed(() => valorDe(this.reservas) ?? []);
  protected readonly mensajeError = computed(() => mensajeDeError(this.reservas.error()));
  protected readonly activas = computed(() =>
    this.lista()
      .filter((reserva) => reserva.estado === 'ACTIVA')
      .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento)),
  );
  protected readonly historial = computed<FilaReserva[]>(() =>
    this.lista()
      .filter((reserva) => reserva.estado !== 'ACTIVA')
      .map((reserva) => ({ ...reserva, moto: `${reserva.marca} ${reserva.modelo}` })),
  );
  protected readonly columnas: Columna<FilaReserva>[] = [
    { clave: 'placa', titulo: 'Placa', tipo: 'placa' },
    { clave: 'moto', titulo: 'Moto', ordenable: true },
    { clave: 'sucursal', titulo: 'Sede' },
    { clave: 'fechaReserva', titulo: 'Reservada', tipo: 'fecha-hora', ordenable: true },
    { clave: 'fechaVencimiento', titulo: 'Vencía', tipo: 'fecha' },
    { clave: 'estado', titulo: 'Estado', tipo: 'estado', ordenable: true },
  ];
  protected readonly clave = (reserva: Reserva) => reserva.idReserva;
  protected readonly vencimiento = (reserva: Reserva) => textoVencimiento(reserva.fechaVencimiento);

  protected async cancelar(reserva: Reserva): Promise<void> {
    const confirmado = await this.confirmacion.confirmar({
      titulo: `¿Cancelar la reserva de la ${reserva.marca} ${reserva.modelo}?`,
      mensaje: `La moto ${reserva.placa} vuelve a quedar disponible para otros clientes. Esta acción no se puede deshacer.`,
      accion: 'Cancelar reserva',
      volver: 'Mantener reserva',
      peligro: true,
    });
    if (!confirmado) {
      return;
    }
    this.http
      .patch<Reserva>(`${API_CLIENTE}/reservas/${reserva.idReserva}/cancelar`, null)
      .subscribe({
        next: (cancelada) => {
          this.reservas.update((lista) =>
            (lista ?? []).map((r) => (r.idReserva === cancelada.idReserva ? cancelada : r)),
          );
          this.toast.exito(`Reserva de la moto ${reserva.placa} cancelada.`);
          afterNextRender(
            () =>
              this.elemento.nativeElement.querySelector<HTMLElement>('#titulo-historial')?.focus(),
            { injector: this.injector },
          );
        },
        error: (error: unknown) => this.toast.error(mensajeDeError(error)),
      });
  }
}
