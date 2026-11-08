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
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { aplicarErroresDeCampos, mensajeDeError } from '../../core/api/errores';
import { NuevaReparacion, Reparacion, Repuesto, TecnicoParticipante } from '../../core/api/modelos';
import { valorDe } from '../../core/api/recurso';
import { API_TECNICO } from '../../core/api/tecnico-api';
import { AuthService } from '../../core/auth/auth.service';
import { PesosPipe } from '../../shared/formato/pesos.pipe';
import {
  enfocarPrimerInvalido,
  hoyIso,
  mensajeError,
  noFutura,
} from '../../shared/formularios/mensajes';
import { Campo, Control } from '../../shared/ui/campo/campo';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { Icono } from '../../shared/ui/icono/icono';
import { ToastService } from '../../shared/ui/toast/toast.service';

export const MAXIMO_REPUESTOS = 20;

type Uso = FormGroup<{
  idRepuesto: FormControl<number | null>;
  cantidad: FormControl<number | null>;
  precioUnitario: FormControl<number | null>;
}>;

@Component({
  selector: 'app-formulario-reparacion',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Campo,
    Control,
    Esqueleto,
    EstadoError,
    Icono,
    PesosPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina' },
  templateUrl: './formulario-reparacion.html',
})
export default class FormularioReparacion {
  readonly idReparacion = input<string>();

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly maximo = MAXIMO_REPUESTOS;
  protected readonly hoy = hoyIso();
  protected readonly editando = computed(() => Boolean(this.idReparacion()));
  protected readonly idUsuario = computed(() => this.auth.usuario()?.id);
  protected readonly esTecnico = computed(() => this.auth.usuario()?.rol === 'TECNICO');

  protected readonly existente = httpResource<Reparacion>(() =>
    this.idReparacion() ? `${API_TECNICO}/reparaciones/${this.idReparacion()}` : undefined,
  );
  protected readonly tecnicosDisponibles = httpResource<TecnicoParticipante[]>(
    () => `${API_TECNICO}/tecnicos`,
  );
  protected readonly repuestos = httpResource<Repuesto[]>(() => `${API_TECNICO}/repuestos`);
  protected readonly catalogo = computed(() => valorDe(this.repuestos) ?? []);
  protected readonly categorias = computed(() => {
    const grupos = new Map<string, Repuesto[]>();
    for (const repuesto of this.catalogo()) {
      grupos.set(repuesto.categoria, [...(grupos.get(repuesto.categoria) ?? []), repuesto]);
    }
    return [...grupos.entries()]
      .map(([categoria, lista]) => ({ categoria, lista }))
      .sort((a, b) => a.categoria.localeCompare(b.categoria));
  });
  protected readonly cargando = computed(
    () =>
      this.tecnicosDisponibles.isLoading() ||
      this.repuestos.isLoading() ||
      (this.editando() && this.existente.isLoading()),
  );
  protected readonly errorCarga = computed(
    () => this.tecnicosDisponibles.error() ?? this.repuestos.error() ?? this.existente.error(),
  );
  protected readonly mensajeCarga = computed(() => mensajeDeError(this.errorCarga()));

  protected readonly gruposTecnicos = computed(() => {
    const grupos = new Map<string, TecnicoParticipante[]>();
    for (const tecnico of valorDe(this.tecnicosDisponibles) ?? []) {
      grupos.set(tecnico.sucursal, [...(grupos.get(tecnico.sucursal) ?? []), tecnico]);
    }
    return [...grupos.entries()]
      .map(([sede, tecnicos]) => ({ sede, tecnicos }))
      .sort((a, b) => a.sede.localeCompare(b.sede));
  });
  protected readonly elegidos = signal<number[]>([]);
  protected readonly intentado = signal(false);
  protected readonly errorTecnicos = computed(() => {
    const elegidos = this.elegidos();
    if (!this.esTecnico() && elegidos.length === 0) {
      return this.intentado() ? 'Elige al menos un técnico que haya hecho la reparación.' : null;
    }
    const sedes = new Set(
      (valorDe(this.tecnicosDisponibles) ?? [])
        .filter((t) => elegidos.includes(t.idEmpleado))
        .map((t) => t.idSucursal),
    );
    return sedes.size > 1 ? 'Los técnicos de una reparación deben ser de la misma sede.' : null;
  });

