import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { METODOS_PAGO, TIPOS_FACTURA } from '../../core/api/cliente-api';
import { mensajeDeError } from '../../core/api/errores';
import {
  Accesorio,
  ClienteSede,
  MetodoPago,
  TipoFactura,
  VentaAccesorio,
} from '../../core/api/modelos';
import { API_PUBLICO } from '../../core/api/publico-api';
import { valorDe } from '../../core/api/recurso';
import {
  API_VENDEDOR,
  nombreCliente,
  textoPago,
  totalAccesorios,
} from '../../core/api/vendedor-api';
import { PesosPipe } from '../../shared/formato/pesos.pipe';
import { enfocarPrimerInvalido, mensajeError } from '../../shared/formularios/mensajes';
import { Campo, Control } from '../../shared/ui/campo/campo';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { Icono } from '../../shared/ui/icono/icono';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { SelectorCliente } from './selector-cliente';

export const MAXIMO_ITEMS = 30;

type Item = FormGroup<{
  idAccesorio: FormControl<number | null>;
  cantidad: FormControl<number | null>;
  precioUnitario: FormControl<number | null>;
}>;

@Component({
  selector: 'app-venta-accesorios',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Campo,
    Control,
    Esqueleto,
    EstadoError,
    Icono,
    SelectorCliente,
    PesosPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina' },
  templateUrl: './venta-accesorios.html',
})
export default class VentaAccesorios {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly maximo = MAXIMO_ITEMS;
  protected readonly metodos = Object.entries(METODOS_PAGO) as [MetodoPago, string][];
  protected readonly facturas = Object.entries(TIPOS_FACTURA) as [TipoFactura, string][];
  protected readonly nombre = nombreCliente;

  protected readonly accesorios = httpResource<Accesorio[]>(() => `${API_PUBLICO}/accesorios`);
  protected readonly catalogo = computed(() => valorDe(this.accesorios) ?? []);
  protected readonly mensajeCarga = computed(() => mensajeDeError(this.accesorios.error()));

  protected readonly formulario = this.fb.group({
    metodoPago: this.fb.control<MetodoPago | ''>('', Validators.required),
    tipoFactura: this.fb.control<TipoFactura | ''>('', Validators.required),
    items: this.fb.array<Item>([this.nuevoItem()]),
  });

  private readonly valores = toSignal(this.formulario.valueChanges, {
    initialValue: this.formulario.getRawValue(),
  });
  protected readonly total = computed(() =>
    totalAccesorios(
      (this.valores().items ?? []).map((item) => ({
        cantidad: item.cantidad ?? null,
        precioUnitario: item.precioUnitario ?? null,
      })),
    ),
  );

  protected readonly cliente = signal<ClienteSede | null>(null);
  protected readonly errorCliente = signal<string | null>(null);
  protected readonly etapa = signal<'datos' | 'resumen'>('datos');
  protected readonly enviando = signal(false);
  protected readonly errorVenta = signal<string | null>(null);

  constructor() {
    const idCliente = this.ruta.snapshot.queryParamMap.get('cliente');
    if (idCliente) {
      this.http.get<ClienteSede>(`${API_VENDEDOR}/clientes/${idCliente}`).subscribe({
        next: (cliente) => this.cliente.set(cliente),
        error: (error: unknown) =>
          this.errorCliente.set(
            error instanceof HttpErrorResponse && error.status === 404
              ? 'El cliente indicado ya no existe. Búscalo de nuevo.'
              : mensajeDeError(error),
          ),
      });
    }
  }

  protected get items() {
    return this.formulario.controls.items;
  }

  protected error(control: FormControl<unknown>): string | null {
    return mensajeError(control, {
      min: 'Usa un valor mayor que cero.',
      max: 'La cantidad máxima es 99.',
    });
  }

  protected errorCampo(campo: string): string | null {
    return mensajeError(this.formulario.get(campo));
  }

  protected yaElegido(idAccesorio: number, indice: number): boolean {
    return this.items.controls.some(
      (item, i) => i !== indice && item.controls.idAccesorio.value === idAccesorio,
    );
  }

  protected subtotal(item: Item): number {
    return (item.controls.cantidad.value ?? 0) * (item.controls.precioUnitario.value ?? 0);
  }

  protected nombreAccesorio(item: Item): string {
    return (
      this.catalogo().find((a) => a.idAccesorio === item.controls.idAccesorio.value)?.nombre ?? ''
    );
  }

  protected agregar(): void {
    this.items.push(this.nuevoItem());
    this.enfocar(`#item-accesorio-${this.items.length - 1}`);
  }

  protected quitar(indice: number): void {
    this.items.removeAt(indice);
    this.enfocar(`#item-accesorio-${Math.max(indice - 1, 0)}`, '#agregar-item');
  }

  protected textoPago(): string {
    return textoPago(this.formulario.getRawValue());
  }

  protected revisar(): void {
    this.errorVenta.set(null);
    this.formulario.markAllAsTouched();
    this.errorCliente.set(this.cliente() ? null : 'Elige el cliente que compra.');
    if (this.formulario.invalid || !this.cliente() || this.items.length === 0) {
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
    const cliente = this.cliente();
    if (!cliente) {
      return;
    }
    const valores = this.formulario.getRawValue();
    const totalEnPantalla = this.total();
    this.enviando.set(true);
    this.errorVenta.set(null);
    this.http
      .post<VentaAccesorio>(`${API_VENDEDOR}/ventas-accesorio`, {
        idCliente: cliente.idCliente,
        metodoPago: valores.metodoPago,
        tipoFactura: valores.tipoFactura,
        items: valores.items,
      })
      .subscribe({
        next: (venta) => {
          const aviso = `Venta N.º ${venta.idVentaAccesorio} registrada por ${new PesosPipe().transform(venta.valorTotal)}.`;
          if (Number(venta.valorTotal) === totalEnPantalla) {
            this.toast.exito(aviso);
          } else {
            this.toast.info(`${aviso} El total calculado por el sistema difiere del mostrado.`);
          }
          void this.router.navigateByUrl('/vendedor/ventas');
        },
        error: (error: unknown) => {
          this.enviando.set(false);
          this.errorVenta.set(mensajeDeError(error));
          this.enfocar('#error-venta');
        },
      });
  }

  private nuevoItem(): Item {
    const item: Item = this.fb.group({
      idAccesorio: this.fb.control<number | null>(null, Validators.required),
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
    item.controls.idAccesorio.valueChanges.subscribe((id) => {
      const accesorio = this.catalogo().find((a) => a.idAccesorio === id);
      item.controls.precioUnitario.setValue(accesorio ? Number(accesorio.precio) : null);
    });
    return item;
  }

  private irA(etapa: 'datos' | 'resumen'): void {
    this.etapa.set(etapa);
    this.enfocar('#titulo-etapa');
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
