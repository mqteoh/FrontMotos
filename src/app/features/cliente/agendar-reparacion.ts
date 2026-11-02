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
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { API_CLIENTE } from '../../core/api/cliente-api';
import { aplicarErroresDeCampos, mensajeDeError } from '../../core/api/errores';
import { Marca, Modelo, MotoCliente, Reparacion, Sucursal } from '../../core/api/modelos';
import { API_PUBLICO, PLACA } from '../../core/api/publico-api';
import { valorDe } from '../../core/api/recurso';
import { FechaPipe } from '../../shared/formato/fecha.pipe';
import {
  MensajesPropios,
  enfocarPrimerInvalido,
  mensajeError,
} from '../../shared/formularios/mensajes';
import { Campo, Control } from '../../shared/ui/campo/campo';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { Icono } from '../../shared/ui/icono/icono';
import { Placa } from '../../shared/ui/placa/placa';
import { ToastService } from '../../shared/ui/toast/toast.service';

export function ahoraLocal(): string {
  const ahora = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}T${dos(ahora.getHours())}:${dos(ahora.getMinutes())}`;
}

export const fechaFutura: ValidatorFn = (control): ValidationErrors | null => {
  const valor = control.value as string;
  return valor && valor <= ahoraLocal() ? { fechaFutura: true } : null;
};

const MENSAJES: Record<string, MensajesPropios> = {
  placaPropia: { required: 'Elige una de tus motos.' },
  placa: { pattern: 'Escribe la placa como aparece en la moto, por ejemplo ABC12D.' },
  fechaAgendada: { fechaFutura: 'Elige una fecha y hora posteriores a este momento.' },
  kilometrajeIngreso: { min: 'El kilometraje no puede ser negativo.' },
};

const PASO_DE_CAMPO: Record<string, number> = {
  placa: 1,
  placaPropia: 1,
  motoExterna: 1,
  idSucursal: 2,
  fechaAgendada: 2,
  kilometrajeIngreso: 2,
  descripcion: 3,
};

const PASOS = ['Moto', 'Cita', 'Revisión'];

@Component({
  selector: 'app-agendar-reparacion',
  imports: [ReactiveFormsModule, RouterLink, Campo, Control, Esqueleto, Icono, Placa, FechaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina' },
  templateUrl: './agendar-reparacion.html',
})
export default class AgendarReparacion {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly pasos = PASOS;
  protected readonly paso = signal(1);
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly ahora = ahoraLocal();

  protected readonly formulario = this.fb.group({
    tipoMoto: this.fb.control<'propia' | 'externa'>('propia'),
    placaPropia: [''],
    placa: [''],
    motoExterna: this.fb.group({
      idMarca: this.fb.control<number | null>(null),
      nroModelo: this.fb.control<number | null>(null),
      anio: this.fb.control<number | null>(null),
      color: [''],
    }),
    idSucursal: this.fb.control<number | null>(null, Validators.required),
    fechaAgendada: ['', [Validators.required, fechaFutura]],
    kilometrajeIngreso: this.fb.control<number | null>(null, Validators.min(0)),
    descripcion: ['', [Validators.required, Validators.maxLength(255)]],
  });

  protected readonly misMotos = httpResource<MotoCliente[]>(() => `${API_CLIENTE}/motos`);
  protected readonly sedes = httpResource<Sucursal[]>(() => `${API_PUBLICO}/sucursales`);
  protected readonly marcas = httpResource<Marca[]>(() => `${API_PUBLICO}/marcas`);
  protected readonly idMarcaElegida = toSignal(
    this.formulario.controls.motoExterna.controls.idMarca.valueChanges,
    { initialValue: null },
  );
  protected readonly modelos = httpResource<Modelo[]>(() => {
    const marca = this.idMarcaElegida();
    return marca ? `${API_PUBLICO}/marcas/${marca}/modelos` : undefined;
  });

  protected readonly listaMotos = computed(() => valorDe(this.misMotos) ?? []);
  protected readonly listaSedes = computed(() => valorDe(this.sedes) ?? []);
  protected readonly listaMarcas = computed(() => valorDe(this.marcas) ?? []);
  protected readonly listaModelos = computed(() => valorDe(this.modelos) ?? []);
  protected readonly tipoMoto = toSignal(this.formulario.controls.tipoMoto.valueChanges, {
    initialValue: 'propia' as const,
  });
  protected readonly descripcion = toSignal(this.formulario.controls.descripcion.valueChanges, {
    initialValue: '',
  });

  constructor() {
    this.formulario.controls.tipoMoto.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((tipo) => this.ajustarValidadores(tipo));
    this.formulario.controls.motoExterna.controls.idMarca.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.formulario.controls.motoExterna.controls.nroModelo.setValue(null));
    this.ajustarValidadores('propia');
    effect(() => {
      if (this.misMotos.hasValue() && this.listaMotos().length === 0) {
        this.formulario.controls.tipoMoto.setValue('externa');
      }
    });
  }

  protected error(campo: string): string | null {
    const clave = campo.split('.').pop() ?? campo;
    return mensajeError(this.formulario.get(campo), MENSAJES[clave]);
  }

  protected siguiente(): void {
    if (this.validarPaso(this.paso())) {
      this.irAPaso(this.paso() + 1);
    }
  }

  protected anterior(): void {
    this.irAPaso(this.paso() - 1);
  }

  protected resumenMoto(): string {
    const valores = this.formulario.getRawValue();
    if (valores.tipoMoto === 'propia') {
      const moto = this.listaMotos().find((m) => m.placa === valores.placaPropia);
      return moto ? `${moto.marca} ${moto.modelo}` : '';
    }
    const marca = this.listaMarcas().find((m) => m.idMarca === valores.motoExterna.idMarca);
    const modelo = this.listaModelos().find((m) => m.nroModelo === valores.motoExterna.nroModelo);
    return [marca?.nombre, modelo?.nombre, valores.motoExterna.anio, valores.motoExterna.color]
      .filter(Boolean)
      .join(' · ');
  }

  protected placaElegida(): string {
    const valores = this.formulario.getRawValue();
    return (valores.tipoMoto === 'propia' ? valores.placaPropia : valores.placa).toUpperCase();
  }

  protected nombreSede(): string {
    const id = this.formulario.controls.idSucursal.value;
    return this.listaSedes().find((sede) => sede.idSucursal === id)?.nombre ?? '';
  }

  protected enviar(): void {
    this.errorGeneral.set(null);
    for (const paso of [1, 2, 3]) {
      if (!this.validarPaso(paso)) {
        this.irAPaso(paso);
        return;
      }
    }
    const valores = this.formulario.getRawValue();
    const externa = valores.tipoMoto === 'externa';
    this.enviando.set(true);
    this.http
      .post<Reparacion>(`${API_CLIENTE}/reparaciones`, {
        placa: this.placaElegida(),
        idSucursal: valores.idSucursal,
        fechaAgendada: valores.fechaAgendada,
        descripcion: valores.descripcion.trim(),
        kilometrajeIngreso: valores.kilometrajeIngreso,
        motoExterna: externa
          ? { ...valores.motoExterna, color: valores.motoExterna.color.trim() }
          : null,
      })
      .subscribe({
        next: (reparacion) => {
          this.toast.exito(
            `Cita agendada en ${reparacion.sucursal} para la moto ${reparacion.placa}.`,
          );
          void this.router.navigateByUrl('/cliente/reparaciones');
        },
        error: (error: unknown) => {
          this.enviando.set(false);
          if (aplicarErroresDeCampos(this.formulario, error)) {
            this.irAlPrimerError();
          } else {
            this.errorGeneral.set(mensajeDeError(error));
            this.enfocar('#error-agendar');
          }
        },
      });
  }

  private ajustarValidadores(tipo: 'propia' | 'externa'): void {
    const { placaPropia, placa, motoExterna } = this.formulario.controls;
    const { idMarca, nroModelo, anio, color } = motoExterna.controls;
    const propia = tipo === 'propia';
    placaPropia.setValidators(propia ? Validators.required : null);
    placa.setValidators(propia ? null : [Validators.required, Validators.pattern(PLACA)]);
    idMarca.setValidators(propia ? null : Validators.required);
    nroModelo.setValidators(propia ? null : Validators.required);
    anio.setValidators(
      propia ? null : [Validators.required, Validators.min(1980), Validators.max(2030)],
    );
    color.setValidators(propia ? null : [Validators.required, Validators.maxLength(30)]);
    for (const control of [placaPropia, placa, idMarca, nroModelo, anio, color]) {
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  private controlesDelPaso(paso: number): AbstractControl[] {
    const c = this.formulario.controls;
    if (paso === 1) {
      return c.tipoMoto.value === 'propia' ? [c.placaPropia] : [c.placa, c.motoExterna];
    }
    if (paso === 2) {
      return [c.idSucursal, c.fechaAgendada, c.kilometrajeIngreso];
    }
    return [c.descripcion];
  }

  private validarPaso(paso: number): boolean {
    const controles = this.controlesDelPaso(paso);
    controles.forEach((control) => {
      control.updateValueAndValidity();
      control.markAllAsTouched();
    });
    const valido = controles.every((control) => control.valid);
    if (!valido && paso === this.paso()) {
      this.enfocar('[aria-invalid="true"]');
    }
    return valido;
  }

  private irAlPrimerError(): void {
    const pasoConError = Object.entries(PASO_DE_CAMPO)
      .filter(([campo]) => this.formulario.get(campo)?.invalid)
      .map(([, paso]) => paso)
      .sort()[0];
    this.irAPaso(pasoConError ?? 3);
    afterNextRender(() => enfocarPrimerInvalido(this.elemento.nativeElement), {
      injector: this.injector,
    });
  }

  private irAPaso(paso: number): void {
    this.errorGeneral.set(null);
    this.paso.set(Math.min(Math.max(paso, 1), PASOS.length));
    this.enfocar('#titulo-paso');
  }

  private enfocar(selector: string): void {
    afterNextRender(
      () => this.elemento.nativeElement.querySelector<HTMLElement>(selector)?.focus(),
      { injector: this.injector },
    );
  }
}
