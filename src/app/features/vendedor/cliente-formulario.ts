import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { aplicarErroresDeCampos, mensajeDeError } from '../../core/api/errores';
import { ClienteSede } from '../../core/api/modelos';
import { valorDe } from '../../core/api/recurso';
import { API_VENDEDOR, nombreCliente } from '../../core/api/vendedor-api';
import { rutaSegura } from '../../core/auth/rutas';
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
  documento: { pattern: 'Escribe solo números, entre 5 y 15 dígitos.' },
  fechaNacimiento: { fechaPasada: 'La fecha debe ser anterior a hoy.' },
};

@Component({
  selector: 'app-cliente-formulario',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Campo,
    Control,
    Esqueleto,
    EstadoError,
    Icono,
    ListaContactos,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina' },
  templateUrl: './cliente-formulario.html',
})
export default class ClienteFormulario {
  readonly idCliente = input<string>();

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly hoy = hoyIso();
  protected readonly editando = computed(() => Boolean(this.idCliente()));
  protected readonly cliente = httpResource<ClienteSede>(() => {
    const id = this.idCliente();
    return id ? `${API_VENDEDOR}/clientes/${id}` : undefined;
  });
  protected readonly datos = computed(() => valorDe(this.cliente));
  protected readonly mensajeCarga = computed(() => mensajeDeError(this.cliente.error()));
  protected readonly guardando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);

  protected readonly formulario = this.fb.group({
    documento: ['', [Validators.required, Validators.pattern(/^[0-9]{5,15}$/)]],
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
    const documento = this.ruta.snapshot.queryParamMap.get('documento');
    if (documento) {
      this.formulario.controls.documento.setValue(documento);
    }
    effect(() => {
      const cliente = this.datos();
      if (cliente) {
        this.cargar(cliente);
      }
    });
  }

  protected error(campo: string): string | null {
    return mensajeError(this.formulario.get(campo), MENSAJES[campo]);
  }

  protected guardar(): void {
    this.errorGeneral.set(null);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.enfocarError();
      return;
    }
    const valores = this.formulario.getRawValue();
    const limpiar = (lista: string[]) => lista.map((v) => v.trim()).filter(Boolean);
    const cuerpo = {
      ...valores,
      documento: valores.documento.trim(),
      telefonos: limpiar(valores.telefonos),
      correos: limpiar(valores.correos),
    };
    const id = this.idCliente();
    const peticion = id
      ? this.http.put<ClienteSede>(`${API_VENDEDOR}/clientes/${id}`, cuerpo)
      : this.http.post<ClienteSede>(`${API_VENDEDOR}/clientes`, cuerpo);
    this.guardando.set(true);
    peticion.subscribe({
      next: (cliente) => {
        this.toast.exito(
          id
            ? `Datos de ${nombreCliente(cliente)} actualizados.`
            : `${nombreCliente(cliente)} quedó registrado.`,
        );
        void this.router.navigateByUrl(this.destino(cliente));
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.formulario.controls.documento.setErrors({ servidor: mensajeDeError(error) });
          this.formulario.controls.documento.markAsTouched();
          this.enfocarError();
        } else if (aplicarErroresDeCampos(this.formulario, error)) {
          this.enfocarError();
        } else {
          this.errorGeneral.set(mensajeDeError(error));
        }
      },
    });
  }

  private destino(cliente: ClienteSede): string {
    const volver = rutaSegura(this.ruta.snapshot.queryParamMap.get('volver'));
    if (volver) {
      const arbol = this.router.parseUrl(volver);
      arbol.queryParams = { ...arbol.queryParams, cliente: cliente.idCliente };
      return this.router.serializeUrl(arbol);
    }
    return this.router.serializeUrl(
      this.router.createUrlTree(['/vendedor/clientes'], { queryParams: { q: cliente.documento } }),
    );
  }

  private cargar(cliente: ClienteSede): void {
    this.formulario.patchValue({
      documento: cliente.documento,
      nombres: cliente.nombres,
      apellidos: cliente.apellidos,
      fechaNacimiento: cliente.fechaNacimiento,
      ciudad: cliente.ciudad,
      barrio: cliente.barrio,
      calle: cliente.calle,
      numeroDireccion: cliente.numeroDireccion,
    });
    const { telefonos, correos } = this.formulario.controls;
    telefonos.clear();
    cliente.telefonos.forEach((t) => telefonos.push(controlContacto('telefono', t)));
    correos.clear();
    cliente.correos.forEach((c) => correos.push(controlContacto('correo', c)));
    this.formulario.markAsPristine();
  }

  private enfocarError(): void {
    afterNextRender(() => enfocarPrimerInvalido(this.elemento.nativeElement), {
      injector: this.injector,
    });
  }
}
