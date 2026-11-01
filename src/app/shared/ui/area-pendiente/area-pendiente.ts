import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-area-pendiente',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pagina" aria-labelledby="titulo-area">
      <h1 id="titulo-area">{{ titulo() }}</h1>
      <p>{{ descripcion() }}</p>
      <p class="aviso">En construcción: esta área se completa en la fase {{ fase() }}.</p>
    </section>
  `,
})
export class AreaPendiente {
  readonly titulo = input.required<string>();
  readonly descripcion = input.required<string>();
  readonly fase = input.required<string>();
}
