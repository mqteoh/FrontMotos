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
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { aplicarErroresDeCampos, mensajeDeError } from '../../core/api/errores';
import { valorDe } from '../../core/api/recurso';
import { rutaSegura } from '../../core/auth/rutas';
import { enfocarPrimerInvalido, mensajeError } from '../../shared/formularios/mensajes';
import { Campo, Control } from '../../shared/ui/campo/campo';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { Icono } from '../../shared/ui/icono/icono';
import { ListaContactos, controlContacto } from '../../shared/ui/lista-contactos/lista-contactos';
import { Placa } from '../../shared/ui/placa/placa';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { CatalogosAdmin } from './catalogos-admin';
import {
  CampoRecurso,
  Fila,
  Opcion,
  Recurso,
  Valores,
  conMayuscula,
  participio,
  textoDe,
} from './recurso';

interface GrupoOpciones {
  nombre: string | null;
  opciones: Opcion[];
}

function esLista(campo: CampoRecurso): boolean {
  return campo.tipo === 'telefonos' || campo.tipo === 'correos';
}

function agrupar(opciones: readonly Opcion[]): GrupoOpciones[] {
  const grupos: GrupoOpciones[] = [];
  for (const opcion of opciones) {
    const nombre = opcion.grupo ?? null;
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.nombre === nombre) {
      ultimo.opciones.push(opcion);
    } else {
      grupos.push({ nombre, opciones: [opcion] });
    }
  }
  return grupos;
}

function convertir(campo: CampoRecurso, valor: unknown): unknown {
  if (esLista(campo)) {
    return (valor as string[]).map((v) => v.trim()).filter(Boolean);
  }
  if (valor === null || valor === undefined || String(valor).trim() === '') {
    return null;
  }
  if (campo.tipo === 'numero' || (campo.tipo === 'seleccion' && campo.numerico)) {
    return Number(valor);
  }
  if (campo.tipo === 'fecha-hora') {
    return String(valor).length === 16 ? `${String(valor)}:00` : valor;
  }
  return String(valor).trim();
}

@Component({
  selector: 'app-formulario-admin',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Campo,
    Control,
    Esqueleto,
    EstadoError,
    EstadoVacio,
    Icono,
    ListaContactos,
    Placa,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina' },
  templateUrl: './formulario-admin.html',
})
export default class FormularioAdmin {
  readonly id = input<string>();

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly catalogos = inject(CatalogosAdmin);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly recurso = this.ruta.snapshot.data['recurso'] as Recurso;
  protected readonly editando = this.ruta.snapshot.paramMap.has('id');
  protected readonly volver =
    rutaSegura(this.ruta.snapshot.queryParamMap.get('volver')) ?? `/admin/${this.recurso.ruta}`;
  private readonly campos = this.recurso.campos ?? [];

  protected readonly formulario = new FormGroup<Record<string, AbstractControl>>(
    Object.fromEntries(this.campos.map((campo) => [campo.clave, this.crearControl(campo)])),
  );
  private readonly valores = toSignal(
    this.formulario.valueChanges.pipe(map(() => this.formulario.getRawValue() as Valores)),
    { initialValue: this.formulario.getRawValue() as Valores },
  );
  protected readonly visibles = computed(() =>
    this.campos.filter((campo) => !campo.visible || campo.visible(this.valores())),
  );
  protected readonly opciones = computed(() => {
    const contexto = { catalogos: this.catalogos, idEditado: this.id() ?? null };
    return new Map(
      this.campos
        .filter((campo) => campo.opciones)
        .map((campo) => [campo.clave, campo.opciones?.(contexto)]),
    );
  });

