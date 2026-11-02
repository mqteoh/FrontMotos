import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reparacion } from '../../core/api/modelos';
import { esAtrasada, hora } from '../../core/api/tecnico-api';
import { FechaPipe } from '../../shared/formato/fecha.pipe';
import { PesosPipe } from '../../shared/formato/pesos.pipe';
import { ChipEstado } from '../../shared/ui/chip-estado/chip-estado';
import { Icono } from '../../shared/ui/icono/icono';
import { Placa } from '../../shared/ui/placa/placa';

@Component({
  selector: 'app-tarjeta-reparacion',
  imports: [RouterLink, ChipEstado, Icono, Placa, FechaPipe, PesosPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tarjeta-cuenta tarjeta-reparacion',
    '[class.tarjeta-reparacion--atrasada]': 'atrasada()',
  },
  template: `
    <div class="tarjeta-reparacion__tiempo">
      @if (soloHora()) {
        <span class="dato tarjeta-reparacion__hora">{{ horaCita() }}</span>
      } @else {
        <span class="dato">{{ reparacion().fechaAgendada | fecha: true }}</span>
      }
      @if (atrasada()) {
        <span class="tarjeta-reparacion__atraso"><app-icono nombre="vencido" />Atrasada</span>
      }
    </div>
    <div class="tarjeta-cuenta__cabecera">
      <app-placa [placa]="reparacion().placa" />
      <p class="tarjeta-cuenta__titulo">
        <a
          class="tarjeta-reparacion__enlace"
          [routerLink]="['/tecnico/reparaciones', reparacion().idReparacion]"
        >
          {{ reparacion().marca }} {{ reparacion().modelo }}
          <span class="sr-only">, reparación N.º {{ reparacion().idReparacion }}</span>
        </a>
      </p>
      <app-chip-estado [estado]="reparacion().estado" />
    </div>
    <p class="tarjeta-cuenta__texto">{{ reparacion().descripcion }}</p>
    <p class="muted pequeno">
      {{ reparacion().cliente }} ·
      {{ reparacion().tecnico ?? 'Sin técnico asignado' }}
      @if (mostrarSede()) {
        · {{ reparacion().sucursal }}
      }
      @if (reparacion().estado === 'FINALIZADA' && reparacion().costoTotal !== null) {
        · <span class="dato">{{ reparacion().costoTotal | pesos }}</span>
      }
    </p>
  `,
})
export class TarjetaReparacion {
  readonly reparacion = input.required<Reparacion>();
  readonly soloHora = input(false);
  readonly mostrarSede = input(false);
  protected readonly atrasada = computed(() => esAtrasada(this.reparacion()));
  protected readonly horaCita = computed(() => hora(this.reparacion().fechaAgendada));
}
