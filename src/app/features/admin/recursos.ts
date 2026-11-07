import { Validators } from '@angular/forms';
import {
  API_ADMIN,
  ESTADOS_MOTO,
  TIPOS_EMPLEADO,
  parametrosSuministro,
} from '../../core/api/admin-api';
import {
  Accesorio,
  ClienteSede,
  EmpleadoAdmin,
  Marca,
  Modelo,
  MotoAdmin,
  Proveedor,
  Reparacion,
  Repuesto,
  Reserva,
  Sucursal,
  Suministro,
  VentaAccesorio,
  VentaMoto,
} from '../../core/api/modelos';
import { API_VENDEDOR, nombreCliente } from '../../core/api/vendedor-api';
import { TIPOS_MOTO, nombreTipoMoto } from '../../shared/formato/tipos-moto';
import { fechaPasada, noFutura } from '../../shared/formularios/mensajes';
import {
  CampoRecurso,
  FuenteOpciones,
  GrupoRecursos,
  definir,
  opcionesDe,
  opcionesFijas,
} from './recurso';

const PRECIO = { min: 'El precio debe ser mayor que cero.' };
const NO_FUTURA = { noFutura: 'La fecha no puede ser posterior a hoy.' };

const sedes: FuenteOpciones = ({ catalogos }) =>
  opcionesDe(
    catalogos.lista('sedes'),
    (s) => s.idSucursal,
    (s) => `${s.nombre} (${s.ciudad})`,
  );

const marcas: FuenteOpciones = ({ catalogos }) =>
  opcionesDe(
    catalogos.lista('marcas'),
    (m) => m.idMarca,
    (m) => m.nombre,
  );

function texto(
  clave: string,
  etiqueta: string,
  maximo: number,
  extra: Partial<CampoRecurso> = {},
): CampoRecurso {
  return {
    clave,
    etiqueta,
    tipo: 'texto',
    obligatorio: true,
    maximo,
    validadores: [Validators.maxLength(maximo)],
    ...extra,
  };
}

function precio(clave = 'precio', etiqueta = 'Precio'): CampoRecurso {
  return {
    clave,
    etiqueta,
    tipo: 'numero',
    obligatorio: true,
    ayuda: 'En pesos colombianos, sin puntos.',
    min: 1,
    paso: 'any',
    validadores: [Validators.min(1)],
    mensajes: PRECIO,
  };
}

const DIRECCION_SEDE: CampoRecurso[] = [
  texto('ciudad', 'Ciudad', 60),
  texto('barrio', 'Barrio', 60),
  texto('calle', 'Dirección', 60, { ayuda: 'Calle y número, por ejemplo Calle 63 # 13-45.' }),
];

const DIRECCION: CampoRecurso[] = [
  ...DIRECCION_SEDE.slice(0, 2),
  texto('calle', 'Calle', 60, { ayuda: 'Por ejemplo, Calle 72 o Carrera 15.' }),
  texto('numeroDireccion', 'Número', 20, { ayuda: 'Por ejemplo, 10-35.' }),
];

const DOCUMENTO: CampoRecurso = texto('documento', 'Documento', 15, {
  ayuda: 'Solo números, entre 5 y 15 dígitos.',
  validadores: [Validators.pattern(/^[0-9]{5,15}$/)],
  mensajes: { pattern: 'Escribe solo números, entre 5 y 15 dígitos.' },
  autocompletar: 'off',
});

const MARCAS = definir<Marca>({
  ruta: 'marcas',
  titulo: 'Marcas',
  singular: 'marca',
  genero: 'f',
  descripcion: 'Fabricantes de las motos. Cada modelo pertenece a una marca.',
  vacio: 'Aún no hay marcas registradas.',
  icono: 'moto',
  url: `${API_ADMIN}/marcas`,
  urlDe: (id) => `${API_ADMIN}/marcas/${id}`,
  id: (m) => String(m.idMarca),
  nombre: (m) => m.nombre,
  columnas: [
    { clave: 'nombre', titulo: 'Marca', ordenable: true },
    { clave: 'paisOrigen', titulo: 'País de origen', ordenable: true },
  ],
  campos: [texto('nombre', 'Nombre', 60), texto('paisOrigen', 'País de origen', 60)],
  alimenta: ['marcas', 'modelos'],
  bloqueo: 'La marca tiene modelos registrados. Elimina primero sus modelos.',
});

