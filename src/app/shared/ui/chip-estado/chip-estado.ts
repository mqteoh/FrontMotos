import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EstadoReparacion, EstadoReserva } from '../../../core/api/modelos';
import { Icono } from '../icono/icono';
import { NombreIcono } from '../icono/iconos';

type Tono = 'activo' | 'proceso' | 'neutro' | 'peligro';

interface Presentacion {
  texto: string;
  icono: NombreIcono;
  tono: Tono;
}

const ESTADOS: Record<EstadoReserva | EstadoReparacion, Presentacion> = {
  ACTIVA: { texto: 'Activa', icono: 'reloj', tono: 'activo' },
  CONCRETADA: { texto: 'Concretada', icono: 'concretada', tono: 'neutro' },
  CANCELADA: { texto: 'Cancelada', icono: 'cancelado', tono: 'peligro' },
  VENCIDA: { texto: 'Vencida', icono: 'vencido', tono: 'neutro' },
  AGENDADA: { texto: 'Agendada', icono: 'agendada', tono: 'activo' },
  EN_PROCESO: { texto: 'En proceso', icono: 'taller', tono: 'proceso' },
  FINALIZADA: { texto: 'Finalizada', icono: 'exito', tono: 'neutro' },
};

@Component({
  selector: 'app-chip-estado',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': "'chip chip--' + presentacion().tono" },
  template: `<app-icono [nombre]="presentacion().icono" />{{ presentacion().texto }}`,
})
export class ChipEstado {
  readonly estado = input.required<string>();
  protected readonly presentacion = computed<Presentacion>(
    () =>
      ESTADOS[this.estado() as EstadoReserva | EstadoReparacion] ?? {
        texto: this.estado(),
        icono: 'info',
        tono: 'neutro',
      },
  );
}
