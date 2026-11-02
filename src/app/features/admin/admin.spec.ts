import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { EmpleadoAdmin, MotoAdmin } from '../../core/api/modelos';
import { ConfirmacionService } from '../../shared/ui/confirmacion/confirmacion.service';
import { guardarSesionDePrueba } from '../../testing/sesion';
import rutasAdmin from './admin.routes';

const MOTO: MotoAdmin = {
  placa: 'HBN45C',
  idMarca: 1,
  nroModelo: 2,
  idSucursal: 1,
  origen: 'INVENTARIO',
  anio: 2025,
  color: 'Azul',
  kilometraje: 0,
  precio: 21000000,
  fechaIngreso: '2026-01-10',
  marca: 'Yamaha',
  modelo: 'MT-03',
  sucursal: 'Sede Chapinero',
  vendida: false,
};

const LAURA: EmpleadoAdmin = {
  idEmpleado: 2,
  documento: '52123456',
  nombres: 'Laura',
  apellidos: 'Gómez',
  fechaContratacion: '2024-02-01',
  tipoEmpleado: 'VENDEDOR',
  idSucursal: 1,
  idJefe: 1,
  correoAcceso: 'laura.gomez@concesionario-motos.test',
  telefonos: ['3001234567'],
  certificadoVentas: 'CV-001',
  comision: 3,
  certificadoTecnico: null,
  especialidad: null,
  sucursal: 'Sede Chapinero',
  jefe: 'Ricardo Salazar',
};

const SEDES = [
  {
    idSucursal: 1,
    nombre: 'Sede Chapinero',
    ciudad: 'Bogotá',
    barrio: 'Chapinero',
    calle: 'Calle 60',
    numeroDireccion: '9-20',
  },
];

describe('Administración', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    guardarSesionDePrueba('DUENO');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'admin', children: rutasAdmin }], withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => localStorage.clear());

  async function abrir(url: string) {
    const harness = await RouterTestingHarness.create(url);
    const raiz = harness.fixture.nativeElement as HTMLElement;
    return { harness, raiz, estable: () => harness.fixture.whenStable() };
  }

  function escribir(raiz: HTMLElement, selector: string, valor: string) {
    const control = raiz.querySelector<HTMLInputElement | HTMLSelectElement>(selector);
    if (!control) {
      throw new Error(`No existe ${selector}`);
    }
    control.value = valor;
    control.dispatchEvent(new Event(control instanceof HTMLSelectElement ? 'change' : 'input'));
  }

  function boton(raiz: HTMLElement, texto: string) {
    return [...raiz.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      b.textContent?.includes(texto),
    );
  }

  it('el índice enlaza las catorce tablas', async () => {
    const { raiz } = await abrir('/admin');
    expect(raiz.querySelectorAll('.indice-admin__enlace')).toHaveLength(14);
  });

  it('filtra las motos por sede en el servidor y busca en la tabla', async () => {
    const { harness, raiz, estable } = await abrir('/admin/motos?idSucursal=1');
    backend.expectOne(`/api/admin/sucursales`).flush(SEDES);
    backend.expectOne('/api/admin/modelos').flush([]);
    const peticion = backend.expectOne((r) => r.url === '/api/admin/motos');
    expect(peticion.request.params.get('idSucursal')).toBe('1');
    peticion.flush([MOTO, { ...MOTO, placa: 'KTR11A', modelo: 'Duke 200', marca: 'KTM' }]);
    await estable();
    expect(raiz.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(raiz.querySelector('tbody tr')?.textContent).toContain('En inventario');

    await harness.navigateByUrl('/admin/motos?idSucursal=1&q=duke');
    backend.expectNone('/api/admin/motos');
    await estable();
    expect(raiz.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(raiz.querySelector('.total')?.textContent?.trim()).toBe('1 moto');
  });

  it('explica por qué no se puede eliminar una marca con modelos', async () => {
    const { raiz, estable } = await abrir('/admin/marcas');
    backend
      .expectOne('/api/admin/marcas')
      .flush([{ idMarca: 1, nombre: 'Yamaha', paisOrigen: 'Japón' }]);
    await estable();
    boton(raiz, 'Eliminar')?.click();
    const confirmacion = TestBed.inject(ConfirmacionService);
    await vi.waitFor(() =>
      expect(confirmacion.actual()?.titulo).toBe('¿Eliminar la marca Yamaha?'),
    );
    confirmacion.responder(true);
    const peticion = await vi.waitFor(() => backend.expectOne('/api/admin/marcas/1'));
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(
      { estado: 409, mensaje: 'No se puede eliminar porque otros registros dependen de él.' },
      { status: 409, statusText: 'Conflict' },
    );
    await estable();
    expect(raiz.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo eliminar la marca Yamaha. La marca tiene modelos registrados.',
    );
    expect(raiz.querySelectorAll('tbody tr')).toHaveLength(1);
  });

  it('una moto de un cliente no lleva sede ni precio', async () => {
    const { raiz, estable } = await abrir('/admin/motos/nuevo');
    backend.expectOne('/api/admin/sucursales').flush(SEDES);
    backend.expectOne('/api/admin/modelos').flush([
      {
        idMarca: 1,
        nroModelo: 2,
        nombreMarca: 'Yamaha',
        nombre: 'MT-03',
        cilindraje: 321,
        tipoMoto: 'NAKED',
        potenciaHp: 41,
        capacidadTanque: 3.7,
      },
    ]);
    await estable();
    escribir(raiz, '[name="origen"]', 'INVENTARIO');
    await estable();
    expect(raiz.querySelector('[name="idSucursal"]')).not.toBeNull();

    escribir(raiz, '[name="origen"]', 'EXTERNA');
    escribir(raiz, '[name="placa"]', 'qwe12r');
    escribir(raiz, '[name="modeloMoto"]', '1-2');
    escribir(raiz, '[name="anio"]', '2019');
    escribir(raiz, '[name="color"]', 'Negro');
    escribir(raiz, '[name="kilometraje"]', '15000');
    escribir(raiz, '[name="fechaIngreso"]', '2026-10-01');
    await estable();
    expect(raiz.querySelector('[name="idSucursal"]')).toBeNull();
    raiz.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    const peticion = backend.expectOne('/api/admin/motos');
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toMatchObject({
      placa: 'QWE12R',
      idMarca: 1,
      nroModelo: 2,
      origen: 'EXTERNA',
      idSucursal: null,
      precio: null,
      anio: 2019,
    });
  });

  it('al editar un empleado el cargo queda fijo y la contraseña vacía no se envía', async () => {
    const { raiz, estable } = await abrir('/admin/empleados/2');
    backend.expectOne('/api/admin/sucursales').flush(SEDES);
    backend.expectOne('/api/admin/empleados').flush([LAURA]);
    backend.expectOne('/api/admin/empleados/2').flush(LAURA);
    await estable();
    expect(raiz.querySelector('[name="tipoEmpleado"]')).toBeNull();
    expect(raiz.querySelector('.campo-fijo')?.textContent).toContain('Vendedor');
    expect(raiz.querySelector('[name="especialidad"]')).toBeNull();
    expect(raiz.querySelectorAll('[name="idJefe"] option')).toHaveLength(1);

    raiz.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    const peticion = backend.expectOne('/api/admin/empleados/2');
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toMatchObject({
      tipoEmpleado: 'VENDEDOR',
      idSucursal: 1,
      comision: 3,
      certificadoTecnico: null,
      contrasena: null,
      telefonos: ['3001234567'],
    });
  });
});
