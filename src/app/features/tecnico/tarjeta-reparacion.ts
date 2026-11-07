import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reparacion } from '../../core/api/modelos';
import { nombresTecnicos } from '../../core/api/tecnico-api';
import { FechaPipe } from '../../shared/formato/fecha.pipe';
import { PesosPipe } from '../../shared/formato/pesos.pipe';
import { Placa } from '../../shared/ui/placa/placa';

@Component({
  selector: 'app-tarjeta-reparacion',
  imports: [RouterLink, Placa, FechaPipe, PesosPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tarjeta-cuenta tarjeta-reparacion' },
  template: `
    <div class="tarjeta-reparacion__tiempo">
      <span class="dato">{{ reparacion().fecha | fecha }}</span>
      <span class="dato tarjeta-reparacion__total">{{ reparacion().costoTotal | pesos }}</span>
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
    </div>
    <p class="tarjeta-cuenta__texto">{{ reparacion().descripcion }}</p>
    <p class="muted pequeno">
      {{ tecnicos() }}
      @if (reparacion().cliente) {
        · Cliente: {{ reparacion().cliente }}
      }
      @if (mostrarSede() && reparacion().sucursal) {
        · {{ reparacion().sucursal }}
      }
    </p>
  `,
})
export class TarjetaReparacion {
  readonly reparacion = input.required<Reparacion>();
  readonly mostrarSede = input(false);
  protected readonly tecnicos = computed(() => nombresTecnicos(this.reparacion()));
}
