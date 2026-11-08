import { TestBed } from '@angular/core/testing';
import { FotoMoto, rutaFotoModelo } from './foto-moto';

describe('FotoMoto', () => {
  async function crear(entradas: Record<string, unknown>) {
    const fixture = TestBed.createComponent(FotoMoto);
    for (const [nombre, valor] of Object.entries(entradas)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    await fixture.whenStable();
    return { fixture, raiz: fixture.nativeElement as HTMLElement };
  }

  it('arma la ruta de la foto con la marca y el modelo sin tildes ni símbolos', () => {
    expect(rutaFotoModelo('TVS', 'Apache RTR 160 4V')).toBe('/motos/tvs-apache-rtr-160-4v.webp');
    expect(rutaFotoModelo('Yamaha', 'FZ 2.0')).toBe('/motos/yamaha-fz-2-0.webp');
    expect(rutaFotoModelo('Suzuki', 'V-Strom 250 SX')).toBe('/motos/suzuki-v-strom-250-sx.webp');
    expect(rutaFotoModelo('Marca Ñandú', 'Única')).toBe('/motos/marca-nandu-unica.webp');
  });

  it('muestra la foto del modelo y vuelve al ícono si la foto no existe', async () => {
    const { fixture, raiz } = await crear({ tipo: 'NAKED', marca: 'KTM', modelo: 'Duke 200' });
    const foto = raiz.querySelector('img');
    expect(foto?.getAttribute('src')).toBe('/motos/ktm-duke-200.webp');
    expect(foto?.getAttribute('loading')).toBe('lazy');

    foto?.dispatchEvent(new Event('error'));
    await fixture.whenStable();

    expect(raiz.querySelector('img')).toBeNull();
    expect(raiz.textContent).toContain('Foto no disponible');
  });

  it('sin marca ni modelo muestra el ícono del tipo de moto', async () => {
    const { raiz } = await crear({ tipo: 'SCOOTER' });
    expect(raiz.querySelector('img')).toBeNull();
    expect(raiz.querySelector('app-icono')).not.toBeNull();
    expect(raiz.textContent).toContain('Foto no disponible');
  });

  it('carga de inmediato la foto principal de la ficha', async () => {
    const { raiz } = await crear({
      tipo: 'NAKED',
      marca: 'Honda',
      modelo: 'CB 190R',
      principal: true,
    });
    const foto = raiz.querySelector('img');
    expect(foto?.getAttribute('loading')).toBe('eager');
    expect(foto?.getAttribute('fetchpriority')).toBe('high');
  });
});
