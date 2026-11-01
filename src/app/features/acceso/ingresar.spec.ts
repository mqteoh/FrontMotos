import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { USUARIOS_PRUEBA } from '../../testing/sesion';
import Ingresar, { rutaSegura } from './ingresar';

describe('Ingresar', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'ingresar', component: Ingresar }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  async function montar(url = '/ingresar') {
    const harness = await RouterTestingHarness.create(url);
    const raiz = harness.fixture.nativeElement as HTMLElement;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const escribir = (nombre: string, valor: string) => {
      const input = raiz.querySelector<HTMLInputElement>(`[formcontrolname="${nombre}"]`);
      if (input) {
        input.value = valor;
        input.dispatchEvent(new Event('input'));
      }
    };
    const enviar = async () => {
      raiz.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
      await harness.fixture.whenStable();
    };
    return { harness, raiz, router, escribir, enviar };
  }

  it('valida en el navegador antes de llamar al back', async () => {
    const { raiz, enviar } = await montar();
    await enviar();
    backend.expectNone('/auth/login');
    expect(raiz.querySelectorAll('[aria-invalid="true"]').length).toBe(2);
    expect(raiz.querySelector('.campo__error')?.textContent?.trim()).toBe(
      'Este campo es obligatorio.',
    );
  });

  it('inicia sesión y vuelve a la ruta pedida', async () => {
    const { router, escribir, enviar } = await montar('/ingresar?volver=%2Fvendedor%2Fventas');
    escribir('correo', 'laura.gomez@concesionario-motos.test');
    escribir('contrasena', 'Motos2026*');
    await enviar();
    const peticion = backend.expectOne('/auth/login');
    expect(peticion.request.body).toEqual({
      correo: 'laura.gomez@concesionario-motos.test',
      contrasena: 'Motos2026*',
    });
    peticion.flush({ token: 't', tipo: 'Bearer', expiraEnMs: 1000, usuario: USUARIOS_PRUEBA.VENDEDOR });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/vendedor/ventas');
  });

  it('sin ruta pedida lleva al inicio del rol', async () => {
    const { router, escribir, enviar } = await montar();
    escribir('correo', 'jhon.castano@concesionario-motos.test');
    escribir('contrasena', 'Motos2026*');
    await enviar();
    backend
      .expectOne('/auth/login')
      .flush({ token: 't', tipo: 'Bearer', expiraEnMs: 1000, usuario: USUARIOS_PRUEBA.TECNICO });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tecnico');
  });

  it('muestra el mensaje del back cuando las credenciales no sirven', async () => {
    const { harness, raiz, escribir, enviar } = await montar();
    escribir('correo', 'maria.ramirez@correo.test');
    escribir('contrasena', 'equivocada');
    await enviar();
    backend
      .expectOne('/auth/login')
      .flush(
        { estado: 401, mensaje: 'Correo o contraseña incorrectos.', campos: [] },
        { status: 401, statusText: 'Unauthorized' },
      );
    await harness.fixture.whenStable();
    expect(raiz.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
      'Correo o contraseña incorrectos.',
    );
    expect(raiz.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
  });

  it('solo acepta rutas internas para volver', () => {
    expect(rutaSegura('/cliente')).toBe('/cliente');
    expect(rutaSegura('//sitio-externo.com')).toBeNull();
    expect(rutaSegura('https://sitio-externo.com')).toBeNull();
    expect(rutaSegura(null)).toBeNull();
  });
});
