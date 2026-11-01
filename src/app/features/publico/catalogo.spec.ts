import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { FiltrosCatalogo, MotoCatalogo, MotoDetalle } from '../../core/api/modelos';
import { guardarSesionDePrueba } from '../../testing/sesion';
import Catalogo from './catalogo';
import FichaMoto from './ficha-moto';

const MOTO: MotoCatalogo = {
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
};

const FILTROS: FiltrosCatalogo = {
  marcas: [{ valor: 'Yamaha', disponibles: 3 }],
  tipos: [{ valor: 'SCOOTER', disponibles: 1 }],
  sedes: [{ idSucursal: 1, nombre: 'Sede Chapinero', ciudad: 'Bogotá', disponibles: 3 }],
  precioMinimo: 5600000,
  precioMaximo: 32500000,
  totalDisponibles: 12,
};

describe('Vitrina', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: '', component: Catalogo },
            { path: 'motos/:placa', component: FichaMoto },
          ],
          withComponentInputBinding(),
        ),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => localStorage.clear());

  async function abrir(url: string) {
    const harness = await RouterTestingHarness.create(url);
    return { harness, raiz: harness.fixture.nativeElement as HTMLElement };
  }

  const responderFiltros = () =>
    backend.expectOne('/api/publico/motos/filtros').flush(FILTROS);

  it('pide las motos con los filtros de la URL y muestra las tarjetas', async () => {
    const { harness, raiz } = await abrir('/?marca=Yamaha&pagina=2');
    responderFiltros();
    const peticion = backend.expectOne((r) => r.url === '/api/publico/motos');
    expect(peticion.request.params.get('marca')).toBe('Yamaha');
    expect(peticion.request.params.get('pagina')).toBe('1');
    peticion.flush({ contenido: [MOTO], pagina: 1, tamano: 12, totalElementos: 13, totalPaginas: 2 });
    await harness.fixture.whenStable();

    expect(raiz.querySelectorAll('app-tarjeta-moto').length).toBe(1);
    expect(raiz.querySelector('.catalogo__conteo')?.textContent?.trim()).toBe(
      '13 motos · página 2 de 2',
    );
    expect(raiz.querySelector<HTMLSelectElement>('#filtro-marca')?.value).toBe('Yamaha');
    expect(raiz.querySelector('.paginacion [aria-current="page"]')?.textContent?.trim()).toBe('2');
  });

  it('elegir una marca la lleva a la URL y vuelve a la primera página', async () => {
    const { harness, raiz } = await abrir('/?pagina=3');
    responderFiltros();
    backend.expectOne((r) => r.url === '/api/publico/motos').flush({
      contenido: [MOTO],
      pagina: 2,
      tamano: 12,
      totalElementos: 30,
      totalPaginas: 3,
    });
    await harness.fixture.whenStable();
    const marca = raiz.querySelector<HTMLSelectElement>('#filtro-marca');
    if (marca) {
      marca.value = 'Yamaha';
      marca.dispatchEvent(new Event('change'));
    }
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/?marca=Yamaha'));
    const nueva = backend.expectOne((r) => r.url === '/api/publico/motos');
    expect(nueva.request.params.get('pagina')).toBe('0');
    expect(nueva.request.params.get('marca')).toBe('Yamaha');
  });

  it('un error del back muestra su mensaje en vez de quedarse cargando', async () => {
    const { harness, raiz } = await abrir('/?tipo=VOLADORA');
    responderFiltros();
    backend
      .expectOne((r) => r.url === '/api/publico/motos')
      .flush(
        { estado: 400, mensaje: 'El tipo de moto VOLADORA no existe.', campos: [] },
        { status: 400, statusText: 'Bad Request' },
      );
    await harness.fixture.whenStable();
    const error = raiz.querySelector('app-estado-error');
    expect(error?.getAttribute('role')).toBe('alert');
    expect(error?.textContent).toContain('El tipo de moto VOLADORA no existe.');
    expect(raiz.querySelector('app-esqueleto')).toBeNull();
  });

  it('sin resultados con filtros ofrece quitarlos, conservando el orden', async () => {
    const { harness, raiz } = await abrir('/?marca=KTM&orden=PRECIO_DESC');
    responderFiltros();
    backend
      .expectOne((r) => r.url === '/api/publico/motos')
      .flush({ contenido: [], pagina: 0, tamano: 12, totalElementos: 0, totalPaginas: 0 });
    await harness.fixture.whenStable();
    expect(raiz.querySelector('app-estado-vacio')?.textContent).toContain(
      'No hay motos con esos filtros.',
    );
    raiz.querySelector<HTMLButtonElement>('app-estado-vacio button')?.click();
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/?orden=PRECIO_DESC'));
  });

  describe('ficha', () => {
    const DETALLE: MotoDetalle = {
      ...MOTO,
      idMarca: 1,
      paisOrigenMarca: 'Japón',
      nroModelo: 2,
      potenciaHp: 15.1,
      capacidadTanque: 7.1,
      kilometraje: 0,
      sucursal: {
        idSucursal: 1,
        nombre: 'Sede Chapinero',
        ciudad: 'Bogotá',
        barrio: 'Chapinero',
        calle: 'Calle 63',
        numeroDireccion: '13-45',
      },
    };

    it('sin sesión, reservar lleva al inicio de sesión y vuelve a la ficha', async () => {
      const { harness, raiz } = await abrir('/motos/GTK22F');
      backend.expectOne('/api/publico/motos/GTK22F').flush(DETALLE);
      await harness.fixture.whenStable();
      expect(raiz.querySelector('h1')?.textContent).toBe('Yamaha NMAX 155');
      expect(raiz.querySelector('.ficha__compra a.btn')?.getAttribute('href')).toBe(
        '/ingresar?volver=%2Fmotos%2FGTK22F',
      );
      expect(raiz.querySelector('.ficha__sede')?.textContent).toContain(
        'Calle 63 # 13-45, Chapinero, Bogotá',
      );
    });

    it('con sesión de cliente, reservar va a la confirmación', async () => {
      guardarSesionDePrueba('CLIENTE');
      const { harness, raiz } = await abrir('/motos/GTK22F');
      backend.expectOne('/api/publico/motos/GTK22F').flush(DETALLE);
      await harness.fixture.whenStable();
      expect(raiz.querySelector('.ficha__compra a.btn')?.getAttribute('href')).toBe(
        '/cliente/reservar/GTK22F',
      );
    });

    it('una placa que no está disponible muestra el mensaje del back', async () => {
      const { harness, raiz } = await abrir('/motos/ZZZ999');
      backend
        .expectOne('/api/publico/motos/ZZZ999')
        .flush(
          { estado: 404, mensaje: 'La moto ZZZ999 no existe o ya no está disponible.', campos: [] },
          { status: 404, statusText: 'Not Found' },
        );
      await harness.fixture.whenStable();
      expect(raiz.querySelector('app-estado-vacio')?.textContent).toContain(
        'La moto ZZZ999 no existe o ya no está disponible.',
      );
    });
  });
});
