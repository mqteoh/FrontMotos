import { TestBed } from '@angular/core/testing';
import { TemaService } from './tema.service';

describe('TemaService', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  it('parte del tema que dejó el script inicial y recuerda el cambio', async () => {
    document.documentElement.setAttribute('data-theme', 'light');
    const servicio = TestBed.inject(TemaService);
    expect(servicio.tema()).toBe('light');

    servicio.alternar();
    TestBed.tick();
    expect(servicio.tema()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('tema')).toBe('dark');
  });
});