  protected readonly formulario = this.fb.group({
    placa: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{3}[0-9]{2}[A-Za-z]$/)]],
    fecha: [hoyIso(), [Validators.required, noFutura]],
    descripcion: ['', [Validators.required, Validators.maxLength(255)]],
    costo: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    repuestos: this.fb.array<Uso>([]),
  });

  private readonly valores = toSignal(this.formulario.valueChanges, {
    initialValue: this.formulario.getRawValue(),
  });
  protected readonly totalRepuestos = computed(() =>
    (this.valores().repuestos ?? []).reduce(
      (total, uso) => total + (uso.cantidad ?? 0) * (uso.precioUnitario ?? 0),
      0,
    ),
  );
  protected readonly total = computed(
    () => this.totalRepuestos() + Number(this.valores().costo ?? 0),
  );

  protected readonly enviando = signal(false);
  protected readonly errorEnvio = signal<string | null>(null);

  constructor() {
    let lleno = false;
    effect(() => {
      const datos = valorDe(this.existente);
      if (datos && !lleno) {
        lleno = true;
        this.llenar(datos);
      }
    });
  }

  protected get usos() {
    return this.formulario.controls.repuestos;
  }

  protected error(campo: string): string | null {
    return mensajeError(this.formulario.get(campo), {
      pattern: 'Usa el formato ABC12D: tres letras, dos números y una letra.',
      noFutura: 'La fecha no puede ser posterior a hoy.',
      min: 'El costo no puede ser negativo.',
    });
  }

  protected errorUso(control: FormControl<unknown>): string | null {
    return mensajeError(control, {
      min: 'Usa un valor mayor que cero.',
      max: 'La cantidad máxima es 99.',
    });
  }

  protected esPropio(idEmpleado: number): boolean {
    return this.esTecnico() && idEmpleado === this.idUsuario();
  }

  protected marcado(idEmpleado: number): boolean {
    return this.esPropio(idEmpleado) || this.elegidos().includes(idEmpleado);
  }

  protected alternar(idEmpleado: number, evento: Event): void {
    const marcado = (evento.target as HTMLInputElement).checked;
    this.elegidos.update((lista) =>
      marcado ? [...lista, idEmpleado] : lista.filter((id) => id !== idEmpleado),
    );
  }

  protected yaElegido(idRepuesto: number, indice: number): boolean {
    return this.usos.controls.some(
      (uso, i) => i !== indice && uso.controls.idRepuesto.value === idRepuesto,
    );
  }

  protected subtotal(uso: Uso): number {
    return (uso.controls.cantidad.value ?? 0) * (uso.controls.precioUnitario.value ?? 0);
  }

  protected agregarRepuesto(): void {
    this.usos.push(this.nuevoUso());
    this.enfocar(`#uso-repuesto-${this.usos.length - 1}`);
  }

  protected quitarRepuesto(indice: number): void {
    this.usos.removeAt(indice);
    this.enfocar(`#uso-repuesto-${Math.max(indice - 1, 0)}`, '#agregar-repuesto');
  }

  protected guardar(): void {
    this.errorEnvio.set(null);
    this.intentado.set(true);
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid || this.errorTecnicos()) {
      afterNextRender(() => enfocarPrimerInvalido(this.elemento.nativeElement), {
        injector: this.injector,
      });
      return;
    }
    const valores = this.formulario.getRawValue();
    const cuerpo: NuevaReparacion = {
      placa: valores.placa.trim().toUpperCase(),
      fecha: valores.fecha,
      descripcion: valores.descripcion.trim(),
      costo: Number(valores.costo),
      idTecnicos: this.elegidos().filter((id) => !this.esPropio(id)),
      repuestos: valores.repuestos.map((uso) => ({
        idRepuesto: Number(uso.idRepuesto),
        cantidad: Number(uso.cantidad),
        precioUnitario: uso.precioUnitario,
      })),
    };
    const id = this.idReparacion();
    const peticion = id
      ? this.http.put<Reparacion>(`${API_TECNICO}/reparaciones/${id}`, cuerpo)
      : this.http.post<Reparacion>(`${API_TECNICO}/reparaciones`, cuerpo);
    this.enviando.set(true);
    peticion.subscribe({
      next: (guardada) => {
        this.toast.exito(
          id
            ? `Reparación N.º ${guardada.idReparacion} corregida.`
            : `Reparación N.º ${guardada.idReparacion} registrada por ${new PesosPipe().transform(guardada.costoTotal)}.`,
        );
        void this.router.navigate(['/tecnico/reparaciones', guardada.idReparacion]);
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        if (aplicarErroresDeCampos(this.formulario, error)) {
          afterNextRender(() => enfocarPrimerInvalido(this.elemento.nativeElement), {
            injector: this.injector,
          });
          return;
        }
        this.errorEnvio.set(mensajeDeError(error));
        this.enfocar('#error-envio');
      },
    });
  }

  private llenar(datos: Reparacion): void {
    this.formulario.patchValue({
      placa: datos.placa,
      fecha: datos.fecha,
      descripcion: datos.descripcion,
      costo: Number(datos.costoManoObra),
    });
    this.usos.clear();
    for (const uso of datos.repuestos) {
      const control = this.nuevoUso();
      control.setValue(
        {
          idRepuesto: uso.idRepuesto,
          cantidad: uso.cantidad,
          precioUnitario: Number(uso.precioUnitario),
        },
        { emitEvent: false },
      );
      this.usos.push(control);
    }
    this.elegidos.set(datos.tecnicos.map((t) => t.idEmpleado));
  }

  private nuevoUso(): Uso {
    const uso: Uso = this.fb.group({
      idRepuesto: this.fb.control<number | null>(null, Validators.required),
      cantidad: this.fb.control<number | null>(1, [
        Validators.required,
        Validators.min(1),
        Validators.max(99),
      ]),
      precioUnitario: this.fb.control<number | null>(null, [
        Validators.required,
        Validators.min(1),
      ]),
    });
    uso.controls.idRepuesto.valueChanges.subscribe((id) => {
      const repuesto = this.catalogo().find((r) => r.idRepuesto === id);
      uso.controls.precioUnitario.setValue(repuesto ? Number(repuesto.precio) : null);
    });
    return uso;
  }

  private enfocar(selector: string, alternativo?: string): void {
    afterNextRender(
      () => {
        const raiz = this.elemento.nativeElement;
        const destino =
          raiz.querySelector<HTMLElement>(selector) ??
          (alternativo ? raiz.querySelector<HTMLElement>(alternativo) : null);
        destino?.focus();
      },
      { injector: this.injector },
    );
  }
}
