import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Columna, Tabla } from './tabla';

interface Fila {
  id: number;
  placa: string;
  precio: number;
  estado: string;
}

@Component({
  imports: [Tabla],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-tabla titulo="Motos" [columnas]="columnas" [filas]="filas" [claveFila]="clave">
      <ng-template #acciones let-fila>
        <button type="button">Vender {{ fila.placa }}</button>
      </ng-template>
    </app-tabla>
  `,
})
class Anfitrion {
  columnas: Columna<Fila>[] = [
    { clave: 'placa', titulo: 'Placa', tipo: 'placa', ordenable: true },
    { clave: 'precio', titulo: 'Precio', tipo: 'pesos', ordenable: true },
    { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
  ];
  filas: Fila[] = [
    { id: 1, placa: 'HBN45C', precio: 27900000, estado: 'ACTIVA' },
    { id: 2, placa: 'GTK22F', precio: 15900000, estado: 'VENCIDA' },
    { id: 3, placa: 'MNP13E', precio: 32500000, estado: 'CANCELADA' },
  ];
  clave = (fila: Fila) => fila.id;
}

describe('Tabla', () => {
  async function montar() {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    return { fixture, raiz: fixture.nativeElement as HTMLElement };
  }

  const placas = (raiz: HTMLElement) =>
    [...raiz.querySelectorAll('tbody app-placa')].map((p) => p.textContent?.replace('Placa ', ''));

  it('ordena por columna y refleja el orden en aria-sort', async () => {
    const { fixture, raiz } = await montar();
    const [thPlaca, thPrecio, thEstado] = [...raiz.querySelectorAll('th')];
    expect(thPlaca.getAttribute('aria-sort')).toBe('none');
    expect(thEstado.hasAttribute('aria-sort')).toBe(false);

    thPrecio.querySelector('button')?.click();
    await fixture.whenStable();
    expect(thPrecio.getAttribute('aria-sort')).toBe('ascending');
    expect(placas(raiz)).toEqual(['GTK22F', 'HBN45C', 'MNP13E']);

    thPrecio.querySelector('button')?.click();
    await fixture.whenStable();
    expect(thPrecio.getAttribute('aria-sort')).toBe('descending');
    expect(placas(raiz)).toEqual(['MNP13E', 'HBN45C', 'GTK22F']);
  });

  it('muestra precios, estados y acciones por fila con su etiqueta para móvil', async () => {
    const { raiz } = await montar();
    const celdas = raiz.querySelectorAll('tbody tr:first-child td');
    expect(celdas[1].textContent?.replace(/\s/g, '')).toBe('$27.900.000');
    expect(celdas[1].classList).toContain('num');
    expect(celdas[2].textContent?.trim()).toBe('Activa');
    expect(celdas[3].getAttribute('data-etiqueta')).toBe('Acciones');
    expect(celdas[3].textContent?.trim()).toBe('Vender HBN45C');
    expect(raiz.querySelector('caption')?.textContent).toBe('Motos');
  });
});
