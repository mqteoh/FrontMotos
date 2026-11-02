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
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { METODOS_PAGO, TIPOS_FACTURA } from '../../core/api/cliente-api';
import { aplicarErroresDeCampos, mensajeDeError } from '../../core/api/errores';
import {
  ClienteSede,
  MetodoPago,
  MotoInventario,
  TipoFactura,
  VentaMoto as VentaRegistrada,
} from '../../core/api/modelos';
import { valorDe } from '../../core/api/recurso';
import { API_VENDEDOR, nombreCliente, textoPago } from '../../core/api/vendedor-api';
import { FechaPipe } from '../../shared/formato/fecha.pipe';
import { PesosPipe } from '../../shared/formato/pesos.pipe';
import { enfocarPrimerInvalido, mensajeError } from '../../shared/formularios/mensajes';
import { Campo, Control } from '../../shared/ui/campo/campo';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { Icono } from '../../shared/ui/icono/icono';
import { Placa } from '../../shared/ui/placa/placa';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { SelectorCliente } from './selector-cliente';

@Component({
  selector: 'app-venta-moto',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Campo,
    Control,
    Esqueleto,
    EstadoError,
    EstadoVacio,
    Icono,
    Placa,
    SelectorCliente,
    FechaPipe,
    PesosPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina' },
  templateUrl: './venta-moto.html',
})
export default class VentaMoto {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly metodos = Object.entries(METODOS_PAGO) as [MetodoPago, string][];
  protected readonly facturas = Object.entries(TIPOS_FACTURA) as [TipoFactura, string][];
  protected readonly nombre = nombreCliente;

  protected readonly inventario = httpResource<MotoInventario[]>(
    () => `${API_VENDEDOR}/inventario`,
  );
  protected readonly motos = computed(() => valorDe(this.inventario) ?? []);
  protected readonly mensajeCarga = computed(() => mensajeDeError(this.inventario.error()));

  protected readonly formulario = this.fb.group({
    placa: ['', Validators.required],
    metodoPago: this.fb.control<MetodoPago | ''>('', Validators.required),
    tipoFactura: this.fb.control<TipoFactura | ''>('', Validators.required),
    valorTotal: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
  });

  protected readonly cliente = signal<ClienteSede | null>(null);
  protected readonly errorCliente = signal<string | null>(null);
  protected readonly etapa = signal<'datos' | 'resumen'>('datos');
  protected readonly enviando = signal(false);
  protected readonly errorVenta = signal<string | null>(null);
  private clienteFijo = false;

  private readonly placa = toSignal(this.formulario.controls.placa.valueChanges, {
    initialValue: '',
  });
  protected readonly moto = computed(() => this.motos().find((m) => m.placa === this.placa()));
  protected readonly reservada = computed(() => {
    const moto = this.moto();
    return moto?.reservada ? moto : null;
  });
  protected readonly ayudaValor = computed(() => {
    const moto = this.moto();
    return moto
      ? `Precio de lista: ${new PesosPipe().transform(moto.precio)}. Puedes registrar un valor distinto si hubo descuento.`
      : 'Primero elige la moto.';
  });

  constructor() {
    const parametros = this.ruta.snapshot.queryParamMap;
    const idCliente = parametros.get('cliente');
    if (idCliente) {
      this.cargarCliente(Number(idCliente));
    }
    effect(() => {
      if (this.motos().length > 0) {
        const placa = parametros.get('placa');
        if (placa && untracked(() => !this.formulario.controls.placa.value)) {
          this.formulario.controls.placa.setValue(placa.toUpperCase());
        }
      }
    });
    this.formulario.controls.placa.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((placa) => this.alElegirMoto(placa));
  }

  protected error(campo: string): string | null {
    return mensajeError(this.formulario.get(campo), {
      min: 'El valor debe ser mayor que cero.',
    });
  }

  protected textoPago(): string {
    return textoPago(this.formulario.getRawValue());
  }

  protected descuento(): number {
    const moto = this.moto();
    const valor = this.formulario.controls.valorTotal.value;
    return moto && valor !== null ? moto.precio - valor : 0;
  }

  protected revisar(): void {
    this.errorVenta.set(null);
    this.formulario.markAllAsTouched();
    this.errorCliente.set(this.cliente() ? null : 'Elige el cliente que compra la moto.');
    if (this.formulario.invalid || !this.cliente()) {
      afterNextRender(() => enfocarPrimerInvalido(this.elemento.nativeElement), {
        injector: this.injector,
      });
      return;
    }
    this.irA('resumen');
  }

  protected corregir(): void {
    this.irA('datos');
  }

  protected confirmar(): void {
    const valores = this.formulario.getRawValue();
    const cliente = this.cliente();
    const moto = this.moto();
    if (!cliente || !moto) {
      return;
    }
    this.enviando.set(true);
    this.errorVenta.set(null);
    this.http
      .post<VentaRegistrada>(`${API_VENDEDOR}/ventas-moto`, {
        placa: moto.placa,
        idCliente: cliente.idCliente,
        metodoPago: valores.metodoPago,
        tipoFactura: valores.tipoFactura,
        valorTotal: valores.valorTotal,
        idReserva: moto.idReserva,
      })
      .subscribe({
        next: (venta) => {
          this.toast.exito(
            `Venta N.º ${venta.idVentaMoto} registrada: ${venta.marca} ${venta.modelo} para ${venta.cliente}.`,
          );
          void this.router.navigateByUrl(moto.reservada ? '/vendedor' : '/vendedor/ventas');
        },
        error: (error: unknown) => {
          this.enviando.set(false);
          if (aplicarErroresDeCampos(this.formulario, error)) {
            this.irA('datos');
            afterNextRender(() => enfocarPrimerInvalido(this.elemento.nativeElement), {
              injector: this.injector,
            });
            return;
          }
          this.errorVenta.set(mensajeDeError(error));
          this.enfocar('#error-venta');
        },
      });
  }

  private alElegirMoto(placa: string): void {
    const moto = this.motos().find((m) => m.placa === placa);
    if (!moto) {
      return;
    }
    this.formulario.controls.valorTotal.setValue(moto.precio);
    if (moto.idClienteReserva !== null) {
      this.cargarCliente(moto.idClienteReserva);
    } else if (this.clienteFijo) {
      this.cliente.set(null);
    }
    this.clienteFijo = moto.idClienteReserva !== null;
  }

  private cargarCliente(idCliente: number): void {
    this.http.get<ClienteSede>(`${API_VENDEDOR}/clientes/${idCliente}`).subscribe({
      next: (cliente) => {
        this.cliente.set(cliente);
        this.errorCliente.set(null);
      },
      error: (error: unknown) =>
        this.errorCliente.set(
          error instanceof HttpErrorResponse && error.status === 404
            ? 'El cliente indicado ya no existe. Búscalo de nuevo.'
            : mensajeDeError(error),
        ),
    });
  }

  private irA(etapa: 'datos' | 'resumen'): void {
    this.etapa.set(etapa);
    this.enfocar('#titulo-etapa');
  }

  private enfocar(selector: string): void {
    afterNextRender(
      () => this.elemento.nativeElement.querySelector<HTMLElement>(selector)?.focus(),
      { injector: this.injector },
    );
  }
}
