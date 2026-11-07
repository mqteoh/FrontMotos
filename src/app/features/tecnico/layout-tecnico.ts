import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-layout-tecnico',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta' },
  template: `
    @if (esDueno()) {
      <nav class="cuenta__nav" aria-label="Taller">
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
export class LayoutTecnico {
  private readonly auth = inject(AuthService);
  protected readonly esDueno = computed(() => this.auth.usuario()?.rol === 'DUENO');
  protected readonly secciones = [
    { etiqueta: 'Reparaciones', ruta: '/tecnico', exacta: true },
    { etiqueta: 'Registrar', ruta: '/tecnico/nueva', exacta: false },
    { etiqueta: 'Historial', ruta: '/tecnico/historial', exacta: false },
  ];
}
