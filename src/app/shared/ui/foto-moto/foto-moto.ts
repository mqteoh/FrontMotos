import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icono } from '../icono/icono';

@Component({
  selector: 'app-foto-moto',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'foto-moto' },
  template: `<app-icono [nombre]="icono()" /><span>Foto no disponible</span>`,
})
export class FotoMoto {
  readonly tipo = input.required<string>();
  protected readonly icono = computed(() => (this.tipo() === 'SCOOTER' ? 'scooter' : 'moto'));
}
