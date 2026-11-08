import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ClienteSede, MotoInventario, Reserva } from '../../core/api/modelos';
import { solicitudBusquedaClientes, textoPago, totalAccesorios } from '../../core/api/vendedor-api';
import { guardarSesionDePrueba } from '../../testing/sesion';
import ClienteFormulario from './cliente-formulario';
import InicioVendedor from './inicio-vendedor';
import VentaAccesorios from './venta-accesorios';
import VentaMoto from './venta-moto';

const JUAN: ClienteSede = {
  idCliente: 2,
  documento: '1022345678',
  nombres: 'Juan Sebastián',
  apellidos: 'López Medina',
  fechaNacimiento: '1990-01-01',
  ciudad: 'Bogotá',
  barrio: 'Chapinero',
  calle: 'Calle 1',
  numeroDireccion: '1-1',
  telefonos: ['3012345678'],
  correos: [],
  tieneCuentaWeb: true,
};

const RESERVADA: MotoInventario = {
  placa: 'MNP12E',
  marca: 'KTM',
  modelo: 'Duke 200',
  tipoMoto: 'NAKED',
  anio: 2026,
  color: 'Naranja',
  precio: 17500000,
  idSucursal: 1,
  sucursal: 'Sede Chapinero',
  reservada: true,
  idReserva: 8,
  idClienteReserva: 2,
  clienteReserva: 'Juan Sebastián López Medina',
  vencimientoReserva: '2026-11-03',
};

