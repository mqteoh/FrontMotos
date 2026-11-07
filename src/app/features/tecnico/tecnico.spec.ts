import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  Reparacion as DatosReparacion,
  Repuesto,
  TecnicoParticipante,
} from '../../core/api/modelos';
import { enRango, nombresTecnicos, participo, totalReparaciones } from '../../core/api/tecnico-api';
import { hoyIso } from '../../shared/formularios/mensajes';
import { guardarSesionDePrueba } from '../../testing/sesion';
import FormularioReparacion from './formulario-reparacion';
import Reparacion from './reparacion';
import Reparaciones from './reparaciones';

const JHON: TecnicoParticipante = {
  idEmpleado: 5,
  nombre: 'Jhon Castaño Ruiz',
  idSucursal: 1,
  sucursal: 'Sede Chapinero',
};
const FELIPE: TecnicoParticipante = { ...JHON, idEmpleado: 4, nombre: 'Felipe Ortiz Lozano' };
const DIEGO: TecnicoParticipante = {
  idEmpleado: 7,
  nombre: 'Diego Moreno Vargas',
  idSucursal: 2,
  sucursal: 'Sede Suba',
};

const ACEITE: Repuesto = {
  idRepuesto: 1,
  nombre: 'Aceite 20W-50 semisintético 1L',
  categoria: 'LUBRICANTES',
  precio: 38000,
};

function reparacion(cambios: Partial<DatosReparacion>): DatosReparacion {
  return {
    idReparacion: 9,
    placa: 'HBN45C',
    marca: 'Yamaha',
    modelo: 'MT-03',
    fecha: '2026-10-15',
    descripcion: 'Cambio de aceite',
    idSucursal: 1,
    sucursal: 'Sede Chapinero',
    idCliente: 8,
    cliente: 'Paula Andrea Sánchez Niño',
    tecnicos: [JHON],
    costoManoObra: 110000,
    costoRepuestos: 72000,
    costoTotal: 182000,
    repuestos: [],
    ...cambios,
  };
}