const MODELOS = definir<Modelo>({
  ruta: 'modelos',
  titulo: 'Modelos',
  singular: 'modelo',
  genero: 'm',
  descripcion:
    'Ficha técnica de cada modelo. Las motos del inventario se registran sobre un modelo.',
  vacio: 'Aún no hay modelos registrados.',
  icono: 'moto',
  url: `${API_ADMIN}/modelos`,
  urlDe: (id) => `${API_ADMIN}/modelos/${id.replace('-', '/')}`,
  id: (m) => `${m.idMarca}-${m.nroModelo}`,
  nombre: (m) => `${m.nombreMarca} ${m.nombre}`,
  vista: (m) => ({ ...m, tipo: nombreTipoMoto(m.tipoMoto) }),
  columnas: [
    { clave: 'nombreMarca', titulo: 'Marca', ordenable: true },
    { clave: 'nombre', titulo: 'Modelo', ordenable: true },
    { clave: 'tipo', titulo: 'Tipo', ordenable: true },
    { clave: 'cilindraje', titulo: 'Cilindraje (cc)', tipo: 'numero', ordenable: true },
    { clave: 'potenciaHp', titulo: 'Potencia (hp)', tipo: 'numero', ordenable: true },
    { clave: 'capacidadTanque', titulo: 'Tanque (gal)', tipo: 'numero' },
  ],
  filtros: [
    {
      clave: 'idMarca',
      etiqueta: 'Marca',
      todos: 'Todas las marcas',
      opciones: marcas,
      local: true,
    },
  ],
  catalogos: ['marcas'],
  alimenta: ['modelos'],
  campos: [
    {
      clave: 'idMarca',
      etiqueta: 'Marca',
      tipo: 'seleccion',
      obligatorio: true,
      numerico: true,
      opciones: marcas,
      fijoAlEditar:
        'La marca de un modelo no se cambia. Si quedó mal, registra el modelo en la marca correcta.',
    },
    texto('nombre', 'Nombre del modelo', 80, { ayuda: 'Único dentro de la marca.' }),
    {
      clave: 'tipoMoto',
      etiqueta: 'Tipo de moto',
      tipo: 'seleccion',
      obligatorio: true,
      opciones: opcionesFijas(TIPOS_MOTO),
    },
    {
      clave: 'cilindraje',
      etiqueta: 'Cilindraje (cc)',
      tipo: 'numero',
      obligatorio: true,
      ayuda: 'Entre 50 y 2500.',
      min: 50,
      max: 2500,
      paso: 1,
      validadores: [Validators.min(50), Validators.max(2500)],
    },
    {
      clave: 'potenciaHp',
      etiqueta: 'Potencia (hp)',
      tipo: 'numero',
      obligatorio: true,
      min: 0.1,
      paso: 0.1,
      validadores: [Validators.min(0.1), Validators.max(9999.9)],
      mensajes: { min: 'La potencia debe ser mayor que cero.' },
    },
    {
      clave: 'capacidadTanque',
      etiqueta: 'Capacidad del tanque (gal)',
      tipo: 'numero',
      obligatorio: true,
      min: 0.1,
      paso: 0.1,
      validadores: [Validators.min(0.1), Validators.max(999.9)],
      mensajes: { min: 'La capacidad debe ser mayor que cero.' },
    },
  ],
  bloqueo: 'Hay motos registradas con este modelo. Elimina o cambia primero esas motos.',
});

