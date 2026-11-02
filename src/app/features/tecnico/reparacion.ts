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
import { Title } from '@angular/platform-browser';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { NOMBRE_APP } from '../../core/app-info';
import { mensajeDeError } from '../../core/api/errores';
import { Reparacion as DatosReparacion, Repuesto } from '../../core/api/modelos';
import { valorDe } from '../../core/api/recurso';
import { API_TECNICO } from '../../core/api/tecnico-api';
import { AuthService } from '../../core/auth/auth.service';
import { FechaPipe } from '../../shared/formato/fecha.pipe';
import { NumeroPipe } from '../../shared/formato/numero.pipe';
import { PesosPipe } from '../../shared/formato/pesos.pipe';
import { enfocarPrimerInvalido, mensajeError } from '../../shared/formularios/mensajes';
import { Campo, Control } from '../../shared/ui/campo/campo';
import { ChipEstado } from '../../shared/ui/chip-estado/chip-estado';
import { ConfirmacionService } from '../../shared/ui/confirmacion/confirmacion.service';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { Icono } from '../../shared/ui/icono/icono';
import { Placa } from '../../shared/ui/placa/placa';
import { ToastService } from '../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-reparacion',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Campo,
    Control,
    ChipEstado,
    Esqueleto,
    EstadoError,
    Icono,
    Placa,
    FechaPipe,
    NumeroPipe,
    PesosPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina' },
  templateUrl: './reparacion.html',
})
export default class Reparacion {
  readonly idReparacion = input.required<string>();

  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly reparacion = httpResource<DatosReparacion>(
    () => `${API_TECNICO}/reparaciones/${this.idReparacion()}`,
  );
  protected readonly datos = computed(() => valorDe(this.reparacion));
  protected readonly mensajeCarga = computed(() => mensajeDeError(this.reparacion.error()));

  private readonly esTecnico = computed(() => this.auth.usuario()?.rol === 'TECNICO');
  protected readonly puedeTomar = computed(
    () => this.esTecnico() && this.datos()?.estado === 'AGENDADA',
  );
  protected readonly trabajando = computed(() => {
    const datos = this.datos();
    return (
      this.esTecnico() &&
      datos?.estado === 'EN_PROCESO' &&
      datos.idTecnico === this.auth.usuario()?.id
    );
  });
  protected readonly otroTecnico = computed(() => {
    const datos = this.datos();
    return datos?.estado === 'EN_PROCESO' && !this.trabajando() ? datos.tecnico : null;
  });

  protected readonly consulta = signal('');
  protected readonly repuestos = httpResource<Repuesto[]>(() =>
    this.trabajando() && this.consulta()
      ? { url: `${API_TECNICO}/repuestos`, params: { texto: this.consulta() } }
      : undefined,
  );
  protected readonly resultados = computed(() => valorDe(this.repuestos) ?? []);
  protected readonly errorRepuestos = computed(() => mensajeDeError(this.repuestos.error()));
  protected readonly ocupado = signal(false);
  protected readonly errorAccion = signal<string | null>(null);

  protected readonly cierre = this.fb.group({
    costo: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    descripcion: ['', Validators.maxLength(255)],
  });

  constructor() {
    const titulo = inject(Title);
    effect(() => {
      const datos = this.datos();
      if (datos) {
        titulo.setTitle(`Reparación N.º ${datos.idReparacion}, ${datos.placa} | ${NOMBRE_APP}`);
      }
    });
  }

  protected errorCierre(campo: string): string | null {
    return mensajeError(this.cierre.get(campo), {
      required: 'Escribe el costo de la mano de obra; sin él no se puede cerrar.',
      min: 'El costo no puede ser negativo.',
    });
  }

  protected cantidadUsada(idRepuesto: number): number | null {
    return this.datos()?.repuestos.find((r) => r.idRepuesto === idRepuesto)?.cantidad ?? null;
  }

  protected totalEstimado(): number {
    const repuestos = Number(this.datos()?.costoRepuestos ?? 0);
    return repuestos + (this.cierre.controls.costo.value ?? 0);
  }

  protected tomar(): void {
    this.ejecutar(
      this.http.patch<DatosReparacion>(
        `${API_TECNICO}/reparaciones/${this.idReparacion()}/tomar`,
        null,
      ),
      (datos) => {
        this.toast.exito(`Tomaste la reparación de la moto ${datos.placa}.`);
        this.enfocar('#titulo-repuestos');
      },
    );
  }

  protected buscar(evento: Event, valor: string): void {
    evento.preventDefault();
    this.consulta.set(valor.trim());
  }

  protected agregar(repuesto: Repuesto, cantidad: string): void {
    const unidades = Number(cantidad);
    if (!Number.isInteger(unidades) || unidades < 1 || unidades > 99) {
      this.toast.error('La cantidad debe ser un número entero entre 1 y 99.');
      return;
    }
    this.ejecutar(
      this.http.post<DatosReparacion>(
        `${API_TECNICO}/reparaciones/${this.idReparacion()}/repuestos`,
        { idRepuesto: repuesto.idRepuesto, cantidad: unidades },
      ),
      () => this.toast.exito(`${repuesto.nombre} × ${unidades} registrado.`),
    );
  }

  protected quitar(idRepuesto: number, nombre: string): void {
    this.ejecutar(
      this.http.delete<DatosReparacion>(
        `${API_TECNICO}/reparaciones/${this.idReparacion()}/repuestos/${idRepuesto}`,
      ),
      () => {
        this.toast.info(`${nombre} quitado de la reparación.`);
        this.enfocar('#titulo-repuestos');
      },
    );
  }

  protected async cerrar(): Promise<void> {
    this.cierre.markAllAsTouched();
    if (this.cierre.invalid) {
      afterNextRender(() => enfocarPrimerInvalido(this.elemento.nativeElement), {
        injector: this.injector,
      });
      return;
    }
    const datos = this.datos();
    const confirmado = await this.confirmacion.confirmar({
      titulo: `¿Cerrar la reparación de la moto ${datos?.placa}?`,
      mensaje: `El total queda en ${new PesosPipe().transform(this.totalEstimado())} y la reparación pasa a finalizada. Después no se pueden cambiar los repuestos ni el costo.`,
      accion: 'Cerrar reparación',
      volver: 'Seguir trabajando',
    });
    if (!confirmado) {
      return;
    }
    const valores = this.cierre.getRawValue();
    this.ejecutar(
      this.http.patch<DatosReparacion>(
        `${API_TECNICO}/reparaciones/${this.idReparacion()}/finalizar`,
        { costo: valores.costo, descripcion: valores.descripcion.trim() || null },
      ),
      (cerrada) => {
        this.toast.exito(
          `Reparación cerrada por ${new PesosPipe().transform(cerrada.costoTotal)}.`,
        );
        this.enfocar('#titulo-reparacion');
      },
    );
  }

  private ejecutar(
    peticion: Observable<DatosReparacion>,
    alTerminar: (datos: DatosReparacion) => void,
  ): void {
    this.ocupado.set(true);
    this.errorAccion.set(null);
    peticion.subscribe({
      next: (datos) => {
        this.ocupado.set(false);
        this.reparacion.set(datos);
        alTerminar(datos);
      },
      error: (error: unknown) => {
        this.ocupado.set(false);
        this.errorAccion.set(mensajeDeError(error));
        this.enfocar('#error-accion');
      },
    });
  }

  private enfocar(selector: string): void {
    afterNextRender(
      () => this.elemento.nativeElement.querySelector<HTMLElement>(selector)?.focus(),
      { injector: this.injector },
    );
  }
}
