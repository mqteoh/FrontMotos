import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { mensajeDeError } from '../../core/api/errores';
import { Accesorio } from '../../core/api/modelos';
import { API_PUBLICO } from '../../core/api/publico-api';
import { valorDe } from '../../core/api/recurso';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { Columna, Tabla } from '../../shared/ui/tabla/tabla';

@Component({
  selector: 'app-accesorios',
  imports: [Esqueleto, EstadoError, EstadoVacio, Tabla],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pagina-lista' },
  template: `
    <header>
      <h1>Accesorios</h1>
      <p class="muted">
        Precios de referencia. Los accesorios se compran en cualquier sede con un vendedor.
      </p>
    </header>
    @if (accesorios.isLoading()) {
      <app-esqueleto etiqueta="Cargando accesorios" forma="filas" [cantidad]="6" />
    } @else if (accesorios.error()) {
      <app-estado-error
        titulo="No se pudieron cargar los accesorios."
        [mensaje]="mensajeError()"
        (reintentar)="accesorios.reload()"
      />
    } @else if (lista().length === 0) {
      <app-estado-vacio
        titulo="Aún no hay accesorios en el catálogo."
        mensaje="Cuando el concesionario agregue accesorios aparecerán aquí con su precio."
      />
    } @else {
      <app-tabla
        titulo="Lista de accesorios"
        [tituloOculto]="true"
        [columnas]="columnas"
        [filas]="lista()"
        [claveFila]="clave"
      />
    }
  `,
})
export default class Accesorios {
  protected readonly accesorios = httpResource<Accesorio[]>(() => `${API_PUBLICO}/accesorios`);
  protected readonly lista = computed(() => valorDe(this.accesorios) ?? []);
  protected readonly mensajeError = computed(() => mensajeDeError(this.accesorios.error()));
  protected readonly columnas: Columna<Accesorio>[] = [
    { clave: 'nombre', titulo: 'Accesorio', ordenable: true },
    { clave: 'marca', titulo: 'Marca', ordenable: true },
    { clave: 'descripcion', titulo: 'Descripción' },
    { clave: 'precio', titulo: 'Precio', tipo: 'pesos', ordenable: true },
  ];
  protected readonly clave = (accesorio: Accesorio) => accesorio.idAccesorio;
}
