import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { guardarSesionDePrueba } from '../../testing/sesion';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let router: Router;

  function configurar() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  }

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('agrega el token a la API pero no al inicio de sesión', () => {
    guardarSesionDePrueba('VENDEDOR', 'abc123');
    configurar();
    http.get('/api/vendedor/reservas').subscribe();
    http.post('/auth/login', {}).subscribe();
    expect(backend.expectOne('/api/vendedor/reservas').request.headers.get('Authorization')).toBe(
      'Bearer abc123',
    );
    expect(backend.expectOne('/auth/login').request.headers.has('Authorization')).toBe(false);
  });

  it('un 401 con sesión la cierra y lleva al inicio de sesión', () => {
    guardarSesionDePrueba('CLIENTE');
    configurar();
    http.get('/api/cliente/reservas').subscribe({ error: () => undefined });
    backend
      .expectOne('/api/cliente/reservas')
      .flush({ mensaje: 'Sesión vencida' }, { status: 401, statusText: 'Unauthorized' });
    expect(TestBed.inject(AuthService).usuario()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/ingresar'], expect.anything());
  });

  it('un 403 al consultar muestra la pantalla de sin permiso; al modificar no', () => {
    guardarSesionDePrueba('DUENO');
    configurar();
    http.get('/api/tecnico/agenda').subscribe({ error: () => undefined });
    http.post('/api/vendedor/ventas-moto', {}).subscribe({ error: () => undefined });
    const prohibido = { status: 403, statusText: 'Forbidden' };
    backend.expectOne('/api/tecnico/agenda').flush({ mensaje: 'No' }, prohibido);
    backend.expectOne('/api/vendedor/ventas-moto').flush({ mensaje: 'No' }, prohibido);
    expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/sin-permiso', { skipLocationChange: true });
    expect(TestBed.inject(AuthService).usuario()?.rol).toBe('DUENO');
  });
});
