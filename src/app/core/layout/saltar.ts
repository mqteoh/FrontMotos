import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-saltar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="btn btn--primario saltar" (click)="saltar()">
      Saltar al contenido
    </button>
  `,
})
export class Saltar {
  protected saltar(): void {
    document.getElementById('contenido')?.focus();
  }
}
