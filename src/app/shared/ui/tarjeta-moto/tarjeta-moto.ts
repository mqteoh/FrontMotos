import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MotoCatalogo } from '../../../core/api/modelos';
import { PesosPipe } from '../../formato/pesos.pipe';
import { nombreTipoMoto } from '../../formato/tipos-moto';
import { FotoMoto } from '../foto-moto/foto-moto';
import { Icono } from '../icono/icono';
import { Placa } from '../placa/placa';

@Component({
  selector: 'app-tarjeta-moto',
  imports: [RouterLink, FotoMoto, Icono, Placa, PesosPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tarjeta' },
  template: `
    <app-foto-moto [tipo]="moto().tipoMoto" />
    <div class="tarjeta__cuerpo">
      <app-placa [placa]="moto().placa" />
      <p class="tarjeta__titulo" role="heading" [attr.aria-level]="nivelTitulo()">
        <a class="tarjeta__enlace" [routerLink]="['/motos', moto().placa]">
          {{ moto().marca }} {{ moto().modelo }}
        </a>
      </p>
      <dl class="tarjeta__datos">
        <div>
          <dt>Tipo</dt>
          <dd>{{ tipo() }}</dd>
        </div>
        <div>
          <dt>Motor</dt>
          <dd class="dato">{{ moto().cilindraje }}<span class="dato__unidad">cc</span></dd>
        </div>
        <div>
          <dt>Año</dt>
          <dd class="dato">{{ moto().anio }}</dd>
        </div>
      </dl>
      <p class="tarjeta__precio dato">{{ moto().precio | pesos }}</p>
      <p class="tarjeta__sede">
        <app-icono nombre="sede" />{{ moto().sucursal }}, {{ moto().ciudad }}
      </p>
    </div>
  `,
})
export class TarjetaMoto {
  readonly moto = input.required<MotoCatalogo>();
  readonly nivelTitulo = input(2);
  protected readonly tipo = computed(() => nombreTipoMoto(this.moto().tipoMoto));
}