  protected readonly item = httpResource<Fila>(() => {
    const id = this.id();
    return id && this.recurso.urlDe ? this.recurso.urlDe(id) : undefined;
  });
  protected readonly noExiste = computed(() => {
    const error = this.item.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });
  protected readonly mensajeCarga = computed(() => mensajeDeError(this.item.error()));
  protected readonly faltanListas = computed(() =>
    this.catalogos.conError(this.recurso.catalogos ?? []),
  );
  protected readonly guardando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);

  private readonly alerta = viewChild<ElementRef<HTMLElement>>('alerta');

  constructor() {
    this.catalogos.usar(this.recurso.catalogos ?? []);
    effect(() => {
      const visibles = new Set(this.visibles());
      for (const campo of this.campos) {
        const control = this.formulario.controls[campo.clave];
        if (visibles.has(campo) && control.disabled) {
          control.enable({ emitEvent: false });
        } else if (!visibles.has(campo) && control.enabled) {
          control.disable({ emitEvent: false });
        }
      }
    });
    effect(() => {
      const fila = valorDe(this.item);
      if (fila) {
        untracked(() => this.cargar(fila));
      }
    });
  }

  protected lista(clave: string): FormArray<FormControl<string>> {
    return this.formulario.controls[clave] as FormArray<FormControl<string>>;
  }

  protected grupos(campo: CampoRecurso): GrupoOpciones[] | undefined {
    const opciones = this.opciones().get(campo.clave);
    return opciones && agrupar(opciones);
  }

  protected obligatorio(campo: CampoRecurso): boolean {
    return campo.obligatorio === true || (campo.obligatorio === 'al-crear' && !this.editando);
  }

  protected ayuda(campo: CampoRecurso): string | undefined {
    return (this.editando && campo.ayudaAlEditar) || campo.ayuda;
  }

  protected error(campo: CampoRecurso): string | null {
    return mensajeError(this.formulario.controls[campo.clave], campo.mensajes);
  }

  protected textoFijo(campo: CampoRecurso): string {
    const valor = textoDe(this.valores()[campo.clave]);
    return (
      this.opciones()
        .get(campo.clave)
        ?.find((o) => o.valor === valor)?.etiqueta ?? valor
    );
  }

  protected recargarListas(): void {
    this.catalogos.recargar(this.recurso.catalogos ?? []);
  }

  protected guardar(): void {
    this.errorGeneral.set(null);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.enfocar(() => enfocarPrimerInvalido(this.elemento.nativeElement));
      return;
    }
    const id = this.id();
    const cuerpo = this.cuerpo();
    const peticion =
      id && this.recurso.urlDe
        ? this.http.put<Fila>(this.recurso.urlDe(id), cuerpo)
        : this.http.post<Fila>(this.recurso.url, cuerpo);
    this.guardando.set(true);
    peticion.subscribe({
      next: (fila) => {
        this.catalogos.recargar(this.recurso.alimenta ?? []);
        const accion = participio(this.recurso, id ? 'actualizad' : 'registrad');
        this.toast.exito(
          `${conMayuscula(this.recurso.singular)} ${this.recurso.nombre(fila)} ${accion}.`,
        );
        void this.router.navigateByUrl(this.volver);
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        if (aplicarErroresDeCampos(this.formulario, error)) {
          this.enfocar(() => enfocarPrimerInvalido(this.elemento.nativeElement));
        } else {
          this.errorGeneral.set(mensajeDeError(error));
          this.enfocar(() => this.alerta()?.nativeElement.focus());
        }
      },
    });
  }

  private crearControl(campo: CampoRecurso): AbstractControl {
    if (esLista(campo)) {
      return new FormArray<FormControl<string>>([]);
    }
    const validadores = [...(campo.validadores ?? [])];
    if (this.obligatorio(campo)) {
      validadores.unshift(Validators.required);
    }
    return new FormControl<unknown>('', { validators: validadores });
  }

  private cargar(fila: Fila): void {
    const valores: Valores = {};
    for (const campo of this.campos) {
      const valor = fila[campo.clave];
      if (esLista(campo)) {
        const lista = this.lista(campo.clave);
        lista.clear();
        const tipo = campo.tipo === 'telefonos' ? 'telefono' : 'correo';
        ((valor as string[] | null) ?? []).forEach((v) => lista.push(controlContacto(tipo, v)));
      } else if (campo.tipo === 'contrasena') {
        valores[campo.clave] = '';
      } else if (campo.tipo === 'fecha-hora') {
        valores[campo.clave] = textoDe(valor).slice(0, 16);
      } else if (campo.tipo === 'numero') {
        valores[campo.clave] = valor ?? null;
      } else {
        valores[campo.clave] = textoDe(valor);
      }
    }
    this.formulario.patchValue({ ...valores, ...this.recurso.aFormulario?.(fila) });
    this.formulario.markAsPristine();
  }

  private cuerpo(): Valores {
    const valores = this.formulario.getRawValue() as Valores;
    const visibles = new Set(this.visibles());
    const cuerpo: Valores = Object.fromEntries(
      this.campos.map((campo) => [
        campo.clave,
        visibles.has(campo) ? convertir(campo, valores[campo.clave]) : null,
      ]),
    );
    return this.recurso.aCuerpo?.(cuerpo) ?? cuerpo;
  }

  private enfocar(accion: () => void): void {
    afterNextRender(accion, { injector: this.injector });
  }
}
