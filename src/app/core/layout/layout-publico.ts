import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IsActiveMatchOptions,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { Icono } from '../../shared/ui/icono/icono';
import { SelectorTema } from '../../shared/ui/selector-tema/selector-tema';
import { NOMBRE_APP } from '../app-info';
import { AuthService } from '../auth/auth.service';
import { INICIO_ROL } from '../auth/roles';
import { Saltar } from './saltar';

@Component({
  selector: 'app-layout-publico',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icono, SelectorTema, Saltar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cerrarMenuConEscape()' },
  template: `
    <app-saltar />
    <header class="cabecera">
      <div class="contenedor cabecera__fila">
        <a class="marca" routerLink="/"><app-icono nombre="moto" />{{ nombre }}</a>
        <button
          #alternar
          type="button"
          class="btn btn--icono cabecera__alternar"
          aria-controls="menu-principal"
          [attr.aria-expanded]="menuAbierto()"
          [attr.aria-label]="menuAbierto() ? 'Cerrar menú' : 'Abrir menú'"
          (click)="menuAbierto.set(!menuAbierto())"
        >
          <app-icono [nombre]="menuAbierto() ? 'cerrar' : 'menu'" />
        </button>
        <nav
          id="menu-principal"
          class="cabecera__nav"
          [class.cabecera__nav--abierta]="menuAbierto()"
          aria-label="Principal"
        >
          <ul class="cabecera__enlaces">
            <li>
              <a
                routerLink="/"
                routerLinkActive="activo"
                [routerLinkActiveOptions]="soloRuta"
                ariaCurrentWhenActive="page"
              >
                Motos disponibles
              </a>
            </li>
            <li>
              <a routerLink="/accesorios" routerLinkActive="activo" ariaCurrentWhenActive="page">
                Accesorios
              </a>
            </li>
            <li>
              <a routerLink="/sedes" routerLinkActive="activo" ariaCurrentWhenActive="page">
                Sedes
              </a>
            </li>
            @if (usuario(); as usuario) {
              <li>
                <a [routerLink]="inicio()" routerLinkActive="activo" ariaCurrentWhenActive="page">
                  {{ usuario.rol === 'CLIENTE' ? 'Mi cuenta' : 'Mi panel' }}
                </a>
              </li>
            }
          </ul>
          <div class="cabecera__sesion">
            <app-selector-tema />
            @if (usuario(); as usuario) {
              <span class="cabecera__usuario"><app-icono nombre="usuario" />{{ usuario.nombre }}</span>
              <button type="button" class="btn btn--secundario" (click)="auth.cerrarSesion()">
                <app-icono nombre="salir" />Cerrar sesión
              </button>
            } @else {
              <a class="btn btn--secundario" routerLink="/ingresar">
                <app-icono nombre="entrar" />Iniciar sesión
              </a>
            }
          </div>
        </nav>
      </div>
    </header>
    <main id="contenido" class="contenedor contenido" tabindex="-1">
      <router-outlet />
    </main>
  `,
})
export class LayoutPublico {
  protected readonly auth = inject(AuthService);
  protected readonly nombre = NOMBRE_APP;
  protected readonly usuario = this.auth.usuario;
  protected readonly inicio = computed(() => {
    const usuario = this.usuario();
    return usuario ? INICIO_ROL[usuario.rol] : '/';
  });
  protected readonly menuAbierto = signal(false);
  protected readonly soloRuta: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored',
  };
  private readonly alternar = viewChild.required<ElementRef<HTMLButtonElement>>('alternar');

  constructor() {
    inject(Router)
      .events.pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuAbierto.set(false));
  }

  protected cerrarMenuConEscape(): void {
    if (this.menuAbierto()) {
      this.menuAbierto.set(false);
      this.alternar().nativeElement.focus();
    }
  }
}
