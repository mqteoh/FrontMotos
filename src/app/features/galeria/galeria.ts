import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EstadoReserva, MotoCatalogo } from '../../core/api/modelos';
import { enfocarPrimerInvalido, mensajeError } from '../../shared/formularios/mensajes';
import { Campo, Control } from '../../shared/ui/campo/campo';
import { ChipEstado } from '../../shared/ui/chip-estado/chip-estado';
import { ConfirmacionService } from '../../shared/ui/confirmacion/confirmacion.service';
import { Dialogo } from '../../shared/ui/dialogo/dialogo';
import { Esqueleto } from '../../shared/ui/esqueleto/esqueleto';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { EstadoVacio } from '../../shared/ui/estado-vacio/estado-vacio';
import { Icono } from '../../shared/ui/icono/icono';
import { Placa } from '../../shared/ui/placa/placa';
import { Columna, Tabla } from '../../shared/ui/tabla/tabla';
import { TarjetaMoto } from '../../shared/ui/tarjeta-moto/tarjeta-moto';
import { ToastService } from '../../shared/ui/toast/toast.service';

interface ReservaEjemplo {
  id: number;
  placa: string;
  fechaReserva: string;
  fechaVencimiento: string;
  estado: EstadoReserva;
}

type EstadoDemo = 'cargando' | 'vacio' | 'error';

const MOTOS: MotoCatalogo[] = [
  {
    placa: 'GTK22F',
    marca: 'Yamaha',
    modelo: 'NMAX 155',
    tipoMoto: 'SCOOTER',
    cilindraje: 155,
    anio: 2026,
    color: 'Gris mate',
    precio: 15900000,
    idSucursal: 1,
    sucursal: 'Sede Chapinero',
    ciudad: 'Bogotá',
  },
  {
    placa: 'HBN45C',
    marca: 'Yamaha',
    modelo: 'MT-03',
    tipoMoto: 'NAKED',
    cilindraje: 321,
    anio: 2026,
    color: 'Negro',
    precio: 27900000,
    idSucursal: 1,
    sucursal: 'Sede Chapinero',
    ciudad: 'Bogotá',
  },
  {
    placa: 'MNP13E',
    marca: 'Kawasaki',
    modelo: 'Ninja 400',
    tipoMoto: 'DEPORTIVA',
    cilindraje: 399,
    anio: 2026,
    color: 'Verde',
    precio: 32500000,
    idSucursal: 1,
    sucursal: 'Sede Chapinero',
    ciudad: 'Bogotá',
  },
  {
    placa: 'WXY90G',
    marca: 'Yamaha',
    modelo: 'XTZ 150',
    tipoMoto: 'DOBLE_PROPOSITO',
    cilindraje: 149,
    anio: 2026,
    color: 'Azul',
    precio: 12900000,
    idSucursal: 3,
    sucursal: 'Sede Laureles',
    ciudad: 'Medellín',
  },
];

const RESERVAS: ReservaEjemplo[] = [
  {
    id: 1,
    placa: 'HBN46C',
    fechaReserva: '2026-02-20T10:15:00',
    fechaVencimiento: '2026-02-27',
    estado: 'ACTIVA',
  },
  {
    id: 4,
    placa: 'TUV58B',
    fechaReserva: '2026-05-11T11:30:00',
    fechaVencimiento: '2026-05-18',
    estado: 'CANCELADA',
  },
  {
    id: 5,
    placa: 'ZAB12H',
    fechaReserva: '2026-06-01T14:00:00',
    fechaVencimiento: '2026-06-08',
    estado: 'VENCIDA',
  },
  {
    id: 8,
    placa: 'MNP12E',
    fechaReserva: '2026-10-27T09:45:00',
    fechaVencimiento: '2026-11-03',
    estado: 'ACTIVA',
  },
];

