import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { aCsv } from '../../shared/formato/csv';
import { compacto, escalaAgradable } from '../../shared/ui/grafico-barras/grafico-barras';
import { guardarSesionDePrueba } from '../../testing/sesion';
import Reportes, { sumarPorSede, textoPeriodo } from './reportes';

const API = '/api/admin/reportes';
const anioActual = new Date().getFullYear();

function mes(numero: number, totalMotos: number, totalAccesorios: number) {
  return {
    mes: numero,
    motosVendidas: totalMotos > 0 ? 1 : 0,
    totalMotos,
    ventasAccesorios: totalAccesorios > 0 ? 1 : 0,
    totalAccesorios,
    total: totalMotos + totalAccesorios,
  };
}

describe('Reportes de gestión', () => {
  it('calcula escalas limpias, cifras compactas y el CSV', () => {
    expect(escalaAgradable(40_506_000, false)).toEqual([0, 20e6, 40e6, 60e6]);
    expect(escalaAgradable(3, true)).toEqual([0, 1, 2, 3]);
    expect(escalaAgradable(0, true)).toEqual([0, 1]);
    expect(compacto(70_280_000, 'pesos')).toMatch(/^\$ 70,3\sM$/);
    expect(compacto(290, 'unidades')).toBe('290');
    expect(textoPeriodo('2026-11')).toBe('noviembre de 2026');

    const csv = aCsv(
      [
        { clave: 'sede', titulo: 'Sede' },
        { clave: 'total', titulo: 'Total' },
      ],
      [
        { sede: 'Sede; "Norte"', total: 1087000 },
        { sede: 'Suba', total: null },
      ],
    );
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1)).toBe('Sede;Total\r\n"Sede; ""Norte""";1087000\r\nSuba;\r\n');
  });

  it('suma recibidas y usadas por sede para el gráfico', () => {
    const base = { idSucursal: 1, idRepuesto: 1, repuesto: 'Filtro' };
    expect(
      sumarPorSede([
        { ...base, sucursal: 'Suba', recibidas: 10, usadas: 2 },
        { ...base, sucursal: 'Chapinero', recibidas: 120, usadas: 4 },
        { ...base, sucursal: 'Suba', recibidas: 5, usadas: 1 },
      ]),
    ).toEqual([
      { etiqueta: 'Chapinero', valores: [120, 4] },
      { etiqueta: 'Suba', valores: [15, 3] },
    ]);
  });

  describe('pantalla', () => {
    let backend: HttpTestingController;

    beforeEach(() => {
      guardarSesionDePrueba('DUENO');
      TestBed.configureTestingModule({
        providers: [
          provideRouter([{ path: 'reportes', component: Reportes }]),
          provideHttpClient(),
          provideHttpClientTesting(),
        ],
      });
      backend = TestBed.inject(HttpTestingController);
    });

    afterEach(() => localStorage.clear());

    function responderTodo(meses: ReturnType<typeof mes>[]) {
      backend.expectOne(`${API}/resumen`).flush({
        mes: '2026-11',
        motosDisponibles: 12,
        reservasActivas: 2,
        reparacionesMes: 3,
        motosVendidasMes: 1,
        ventasMotosMes: 17000000,
        ventasAccesoriosMes: 1527000,
        clientes: 17,
        empleados: 12,
      });
      backend.expectOne((r) => r.url === `${API}/ventas-por-mes`).flush(meses);
      backend.expectOne(`${API}/ventas-por-vendedor`).flush([
        {
          idEmpleado: 2,
          vendedor: 'Laura Gómez Torres',
          sucursal: 'Sede Chapinero',
          motosVendidas: 4,
          totalMotos: 66300000,
          totalAccesorios: 3980000,
          total: 70280000,
        },
      ]);
      backend
        .expectOne(`${API}/disponibles-por-sede`)
        .flush([{ idSucursal: 1, sucursal: 'Sede Chapinero', ciudad: 'Bogotá', disponibles: 3 }]);
      backend.expectOne(`${API}/costos-reparacion`).flush([]);
      backend.expectOne(`${API}/repuestos-por-sucursal`).flush([
        {
          idSucursal: 1,
          sucursal: 'Sede Chapinero',
          idRepuesto: 1,
          repuesto: 'Aceite',
          recibidas: 120,
          usadas: 4,
        },
      ]);
    }

    it('muestra el resumen, los gráficos con su tabla y los estados vacíos', async () => {
      const harness = await RouterTestingHarness.create('/reportes');
      const raiz = harness.fixture.nativeElement as HTMLElement;
      responderTodo([mes(1, 0, 488000), mes(2, 22000000, 1616000)]);
      await harness.fixture.whenStable();

      expect(raiz.querySelector('#titulo-resumen')?.textContent).toContain(
        'Resumen de noviembre de 2026',
      );
      expect(raiz.querySelector('.kpi--principal dt')?.textContent).toBe(
        'Ventas de motos en noviembre',
      );
      expect(raiz.querySelectorAll('app-grafico-barras')).toHaveLength(4);
      expect(raiz.querySelectorAll('.reporte__datos')).toHaveLength(4);
      expect(raiz.textContent).toContain('Aún no hay reparaciones registradas.');
      const mensual = raiz.querySelector('app-seccion-reporte');
      expect(mensual?.querySelector('.grafico__leyenda')?.textContent).toContain('Accesorios');
      expect(mensual?.querySelector('[role="img"]')?.getAttribute('aria-label')).toContain(
        `cada mes de ${anioActual}`,
      );
      expect(
        raiz.querySelectorAll('app-seccion-reporte')[2].querySelector('.grafico__leyenda'),
      ).toBeNull();
    });

    it('cambia de año y avisa cuando no hubo ventas', async () => {
      const harness = await RouterTestingHarness.create('/reportes');
      const raiz = harness.fixture.nativeElement as HTMLElement;
      responderTodo([mes(1, 0, 0)]);
      await harness.fixture.whenStable();
      expect(raiz.textContent).toContain(`No hubo ventas en ${anioActual}.`);

      const selector = raiz.querySelector<HTMLSelectElement>('#reporte-anio');
      if (selector) {
        selector.value = String(anioActual - 1);
        selector.dispatchEvent(new Event('change'));
      }
      const peticion = await vi.waitFor(() =>
        backend.expectOne((r) => r.url === `${API}/ventas-por-mes`),
      );
      expect(peticion.request.params.get('anio')).toBe(String(anioActual - 1));
      peticion.flush([mes(10, 10500000, 577000)]);
      await harness.fixture.whenStable();
      expect(raiz.querySelector('.grafico-v__valor')?.textContent?.trim()).toMatch(/11,1\sM/);
    });
  });
});
