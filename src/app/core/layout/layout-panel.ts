import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Icono } from '../../shared/ui/icono/icono';
import { SelectorTema } from '../../shared/ui/selector-tema/selector-tema';
import { NOMBRE_APP } from '../app-info';
import { AuthService } from '../auth/auth.service';
import { INICIO_ROL, MENU_PANEL, NOMBRE_ROL } from '../auth/roles';
import { Saltar } from './saltar';

@Component({
  selector: 'app-layout-panel',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icono, SelectorTema, Saltar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'panel' },
  template: `
    <app-saltar />
    <aside class="panel__lateral">
      <a class="marca" [routerLink]="inicio()"><app-icono nombre="moto" />{{ nombre }}</a>
      <nav aria-label="Módulos del panel">
        <ul class="panel__menu">
          @for (item of menu(); track item.ruta) {
            <li>
              <a [routerLink]="item.ruta" routerLinkActive="activo" ariaCurrentWhenActive="page">
                <app-icono [nombre]="item.icono" />{{ item.etiqueta }}
              </a>
            </li>
          }
        </ul>
      </nav>
      <div class="panel__usuario">
        <p class="panel__nombre">
          <app-icono nombre="usuario" />
          <span>{{ usuario()?.nombre }}<span class="panel__rol">{{ rol() }}</span></span>
        </p>
        <div class="acciones">
          <app-selector-tema />
          <button type="button" class="btn btn--secundario" (click)="auth.cerrarSesion()">
            <app-icono nombre="salir" />Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
    <header class="panel__superior">
      <a class="marca" [routerLink]="inicio()"><app-icono nombre="moto" />{{ nombre }}</a>
      <div class="panel__acciones-superior">
        <app-selector-tema />
        <button
          type="button"
          class="btn btn--icono"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          (click)="auth.cerrarSesion()"
        >
          <app-icono nombre="salir" />
        </button>
      </div>
    </header>
    <main id="contenido" class="panel__contenido" tabindex="-1">
      <router-outlet />
    </main>
    @if (menu().length > 1) {
      <nav class="barra-inferior" aria-label="Módulos del panel">
        <ul>
          @for (item of menu(); track item.ruta) {
            <li>
              <a [routerLink]="item.ruta" routerLinkActive="activo" ariaCurrentWhenActive="page">
                <app-icono [nombre]="item.icono" />{{ item.etiqueta }}
              </a>
            </li>
          }
        </ul>
      </nav>
    }
  `,
})
export class LayoutPanel {
  protected readonly auth = inject(AuthService);
  protected readonly nombre = NOMBRE_APP;
  protected readonly usuario = this.auth.usuario;
  protected readonly menu = computed(() => {
    const usuario = this.usuario();
    return usuario ? MENU_PANEL[usuario.rol] : [];
  });
  protected readonly rol = computed(() => {
    const usuario = this.usuario();
    return usuario ? NOMBRE_ROL[usuario.rol] : '';
  });
  protected readonly inicio = computed(() => {
    const usuario = this.usuario();
    return usuario ? INICIO_ROL[usuario.rol] : '/';
  });
}