const MOTOS = definir<MotoAdmin>({
  ruta: 'motos',
  titulo: 'Motos',
  singular: 'moto',
  genero: 'f',
  descripcion: 'Motos de cada sede. El estado cambia solo con las reservas y las ventas.',
  vacio: 'Aún no hay motos registradas.',
  icono: 'moto',
  url: `${API_ADMIN}/motos`,
  urlDe: (id) => `${API_ADMIN}/motos/${id}`,
  id: (m) => m.placa,
  nombre: (m) => m.placa,
  vista: (m) => ({ ...m, moto: `${m.marca} ${m.modelo}` }),
  columnas: [
    { clave: 'placa', titulo: 'Placa', tipo: 'placa', ordenable: true },
    { clave: 'moto', titulo: 'Moto', ordenable: true },
    { clave: 'anio', titulo: 'Año', tipo: 'numero', ordenable: true },
    { clave: 'estado', titulo: 'Estado', tipo: 'estado', ordenable: true },
    { clave: 'sucursal', titulo: 'Sede', ordenable: true },
    { clave: 'precio', titulo: 'Precio', tipo: 'pesos', ordenable: true },
  ],
  filtros: [
    { clave: 'idSucursal', etiqueta: 'Sede', todos: 'Todas las sedes', opciones: sedes },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      todos: 'Todos los estados',
      opciones: opcionesFijas(ESTADOS_MOTO),
    },
  ],
  catalogos: ['sedes', 'modelos'],
  campos: [
    texto('placa', 'Placa', 6, {
      ayuda: 'Tres letras, dos números y una letra, por ejemplo ABC12D.',
      validadores: [Validators.pattern(/^[A-Za-z]{3}[0-9]{2}[A-Za-z]$/)],
      mensajes: { pattern: 'Usa el formato ABC12D.' },
      placa: true,
      autocompletar: 'off',
      fijoAlEditar: 'La placa no se cambia. Si quedó mal, elimina la moto y regístrala de nuevo.',
    }),
    {
      clave: 'modeloMoto',
      etiqueta: 'Modelo',
      tipo: 'seleccion',
      obligatorio: true,
      ayuda: 'Si el modelo no aparece, regístralo primero en Modelos.',
      opciones: ({ catalogos }) =>
        opcionesDe(
          catalogos.lista('modelos'),
          (m) => `${m.idMarca}-${m.nroModelo}`,
          (m) => `${m.nombre} · ${m.cilindraje} cc`,
          (m) => m.nombreMarca,
        ),
    },
    {
      clave: 'idSucursal',
      etiqueta: 'Sede',
      tipo: 'seleccion',
      obligatorio: true,
      numerico: true,
      opciones: sedes,
    },
    precio(),
    {
      clave: 'anio',
      etiqueta: 'Año',
      tipo: 'numero',
      obligatorio: true,
      min: 1980,
      max: 2030,
      paso: 1,
      validadores: [Validators.min(1980), Validators.max(2030)],
    },
    texto('color', 'Color', 30),
    {
      clave: 'kilometraje',
      etiqueta: 'Kilometraje',
      tipo: 'numero',
      obligatorio: true,
      min: 0,
      paso: 1,
      validadores: [Validators.min(0)],
      mensajes: { min: 'El kilometraje no puede ser negativo.' },
    },
    { clave: 'fechaIngreso', etiqueta: 'Fecha de ingreso', tipo: 'fecha', obligatorio: true },
  ],
  aFormulario: (m) => ({ modeloMoto: `${m.idMarca}-${m.nroModelo}` }),
  aCuerpo: ({ modeloMoto, placa, ...resto }) => {
    const [idMarca, nroModelo] = String(modeloMoto).split('-').map(Number);
    return { ...resto, placa: String(placa).toUpperCase(), idMarca, nroModelo };
  },
  bloqueo:
    'La moto tiene reservas, ventas o reparaciones registradas. Elimina primero esos registros.',
});

const SEDES = definir<Sucursal>({
  ruta: 'sedes',
  titulo: 'Sedes',
  singular: 'sede',
  genero: 'f',
  descripcion: 'Puntos de venta y taller. Empleados, motos y entregas se asignan a una sede.',
  vacio: 'Aún no hay sedes registradas.',
  icono: 'sede',
  url: `${API_ADMIN}/sucursales`,
  urlDe: (id) => `${API_ADMIN}/sucursales/${id}`,
  id: (s) => String(s.idSucursal),
  nombre: (s) => s.nombre,
  vista: (s) => ({ ...s, direccion: `${s.calle}, ${s.barrio}` }),
  columnas: [
    { clave: 'nombre', titulo: 'Sede', ordenable: true },
    { clave: 'ciudad', titulo: 'Ciudad', ordenable: true },
    { clave: 'direccion', titulo: 'Dirección' },
  ],
  campos: [texto('nombre', 'Nombre', 80), ...DIRECCION_SEDE],
  alimenta: ['sedes'],
  bloqueo:
    'La sede tiene empleados, motos, reservas o entregas asociadas. Muévelos o elimínalos primero.',
});

const ACCESORIOS = definir<Accesorio>({
  ruta: 'accesorios',
  titulo: 'Accesorios',
  singular: 'accesorio',
  genero: 'm',
  descripcion: 'Cascos, chaquetas y demás artículos que venden los vendedores.',
  vacio: 'Aún no hay accesorios registrados.',
  icono: 'venta',
  url: `${API_ADMIN}/accesorios`,
  urlDe: (id) => `${API_ADMIN}/accesorios/${id}`,
  id: (a) => String(a.idAccesorio),
  nombre: (a) => a.nombre,
  columnas: [
    { clave: 'nombre', titulo: 'Accesorio', ordenable: true },
    { clave: 'marca', titulo: 'Marca', ordenable: true },
    { clave: 'precio', titulo: 'Precio', tipo: 'pesos', ordenable: true },
  ],
  campos: [
    texto('nombre', 'Nombre', 80),
    texto('marca', 'Marca', 60),
    {
      clave: 'descripcion',
      etiqueta: 'Descripción',
      tipo: 'area',
      maximo: 255,
      validadores: [Validators.maxLength(255)],
      completo: true,
    },
    precio(),
  ],
  bloqueo: 'El accesorio aparece en ventas registradas, así que no se puede eliminar.',
});

