import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FormGroup, FormControl, FormArray } from '@angular/forms';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { diasHasta, textoVencimiento } from '../../core/api/cliente-api';
import { aplicarErroresDeCampos } from '../../core/api/errores';
import { MotoDetalle, Reserva } from '../../core/api/modelos';
import { ConfirmacionService } from '../../shared/ui/confirmacion/confirmacion.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import AgendarReparacion from './agendar-reparacion';
import ConfirmarReserva from './confirmar-reserva';
import MisReservas from './mis-reservas';
import Perfil from './perfil';
import { HttpErrorResponse } from '@angular/common/http';

const RESERVA: Reserva = {
  idReserva: 9,
  fechaReserva: '2026-11-01T18:00:00',
  fechaVencimiento: '2026-11-08',
  estado: 'ACTIVA',
  placa: 'GTK22F',
  marca: 'Yamaha',
  modelo: 'NMAX 155',
  precio: 15900000,
  idSucursal: 1,
  sucursal: 'Sede Chapinero',
  idCliente: 1,
  cliente: 'María José Ramírez Castro',
};

const DETALLE: MotoDetalle = {
  placa: 'GTK22F',
  idMarca: 1,
  marca: 'Yamaha',
  paisOrigenMarca: 'Japón',
  nroModelo: 2,
  modelo: 'NMAX 155',
  tipoMoto: 'SCOOTER',
  cilindraje: 155,
  potenciaHp: 15.1,
  capacidadTanque: 7.1,
  anio: 2026,
  color: 'Gris mate',
  kilometraje: 0,
  precio: 15900000,
  sucursal: {
    idSucursal: 1,
    nombre: 'Sede Chapinero',
    ciudad: 'Bogotá',
    barrio: 'Chapinero',
    calle: 'Calle 63',
    numeroDireccion: '13-45',
  },
};

const conflicto = (mensaje: string) => ({
  body: { estado: 409, mensaje, campos: [] },
  opciones: { status: 409, statusText: 'Conflict' },
});