describe('Panel del vendedor', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    guardarSesionDePrueba('VENDEDOR');
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: 'inicio', component: InicioVendedor },
            { path: 'moto', component: VentaMoto },
            { path: 'accesorios', component: VentaAccesorios },
            { path: 'nuevo', component: ClienteFormulario },
            { path: 'vendedor', children: [] },
            { path: 'vendedor/ventas', children: [] },
            { path: 'vendedor/clientes', children: [] },
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

  const boton = (raiz: HTMLElement, texto: string) =>
    [...raiz.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => b.textContent?.trim() === texto,
    );

  it('decide cómo buscar clientes y calcula totales y textos de pago', () => {
    expect(solicitudBusquedaClientes('1022345678')?.params).toEqual({ documento: '1022345678' });
    expect(solicitudBusquedaClientes(' lopez ')?.params).toEqual({ texto: 'lopez' });
    expect(solicitudBusquedaClientes('a')).toBeUndefined();
    expect(
      totalAccesorios([
        { cantidad: 2, precioUnitario: 589000 },
        { cantidad: 1, precioUnitario: 349000 },
      ]),
    ).toBe(1527000);
    expect(textoPago({ metodoPago: 'TRANSFERENCIA', tipoFactura: 'POS' })).toBe(
      'Transferencia · Factura POS',
    );
  });

  it('ordena las reservas de la sede por vencimiento y ofrece registrar la venta', async () => {
    const { raiz, estable } = await abrir('/inicio');
    const reserva = (id: number, placa: string, vence: string): Reserva => ({
      idReserva: id,
      fechaReserva: '2026-10-27T09:45:00',
      fechaVencimiento: vence,
      estado: 'ACTIVA',
      placa,
      marca: 'KTM',
      modelo: 'Duke 200',
      precio: 17500000,
      idSucursal: 1,
      sucursal: 'Sede Chapinero',
      idCliente: 2,
      cliente: 'Juan Sebastián López Medina',
    });
    backend
      .expectOne('/api/vendedor/reservas')
      .flush([reserva(9, 'AAA11A', '2030-05-10'), reserva(8, 'MNP12E', '2030-05-02')]);
    backend.expectOne('/api/publico/sucursales').flush([]);
    await estable();
    expect([...raiz.querySelectorAll('.reserva-sede app-placa')].map((p) => p.textContent)).toEqual(
      ['Placa MNP12E', 'Placa AAA11A'],
    );
    expect(raiz.querySelector('.reserva-sede a.btn')?.getAttribute('href')).toBe(
      '/vendedor/ventas/moto?placa=MNP12E',
    );
  });

  it('una moto reservada fija al cliente y la venta concreta esa reserva', async () => {
    const { raiz, estable } = await abrir('/moto?placa=MNP12E');
    backend.expectOne('/api/vendedor/inventario').flush([RESERVADA]);
    await vi.waitFor(() => backend.expectOne('/api/vendedor/clientes/2').flush(JUAN));
    await estable();
    expect(raiz.querySelector('.aviso-reserva')?.textContent).toContain('reserva N.º');
    expect(raiz.querySelector('.selector-cliente__elegido button')).toBeNull();
    expect(raiz.querySelector<HTMLInputElement>('[formcontrolname="valorTotal"]')?.value).toBe(
      '17500000',
    );

    const elegir = (nombre: string, valor: string) => {
      const select = raiz.querySelector<HTMLSelectElement>(`[formcontrolname="${nombre}"]`);
      if (select) {
        select.value = valor;
        select.dispatchEvent(new Event('change'));
      }
    };
    elegir('metodoPago', 'EFECTIVO');
    elegir('tipoFactura', 'POS');
    boton(raiz, 'Revisar venta')?.click();
    await estable();
    expect(raiz.querySelector('#titulo-etapa')?.textContent).toContain('Revisa antes de confirmar');

    boton(raiz, 'Confirmar venta')?.click();
    const peticion = backend.expectOne('/api/vendedor/ventas-moto');
    expect(peticion.request.body).toEqual({
      placa: 'MNP12E',
      idCliente: 2,
      metodoPago: 'EFECTIVO',
      tipoFactura: 'POS',
      valorTotal: 17500000,
      idReserva: 8,
    });
    peticion.flush({ placa: 'MNP12E', marca: 'KTM', modelo: 'Duke 200', cliente: 'Juan' });
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/vendedor'));
  });

  it('un 409 de la venta queda visible en el resumen', async () => {
    const { raiz, estable } = await abrir('/moto?placa=MNP12E&cliente=2');
    backend.expectOne('/api/vendedor/inventario').flush([
      {
        ...RESERVADA,
        reservada: false,
        idReserva: null,
        idClienteReserva: null,
        clienteReserva: null,
        vencimientoReserva: null,
      },
    ]);
    backend.expectOne('/api/vendedor/clientes/2').flush(JUAN);
    await estable();
    for (const [nombre, valor] of [
      ['metodoPago', 'EFECTIVO'],
      ['tipoFactura', 'POS'],
    ]) {
      const select = raiz.querySelector<HTMLSelectElement>(`[formcontrolname="${nombre}"]`);
      if (select) {
        select.value = valor;
        select.dispatchEvent(new Event('change'));
      }
    }
    boton(raiz, 'Revisar venta')?.click();
    await estable();
    boton(raiz, 'Confirmar venta')?.click();
    backend
      .expectOne('/api/vendedor/ventas-moto')
      .flush(
        { estado: 409, mensaje: 'La moto MNP12E ya fue vendida.', campos: [] },
        { status: 409, statusText: 'Conflict' },
      );
    await estable();
    expect(raiz.querySelector('#error-venta')?.textContent).toContain(
      'La moto MNP12E ya fue vendida.',
    );
  });

  it('suma los accesorios en pantalla y no deja repetir uno', async () => {
    const { harness, raiz, estable } = await abrir('/accesorios?cliente=2');
    backend.expectOne('/api/vendedor/clientes/2').flush(JUAN);
    backend.expectOne('/api/publico/accesorios').flush([
      { idAccesorio: 7, nombre: 'Baúl Givi E43', marca: 'Givi', descripcion: null, precio: 589000 },
      { idAccesorio: 5, nombre: 'Casco Ich 3110', marca: 'Ich', descripcion: null, precio: 349000 },
    ]);
    await estable();
    const componente = harness.routeDebugElement?.componentInstance as VentaAccesorios;
    const items = componente['formulario'].controls.items;
    items.at(0).patchValue({ idAccesorio: 7, cantidad: 2 });
    boton(raiz, 'Agregar otro accesorio')?.click();
    await estable();
    items.at(1).patchValue({ idAccesorio: 5 });
    await estable();
    expect(items.at(1).controls.precioUnitario.value).toBe(349000);
    expect(raiz.querySelector('.total-venta')?.textContent?.replace(/\s/g, '')).toBe(
      'Total$1.527.000',
    );
    const segunda = raiz.querySelector<HTMLSelectElement>('#item-accesorio-1');
    const baulEnSegunda = [...(segunda?.options ?? [])].find((o) =>
      o.textContent?.includes('Baúl'),
    );
    expect(baulEnSegunda?.disabled).toBe(true);
  });

  it('un documento repetido se marca en su campo', async () => {
    const { harness, raiz, estable } = await abrir('/nuevo?documento=1099111222');
    await estable();
    const componente = harness.routeDebugElement?.componentInstance as ClienteFormulario;
    componente['formulario'].patchValue({
      nombres: 'Otra',
      apellidos: 'Persona',
      fechaNacimiento: '1991-01-01',
      ciudad: 'Cali',
      barrio: 'Granada',
      calle: 'Calle 1',
      numeroDireccion: '1-1',
    });
    raiz.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    backend
      .expectOne('/api/vendedor/clientes')
      .flush(
        { estado: 409, mensaje: 'Ya existe un cliente con el documento 1099111222.', campos: [] },
        { status: 409, statusText: 'Conflict' },
      );
    await estable();
    const documento = raiz.querySelector('[formcontrolname="documento"]');
    expect(documento?.getAttribute('aria-invalid')).toBe('true');
    expect(documento?.closest('app-campo')?.querySelector('.campo__error')?.textContent).toContain(
      'Ya existe un cliente con el documento 1099111222.',
    );
  });
});
