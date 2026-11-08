import { TestBed } from '@angular/core/testing';
import { ESPERA_LENTA_MS, Esqueleto } from './esqueleto';

describe('Esqueleto', () => {
  afterEach(() => vi.useRealTimers());

  it('avisa cuando la carga tarda más de lo habitual sin mover el diseño', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(Esqueleto);
    fixture.componentRef.setInput('etiqueta', 'Cargando ventas');
    fixture.detectChanges();
    const aviso = () => (fixture.nativeElement as HTMLElement).querySelector('.esqueleto__aviso');
    expect(aviso()).not.toBeNull();
    expect(aviso()?.textContent?.trim()).toBe('');

    vi.advanceTimersByTime(ESPERA_LENTA_MS);
    fixture.detectChanges();
    expect(aviso()?.textContent?.trim()).toBe(
      'Sigue cargando. El servidor está tardando más de lo habitual.',
    );
    expect(aviso()?.closest('[role="status"]')).not.toBeNull();
  });
});
