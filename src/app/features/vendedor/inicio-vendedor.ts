import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { diasHasta, textoVencimiento } from '../../core/api/cliente-api';
import { mensajeDeError } from '../../core/api/errores';
import { Reserva, Sucursal } from '../../core/api/modelos';
import { API_PUBLICO } from '../../core/api/publico-api';
import { valorDe } from '../../core/api/recurso';
import { API_VENDEDOR } from '../../core/api/vendedor-api';
import { AuthService } from '../../core/auth/auth.service';
import { FechaPipe } from '../../shared/formato/fecha.pipe';
import { PesosPipe } from '../../shared/formato/pesos.pipe';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { Icono } from '../../shared/ui/icono/icono';
import { Placa } from '../../shared/ui/placa/placa';

@Component({
  selector: 'app-inicio-vendedor',
  imports: [RouterLink, Esqueleto, EstadoError, EstadoVacio, Icono, Placa, FechaPipe, PesosPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina cuenta__pagina--ancha' },
  template: `
    <header class="cuenta__cabecera">
      <div>
        <h1>Reservas por vencer</h1>
        <p class="muted">{{ alcance() }} · Ordenadas por fecha de vencimiento.</p>
      </div>
      @if (esVendedor()) {
        <div class="acciones">
          <a class="btn btn--secundario" routerLink="/vendedor/ventas/moto">Vender moto</a>
          <a class="btn btn--secundario" routerLink="/vendedor/ventas/accesorios">
            Vender accesorios
          </a>
        </div>
      }
    </header>

    @if (reservas.isLoading()) {
      <app-esqueleto etiqueta="Cargando reservas" forma="filas" [cantidad]="4" />
    } @else if (reservas.error()) {
      <app-estado-error
        titulo="No se pudieron cargar las reservas."
        [mensaje]="mensajeError()"
        (reintentar)="reservas.reload()"
      />
    } @else if (lista().length === 0) {
      <app-estado-vacio
        titulo="No hay reservas activas."
        mensaje="Cuando un cliente aparte una moto desde la página aparecerá aquí con su fecha de vencimiento."
        icono="reloj"
      />
    } @else {
      <ul class="tarjetas-cuenta">
        @for (reserva of lista(); track reserva.idReserva) {
          <li class="tarjeta-cuenta reserva-sede" [class.reserva-sede--urgente]="urgente(reserva)">
            <p class="reserva-sede__vence">
              <app-icono nombre="reloj" />
              <span>
                <strong>{{ vencimiento(reserva) }}</strong>
                <span class="dato"> · {{ reserva.fechaVencimiento | fecha }}</span>
              </span>
            </p>
            <div class="tarjeta-cuenta__cabecera">
              <app-placa [placa]="reserva.placa" />
              <p class="tarjeta-cuenta__titulo">{{ reserva.marca }} {{ reserva.modelo }}</p>
              <p class="dato tarjeta-cuenta__valor">{{ reserva.precio | pesos }}</p>
            </div>
            <dl class="resumen">
              <div>
                <dt>Cliente</dt>
                <dd>{{ reserva.cliente }}</dd>
              </div>
              <div>
                <dt>Reservada</dt>
                <dd class="dato">{{ reserva.fechaReserva | fecha: true }}</dd>
              </div>
              @if (!esVendedor()) {
                <div>
                  <dt>Sede</dt>
                  <dd>{{ reserva.sucursal }}</dd>
                </div>
              }
            </dl>
            @if (esVendedor()) {
              <a
                class="btn btn--primario"
                routerLink="/vendedor/ventas/moto"
                [queryParams]="{ placa: reserva.placa }"
              >
                Registrar venta<span class="sr-only"> de la moto {{ reserva.placa }}</span>
              </a>
            }
          </li>
        }
      </ul>
    }
  `,
})
export default class InicioVendedor {
  private readonly auth = inject(AuthService);
  protected readonly esVendedor = computed(() => this.auth.usuario()?.rol === 'VENDEDOR');

  protected readonly reservas = httpResource<Reserva[]>(() => `${API_VENDEDOR}/reservas`);
  private readonly sedes = httpResource<Sucursal[]>(() => `${API_PUBLICO}/sucursales`);
  protected readonly mensajeError = computed(() => mensajeDeError(this.reservas.error()));
  protected readonly lista = computed(() =>
    [...(valorDe(this.reservas) ?? [])].sort((a, b) =>
      a.fechaVencimiento.localeCompare(b.fechaVencimiento),
    ),
  );
  protected readonly alcance = computed(() => {
    if (!this.esVendedor()) {
      return 'Todas las sedes';
    }
    const id = this.auth.usuario()?.idSucursal;
    return (valorDe(this.sedes) ?? []).find((sede) => sede.idSucursal === id)?.nombre ?? 'Tu sede';
  });

  protected vencimiento(reserva: Reserva): string {
    const texto = textoVencimiento(reserva.fechaVencimiento);
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  protected urgente(reserva: Reserva): boolean {
    return diasHasta(reserva.fechaVencimiento) <= 1;
  }
}
