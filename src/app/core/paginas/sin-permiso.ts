import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { INICIO_ROL, NOMBRE_ROL } from '../auth/roles';

@Component({
  selector: 'app-sin-permiso',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pagina" aria-labelledby="titulo-sin-permiso">
      <h1 id="titulo-sin-permiso">No tienes acceso a esta sección</h1>
      @if (usuario(); as usuario) {
        <p>Tu cuenta de {{ rol() }} no puede abrir esta página.</p>
        <div class="acciones">
          <a class="btn btn--primario" [routerLink]="inicio()">
            {{ usuario.rol === 'CLIENTE' ? 'Ir a mi cuenta' : 'Ir a mi panel' }}
          </a>
          <button type="button" class="btn btn--secundario" (click)="cambiarCuenta()">
            Entrar con otra cuenta
          </button>
        </div>
      } @else {
        <p>Inicia sesión con una cuenta que tenga permiso para ver esta página.</p>
        <a class="btn btn--primario" routerLink="/ingresar">Iniciar sesión</a>
      }
    </section>
  `,
})
export class SinPermiso {
  private readonly auth = inject(AuthService);
  protected readonly usuario = this.auth.usuario;
  protected readonly rol = computed(() => {
    const usuario = this.usuario();
    return usuario ? NOMBRE_ROL[usuario.rol].toLowerCase() : '';
  });
  protected readonly inicio = computed(() => {
    const usuario = this.usuario();
    return usuario ? INICIO_ROL[usuario.rol] : '/';
  });

  protected cambiarCuenta(): void {
    this.auth.cerrarSesion('/ingresar');
  }
}
