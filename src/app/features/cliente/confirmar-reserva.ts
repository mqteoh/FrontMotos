import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_CLIENTE, DIAS_RESERVA, fechaIso, sumarDias } from '../../core/api/cliente-api';
import { mensajeDeError } from '../../core/api/errores';
import { MotoDetalle, Reserva } from '../../core/api/modelos';
import { API_PUBLICO, direccionSede } from '../../core/api/publico-api';
import { valorDe } from '../../core/api/recurso';
import { FechaPipe } from '../../shared/formato/fecha.pipe';
import { PesosPipe } from '../../shared/formato/pesos.pipe';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { Icono } from '../../shared/ui/icono/icono';
import { Placa } from '../../shared/ui/placa/placa';

@Component({
  selector: 'app-confirmar-reserva',
  imports: [RouterLink, Esqueleto, EstadoError, EstadoVacio, Icono, Placa, FechaPipe, PesosPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina' },
  templateUrl: './confirmar-reserva.html',
})
export default class ConfirmarReserva {
  readonly placa = input.required<string>();

  private readonly http = inject(HttpClient);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly moto = httpResource<MotoDetalle>(
    () => `${API_PUBLICO}/motos/${encodeURIComponent(this.placa())}`,
  );
  protected readonly detalle = computed(() => valorDe(this.moto));
  protected readonly noDisponible = computed(() => {
    const error = this.moto.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });
  protected readonly mensajeCarga = computed(() => mensajeDeError(this.moto.error()));
  protected readonly direccion = computed(() => {
    const moto = this.detalle();
    return moto ? direccionSede(moto.sucursal) : '';
  });
  protected readonly venceEstimado = fechaIso(sumarDias(new Date(), DIAS_RESERVA));
  protected readonly dias = DIAS_RESERVA;

  protected readonly enviando = signal(false);
  protected readonly errorReserva = signal<string | null>(null);
  protected readonly reserva = signal<Reserva | null>(null);

  protected confirmar(): void {
    this.enviando.set(true);
    this.errorReserva.set(null);
    this.http.post<Reserva>(`${API_CLIENTE}/reservas`, { placa: this.placa() }).subscribe({
      next: (reserva) => {
        this.reserva.set(reserva);
        this.enfocar('#titulo-reserva-lista');
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.errorReserva.set(mensajeDeError(error));
        this.enfocar('#error-reserva');
      },
    });
  }

  private enfocar(selector: string): void {
    afterNextRender(
      () => this.elemento.nativeElement.querySelector<HTMLElement>(selector)?.focus(),
      { injector: this.injector },
    );
  }
}
