import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icono } from '../icono/icono';
import { NombreIcono } from '../icono/iconos';

@Component({
  selector: 'app-estado-vacio',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'estado-datos estado-datos--vacio' },
  template: `
    <p class="estado-datos__titulo"><app-icono [nombre]="icono()" />{{ titulo() }}</p>
    <p class="estado-datos__mensaje">{{ mensaje() }}</p>
    <ng-content />
  `,
})
export class EstadoVacio {
  readonly titulo = input.required<string>();
  readonly mensaje = input.required<string>();
  readonly icono = input<NombreIcono>('info');
}
