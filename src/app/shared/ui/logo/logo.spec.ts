import { TestBed } from '@angular/core/testing';
import { Logo } from './logo';

describe('Logo', () => {
  it('trae una versión del logo para cada tema, sin texto alternativo repetido', async () => {
    const fixture = TestBed.createComponent(Logo);
    await fixture.whenStable();
    const imagenes = [...(fixture.nativeElement as HTMLElement).querySelectorAll('img')];

    expect(imagenes.map((img) => img.getAttribute('src'))).toEqual([
      '/marca/logo-claro.png',
      '/marca/logo-oscuro.png',
    ]);
    expect(imagenes.every((img) => img.getAttribute('alt') === '')).toBe(true);
  });
});
