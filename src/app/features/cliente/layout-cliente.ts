import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout-cliente',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta' },
  template: `
    <nav class="cuenta__nav" aria-label="Mi cuenta">
      <ul>
        @for (seccion of secciones; track seccion.ruta) {
          <li>
            <a [routerLink]="seccion.ruta" routerLinkActive="activo" ariaCurrentWhenActive="page">
              {{ seccion.etiqueta }}
            </a>
          </li>
        }
      </ul>
    </nav>
    <router-outlet />
  `,
})
export class LayoutCliente {
  protected readonly secciones = [
    { etiqueta: 'Reservas', ruta: '/cliente/reservas' },
    { etiqueta: 'Reparaciones', ruta: '/cliente/reparaciones' },
    { etiqueta: 'Compras', ruta: '/cliente/compras' },
    { etiqueta: 'Perfil', ruta: '/cliente/perfil' },
  ];
}
