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
import { Router, RouterLink } from '@angular/router';
import { aplicarErroresDeCampos, mensajeDeError } from '../../core/api/errores';
import { AuthService } from '../../core/auth/auth.service';
import {
  MensajesPropios,
  enfocarPrimerInvalido,
  fechaPasada,
  hoyIso,
  mensajeError,
} from '../../shared/formularios/mensajes';
import { Campo, Control } from '../../shared/ui/campo/campo';
import { Icono } from '../../shared/ui/icono/icono';
import { ToastService } from '../../shared/ui/toast/toast.service';

const MENSAJES: Record<string, MensajesPropios> = {
  documento: { pattern: 'Escribe solo números, entre 5 y 15 dígitos.' },
  fechaNacimiento: { fechaPasada: 'La fecha debe ser anterior a hoy.' },
  telefono: { pattern: 'Escribe solo números, entre 7 y 15 dígitos.' },
  contrasena: { pattern: 'Usa entre 8 y 72 caracteres, con al menos una letra y un número.' },
};

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, Campo, Control, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'acceso acceso--ancho' },
  templateUrl: './registro.html',
})
export default class Registro {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly hoy = hoyIso();
  protected readonly formulario = inject(NonNullableFormBuilder).group({
    documento: ['', [Validators.required, Validators.pattern(/^[0-9]{5,15}$/)]],
    nombres: ['', [Validators.required, Validators.maxLength(60)]],
    apellidos: ['', [Validators.required, Validators.maxLength(60)]],
    fechaNacimiento: ['', [Validators.required, fechaPasada]],
    telefono: ['', Validators.pattern(/^[0-9]{7,15}$/)],
    ciudad: ['', [Validators.required, Validators.maxLength(60)]],
    barrio: ['', [Validators.required, Validators.maxLength(60)]],
    calle: ['', [Validators.required, Validators.maxLength(60)]],
    numeroDireccion: ['', [Validators.required, Validators.maxLength(20)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    contrasena: [
      '',
      [Validators.required, Validators.pattern(/^(?=.*[A-Za-z])(?=.*[0-9]).{8,72}$/)],
    ],
  });
  protected readonly verClave = signal(false);
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);

  protected error(campo: string): string | null {
    return mensajeError(this.formulario.get(campo), MENSAJES[campo]);
  }

  protected enviar(): void {
    this.errorGeneral.set(null);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.enfocarError();
      return;
    }
    const datos = this.formulario.getRawValue();
    this.enviando.set(true);
    this.auth.registrar({ ...datos, telefono: datos.telefono.trim() || null }).subscribe({
      next: () => {
        this.toast.exito('Cuenta creada. Ya puedes reservar motos desde el catálogo.');
        void this.router.navigateByUrl('/cliente');
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        if (aplicarErroresDeCampos(this.formulario, error)) {
          this.enfocarError();
        } else {
          this.errorGeneral.set(mensajeDeError(error));
          afterNextRender(() => this.elemento.nativeElement.scrollIntoView({ block: 'start' }), {
            injector: this.injector,
          });
        }
      },
    });
  }

  private enfocarError(): void {
    afterNextRender(() => enfocarPrimerInvalido(this.elemento.nativeElement), {
      injector: this.injector,
    });
  }
}
