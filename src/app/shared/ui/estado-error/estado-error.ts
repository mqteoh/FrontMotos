import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icono } from '../icono/icono';

@Component({
  selector: 'app-estado-error',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'estado-datos estado-datos--error', role: 'alert' },
  template: `
    <p class="estado-datos__titulo"><app-icono nombre="error" />{{ titulo() }}</p>
    <p class="estado-datos__mensaje">{{ mensaje() }}</p>
    <div class="acciones">
      <button type="button" class="btn btn--secundario" (click)="reintentar.emit()">
        <app-icono nombre="reintentar" />Reintentar
      </button>
      <ng-content />
    </div>
  `,
})
export class EstadoError {
  readonly titulo = input.required<string>();
  readonly mensaje = input('Revisa tu conexión a internet e inténtalo de nuevo.');
  readonly reintentar = output();
}
