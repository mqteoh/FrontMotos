import { HttpClient, httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { API_CLIENTE } from '../../core/api/cliente-api';
import { aplicarErroresDeCampos, mensajeDeError } from '../../core/api/errores';
import { PerfilCliente } from '../../core/api/modelos';
import { valorDe } from '../../core/api/recurso';
import { AuthService } from '../../core/auth/auth.service';
import {
  MensajesPropios,
  enfocarPrimerInvalido,
  fechaPasada,
  hoyIso,
  mensajeError,
} from '../../shared/formularios/mensajes';
import { Campo, Control } from '../../shared/ui/campo/campo';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { Icono } from '../../shared/ui/icono/icono';
import { ListaContactos, controlContacto } from '../../shared/ui/lista-contactos/lista-contactos';
import { ToastService } from '../../shared/ui/toast/toast.service';

const MENSAJES: Record<string, MensajesPropios> = {
  fechaNacimiento: { fechaPasada: 'La fecha debe ser anterior a hoy.' },
};

@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule, Campo, Control, Esqueleto, EstadoError, Icono, ListaContactos],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina' },
  templateUrl: './perfil.html',
})
export default class Perfil {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly hoy = hoyIso();
  protected readonly perfil = httpResource<PerfilCliente>(() => `${API_CLIENTE}/perfil`);
  protected readonly datos = computed(() => valorDe(this.perfil));
  protected readonly mensajeCarga = computed(() => mensajeDeError(this.perfil.error()));
  protected readonly guardando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);

  protected readonly formulario = this.fb.group({
    nombres: ['', [Validators.required, Validators.maxLength(60)]],
    apellidos: ['', [Validators.required, Validators.maxLength(60)]],
    fechaNacimiento: ['', [Validators.required, fechaPasada]],
    ciudad: ['', [Validators.required, Validators.maxLength(60)]],
    barrio: ['', [Validators.required, Validators.maxLength(60)]],
    calle: ['', [Validators.required, Validators.maxLength(60)]],
    numeroDireccion: ['', [Validators.required, Validators.maxLength(20)]],
    telefonos: this.fb.array<FormControl<string>>([]),
    correos: this.fb.array<FormControl<string>>([]),
  });

  constructor() {
    effect(() => {
      const perfil = this.datos();
      if (perfil) {
        this.cargar(perfil);
      }
    });
  }

  protected error(campo: string): string | null {
    const grupo = campo.split('.')[0];
    return mensajeError(this.formulario.get(campo), MENSAJES[grupo]);
  }

  protected guardar(): void {
    this.errorGeneral.set(null);
    const perfil = this.datos();
    if (!perfil) {
      return;
    }
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.enfocarError();
      return;
    }
    const valores = this.formulario.getRawValue();
    const limpiar = (lista: string[]) => lista.map((v) => v.trim()).filter(Boolean);
    this.guardando.set(true);
    this.http
      .put<PerfilCliente>(`${API_CLIENTE}/perfil`, {
        ...perfil,
        ...valores,
        telefonos: limpiar(valores.telefonos),
        correos: limpiar(valores.correos),
      })
      .subscribe({
        next: (actualizado) => {
          this.guardando.set(false);
          this.perfil.set(actualizado);
          this.auth.actualizarNombre(`${actualizado.nombres} ${actualizado.apellidos}`);
          this.toast.exito('Tus datos quedaron guardados.');
        },
        error: (error: unknown) => {
          this.guardando.set(false);
          if (aplicarErroresDeCampos(this.formulario, error)) {
            this.enfocarError();
          } else {
            this.errorGeneral.set(mensajeDeError(error));
          }
        },
      });
  }

  private cargar(perfil: PerfilCliente): void {
    this.formulario.patchValue({
      nombres: perfil.nombres,
      apellidos: perfil.apellidos,
      fechaNacimiento: perfil.fechaNacimiento,
      ciudad: perfil.ciudad,
      barrio: perfil.barrio,
      calle: perfil.calle,
      numeroDireccion: perfil.numeroDireccion,
    });
    this.formulario.controls.telefonos.clear();
    perfil.telefonos.forEach((t) =>
      this.formulario.controls.telefonos.push(controlContacto('telefono', t)),
    );
    this.formulario.controls.correos.clear();
    perfil.correos.forEach((c) =>
      this.formulario.controls.correos.push(controlContacto('correo', c)),
    );
    this.formulario.markAsPristine();
  }

  private enfocarError(): void {
    afterNextRender(() => enfocarPrimerInvalido(this.elemento.nativeElement), {
      injector: this.injector,
    });
  }
}
