import { Location } from '@angular/common';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Title } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { guardarSesionDePrueba } from './testing/sesion';

describe('Rutas y navegación por rol', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
  });

  afterEach(() => localStorage.clear());

  async function abrir(url: string) {
    const harness = await RouterTestingHarness.create(url);
    return {
      harness,
      raiz: harness.fixture.nativeElement as HTMLElement,
      url: TestBed.inject(Router).url,
      direccion: TestBed.inject(Location).path(),
      titulo: TestBed.inject(Title).getTitle(),
    };
  }

  const textos = (raiz: HTMLElement, selector: string) =>
    [...raiz.querySelectorAll(selector)].map((e) => e.textContent?.trim());

  it('la vitrina usa el layout público con el enlace de inicio de sesión', async () => {
    const { raiz, titulo } = await abrir('/');
    expect(raiz.querySelector('a.marca')?.getAttribute('href')).toBe('/');
    expect(raiz.querySelector('h1')?.textContent).toBe('Motos disponibles');
    expect(textos(raiz, '.cabecera__sesion a')).toEqual(['Iniciar sesión']);
    expect(titulo).toBe('Motos disponibles | Concesionario de motos');
  });

  it('sin sesión, un panel lleva al inicio de sesión recordando la ruta', async () => {
    const { raiz, url } = await abrir('/vendedor');
    expect(url).toBe('/ingresar?volver=%2Fvendedor');
    expect(raiz.querySelector('h1')?.textContent).toBe('Iniciar sesión');
  });

  it.each([
    ['VENDEDOR', '/vendedor', ['Ventas']],
    ['TECNICO', '/tecnico', ['Taller']],
    ['DUENO', '/admin', ['Administración', 'Ventas', 'Taller']],
  ] as const)('%s entra a %s y ve solo su menú', async (rol, ruta, menu) => {
    guardarSesionDePrueba(rol);
    const { raiz, url } = await abrir(ruta);
    expect(url).toBe(ruta);
    expect(textos(raiz, '.panel__menu a')).toEqual(menu);
    expect(raiz.querySelector('.barra-inferior') !== null).toBe(menu.length > 1);
  });

  it.each([
    ['VENDEDOR', '/admin'],
    ['TECNICO', '/vendedor'],
    ['CLIENTE', '/tecnico'],
  ] as const)('%s en %s ve la pantalla de sin permiso sin cambiar la URL', async (rol, ruta) => {
    guardarSesionDePrueba(rol);
    const { raiz, url, direccion } = await abrir(ruta);
    expect(url).toBe('/sin-permiso');
    expect(direccion).toBe(ruta);
    expect(raiz.querySelector('h1')?.textContent).toBe('No tienes acceso a esta sección');
  });

  it('el cliente usa el layout público con su cuenta en el menú', async () => {
    guardarSesionDePrueba('CLIENTE');
    const { raiz } = await abrir('/cliente');
    expect(raiz.querySelector('h1')?.textContent).toBe('Mi cuenta');
    expect(textos(raiz, '.cabecera__enlaces a')).toEqual([
      'Motos disponibles',
      'Accesorios',
      'Sedes',
      'Mi cuenta',
    ]);
    expect(raiz.querySelector('.cabecera__usuario')?.textContent?.trim()).toBe('María Ramírez');
  });

  it('con sesión iniciada, las pantallas de acceso llevan al inicio del rol', async () => {
    guardarSesionDePrueba('TECNICO');
    const { url } = await abrir('/ingresar');
    expect(url).toBe('/tecnico');
  });

  it('cerrar sesión borra la sesión y vuelve a la vitrina', async () => {
    guardarSesionDePrueba('DUENO');
    const { harness, raiz } = await abrir('/admin');
    raiz.querySelector<HTMLButtonElement>('.panel__usuario button.btn--secundario')?.click();
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/'));
    expect(harness.routeNativeElement).toBeTruthy();
    expect(localStorage.getItem('sesion')).toBeNull();
  });

  it('una ruta inexistente muestra la página de no encontrada', async () => {
    const { raiz, titulo } = await abrir('/no-existe');
    expect(raiz.querySelector('h1')?.textContent).toBe('Esta página no existe');
    expect(titulo).toBe('Página no encontrada | Concesionario de motos');
  });

  it('el botón de saltar lleva el foco al contenido', async () => {
    const { raiz } = await abrir('/');
    document.body.appendChild(raiz);
    raiz.querySelector<HTMLButtonElement>('button.saltar')?.click();
    expect(document.activeElement?.id).toBe('contenido');
    raiz.remove();
  });
});
