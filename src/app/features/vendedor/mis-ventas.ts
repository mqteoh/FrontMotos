import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api/errores';
import { VentaAccesorio, VentaMoto } from '../../core/api/modelos';
import { valorDe } from '../../core/api/recurso';
import { API_VENDEDOR, textoPago } from '../../core/api/vendedor-api';
import { AuthService } from '../../core/auth/auth.service';
import { PesosPipe } from '../../shared/formato/pesos.pipe';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { Columna, Tabla } from '../../shared/ui/tabla/tabla';

type FilaMoto = VentaMoto & { moto: string; pago: string };
type FilaAccesorio = VentaAccesorio & { detalle: string; pago: string };

@Component({
  selector: 'app-mis-ventas',
  imports: [RouterLink, Esqueleto, EstadoError, EstadoVacio, Tabla, PesosPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina cuenta__pagina--ancha' },
  template: `
    <header class="cuenta__cabecera">
      <h1>{{ esVendedor() ? 'Mis ventas' : 'Ventas de todas las sedes' }}</h1>
      @if (esVendedor()) {
        <div class="acciones">
          <a class="btn btn--primario" routerLink="/vendedor/ventas/moto">Vender moto</a>
          <a class="btn btn--secundario" routerLink="/vendedor/ventas/accesorios">
            Vender accesorios
          </a>
        </div>
      }
    </header>

    <section class="cuenta__seccion" aria-labelledby="titulo-ventas-motos">
      <div class="cuenta__cabecera">
        <h2 id="titulo-ventas-motos">Motos</h2>
        @if (filasMotos().length > 0) {
          <p class="total">
            {{ filasMotos().length }} {{ filasMotos().length === 1 ? 'venta' : 'ventas' }}
            <span class="dato">{{ totalMotos() | pesos }}</span>
          </p>
        }
      </div>
      @if (motos.isLoading()) {
        <app-esqueleto etiqueta="Cargando ventas de motos" forma="filas" [cantidad]="3" />
      } @else if (motos.error()) {
        <app-estado-error
          titulo="No se pudieron cargar las ventas de motos."
          [mensaje]="errorMotos()"
          (reintentar)="motos.reload()"
        />
      } @else if (filasMotos().length === 0) {
        <app-estado-vacio
          titulo="Aún no hay ventas de motos."
          mensaje="Cada moto que vendas aparecerá aquí con su cliente y su factura."
          icono="moto"
        />
      } @else {
        <app-tabla
          titulo="Ventas de motos"
          [tituloOculto]="true"
          [columnas]="columnasMotos()"
          [filas]="filasMotos()"
          [claveFila]="claveMoto"
        />
      }
    </section>

    <section class="cuenta__seccion" aria-labelledby="titulo-ventas-accesorios">
      <div class="cuenta__cabecera">
        <h2 id="titulo-ventas-accesorios">Accesorios</h2>
        @if (filasAccesorios().length > 0) {
          <p class="total">
            {{ filasAccesorios().length }}
            {{ filasAccesorios().length === 1 ? 'venta' : 'ventas' }}
            <span class="dato">{{ totalAccesorios() | pesos }}</span>
          </p>
        }
      </div>
      @if (accesorios.isLoading()) {
        <app-esqueleto etiqueta="Cargando ventas de accesorios" forma="filas" [cantidad]="3" />
      } @else if (accesorios.error()) {
        <app-estado-error
          titulo="No se pudieron cargar las ventas de accesorios."
          [mensaje]="errorAccesorios()"
          (reintentar)="accesorios.reload()"
        />
      } @else if (filasAccesorios().length === 0) {
        <app-estado-vacio
          titulo="Aún no hay ventas de accesorios."
          mensaje="Las ventas de cascos, guantes y demás accesorios aparecerán aquí."
          icono="venta"
        />
      } @else {
        <app-tabla
          titulo="Ventas de accesorios"
          [tituloOculto]="true"
          [columnas]="columnasAccesorios()"
          [filas]="filasAccesorios()"
          [claveFila]="claveAccesorio"
        />
      }
    </section>
  `,
})
export default class MisVentas {
  private readonly auth = inject(AuthService);
  protected readonly esVendedor = computed(() => this.auth.usuario()?.rol === 'VENDEDOR');

  protected readonly motos = httpResource<VentaMoto[]>(() => `${API_VENDEDOR}/ventas-moto`);
  protected readonly accesorios = httpResource<VentaAccesorio[]>(
    () => `${API_VENDEDOR}/ventas-accesorio`,
  );
  protected readonly errorMotos = computed(() => mensajeDeError(this.motos.error()));
  protected readonly errorAccesorios = computed(() => mensajeDeError(this.accesorios.error()));

  protected readonly filasMotos = computed<FilaMoto[]>(() =>
    (valorDe(this.motos) ?? []).map((venta) => ({
      ...venta,
      moto: `${venta.marca} ${venta.modelo}`,
      pago: textoPago(venta),
    })),
  );
  protected readonly filasAccesorios = computed<FilaAccesorio[]>(() =>
    (valorDe(this.accesorios) ?? []).map((venta) => ({
      ...venta,
      detalle: venta.items.map((item) => `${item.nombre} × ${item.cantidad}`).join(', '),
      pago: textoPago(venta),
    })),
  );
  protected readonly totalMotos = computed(() =>
    this.filasMotos().reduce((total, venta) => total + Number(venta.valorTotal), 0),
  );
  protected readonly totalAccesorios = computed(() =>
    this.filasAccesorios().reduce((total, venta) => total + Number(venta.valorTotal), 0),
  );

  protected readonly columnasMotos = computed<Columna<FilaMoto>[]>(() => [
    { clave: 'fechaVenta', titulo: 'Fecha', tipo: 'fecha-hora', ordenable: true },
    { clave: 'placa', titulo: 'Placa', tipo: 'placa' },
    { clave: 'moto', titulo: 'Moto' },
    { clave: 'cliente', titulo: 'Cliente', ordenable: true },
    ...(this.esVendedor()
      ? []
      : [
          { clave: 'vendedor', titulo: 'Vendedor', ordenable: true } as Columna<FilaMoto>,
          { clave: 'sucursal', titulo: 'Sede', ordenable: true } as Columna<FilaMoto>,
        ]),
    { clave: 'pago', titulo: 'Pago' },
    { clave: 'valorTotal', titulo: 'Valor', tipo: 'pesos', ordenable: true },
  ]);
  protected readonly columnasAccesorios = computed<Columna<FilaAccesorio>[]>(() => [
    { clave: 'fechaVenta', titulo: 'Fecha', tipo: 'fecha-hora', ordenable: true },
    { clave: 'cliente', titulo: 'Cliente', ordenable: true },
    ...(this.esVendedor()
      ? []
      : [{ clave: 'vendedor', titulo: 'Vendedor', ordenable: true } as Columna<FilaAccesorio>]),
    { clave: 'detalle', titulo: 'Accesorios' },
    { clave: 'pago', titulo: 'Pago' },
    { clave: 'valorTotal', titulo: 'Valor', tipo: 'pesos', ordenable: true },
  ]);
  protected readonly claveMoto = (venta: VentaMoto) => venta.idVentaMoto;
  protected readonly claveAccesorio = (venta: VentaAccesorio) => venta.idVentaAccesorio;
}
