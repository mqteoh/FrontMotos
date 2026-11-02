import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { fechaIso } from '../../core/api/cliente-api';
import { Reparacion as DatosReparacion } from '../../core/api/modelos';
import {
  agruparPorDia,
  esAtrasada,
  filtrarVista,
  hora,
  rangoSemana,
} from '../../core/api/tecnico-api';
import { ConfirmacionService } from '../../shared/ui/confirmacion/confirmacion.service';
import { guardarSesionDePrueba } from '../../testing/sesion';
import Agenda from './agenda';
import Reparacion from './reparacion';

function reparacion(cambios: Partial<DatosReparacion>): DatosReparacion {
  return {
    idReparacion: 11,
    placa: 'HBN45C',
    marca: 'Yamaha',
    modelo: 'MT-03',
    fechaAgendada: '2030-01-15T08:00:00',
    fechaFinalizacion: null,
    estado: 'AGENDADA',
    descripcion: 'Mantenimiento de los 1000 km',
    kilometrajeIngreso: null,
    idSucursal: 1,
    sucursal: 'Sede Chapinero',
    idCliente: 8,
    cliente: 'Paula Andrea Sánchez Niño',
    idTecnico: null,
    tecnico: null,
    costoManoObra: null,
    costoRepuestos: 0,
    costoTotal: 0,
    repuestos: [],
    ...cambios,
  };
}

describe('Panel del técnico', () => {
  const hoy = new Date(2026, 10, 2, 10, 0);

  it('calcula la semana, las vistas y las citas atrasadas', () => {
    expect(rangoSemana(hoy)).toEqual(['2026-11-02', '2026-11-08']);
    expect(rangoSemana(new Date(2026, 10, 8))).toEqual(['2026-11-02', '2026-11-08']);
    const lista = [
      reparacion({ idReparacion: 1, fechaAgendada: '2026-11-02T09:00:00' }),
      reparacion({ idReparacion: 2, fechaAgendada: '2026-11-06T14:30:00' }),
      reparacion({ idReparacion: 3, fechaAgendada: '2026-11-20T08:00:00' }),
    ];
    expect(filtrarVista(lista, 'hoy', hoy).map((r) => r.idReparacion)).toEqual([1]);
    expect(filtrarVista(lista, 'semana', hoy).map((r) => r.idReparacion)).toEqual([1, 2]);
    expect(filtrarVista(lista, 'pendientes', hoy)).toHaveLength(3);
    expect(esAtrasada(reparacion({ fechaAgendada: '2026-10-29T08:00:00' }), hoy)).toBe(true);
    expect(
      esAtrasada(reparacion({ fechaAgendada: '2026-10-29T08:00:00', estado: 'EN_PROCESO' }), hoy),
    ).toBe(false);
    expect(agruparPorDia(lista)[1].titulo).toBe('Viernes, 6 de noviembre');
    expect(hora('2026-11-06T14:30:00')).toBe('2:30 p. m.');
  });

  describe('pantallas', () => {
    let backend: HttpTestingController;

    beforeEach(() => {
      guardarSesionDePrueba('TECNICO');
      TestBed.configureTestingModule({
        providers: [
          provideRouter(
            [
              { path: 'agenda', component: Agenda },
              { path: 'reparaciones/:idReparacion', component: Reparacion },
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

    it('separa lo que está en curso conmigo y lo atrasado del resto', async () => {
      const { raiz, estable } = await abrir('/agenda?vista=pendientes');
      backend
        .expectOne('/api/tecnico/agenda')
        .flush([
          reparacion({ idReparacion: 1, estado: 'EN_PROCESO', idTecnico: 5, tecnico: 'Jhon' }),
          reparacion({ idReparacion: 2, fechaAgendada: '2020-01-01T08:00:00' }),
          reparacion({ idReparacion: 3 }),
        ]);
      backend.expectOne('/api/publico/sucursales').flush([]);
      await estable();
      const seccion = (id: string) =>
        raiz.querySelector(`#${id}`)?.closest('section')?.querySelectorAll('app-placa').length;
      expect(seccion('titulo-en-curso')).toBe(1);
      expect(seccion('titulo-atrasadas')).toBe(1);
      expect(raiz.querySelectorAll('.agenda__dia app-tarjeta-reparacion')).toHaveLength(1);
      expect(raiz.querySelector('.tarjeta-reparacion--atrasada')?.textContent).toContain(
        'Atrasada',
      );
    });

    it('no deja cerrar sin costo y cierra con costo tras confirmar', async () => {
      const { raiz, estable } = await abrir('/reparaciones/11');
      backend.expectOne('/api/tecnico/reparaciones/11').flush(
        reparacion({
          estado: 'EN_PROCESO',
          idTecnico: 5,
          tecnico: 'Jhon',
          costoRepuestos: 76000,
        }),
      );
      await estable();
      expect(raiz.querySelector('.reparacion__cabecera app-placa')?.classList).toContain(
        'placa--grande',
      );

      const cerrar = () =>
        raiz.querySelector<HTMLButtonElement>('form.formulario button[type="submit"]')?.click();
      cerrar();
      await estable();
      backend.expectNone('/api/tecnico/reparaciones/11/finalizar');
      expect(TestBed.inject(ConfirmacionService).actual()).toBeNull();
      expect(raiz.querySelector('[formcontrolname="costo"]')?.getAttribute('aria-invalid')).toBe(
        'true',
      );

      const costo = raiz.querySelector<HTMLInputElement>('[formcontrolname="costo"]');
      if (costo) {
        costo.value = '80000';
        costo.dispatchEvent(new Event('input'));
      }
      await estable();
      expect(raiz.querySelector('.total-venta')?.textContent?.replace(/\s/g, '')).toBe(
        'Totalestimado$156.000',
      );
      cerrar();
      const confirmacion = TestBed.inject(ConfirmacionService);
      await vi.waitFor(() => expect(confirmacion.actual()?.mensaje).toMatch(/\$\s156\.000/));
      confirmacion.responder(true);
      const peticion = await vi.waitFor(() =>
        backend.expectOne('/api/tecnico/reparaciones/11/finalizar'),
      );
      expect(peticion.request.body).toEqual({ costo: 80000, descripcion: null });
    });

    it('solo el técnico asignado ve las acciones de trabajo', async () => {
      const { raiz, estable } = await abrir('/reparaciones/8');
      backend.expectOne('/api/tecnico/reparaciones/8').flush(
        reparacion({
          idReparacion: 8,
          estado: 'EN_PROCESO',
          idTecnico: 9,
          tecnico: 'Felipe Ortiz',
        }),
      );
      await estable();
      expect(raiz.querySelector('#titulo-cierre')).toBeNull();
      expect(raiz.textContent).toContain('La está atendiendo Felipe Ortiz');
    });

    it('tomar una cita agendada la pasa a mi nombre', async () => {
      const { raiz, estable } = await abrir('/reparaciones/11');
      backend.expectOne('/api/tecnico/reparaciones/11').flush(reparacion({}));
      await estable();
      [...raiz.querySelectorAll<HTMLButtonElement>('button')]
        .find((b) => b.textContent?.includes('Tomar reparación'))
        ?.click();
      backend
        .expectOne('/api/tecnico/reparaciones/11/tomar')
        .flush(reparacion({ estado: 'EN_PROCESO', idTecnico: 5, tecnico: 'Jhon' }));
      await estable();
      expect(raiz.querySelector('#titulo-agregar')).not.toBeNull();
      expect(fechaIso(hoy)).toBe('2026-11-02');
    });
  });
});