const REPUESTOS = definir<Repuesto>({
  ruta: 'repuestos',
  titulo: 'Repuestos',
  singular: 'repuesto',
  genero: 'm',
  descripcion: 'Piezas que el taller usa en las reparaciones y que llegan en las entregas.',
  vacio: 'Aún no hay repuestos registrados.',
  icono: 'taller',
  url: `${API_ADMIN}/repuestos`,
  urlDe: (id) => `${API_ADMIN}/repuestos/${id}`,
  id: (r) => String(r.idRepuesto),
  nombre: (r) => r.nombre,
  columnas: [
    { clave: 'nombre', titulo: 'Repuesto', ordenable: true },
    { clave: 'categoria', titulo: 'Categoría', ordenable: true },
    { clave: 'precio', titulo: 'Precio', tipo: 'pesos', ordenable: true },
  ],
  campos: [
    texto('nombre', 'Nombre', 80),
    texto('categoria', 'Categoría', 40, { ayuda: 'Por ejemplo, Frenos o Motor.' }),
    precio(),
  ],
  alimenta: ['repuestos'],
  bloqueo:
    'El repuesto aparece en reparaciones o entregas registradas. Elimina primero esos registros.',
});

const PROVEEDORES = definir<Proveedor>({
  ruta: 'proveedores',
  titulo: 'Proveedores',
  singular: 'proveedor',
  genero: 'm',
  descripcion: 'Empresas que entregan repuestos a las sedes.',
  vacio: 'Aún no hay proveedores registrados.',
  icono: 'sede',
  url: `${API_ADMIN}/proveedores`,
  urlDe: (id) => `${API_ADMIN}/proveedores/${encodeURIComponent(id)}`,
  id: (p) => p.nit,
  nombre: (p) => p.nombre,
  columnas: [
    { clave: 'nit', titulo: 'NIT', tipo: 'codigo' },
    { clave: 'nombre', titulo: 'Proveedor', ordenable: true },
    { clave: 'telefono', titulo: 'Teléfono', tipo: 'codigo' },
    { clave: 'correo', titulo: 'Correo' },
  ],
  campos: [
    texto('nit', 'NIT', 14, {
      ayuda: 'Con dígito de verificación, por ejemplo 900123456-7.',
      validadores: [Validators.pattern(/^[0-9]{6,12}-[0-9]$/)],
      mensajes: { pattern: 'Usa el formato 900123456-7.' },
      autocompletar: 'off',
      fijoAlEditar: 'El NIT identifica al proveedor y no se cambia.',
    }),
    texto('nombre', 'Nombre', 100),
    texto('telefono', 'Teléfono', 15, {
      tipo: 'telefono',
      validadores: [Validators.pattern(/^[0-9]{7,15}$/)],
      mensajes: { pattern: 'Escribe solo números, entre 7 y 15 dígitos.' },
    }),
    texto('correo', 'Correo', 120, {
      tipo: 'correo',
      validadores: [Validators.email, Validators.maxLength(120)],
    }),
  ],
  alimenta: ['proveedores'],
  bloqueo: 'El proveedor tiene entregas de repuestos registradas. Elimina primero esas entregas.',
});

const esTipo = (tipo: string) => (valores: Record<string, unknown>) =>
  valores['tipoEmpleado'] === tipo;