@Component({
  selector: 'app-galeria',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Campo,
    Control,
    ChipEstado,
    Dialogo,
    Esqueleto,
    EstadoError,
    EstadoVacio,
    Icono,
    Placa,
    Tabla,
    TarjetaMoto,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './galeria.html',
  styles: `
    :host {
      display: grid;
      gap: var(--space-section);
    }
    section {
      display: grid;
      gap: var(--space-2);
      justify-items: start;
    }
    section > :is(.grid-motos, app-tabla, .demo-estado) {
      justify-self: stretch;
    }
    .fila {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1) var(--space-2);
      align-items: center;
    }
  `,
})
export default class Galeria {
  private readonly toast = inject(ToastService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly motos = MOTOS;
  protected readonly estados = [
    'ACTIVA',
    'CONCRETADA',
    'CANCELADA',
    'VENCIDA',
    'AGENDADA',
    'EN_PROCESO',
    'FINALIZADA',
  ];
  protected readonly reservas = signal(RESERVAS);
  protected readonly columnas: Columna<ReservaEjemplo>[] = [
    { clave: 'id', titulo: 'N.º', tipo: 'numero', ordenable: true },
    { clave: 'placa', titulo: 'Placa', tipo: 'placa', ordenable: true },
    { clave: 'fechaReserva', titulo: 'Reservada', tipo: 'fecha-hora', ordenable: true },
    { clave: 'fechaVencimiento', titulo: 'Vence', tipo: 'fecha', ordenable: true },
    { clave: 'estado', titulo: 'Estado', tipo: 'estado', ordenable: true },
  ];
  protected readonly claveReserva = (reserva: ReservaEjemplo) => reserva.id;

  protected readonly dialogoAbierto = signal(false);
  protected readonly estadoDemo = signal<EstadoDemo>('cargando');

  protected readonly formulario = inject(NonNullableFormBuilder).group({
    nombre: ['', [Validators.required, Validators.maxLength(60)]],
    correo: ['', [Validators.required, Validators.email]],
    ciudad: ['', Validators.required],
    contrasena: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected readonly error = mensajeError;

  protected accion(texto: string): void {
    this.toast.info(`Botón de ejemplo pulsado: «${texto}».`);
  }

  protected cancelarPrimeraActiva(): void {
    const activa = this.reservas().find((reserva) => reserva.estado === 'ACTIVA');
    if (activa) {
      void this.cancelarReserva(activa);
    } else {
      this.toast.info('No quedan reservas activas en la tabla de ejemplo.');
    }
  }

  protected async cancelarReserva(reserva: ReservaEjemplo): Promise<void> {
    const confirmado = await this.confirmacion.confirmar({
      titulo: `¿Cancelar la reserva N.º ${reserva.id}?`,
      mensaje: `La moto ${reserva.placa} vuelve a quedar disponible para otros clientes. Esta acción no se puede deshacer.`,
      accion: 'Cancelar reserva',
      peligro: true,
    });
    if (!confirmado) {
      return;
    }
    this.reservas.update((lista) =>
      lista.map((r) => (r.id === reserva.id ? { ...r, estado: 'CANCELADA' } : r)),
    );
    this.toast.exito(`Reserva N.º ${reserva.id} cancelada.`);
  }

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      afterNextRender(() => enfocarPrimerInvalido(this.elemento.nativeElement), {
        injector: this.injector,
      });
      this.toast.error('Revisa los campos marcados antes de continuar.');
      return;
    }
    this.toast.exito(`Datos válidos para ${this.formulario.getRawValue().nombre}.`);
    this.formulario.reset();
  }

  protected mostrarAviso(tipo: 'exito' | 'error' | 'info'): void {
    const mensajes = {
      exito: 'Reserva registrada. Vence en 7 días.',
      error: 'No se pudo guardar la venta. Inténtalo de nuevo.',
      info: 'Una reserva dura 7 días; después vence sola.',
    };
    this.toast[tipo](mensajes[tipo]);
  }
}
