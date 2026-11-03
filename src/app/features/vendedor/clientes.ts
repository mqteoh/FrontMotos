import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { mensajeDeError } from '../../core/api/errores';
import { ClienteSede } from '../../core/api/modelos';
import { valorDe } from '../../core/api/recurso';
import { nombreCliente, solicitudBusquedaClientes } from '../../core/api/vendedor-api';
import { AuthService } from '../../core/auth/auth.service';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { Icono } from '../../shared/ui/icono/icono';
import { Columna, Tabla } from '../../shared/ui/tabla/tabla';

type FilaCliente = ClienteSede & { nombre: string; telefono: string; cuenta: string };

@Component({
  selector: 'app-clientes',
  imports: [RouterLink, Esqueleto, EstadoError, EstadoVacio, Icono, Tabla],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina cuenta__pagina--ancha' },
  template: `
    <header class="cuenta__cabecera">
      <h1>Clientes</h1>
      <a class="btn btn--secundario" routerLink="/vendedor/clientes/nuevo">
        <app-icono nombre="agregar" />Registrar cliente
      </a>
    </header>

    <form class="busqueda" role="search" aria-label="Buscar clientes" (submit)="buscar($event)">
      <div class="campo">
        <label class="campo__etiqueta" for="buscar-cliente">Documento o nombre</label>
        <p class="campo__ayuda" id="buscar-cliente-ayuda">
          Con solo números se busca el documento exacto; con letras, por nombre o apellido.
        </p>
        <div class="busqueda__fila">
          <input
            id="buscar-cliente"
            name="consulta"
            class="control"
            type="search"
            autocomplete="off"
            aria-describedby="buscar-cliente-ayuda"
            [value]="consulta()"
          />
          <button type="submit" class="btn btn--primario">
            <app-icono nombre="buscar" />Buscar
          </button>
        </div>
      </div>
    </form>

    <p class="sr-only" role="status">{{ anuncio() }}</p>
    @if (!solicitud()) {
      @if (consulta()) {
        <p class="alerta" role="alert">
          <app-icono nombre="error" />Escribe al menos 2 caracteres para buscar.
        </p>
      } @else {
        <p class="muted">Busca al cliente antes de registrarlo para no duplicarlo.</p>
      }
    } @else if (clientes.isLoading()) {
      <app-esqueleto etiqueta="Buscando clientes" forma="filas" [cantidad]="3" />
    } @else if (sinDocumento()) {
      <app-estado-vacio
        titulo="No hay un cliente con ese documento."
        [mensaje]="'Puedes registrarlo ahora con el documento ' + consulta() + '.'"
        icono="usuario"
      >
        <a
          class="btn btn--primario"
          routerLink="/vendedor/clientes/nuevo"
          [queryParams]="{ documento: consulta() }"
        >
          Registrar cliente
        </a>
      </app-estado-vacio>
    } @else if (clientes.error()) {
      <app-estado-error
        titulo="No se pudo hacer la búsqueda."
        [mensaje]="mensajeError()"
        (reintentar)="clientes.reload()"
      />
    } @else if (filas().length === 0) {
      <app-estado-vacio
        titulo="Ningún cliente coincide con la búsqueda."
        mensaje="Revisa la ortografía o busca por documento."
        icono="usuario"
      >
        <a class="btn btn--primario" routerLink="/vendedor/clientes/nuevo">Registrar cliente</a>
      </app-estado-vacio>
    } @else {
      <app-tabla
        titulo="Resultados de la búsqueda"
        [tituloOculto]="true"
        [columnas]="columnas"
        [filas]="filas()"
        [claveFila]="clave"
      >
        <ng-template #acciones let-cliente>
          <a class="btn btn--secundario" [routerLink]="['/vendedor/clientes', cliente.idCliente]">
            Editar<span class="sr-only"> a {{ cliente.nombre }}</span>
          </a>
          @if (esVendedor()) {
            <a
              class="btn btn--secundario"
              routerLink="/vendedor/ventas/moto"
              [queryParams]="{ cliente: cliente.idCliente }"
            >
              Vender moto<span class="sr-only"> a {{ cliente.nombre }}</span>
            </a>
          }
        </ng-template>
      </app-tabla>
    }
  `,
})
export default class Clientes {
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  protected readonly esVendedor = computed(() => this.auth.usuario()?.rol === 'VENDEDOR');
  protected readonly consulta = toSignal(
    this.ruta.queryParamMap.pipe(map((params) => (params.get('q') ?? '').trim())),
    { initialValue: '' },
  );
  protected readonly solicitud = computed(() => solicitudBusquedaClientes(this.consulta()));
  protected readonly clientes = httpResource<ClienteSede[]>(() => this.solicitud());
  protected readonly sinDocumento = computed(() => {
    const error = this.clientes.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });
  protected readonly mensajeError = computed(() => mensajeDeError(this.clientes.error()));
  protected readonly anuncio = computed(() => {
    if (!this.solicitud() || this.clientes.isLoading()) {
      return '';
    }
    if (this.sinDocumento()) {
      return 'No hay un cliente con ese documento.';
    }
    if (this.clientes.error()) {
      return '';
    }
    const cantidad = this.filas().length;
    if (cantidad === 0) {
      return 'Ningún cliente coincide con la búsqueda.';
    }
    return cantidad === 1 ? '1 cliente encontrado.' : `${cantidad} clientes encontrados.`;
  });
  protected readonly filas = computed<FilaCliente[]>(() =>
    (valorDe(this.clientes) ?? []).map((cliente) => ({
      ...cliente,
      nombre: nombreCliente(cliente),
      telefono: cliente.telefonos[0] ?? '',
      cuenta: cliente.tieneCuentaWeb ? 'Sí' : 'No',
    })),
  );
  protected readonly columnas: Columna<FilaCliente>[] = [
    { clave: 'documento', titulo: 'Documento', tipo: 'codigo' },
    { clave: 'nombre', titulo: 'Nombre', ordenable: true },
    { clave: 'ciudad', titulo: 'Ciudad', ordenable: true },
    { clave: 'telefono', titulo: 'Teléfono', tipo: 'codigo' },
    { clave: 'cuenta', titulo: 'Cuenta web' },
  ];
  protected readonly clave = (cliente: ClienteSede) => cliente.idCliente;

  protected buscar(evento: Event): void {
    evento.preventDefault();
    const formulario = evento.target as HTMLFormElement;
    const valor = (formulario.elements.namedItem('consulta') as HTMLInputElement).value.trim();
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: valor ? { q: valor } : {},
    });
  }
}
