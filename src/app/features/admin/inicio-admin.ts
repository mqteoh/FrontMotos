import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../shared/ui/icono/icono';
import { GRUPOS_ADMIN } from './recursos';

@Component({
  selector: 'app-inicio-admin',
  imports: [RouterLink, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina cuenta__pagina--ancha' },
  template: `
    <header>
      <h1>Administración</h1>
      <p class="muted">
        Datos de todas las sedes. Elige una tabla para consultar, registrar, corregir o eliminar.
      </p>
    </header>
    <div class="indice-admin">
      @for (grupo of grupos; track grupo.titulo; let i = $index) {
        <section class="indice-admin__grupo" [attr.aria-labelledby]="'grupo-admin-' + i">
          <h2 [id]="'grupo-admin-' + i"><app-icono [nombre]="grupo.icono" />{{ grupo.titulo }}</h2>
          <ul>
            @for (recurso of grupo.recursos; track recurso.ruta) {
              <li>
                <a class="indice-admin__enlace" [routerLink]="['/admin', recurso.ruta]">
                  <span class="indice-admin__nombre">{{ recurso.titulo }}</span>
                  <span class="indice-admin__texto">{{ recurso.descripcion }}</span>
                </a>
              </li>
            }
          </ul>
        </section>
      }
    </div>
  `,
})
export default class InicioAdmin {
  protected readonly grupos = GRUPOS_ADMIN;
}
