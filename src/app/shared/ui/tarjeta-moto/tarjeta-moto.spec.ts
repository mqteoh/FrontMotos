import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TarjetaMoto } from './tarjeta-moto';

describe('TarjetaMoto', () => {
  it('muestra la placa, los datos técnicos y enlaza a la ficha', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TarjetaMoto);
    fixture.componentRef.setInput('moto', {
      placa: 'GTK22F',
      marca: 'Yamaha',
      modelo: 'NMAX 155',
      tipoMoto: 'SCOOTER',
      cilindraje: 155,
      anio: 2026,
      color: 'Gris mate',
      precio: 15900000,
      idSucursal: 1,
      sucursal: 'Sede Chapinero',
      ciudad: 'Bogotá',
    });
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelector('app-placa')?.textContent).toBe('Placa GTK22F');
    expect(raiz.querySelector('a')?.getAttribute('href')).toBe('/motos/GTK22F');
    expect(raiz.querySelector('[role="heading"]')?.getAttribute('aria-level')).toBe('2');
    expect(raiz.querySelector('.tarjeta__datos')?.textContent).toContain('Scooter');
    expect(raiz.querySelector('app-foto-moto')?.textContent).toContain('Foto no disponible');
    expect(raiz.querySelector('.tarjeta__precio')?.textContent?.replace(/\s/g, '')).toBe(
      '$15.900.000',
    );
  });
});