describe('Panel del técnico', () => {
  it('arma los datos de las reparaciones', () => {
    const conDos = reparacion({ tecnicos: [FELIPE, JHON] });
    expect(nombresTecnicos(conDos)).toBe('Felipe Ortiz Lozano, Jhon Castaño Ruiz');
    expect(participo(conDos, 4)).toBe(true);
    expect(participo(conDos, 7)).toBe(false);
    expect(enRango('2026-04-10', '2026-01-01', '2026-06-30')).toBe(true);
    expect(enRango('2026-07-01', '', '2026-06-30')).toBe(false);
    expect(enRango('2026-07-01', '', '')).toBe(true);
    expect(totalReparaciones([conDos, reparacion({ costoTotal: 50000 })])).toBe(232000);
  });

  describe('pantallas', () => {
    let backend: HttpTestingController;

    beforeEach(() => {
      guardarSesionDePrueba('TECNICO');
      TestBed.configureTestingModule({
        providers: [
          provideRouter(
            [
              { path: 'tecnico', component: Reparaciones },
              { path: 'tecnico/nueva', component: FormularioReparacion },
              { path: 'tecnico/reparaciones/:idReparacion', component: Reparacion },
              {
                path: 'tecnico/reparaciones/:idReparacion/editar',
                component: FormularioReparacion,
              },
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
      const raiz = harness.fixture.nativeElement as HTMLElement;
      return { harness, raiz, estable: () => harness.fixture.whenStable() };
    }

    const texto = (raiz: HTMLElement, selector: string) =>
      raiz.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();

    it('pide al servidor las reparaciones de la sede entre las fechas elegidas', async () => {
      const { raiz, estable } = await abrir('/tecnico?desde=2026-04-01');
      backend.expectOne('/api/publico/sucursales').flush([]);
      const peticion = backend.expectOne((r) => r.url === '/api/tecnico/reparaciones');
      expect(peticion.request.params.get('desde')).toBe('2026-04-01');
      expect(peticion.request.params.has('idSucursal')).toBe(false);
      peticion.flush([reparacion({}), reparacion({ idReparacion: 6, costoTotal: 303000 })]);
      await estable();
      expect(raiz.querySelectorAll('app-tarjeta-reparacion')).toHaveLength(2);
      expect(raiz.textContent).toContain('485.000');
      expect(raiz.querySelector('[aria-pressed="true"]')?.textContent).toContain('Toda la sede');
    });

    it('«Solo en las que participé» usa mis reparaciones y filtra las fechas aquí', async () => {
      const { raiz, estable } = await abrir('/tecnico?vista=mias&desde=2026-10-01');
      backend.expectOne('/api/publico/sucursales').flush([]);
      backend
        .expectOne('/api/tecnico/mis-reparaciones')
        .flush([reparacion({}), reparacion({ idReparacion: 3, fecha: '2026-04-10' })]);
      await estable();
      expect(raiz.querySelectorAll('app-tarjeta-reparacion')).toHaveLength(1);
    });

    it('con un rango al revés no consulta y explica el error', async () => {
      const { raiz, estable } = await abrir('/tecnico?desde=2026-12-01&hasta=2026-01-01');
      backend.expectOne('/api/publico/sucursales').flush([]);
      await estable();
      backend.expectNone((r) => r.url === '/api/tecnico/reparaciones');
      expect(texto(raiz, '#error-rango')).toContain('no puede ser posterior');
    });

    it('el detalle ofrece corregir solo a quien participó', async () => {
      const propia = await abrir('/tecnico/reparaciones/9');
      backend.expectOne('/api/tecnico/reparaciones/9').flush(reparacion({}));
      await propia.estable();
      expect(propia.raiz.querySelector('.reparacion__corregir')?.getAttribute('href')).toBe(
        '/tecnico/reparaciones/9/editar',
      );
      expect(texto(propia.raiz, '#titulo-repuestos + p')).toContain('No se usaron repuestos');

      await propia.harness.navigateByUrl('/tecnico/reparaciones/4');
      backend
        .expectOne('/api/tecnico/reparaciones/4')
        .flush(reparacion({ idReparacion: 4, tecnicos: [DIEGO] }));
      await propia.estable();
      expect(propia.raiz.querySelector('.reparacion__corregir')).toBeNull();
    });

    async function abrirFormulario(url: string) {
      const abierto = await abrir(url);
      backend.expectOne('/api/tecnico/tecnicos').flush([FELIPE, JHON]);
      backend.expectOne('/api/tecnico/repuestos').flush([ACEITE]);
      return abierto;
    }

    it('registra con el técnico incluido, sus compañeros y los repuestos', async () => {
      const { harness, raiz, estable } = await abrirFormulario('/tecnico/nueva');
      await estable();
      const propio = raiz.querySelectorAll<HTMLInputElement>('.casilla input')[1];
      expect(propio.checked).toBe(true);
      expect(propio.disabled).toBe(true);

      const enviar = () => raiz.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
      enviar();
      await estable();
      backend.expectNone('/api/tecnico/reparaciones');
      expect(raiz.querySelectorAll('[aria-invalid="true"]').length).toBeGreaterThan(0);

      const componente = harness.routeDebugElement?.componentInstance as FormularioReparacion;
      componente['formulario'].patchValue({
        placa: 'hbn45c',
        descripcion: ' Cambio de aceite ',
        costo: 60000,
      });
      raiz.querySelectorAll<HTMLInputElement>('.casilla input')[0].click();
      raiz.querySelector<HTMLButtonElement>('#agregar-repuesto')?.click();
      await estable();
      componente['usos'].at(0).controls.idRepuesto.setValue(1);
      await estable();
      expect(texto(raiz, '.total-venta')).toContain('98.000');

      enviar();
      const peticion = backend.expectOne('/api/tecnico/reparaciones');
      expect(peticion.request.method).toBe('POST');
      expect(peticion.request.body).toEqual({
        placa: 'HBN45C',
        fecha: hoyIso(),
        descripcion: 'Cambio de aceite',
        costo: 60000,
        idTecnicos: [4],
        repuestos: [{ idRepuesto: 1, cantidad: 1, precioUnitario: 38000 }],
      });
      peticion.flush(reparacion({ idReparacion: 20 }));
      await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/tecnico/reparaciones/20'));
    });

    it('corrige una reparación cargando sus datos y muestra el rechazo del servidor', async () => {
      const { raiz, estable } = await abrirFormulario('/tecnico/reparaciones/9/editar');
      backend.expectOne('/api/tecnico/reparaciones/9').flush(
        reparacion({
          tecnicos: [JHON, FELIPE],
          repuestos: [
            {
              idRepuesto: 1,
              nombre: ACEITE.nombre,
              categoria: ACEITE.categoria,
              cantidad: 2,
              precioUnitario: 36000,
              subtotal: 72000,
            },
          ],
        }),
      );
      await estable();
      expect(raiz.querySelector('h1')?.textContent).toContain('Corregir reparación N.º 9');
      expect(raiz.querySelectorAll<HTMLInputElement>('.casilla input')[0].checked).toBe(true);
      expect(texto(raiz, '.total-venta')).toContain('182.000');

      raiz.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
      const peticion = backend.expectOne('/api/tecnico/reparaciones/9');
      expect(peticion.request.method).toBe('PUT');
      expect(peticion.request.body.idTecnicos).toEqual([4]);
      expect(peticion.request.body.repuestos).toEqual([
        { idRepuesto: 1, cantidad: 2, precioUnitario: 36000 },
      ]);
      peticion.flush(
        { estado: 409, mensaje: 'La reparación no puede ser anterior a la venta.', campos: [] },
        { status: 409, statusText: 'Conflict' },
      );
      await estable();
      expect(texto(raiz, '#error-envio')).toContain('anterior a la venta');
    });

    it('el dueño ve los técnicos por sede y no puede mezclar sedes', async () => {
      localStorage.clear();
      guardarSesionDePrueba('DUENO');
      const { raiz, estable } = await abrir('/tecnico/nueva');
      backend.expectOne('/api/tecnico/tecnicos').flush([FELIPE, JHON, DIEGO]);
      backend.expectOne('/api/tecnico/repuestos').flush([ACEITE]);
      await estable();
      const titulos = [...raiz.querySelectorAll('.casillas__titulo')].map((t) => t.textContent);
      expect(titulos).toEqual(['Sede Chapinero', 'Sede Suba']);
      const casillas = raiz.querySelectorAll<HTMLInputElement>('.casilla input');
      casillas[0].click();
      casillas[2].click();
      await estable();
      expect(texto(raiz, '#error-tecnicos')).toContain('misma sede');
    });
  });
});
