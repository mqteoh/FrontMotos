import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { aplicarErroresDeCampos, mensajeDeError } from '../../core/api/errores';
import { Usuario } from '../../core/api/modelos';
import { AuthService } from '../../core/auth/auth.service';
import { INICIO_ROL } from '../../core/auth/roles';
import { enfocarPrimerInvalido, mensajeError } from '../../shared/formularios/mensajes';
import { Campo, Control } from '../../shared/ui/campo/campo';
import { Icono } from '../../shared/ui/icono/icono';

export function rutaSegura(ruta: string | null): string | null {
  return ruta?.startsWith('/') && !ruta.startsWith('//') ? ruta : null;
}

@Component({
  selector: 'app-ingresar',
  imports: [ReactiveFormsModule, RouterLink, Campo, Control, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'acceso' },
  template: `
    <h1>Iniciar sesión</h1>
    <p class="muted">Clientes y empleados entran con el correo y la contraseña de su cuenta.</p>
    @if (errorGeneral()) {
      <p class="alerta" role="alert"><app-icono nombre="error" />{{ errorGeneral() }}</p>
    }
    <form class="formulario" [formGroup]="formulario" (ngSubmit)="enviar()" novalidate>
      <app-campo etiqueta="Correo" [error]="error(formulario.controls.correo)">
        <input
          appControl
          type="email"
          inputmode="email"
          formControlName="correo"
          autocomplete="username"
        />
      </app-campo>
      <app-campo etiqueta="Contraseña" [error]="error(formulario.controls.contrasena)">
        <div class="control-accion">
          <input
            appControl
            [type]="verClave() ? 'text' : 'password'"
            formControlName="contrasena"
            autocomplete="current-password"
          />
          <button
            type="button"
            class="control-accion__boton"
            [attr.aria-pressed]="verClave()"
            (click)="verClave.set(!verClave())"
          >
            <app-icono [nombre]="verClave() ? 'ocultar' : 'ver'" />
            <span class="sr-only">Mostrar contraseña</span>
          </button>
        </div>
      </app-campo>
      <div class="acciones">
        <button type="submit" class="btn btn--primario" [disabled]="enviando()">
          {{ enviando() ? 'Entrando…' : 'Iniciar sesión' }}
        </button>
      </div>
    </form>
    <p class="acceso__alterno">
      ¿Aún no tienes cuenta? <a routerLink="/registro">Crea tu cuenta de cliente</a>
    </p>
  `,
})
export default class Ingresar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly formulario = inject(NonNullableFormBuilder).group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', Validators.required],
  });
  protected readonly verClave = signal(false);
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly error = mensajeError;

  protected enviar(): void {
    this.errorGeneral.set(null);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.enfocarError();
      return;
    }
    this.enviando.set(true);
    this.auth.iniciarSesion(this.formulario.getRawValue()).subscribe({
      next: (usuario) => void this.router.navigateByUrl(this.destino(usuario)),
      error: (error: unknown) => {
        this.enviando.set(false);
        if (aplicarErroresDeCampos(this.formulario, error)) {
          this.enfocarError();
        } else {
          this.errorGeneral.set(mensajeDeError(error));
        }
      },
    });
  }

  private destino(usuario: Usuario): string {
    return rutaSegura(this.ruta.snapshot.queryParamMap.get('volver')) ?? INICIO_ROL[usuario.rol];
  }

  private enfocarError(): void {
    afterNextRender(() => enfocarPrimerInvalido(this.elemento.nativeElement), {
      injector: this.injector,
    });
  }
}