const EMPLEADOS = definir<EmpleadoAdmin>({
  ruta: 'empleados',
  titulo: 'Empleados',
  singular: 'empleado',
  genero: 'm',
  descripcion: 'Vendedores, técnicos y dueño, con su sede, salario, jefe y correo de acceso.',
  vacio: 'Aún no hay empleados registrados.',
  icono: 'usuario',
  url: `${API_ADMIN}/empleados`,
  urlDe: (id) => `${API_ADMIN}/empleados/${id}`,
  id: (e) => String(e.idEmpleado),
  nombre: (e) => `${e.nombres} ${e.apellidos}`,
  vista: (e) => ({
    ...e,
    nombre: `${e.nombres} ${e.apellidos}`,
    cargo: TIPOS_EMPLEADO[e.tipoEmpleado],
  }),
  columnas: [
    { clave: 'documento', titulo: 'Documento', tipo: 'codigo' },
    { clave: 'nombre', titulo: 'Nombre', ordenable: true },
    { clave: 'cargo', titulo: 'Cargo', ordenable: true },
    { clave: 'sucursal', titulo: 'Sede', ordenable: true },
    { clave: 'salario', titulo: 'Salario', tipo: 'pesos', ordenable: true },
    { clave: 'jefe', titulo: 'Jefe' },
    { clave: 'correoAcceso', titulo: 'Correo de acceso' },
  ],
  filtros: [
    { clave: 'idSucursal', etiqueta: 'Sede', todos: 'Todas las sedes', opciones: sedes },
    {
      clave: 'tipo',
      etiqueta: 'Cargo',
      todos: 'Todos los cargos',
      opciones: opcionesFijas(TIPOS_EMPLEADO),
    },
  ],
  puedeEliminar: (e, idUsuario) => e.idEmpleado !== idUsuario,
  catalogos: ['sedes', 'empleados'],
  alimenta: ['empleados'],
  campos: [
    DOCUMENTO,
    texto('nombres', 'Nombres', 60, { autocompletar: 'off' }),
    texto('apellidos', 'Apellidos', 60, { autocompletar: 'off' }),
    {
      clave: 'fechaContratacion',
      etiqueta: 'Fecha de contratación',
      tipo: 'fecha',
      obligatorio: true,
      validadores: [noFutura],
      mensajes: NO_FUTURA,
    },
    {
      clave: 'tipoEmpleado',
      etiqueta: 'Cargo',
      tipo: 'seleccion',
      obligatorio: true,
      opciones: opcionesFijas(TIPOS_EMPLEADO),
      fijoAlEditar: 'El cargo no se cambia. Para otro cargo, registra al empleado de nuevo.',
    },
    {
      clave: 'idSucursal',
      etiqueta: 'Sede',
      tipo: 'seleccion',
      obligatorio: true,
      numerico: true,
      opciones: sedes,
    },
    precio('salario', 'Salario mensual'),
    {
      clave: 'idJefe',
      etiqueta: 'Jefe directo',
      tipo: 'seleccion',
      numerico: true,
      sinValor: 'Sin jefe directo',
      opciones: ({ catalogos, idEditado }) =>
        opcionesDe(
          catalogos.lista('empleados')?.filter((e) => String(e.idEmpleado) !== idEditado),
          (e) => e.idEmpleado,
          (e) => `${e.nombres} ${e.apellidos}`,
          (e) => TIPOS_EMPLEADO[e.tipoEmpleado],
        ),
    },
    texto('certificadoVentas', 'Certificado de ventas', 80, { visible: esTipo('VENDEDOR') }),
    {
      clave: 'comision',
      etiqueta: 'Comisión (%)',
      tipo: 'numero',
      obligatorio: true,
      ayuda: 'Entre 0 y 100.',
      min: 0,
      max: 100,
      paso: 'any',
      validadores: [Validators.min(0), Validators.max(100)],
      visible: esTipo('VENDEDOR'),
    },
    texto('certificadoTecnico', 'Certificado técnico', 80, { visible: esTipo('TECNICO') }),
    texto('especialidad', 'Especialidad', 60, {
      ayuda: 'Por ejemplo, Motores o Sistema eléctrico.',
      visible: esTipo('TECNICO'),
    }),
    texto('correoAcceso', 'Correo de acceso', 120, {
      tipo: 'correo',
      ayuda: 'Con este correo entra al sistema.',
      validadores: [Validators.email, Validators.maxLength(120)],
      autocompletar: 'off',
    }),
    {
      clave: 'contrasena',
      etiqueta: 'Contraseña',
      tipo: 'contrasena',
      obligatorio: 'al-crear',
      ayuda: 'Entre 8 y 72 caracteres, con al menos una letra y un número.',
      ayudaAlEditar: 'Déjala vacía para conservar la actual.',
      validadores: [Validators.pattern(/^(?=.*[A-Za-z])(?=.*[0-9]).{8,72}$/)],
      mensajes: { pattern: 'Usa entre 8 y 72 caracteres, con al menos una letra y un número.' },
      autocompletar: 'new-password',
    },
    { clave: 'telefonos', etiqueta: 'Teléfonos', tipo: 'telefonos', completo: true },
  ],
  bloqueo:
    'El empleado tiene ventas, reparaciones o personas a cargo registradas. Reasigna o elimina primero esos registros.',
});

