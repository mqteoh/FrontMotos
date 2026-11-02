import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_CLIENTE, METODOS_PAGO, TIPOS_FACTURA } from '../../core/api/cliente-api';
import { mensajeDeError } from '../../core/api/errores';
import { ComprasCliente } from '../../core/api/modelos';
import { valorDe } from '../../core/api/recurso';
import { FechaPipe } from '../../shared/formato/fecha.pipe';
import { PesosPipe } from '../../shared/formato/pesos.pipe';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { Placa } from '../../shared/ui/placa/placa';

@Component({
  selector: 'app-mis-compras',
  imports: [RouterLink, Esqueleto, EstadoError, EstadoVacio, Placa, FechaPipe, PesosPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina' },
  template: `
    <header class="cuenta__cabecera">
      <h1>Mis compras</h1>
      @if (datos(); as datos) {
        @if (datos.motos.length + datos.accesorios.length > 0) {
          <p class="total">
            Total comprado <span class="dato">{{ datos.totalGastado | pesos }}</span>
          </p>
        }
      }
    </header>

    @if (compras.isLoading()) {
      <app-esqueleto etiqueta="Cargando tus compras" forma="filas" [cantidad]="3" />
    } @else if (compras.error()) {
      <app-estado-error
        titulo="No se pudieron cargar tus compras."
        [mensaje]="mensajeError()"
        (reintentar)="compras.reload()"
      />
    } @else if (datos(); as datos) {
      @if (datos.motos.length + datos.accesorios.length === 0) {
        <app-estado-vacio
          titulo="Aún no tienes compras registradas."
          mensaje="Las motos y los accesorios que compres en una sede aparecerán aquí con su factura."
          icono="venta"
        >
          <a class="btn btn--primario" routerLink="/">Ver motos disponibles</a>
        </app-estado-vacio>
      }
      @if (datos.motos.length > 0) {
        <section class="cuenta__seccion" aria-labelledby="titulo-compras-motos">
          <h2 id="titulo-compras-motos">Motos</h2>
          <ul class="tarjetas-cuenta">
            @for (venta of datos.motos; track venta.idVentaMoto) {
              <li class="tarjeta-cuenta">
                <div class="tarjeta-cuenta__cabecera">
                  <app-placa [placa]="venta.placa" />
                  <p class="tarjeta-cuenta__titulo">{{ venta.marca }} {{ venta.modelo }}</p>
                  <p class="dato tarjeta-cuenta__valor">{{ venta.valorTotal | pesos }}</p>
                </div>
                <dl class="resumen">
                  <div>
                    <dt>Fecha</dt>
                    <dd class="dato">{{ venta.fechaVenta | fecha }}</dd>
                  </div>
                  <div>
                    <dt>Sede</dt>
                    <dd>{{ venta.sucursal }}</dd>
                  </div>
                  <div>
                    <dt>Vendedor</dt>
                    <dd>{{ venta.vendedor }}</dd>
                  </div>
                  <div>
                    <dt>Pago</dt>
                    <dd>{{ metodos[venta.metodoPago] }} · {{ facturas[venta.tipoFactura] }}</dd>
                  </div>
                </dl>
                @if (venta.idReserva !== null) {
                  <p class="muted pequeno">Comprada con la reserva N.º {{ venta.idReserva }}.</p>
                }
              </li>
            }
          </ul>
        </section>
      }
      @if (datos.accesorios.length > 0) {
        <section class="cuenta__seccion" aria-labelledby="titulo-compras-accesorios">
          <h2 id="titulo-compras-accesorios">Accesorios</h2>
          <ul class="tarjetas-cuenta">
            @for (venta of datos.accesorios; track venta.idVentaAccesorio) {
              <li class="tarjeta-cuenta">
                <div class="tarjeta-cuenta__cabecera">
                  <p class="tarjeta-cuenta__titulo">
                    Compra del <span class="dato">{{ venta.fechaVenta | fecha }}</span>
                  </p>
                  <p class="dato tarjeta-cuenta__valor">{{ venta.valorTotal | pesos }}</p>
                </div>
                <ul class="items">
                  @for (item of venta.items; track item.idAccesorio) {
                    <li>
                      <span>{{ item.nombre }} × {{ item.cantidad }}</span>
                      <span class="dato">{{ item.subtotal | pesos }}</span>
                    </li>
                  }
                </ul>
                <p class="muted pequeno">
                  {{ venta.vendedor }} · {{ metodos[venta.metodoPago] }} ·
                  {{ facturas[venta.tipoFactura] }}
                </p>
              </li>
            }
          </ul>
        </section>
      }
    }
  `,
})
export default class MisCompras {
  protected readonly compras = httpResource<ComprasCliente>(() => `${API_CLIENTE}/compras`);
  protected readonly datos = computed(() => valorDe(this.compras));
  protected readonly mensajeError = computed(() => mensajeDeError(this.compras.error()));
  protected readonly metodos = METODOS_PAGO;
  protected readonly facturas = TIPOS_FACTURA;
}