describe('Área del cliente', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: 'reservas', component: MisReservas },
            { path: 'reservar/:placa', component: ConfirmarReserva },
            { path: 'agendar', component: AgendarReparacion },
            { path: 'perfil', component: Perfil },
            { path: 'reparaciones', children: [] },
          ],
          withComponentInputBinding(),
        ),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  async function abrir(url: string) {
    const harness = await RouterTestingHarness.create(url);
    const raiz = harness.fixture.nativeElement as HTMLElement;
    const estable = () => harness.fixture.whenStable();
    return { harness, raiz, estable };
  }

  const texto = (raiz: HTMLElement, selector: string) =>
    raiz.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();

  it('cuenta los días hasta el vencimiento', () => {
    const hoy = new Date(2026, 10, 1, 22, 0);
    expect(diasHasta('2026-11-08', hoy)).toBe(7);
    expect(textoVencimiento('2026-11-02', hoy)).toBe('vence mañana');
    expect(textoVencimiento('2026-11-01', hoy)).toBe('vence hoy');
    expect(textoVencimiento('2026-11-05', hoy)).toBe('vence en 4 días');
  });

  it('ubica los errores del back también dentro de listas y grupos', () => {
    const formulario = new FormGroup({
      telefonos: new FormArray([new FormControl(''), new FormControl('')]),
      motoExterna: new FormGroup({ anio: new FormControl(0) }),
    });
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        mensaje: 'Revise los datos.',
        campos: [
          { campo: 'telefonos[1]', mensaje: 'Cada teléfono debe tener entre 7 y 15 dígitos.' },
          { campo: 'motoExterna.anio', mensaje: 'El año mínimo es 1980.' },
        ],
      },
    });
    expect(aplicarErroresDeCampos(formulario, error)).toBe(true);
    expect(formulario.get('telefonos.1')?.errors?.['servidor']).toContain('7 y 15');
    expect(formulario.get('motoExterna.anio')?.errors?.['servidor']).toBe('El año mínimo es 1980.');
  });

  describe('reservas', () => {
    it('muestra la activa con su vencimiento y la cancela tras confirmar', async () => {
      const { raiz, estable } = await abrir('/reservas');
      backend
        .expectOne('/api/cliente/reservas')
        .flush([RESERVA, { ...RESERVA, idReserva: 1, estado: 'CONCRETADA', placa: 'HBN46C' }]);
      await estable();
      expect(texto(raiz, '.tarjeta-cuenta--destacada')).toContain('Hasta el 8 de nov');
      expect(raiz.querySelectorAll('app-tabla tbody tr').length).toBe(1);

      const confirmacion = TestBed.inject(ConfirmacionService);
      raiz.querySelector<HTMLButtonElement>('.tarjeta-cuenta--destacada button')?.click();
      expect(confirmacion.actual()?.titulo).toBe('¿Cancelar la reserva de la Yamaha NMAX 155?');
      confirmacion.responder(true);
      await vi.waitFor(() => backend.expectOne('/api/cliente/reservas/9/cancelar'));
    });

    it('si el back rechaza la cancelación, avisa con su mensaje', async () => {
      const { raiz, estable } = await abrir('/reservas');
      backend.expectOne('/api/cliente/reservas').flush([RESERVA]);
      await estable();
      const toast = TestBed.inject(ToastService);
      raiz.querySelector<HTMLButtonElement>('.tarjeta-cuenta--destacada button')?.click();
      TestBed.inject(ConfirmacionService).responder(true);
      const { body, opciones } = conflicto('Solo se pueden cancelar reservas activas.');
      await vi.waitFor(() =>
        backend.expectOne('/api/cliente/reservas/9/cancelar').flush(body, opciones),
      );
      expect(toast.toasts().map((t) => t.mensaje)).toEqual([
        'Solo se pueden cancelar reservas activas.',
      ]);
    });
  });

  describe('confirmar reserva', () => {
    it('confirma y muestra la fecha que devuelve el back', async () => {
      const { raiz, estable } = await abrir('/reservar/GTK22F');
      backend.expectOne('/api/publico/motos/GTK22F').flush(DETALLE);
      await estable();
      raiz.querySelector<HTMLButtonElement>('.confirmacion button')?.click();
      const peticion = backend.expectOne('/api/cliente/reservas');
      expect(peticion.request.body).toEqual({ placa: 'GTK22F' });
      peticion.flush(RESERVA);
      await estable();
      expect(texto(raiz, 'h1')).toBe('Reserva confirmada');
      expect(texto(raiz, '.confirmacion > p')).toContain('hasta el 8 de nov');
    });

    it('un 409 se explica con la causa y qué hacer', async () => {
      const { raiz, estable } = await abrir('/reservar/GTK22F');
      backend.expectOne('/api/publico/motos/GTK22F').flush(DETALLE);
      await estable();
      raiz.querySelector<HTMLButtonElement>('.confirmacion button')?.click();
      const { body, opciones } = conflicto('La moto GTK22F no está disponible para reservar.');
      backend.expectOne('/api/cliente/reservas').flush(body, opciones);
      await estable();
      const alerta = raiz.querySelector('#error-reserva');
      expect(alerta?.getAttribute('role')).toBe('alert');
      expect(alerta?.textContent).toContain('La moto GTK22F no está disponible para reservar.');
      expect(alerta?.textContent).toContain('tus reservas');
    });
  });

  describe('agendar reparación', () => {
    async function abrirAsistente() {
      const abierto = await abrir('/agendar');
      backend.expectOne('/api/cliente/motos').flush([
        {
          placa: 'HBN46C',
          marca: 'Honda',
          modelo: 'CB 190R',
          anio: 2026,
          color: 'Rojo',
          origen: 'INVENTARIO',
        },
      ]);
      backend.expectOne('/api/publico/sucursales').flush([DETALLE.sucursal]);
      backend
        .expectOne('/api/publico/marcas')
        .flush([{ idMarca: 2, nombre: 'Honda', paisOrigen: 'Japón' }]);
      await abierto.estable();
      const componente = abierto.harness.routeDebugElement?.componentInstance as AgendarReparacion;
      return { ...abierto, formulario: componente['formulario'] };
    }

    const boton = (raiz: HTMLElement, etiqueta: string) =>
      [...raiz.querySelectorAll<HTMLButtonElement>('button')].find(
        (b) => b.textContent?.trim() === etiqueta,
      );

    it('no avanza sin elegir moto', async () => {
      const { raiz, estable } = await abrirAsistente();
      boton(raiz, 'Siguiente')?.click();
      await estable();
      expect(texto(raiz, '.pasos [aria-current="step"]')).toBe('1Moto');
      expect(texto(raiz, '.campo__error')).toBe('Elige una de tus motos.');
    });

    it('agenda una moto propia sin enviar datos de moto externa', async () => {
      const { raiz, estable, formulario } = await abrirAsistente();
      formulario.patchValue({
        placaPropia: 'HBN46C',
        idSucursal: 1,
        fechaAgendada: '2030-01-15T09:30',
        descripcion: 'Cambio de aceite',
      });
      boton(raiz, 'Siguiente')?.click();
      await estable();
      boton(raiz, 'Siguiente')?.click();
      await estable();
      raiz.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
      const peticion = backend.expectOne('/api/cliente/reparaciones');
      expect(peticion.request.body).toEqual({
        placa: 'HBN46C',
        idSucursal: 1,
        fechaAgendada: '2030-01-15T09:30',
        descripcion: 'Cambio de aceite',
        kilometrajeIngreso: null,
        motoExterna: null,
      });
    });

    it('con moto externa envía sus datos y un 409 queda visible en la revisión', async () => {
      const { raiz, estable, formulario } = await abrirAsistente();
      formulario.patchValue({ tipoMoto: 'externa' });
      formulario.patchValue({
        placa: 'qwe12r',
        motoExterna: { idMarca: 2, nroModelo: 1, anio: 2021, color: ' Negro ' },
        idSucursal: 1,
        fechaAgendada: '2030-01-15T09:30',
        descripcion: 'Frenos',
      });
      await vi.waitFor(() =>
        backend
          .expectOne('/api/publico/marcas/2/modelos')
          .flush([{ idMarca: 2, nroModelo: 1, nombreMarca: 'Honda', nombre: 'CB 190R' }]),
      );
      formulario.controls.motoExterna.controls.nroModelo.setValue(1);
      await estable();
      for (let i = 0; i < 2; i++) {
        boton(raiz, 'Siguiente')?.click();
        await estable();
      }
      raiz.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
      const peticion = backend.expectOne('/api/cliente/reparaciones');
      expect(peticion.request.body.placa).toBe('QWE12R');
      expect(peticion.request.body.motoExterna).toEqual({
        idMarca: 2,
        nroModelo: 1,
        anio: 2021,
        color: 'Negro',
      });
      const { body, opciones } = conflicto(
        'La moto QWE12R ya tiene un servicio pendiente en el taller.',
      );
      peticion.flush(body, opciones);
      await estable();
      expect(texto(raiz, '#error-agendar')).toContain('ya tiene un servicio pendiente');
    });
  });

  describe('perfil', () => {
    const PERFIL = {
      idCliente: 1,
      documento: '1013654789',
      nombres: 'María José',
      apellidos: 'Ramírez Castro',
      fechaNacimiento: '1995-04-18',
      edad: 31,
      ciudad: 'Bogotá',
      barrio: 'Galerías',
      calle: 'Calle 53',
      numeroDireccion: '24-31',
      correoAcceso: 'maria.ramirez@correo.test',
      telefonos: ['3001234567'],
      correos: ['maria.ramirez@correo.test'],
    };

    it('carga los datos, valida los teléfonos nuevos y guarda sin vacíos', async () => {
      const { raiz, estable } = await abrir('/perfil');
      backend.expectOne('/api/cliente/perfil').flush(PERFIL);
      await estable();
      expect(raiz.querySelector<HTMLInputElement>('#telefono-0')?.value).toBe('3001234567');

      raiz.querySelector<HTMLButtonElement>('#agregar-telefono')?.click();
      await estable();
      const nuevo = raiz.querySelector<HTMLInputElement>('#telefono-1');
      if (nuevo) {
        nuevo.value = '123';
        nuevo.dispatchEvent(new Event('input'));
        nuevo.dispatchEvent(new Event('blur'));
      }
      await estable();
      expect(texto(raiz, '#error-telefono-1')).toBe('Escribe solo números, entre 7 y 15 dígitos.');

      raiz.querySelector<HTMLButtonElement>('button[aria-label="Quitar teléfono 2"]')?.click();
      await estable();
      raiz.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
      const peticion = backend.expectOne('/api/cliente/perfil');
      expect(peticion.request.method).toBe('PUT');
      expect(peticion.request.body.telefonos).toEqual(['3001234567']);
      expect(peticion.request.body.documento).toBe('1013654789');
    });
  });

  it('las rutas del área se resuelven', async () => {
    await RouterTestingHarness.create('/reparaciones');
    expect(TestBed.inject(Router).url).toBe('/reparaciones');
  });
});