const CLIENTES = definir<ClienteSede>({
  ruta: 'clientes',
  titulo: 'Clientes',
  singular: 'cliente',
  genero: 'm',
  descripcion: 'Todas las personas que han comprado, reservado o llevado su moto al taller.',
  vacio: 'Aún no hay clientes registrados.',
  icono: 'usuario',
  url: `${API_ADMIN}/clientes`,
  urlDe: (id) => `${API_ADMIN}/clientes/${id}`,
  id: (c) => String(c.idCliente),
  nombre: (c) => nombreCliente(c),
  vista: (c) => ({
    ...c,
    nombre: nombreCliente(c),
    telefono: c.telefonos[0] ?? '',
    cuenta: c.tieneCuentaWeb ? 'Sí' : 'No',
  }),
  columnas: [
    { clave: 'documento', titulo: 'Documento', tipo: 'codigo' },
    { clave: 'nombre', titulo: 'Nombre', ordenable: true },
    { clave: 'ciudad', titulo: 'Ciudad', ordenable: true },
    { clave: 'telefono', titulo: 'Teléfono', tipo: 'codigo' },
    { clave: 'cuenta', titulo: 'Cuenta web', ordenable: true },
  ],
  campos: [
    DOCUMENTO,
    texto('nombres', 'Nombres', 60, { autocompletar: 'off' }),
    texto('apellidos', 'Apellidos', 60, { autocompletar: 'off' }),
    {
      clave: 'fechaNacimiento',
      etiqueta: 'Fecha de nacimiento',
      tipo: 'fecha',
      obligatorio: true,
      validadores: [fechaPasada],
      mensajes: { fechaPasada: 'La fecha debe ser anterior a hoy.' },
    },
    ...DIRECCION,
    { clave: 'telefonos', etiqueta: 'Teléfonos', tipo: 'telefonos', completo: true },
    { clave: 'correos', etiqueta: 'Correos', tipo: 'correos', completo: true },
  ],
  bloqueo:
    'El cliente tiene reservas, compras o reparaciones registradas. Elimina primero esos registros.',
});

const SUMINISTROS = definir<Suministro>({
  ruta: 'entregas',
  titulo: 'Entregas de repuestos',
  singular: 'entrega',
  genero: 'f',
  descripcion: 'Repuestos que cada proveedor entregó en una sede, con cantidad y costo.',
  vacio: 'Aún no hay entregas registradas.',
  icono: 'taller',
  url: `${API_ADMIN}/suministros`,
  id: (s) => `${s.nit}|${s.idRepuesto}|${s.idSucursal}|${s.fechaSuministro}`,
  nombre: (s) => `de ${s.cantidad} × ${s.repuesto}`,
  vista: (s) => ({ ...s, total: s.cantidad * s.costoUnitario }),
  columnas: [
    { clave: 'fechaSuministro', titulo: 'Fecha', tipo: 'fecha-hora', ordenable: true },
    { clave: 'proveedor', titulo: 'Proveedor', ordenable: true },
    { clave: 'repuesto', titulo: 'Repuesto', ordenable: true },
    { clave: 'sucursal', titulo: 'Sede', ordenable: true },
    { clave: 'cantidad', titulo: 'Cantidad', tipo: 'numero' },
    { clave: 'costoUnitario', titulo: 'Costo unitario', tipo: 'pesos' },
    { clave: 'total', titulo: 'Total', tipo: 'pesos', ordenable: true },
  ],
  filtros: [
    { clave: 'idSucursal', etiqueta: 'Sede', todos: 'Todas las sedes', opciones: sedes },
    {
      clave: 'nit',
      etiqueta: 'Proveedor',
      todos: 'Todos los proveedores',
      opciones: ({ catalogos }) =>
        opcionesDe(
          catalogos.lista('proveedores'),
          (p) => p.nit,
          (p) => p.nombre,
        ),
    },
  ],
  editable: false,
  eliminar: (s) => ({ url: `${API_ADMIN}/suministros`, params: parametrosSuministro(s) }),
  catalogos: ['sedes', 'proveedores', 'repuestos'],
  campos: [
    {
      clave: 'nit',
      etiqueta: 'Proveedor',
      tipo: 'seleccion',
      obligatorio: true,
      opciones: ({ catalogos }) =>
        opcionesDe(
          catalogos.lista('proveedores'),
          (p) => p.nit,
          (p) => p.nombre,
        ),
    },
    {
      clave: 'idRepuesto',
      etiqueta: 'Repuesto',
      tipo: 'seleccion',
      obligatorio: true,
      numerico: true,
      opciones: ({ catalogos }) =>
        opcionesDe(
          catalogos.lista('repuestos'),
          (r) => r.idRepuesto,
          (r) => r.nombre,
          (r) => r.categoria,
        ),
    },
    {
      clave: 'idSucursal',
      etiqueta: 'Sede que recibe',
      tipo: 'seleccion',
      obligatorio: true,
      numerico: true,
      opciones: sedes,
    },
    {
      clave: 'fechaSuministro',
      etiqueta: 'Fecha y hora de la entrega',
      tipo: 'fecha-hora',
      ayuda: 'Si la dejas vacía, se registra la hora actual.',
      validadores: [noFutura],
      mensajes: NO_FUTURA,
    },
    {
      clave: 'cantidad',
      etiqueta: 'Cantidad',
      tipo: 'numero',
      obligatorio: true,
      ayuda: 'Entre 1 y 9999 unidades.',
      min: 1,
      max: 9999,
      paso: 1,
      validadores: [Validators.min(1), Validators.max(9999)],
    },
    precio('costoUnitario', 'Costo unitario'),
  ],
});

