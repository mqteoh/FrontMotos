import { FechaPipe, aFecha } from './fecha.pipe';
import { PesosPipe } from './pesos.pipe';
import { nombreTipoMoto } from './tipos-moto';

describe('Formatos', () => {
  it('muestra pesos colombianos sin decimales', () => {
    const pesos = new PesosPipe();
    expect(pesos.transform(15900000).replace(/\s/g, '')).toBe('$15.900.000');
    expect(pesos.transform('27900000.00').replace(/\s/g, '')).toBe('$27.900.000');
    expect(pesos.transform(null)).toBe('');
  });

  it('lee las fechas sin hora como fecha local', () => {
    const fecha = aFecha('2026-11-03');
    expect([fecha.getFullYear(), fecha.getMonth(), fecha.getDate()]).toEqual([2026, 10, 3]);
    expect(new FechaPipe().transform('2026-11-03')).toMatch(/^3 de nov\.? de 2026$/);
    expect(new FechaPipe().transform('2026-10-27T09:45:00', true)).toContain('9:45');
    expect(new FechaPipe().transform('')).toBe('');
  });

  it('nombra los tipos de moto del back', () => {
    expect(nombreTipoMoto('DOBLE_PROPOSITO')).toBe('Doble propósito');
    expect(nombreTipoMoto('OTRO')).toBe('OTRO');
  });
});
