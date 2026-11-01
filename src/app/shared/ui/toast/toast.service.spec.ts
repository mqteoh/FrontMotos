import { TestBed } from '@angular/core/testing';
import { DURACION_TOAST_MS, ToastService } from './toast.service';

describe('ToastService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('cierra cada aviso a los 5 segundos', () => {
    const servicio = TestBed.inject(ToastService);
    servicio.exito('Reserva registrada.');
    vi.advanceTimersByTime(1000);
    servicio.error('No se pudo guardar.');
    expect(servicio.toasts().map((t) => t.tipo)).toEqual(['exito', 'error']);

    vi.advanceTimersByTime(DURACION_TOAST_MS - 1000);
    expect(servicio.toasts().map((t) => t.mensaje)).toEqual(['No se pudo guardar.']);

    vi.advanceTimersByTime(1000);
    expect(servicio.toasts()).toEqual([]);
  });

  it('permite cerrar un aviso antes de tiempo', () => {
    const servicio = TestBed.inject(ToastService);
    servicio.info('Una reserva dura 7 días.');
    servicio.cerrar(servicio.toasts()[0].id);
    expect(servicio.toasts()).toEqual([]);
  });
});