const ESTADOS_RESERVA = {
  ACTIVA: 'Activa',
  CONCRETADA: 'Concretada',
  CANCELADA: 'Cancelada',
  VENCIDA: 'Vencida',
};

const RESERVAS = definir<Reserva>({
  ruta: 'reservas',
  titulo: 'Reservas',
  singular: 'reserva',
  genero: 'f',
  descripcion: 'Reservas de motos de todas las sedes, en cualquier estado.',
  vacio: 'Aún no hay reservas.',
  icono: 'reloj',
  url: `${API_ADMIN}/reservas`,
  urlDe: (id) => `${API_ADMIN}/reservas/${id}`,
  id: (r) => String(r.idReserva),
  nombre: (r) => `N.º ${r.idReserva}`,
  vista: (r) => ({ ...r, moto: `${r.marca} ${r.modelo}` }),
  columnas: [
    { clave: 'idReserva', titulo: 'N.º', tipo: 'numero', ordenable: true },
    { clave: 'placa', titulo: 'Placa', tipo: 'placa' },
    { clave: 'moto', titulo: 'Moto' },
    { clave: 'cliente', titulo: 'Cliente', ordenable: true },
    { clave: 'sucursal', titulo: 'Sede', ordenable: true },
    { clave: 'fechaVencimiento', titulo: 'Vence', tipo: 'fecha', ordenable: true },
    { clave: 'estado', titulo: 'Estado', tipo: 'estado', ordenable: true },
  ],
  filtros: [
    {
      clave: 'estado',
      etiqueta: 'Estado',
      todos: 'Todos los estados',
      opciones: opcionesFijas(ESTADOS_RESERVA),
    },
  ],
  editable: false,
  avisoEliminar:
    'Si la reserva estaba activa, la moto vuelve a quedar disponible para otros clientes. No se puede deshacer.',
  accion: {
    etiqueta: 'Marcar vencidas',
    icono: 'vencido',
    titulo: '¿Marcar como vencidas las reservas que ya pasaron su fecha?',
    mensaje:
      'Las reservas activas con fecha de vencimiento pasada quedan vencidas y sus motos vuelven a estar disponibles. El sistema también lo hace solo cada noche.',
    url: `${API_ADMIN}/reservas/vencer`,
    resultado: (respuesta) => {
      const cantidad = Number((respuesta as { reservasVencidas?: number }).reservasVencidas ?? 0);
      if (cantidad === 0) {
        return 'No había reservas activas con la fecha vencida.';
      }
      return cantidad === 1
        ? '1 reserva quedó vencida.'
        : `${cantidad} reservas quedaron vencidas.`;
    },
  },
});

const VENTAS_MOTO = definir<VentaMoto>({
  ruta: 'ventas-motos',
  titulo: 'Ventas de motos',
  singular: 'venta de moto',
  genero: 'f',
  descripcion: 'Motos vendidas en todas las sedes, con cliente, vendedor y factura.',
  vacio: 'Aún no hay ventas de motos.',
  icono: 'venta',
  url: `${API_VENDEDOR}/ventas-moto`,
  urlDe: (id) => `${API_ADMIN}/ventas-moto/${id}`,
  id: (v) => v.placa,
  nombre: (v) => v.placa,
  vista: (v) => ({ ...v, moto: `${v.marca} ${v.modelo}` }),
  columnas: [
    { clave: 'placa', titulo: 'Placa', tipo: 'placa', ordenable: true },
    { clave: 'fechaVenta', titulo: 'Fecha', tipo: 'fecha-hora', ordenable: true },
    { clave: 'moto', titulo: 'Moto' },
    { clave: 'cliente', titulo: 'Cliente', ordenable: true },
    { clave: 'vendedor', titulo: 'Vendedor', ordenable: true },
    { clave: 'sucursal', titulo: 'Sede', ordenable: true },
    { clave: 'valorTotal', titulo: 'Valor', tipo: 'pesos', ordenable: true },
  ],
  editable: false,
  avisoEliminar:
    'La moto vuelve a quedar disponible y, si la venta salió de una reserva, la reserva queda cancelada. No se puede deshacer.',
});

