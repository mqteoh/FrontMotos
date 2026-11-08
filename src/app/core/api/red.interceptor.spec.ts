import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { mensajeDeError } from './errores';
import {
  ESPERA_MAXIMA_MS,
  MENSAJE_ESPERA_CAMBIO,
  MENSAJE_ESPERA_LECTURA,
  redInterceptor,
} from './red.interceptor';

describe('Interceptor de red', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([redInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
    vi.useRealTimers();
  });

  it('reintenta una lectura cuando el servidor no está disponible', () => {
    const respuesta = vi.fn();
    http.get('/api/publico/sucursales').subscribe(respuesta);

    backend
      .expectOne('/api/publico/sucursales')
      .flush(null, { status: 503, statusText: 'No disponible' });
    vi.advanceTimersByTime(1_000);
    backend.expectOne('/api/publico/sucursales').flush(null, { status: 0, statusText: '' });
    vi.advanceTimersByTime(2_000);
    backend.expectOne('/api/publico/sucursales').flush([{ idSucursal: 1 }]);

    expect(respuesta).toHaveBeenCalledWith([{ idSucursal: 1 }]);
  });

  it('no reintenta errores de datos ni operaciones que cambian información', () => {
    const errores: unknown[] = [];
    http.get('/api/admin/marcas/99').subscribe({ error: (e) => errores.push(e) });
    backend.expectOne('/api/admin/marcas/99').flush(null, { status: 404, statusText: 'No existe' });

    http.post('/api/admin/marcas', {}).subscribe({ error: (e) => errores.push(e) });
    backend
      .expectOne('/api/admin/marcas')
      .flush(null, { status: 503, statusText: 'No disponible' });
    vi.advanceTimersByTime(5_000);
    backend.expectNone('/api/admin/marcas');

    expect(errores).toHaveLength(2);
  });

  it('corta la espera con un mensaje distinto para lecturas y cambios', () => {
    const errores: unknown[] = [];
    http.get('/api/vendedor/ventas-moto').subscribe({ error: (e) => errores.push(e) });
    http.put('/api/admin/marcas/1', {}).subscribe({ error: (e) => errores.push(e) });
    const lectura = backend.expectOne('/api/vendedor/ventas-moto');
    const cambio = backend.expectOne('/api/admin/marcas/1');

    vi.advanceTimersByTime(ESPERA_MAXIMA_MS);

    expect(lectura.cancelled).toBe(true);
    expect(cambio.cancelled).toBe(true);
    expect(errores.map(mensajeDeError)).toEqual([MENSAJE_ESPERA_LECTURA, MENSAJE_ESPERA_CAMBIO]);
  });
});
