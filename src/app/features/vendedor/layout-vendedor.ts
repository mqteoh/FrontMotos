import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-layout-vendedor',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta' },
  template: `
    @if (esDueno()) {
      <nav class="cuenta__nav" aria-label="Ventas">
        <ul>
          @for (seccion of secciones; track seccion.ruta) {
            <li>
              <a
                [routerLink]="seccion.ruta"
                routerLinkActive="activo"
                ariaCurrentWhenActive="page"
                [routerLinkActiveOptions]="{ exact: seccion.exacta }"
              >
                {{ seccion.etiqueta }}
              </a>
            </li>
          }
        </ul>
      </nav>
    }
    <router-outlet />
  `,
})
export class LayoutVendedor {
  private readonly auth = inject(AuthService);
  protected readonly esDueno = computed(() => this.auth.usuario()?.rol === 'DUENO');
  protected readonly secciones = [
    { etiqueta: 'Reservas', ruta: '/vendedor', exacta: true },
    { etiqueta: 'Clientes', ruta: '/vendedor/clientes', exacta: false },
    { etiqueta: 'Ventas', ruta: '/vendedor/ventas', exacta: false },
  ];
}