const VENTAS_ACCESORIOS = definir<VentaAccesorio>({
  ruta: 'ventas-accesorios',
  titulo: 'Ventas de accesorios',
  singular: 'venta de accesorios',
  genero: 'f',
  descripcion: 'Ventas de accesorios de todas las sedes, con el detalle de artículos.',
  vacio: 'Aún no hay ventas de accesorios.',
  icono: 'venta',
  url: `${API_VENDEDOR}/ventas-accesorio`,
  urlDe: (id) => `${API_ADMIN}/ventas-accesorio/${id}`,
  id: (v) => String(v.idVentaAccesorio),
  nombre: (v) => `N.º ${v.idVentaAccesorio}`,
  vista: (v) => ({
    ...v,
    articulos: v.items.map((item) => `${item.cantidad} × ${item.nombre}`).join(', '),
  }),
  columnas: [
    { clave: 'idVentaAccesorio', titulo: 'N.º', tipo: 'numero', ordenable: true },
    { clave: 'fechaVenta', titulo: 'Fecha', tipo: 'fecha-hora', ordenable: true },
    { clave: 'cliente', titulo: 'Cliente', ordenable: true },
    { clave: 'vendedor', titulo: 'Vendedor', ordenable: true },
    { clave: 'articulos', titulo: 'Artículos' },
    { clave: 'valorTotal', titulo: 'Valor', tipo: 'pesos', ordenable: true },
  ],
  editable: false,
});

const REPARACIONES = definir<Reparacion>({
  ruta: 'reparaciones',
  titulo: 'Reparaciones',
  singular: 'reparación',
  genero: 'f',
  descripcion: 'Reparaciones registradas por los técnicos de todas las sedes, con su costo.',
  vacio: 'Aún no hay reparaciones.',
  icono: 'taller',
  url: `${API_ADMIN}/reparaciones`,
  urlDe: (id) => `${API_ADMIN}/reparaciones/${id}`,
  id: (r) => String(r.idReparacion),
  nombre: (r) => `N.º ${r.idReparacion}`,
  vista: (r) => ({
    ...r,
    moto: `${r.marca} ${r.modelo}`,
    tecnicosTexto: r.tecnicos.map((t) => t.nombre).join(', '),
  }),
  columnas: [
    { clave: 'idReparacion', titulo: 'N.º', tipo: 'numero', ordenable: true },
    { clave: 'fecha', titulo: 'Fecha', tipo: 'fecha', ordenable: true },
    { clave: 'placa', titulo: 'Placa', tipo: 'placa' },
    { clave: 'moto', titulo: 'Moto' },
    { clave: 'sucursal', titulo: 'Sede', ordenable: true },
    { clave: 'tecnicosTexto', titulo: 'Técnicos' },
    { clave: 'costoTotal', titulo: 'Costo', tipo: 'pesos', ordenable: true },
  ],
  filtros: [
    { clave: 'idSucursal', etiqueta: 'Sede', todos: 'Todas las sedes', opciones: sedes },
    { clave: 'desde', etiqueta: 'Desde', tipo: 'fecha' },
    { clave: 'hasta', etiqueta: 'Hasta', tipo: 'fecha' },
  ],
  editable: false,
  catalogos: ['sedes'],
});

export const GRUPOS_ADMIN: readonly GrupoRecursos[] = [
  { titulo: 'Inventario', icono: 'moto', recursos: [MOTOS, MODELOS, MARCAS] },
  {
    titulo: 'Operación',
    icono: 'venta',
    recursos: [RESERVAS, VENTAS_MOTO, VENTAS_ACCESORIOS, REPARACIONES],
  },
  { titulo: 'Personas', icono: 'usuario', recursos: [EMPLEADOS, CLIENTES] },
  { titulo: 'Productos', icono: 'taller', recursos: [ACCESORIOS, REPUESTOS] },
  { titulo: 'Sedes y proveedores', icono: 'sede', recursos: [SEDES, PROVEEDORES, SUMINISTROS] },
];

export const RECURSOS_ADMIN = GRUPOS_ADMIN.flatMap((grupo) => grupo.recursos);
