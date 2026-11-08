import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { Icono } from '../icono/icono';

function parteRuta(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function rutaFotoModelo(marca: string, modelo: string): string {
  return `/motos/${parteRuta(marca)}-${parteRuta(modelo)}.webp`;
}

@Component({
  selector: 'app-foto-moto',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'foto-moto', '[class.foto-moto--con-foto]': 'mostrarFoto()' },
  template: `
    @if (mostrarFoto()) {
      <img
        [src]="ruta()"
        alt=""
        width="800"
        height="600"
        decoding="async"
        [attr.loading]="principal() ? 'eager' : 'lazy'"
        [attr.fetchpriority]="principal() ? 'high' : null"
        (error)="fallo.set(true)"
      />
    } @else {
      <app-icono [nombre]="icono()" /><span>Foto no disponible</span>
    }
  `,
})
export class FotoMoto {
  readonly tipo = input.required<string>();
  readonly marca = input<string>();
  readonly modelo = input<string>();
  readonly principal = input(false);
  protected readonly icono = computed(() => (this.tipo() === 'SCOOTER' ? 'scooter' : 'moto'));
  protected readonly ruta = computed(() => {
    const marca = this.marca();
    const modelo = this.modelo();
    return marca && modelo ? rutaFotoModelo(marca, modelo) : null;
  });
  protected readonly fallo = linkedSignal({ source: this.ruta, computation: () => false });
  protected readonly mostrarFoto = computed(() => this.ruta() !== null && !this.fallo());
}
