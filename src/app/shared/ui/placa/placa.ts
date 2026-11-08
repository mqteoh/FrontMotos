import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-placa',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'placa', '[class.placa--grande]': 'grande()' },
  template: `<span class="sr-only">Placa </span>{{ placa() }}`,
})
export class Placa {
  readonly placa = input.required<string>();
  readonly grande = input(false);
}
