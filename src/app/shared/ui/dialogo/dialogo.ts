import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  model,
  viewChild,
} from '@angular/core';
import { Icono } from '../icono/icono';

let siguienteDialogo = 0;

@Component({
  selector: 'app-dialogo',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialogo
      class="dialogo"
      [attr.aria-labelledby]="idTitulo"
      [attr.aria-describedby]="idCuerpo"
      (cancel)="alCancelar($event)"
      (close)="cerrar()"
    >
      <div class="dialogo__cabecera">
        <h2 [id]="idTitulo">{{ titulo() }}</h2>
        <button type="button" class="btn btn--icono" aria-label="Cerrar" (click)="cerrar()">
          <app-icono nombre="cerrar" />
        </button>
      </div>
      <div class="dialogo__cuerpo" [id]="idCuerpo"><ng-content /></div>
      <div class="dialogo__pie"><ng-content select="[pie]" /></div>
    </dialog>
  `,
})
export class Dialogo {
  readonly titulo = input.required<string>();
  readonly abierto = model(false);

  protected readonly idTitulo = `dialogo-${++siguienteDialogo}-titulo`;
  protected readonly idCuerpo = `dialogo-${siguienteDialogo}-cuerpo`;

  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');
  private origen: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const elemento = this.dialogo().nativeElement;
      if (this.abierto()) {
        if (!elemento.open) {
          this.origen =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
          elemento.showModal();
        }
        return;
      }
      if (elemento.open) {
        elemento.close();
      }
      if (this.origen) {
        const destino = this.origen.isConnected ? this.origen : document.querySelector('main');
        destino?.focus();
      }
      this.origen = null;
    });
  }

  protected alCancelar(evento: Event): void {
    evento.preventDefault();
    this.cerrar();
  }

  protected cerrar(): void {
    if (this.abierto()) {
      this.abierto.set(false);
    }
  }
}
