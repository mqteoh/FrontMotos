export type TipoMoto =
  'CALLE' | 'DEPORTIVA' | 'NAKED' | 'SCOOTER' | 'ENDURO' | 'TOURING' | 'DOBLE_PROPOSITO';

export type EstadoReserva = 'ACTIVA' | 'CONCRETADA' | 'CANCELADA' | 'VENCIDA';

export type EstadoReparacion = 'AGENDADA' | 'EN_PROCESO' | 'FINALIZADA' | 'CANCELADA';

export type Rol = 'CLIENTE' | 'DUENO' | 'VENDEDOR' | 'TECNICO';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  idSucursal: number | null;
}

export interface RespuestaToken {
  token: string;
  tipo: string;
  expiraEnMs: number;
  usuario: Usuario;
}

export interface Credenciales {
  correo: string;
  contrasena: string;
}

export interface RegistroCliente {
  documento: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  ciudad: string;
  barrio: string;
  calle: string;
  numeroDireccion: string;
  telefono: string | null;
  correo: string;
  contrasena: string;
}

export interface ErrorApi {
  estado: number;
  mensaje: string;
  campos: { campo: string; mensaje: string }[];
  ruta: string;
  fecha: string;
}

export type OrdenCatalogo = 'MARCA' | 'PRECIO_ASC' | 'PRECIO_DESC' | 'CILINDRAJE';

export interface Pagina<T> {
  contenido: T[];
  pagina: number;
  tamano: number;
  totalElementos: number;
  totalPaginas: number;
}

export interface Sucursal {
  idSucursal: number;
  nombre: string;
  ciudad: string;
  barrio: string;
  calle: string;
  numeroDireccion: string;
}

export interface FiltrosCatalogo {
  marcas: { valor: string; disponibles: number }[];
  tipos: { valor: string; disponibles: number }[];
  sedes: { idSucursal: number; nombre: string; ciudad: string; disponibles: number }[];
  precioMinimo: number | null;
  precioMaximo: number | null;
  totalDisponibles: number;
}

export interface MotoDetalle {
  placa: string;
  idMarca: number;
  marca: string;
  paisOrigenMarca: string;
  nroModelo: number;
  modelo: string;
  tipoMoto: TipoMoto;
  cilindraje: number;
  potenciaHp: number;
  capacidadTanque: number;
  anio: number;
  color: string;
  kilometraje: number;
  precio: number;
  sucursal: Sucursal;
}

export interface Accesorio {
  idAccesorio: number;
  nombre: string;
  marca: string;
  descripcion: string | null;
  precio: number;
}

export type MetodoPago = 'EFECTIVO' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'TRANSFERENCIA';

export type TipoFactura = 'ELECTRONICA' | 'POS';

export interface Marca {
  idMarca: number;
  nombre: string;
  paisOrigen: string;
}

export interface Modelo {
  idMarca: number;
  nroModelo: number;
  nombreMarca: string;
  nombre: string;
  cilindraje: number;
  tipoMoto: TipoMoto;
  potenciaHp: number;
  capacidadTanque: number;
}

export interface Reserva {
  idReserva: number;
  fechaReserva: string;
  fechaVencimiento: string;
  estado: EstadoReserva;
  placa: string;
  marca: string;
  modelo: string;
  precio: number;
  idSucursal: number;
  sucursal: string;
  idCliente: number;
  cliente: string;
}

export interface RepuestoUsado {
  idRepuesto: number;
  nombre: string;
  categoria: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Reparacion {
  idReparacion: number;
  placa: string;
  marca: string;
  modelo: string;
  fechaAgendada: string;
  fechaFinalizacion: string | null;
  estado: EstadoReparacion;
  descripcion: string;
  kilometrajeIngreso: number | null;
  idSucursal: number;
  sucursal: string;
  idCliente: number;
  cliente: string;
  idTecnico: number | null;
  tecnico: string | null;
  costoManoObra: number | null;
  costoRepuestos: number | null;
  costoTotal: number | null;
  repuestos: RepuestoUsado[];
}

export interface MotoCliente {
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  origen: 'INVENTARIO' | 'EXTERNA';
}

export interface AgendarReparacion {
  placa: string;
  idSucursal: number;
  fechaAgendada: string;
  descripcion: string;
  kilometrajeIngreso: number | null;
  motoExterna: { idMarca: number; nroModelo: number; anio: number; color: string } | null;
}

export interface VentaMoto {
  idVentaMoto: number;
  fechaVenta: string;
  metodoPago: MetodoPago;
  tipoFactura: TipoFactura;
  valorTotal: number;
  placa: string;
  marca: string;
  modelo: string;
  idCliente: number;
  cliente: string;
  idVendedor: number;
  vendedor: string;
  sucursal: string;
  idReserva: number | null;
}

export interface ItemVentaAccesorio {
  idAccesorio: number;
  nombre: string;
  marca: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaAccesorio {
  idVentaAccesorio: number;
  fechaVenta: string;
  metodoPago: MetodoPago;
  tipoFactura: TipoFactura;
  idCliente: number;
  cliente: string;
  idVendedor: number;
  vendedor: string;
  valorTotal: number;
  items: ItemVentaAccesorio[];
}

export interface ComprasCliente {
  motos: VentaMoto[];
  accesorios: VentaAccesorio[];
  totalGastado: number;
}

export interface PerfilCliente {
  idCliente: number;
  documento: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  edad: number;
  ciudad: string;
  barrio: string;
  calle: string;
  numeroDireccion: string;
  correoAcceso: string;
  telefonos: string[];
  correos: string[];
}

export interface ClienteSede {
  idCliente: number;
  documento: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  ciudad: string;
  barrio: string;
  calle: string;
  numeroDireccion: string;
  telefonos: string[];
  correos: string[];
  tieneCuentaWeb: boolean;
}

export interface MotoInventario {
  placa: string;
  marca: string;
  modelo: string;
  tipoMoto: TipoMoto;
  anio: number;
  color: string;
  precio: number;
  idSucursal: number;
  sucursal: string;
  reservada: boolean;
  idReserva: number | null;
  idClienteReserva: number | null;
  clienteReserva: string | null;
  vencimientoReserva: string | null;
}

export interface Repuesto {
  idRepuesto: number;
  nombre: string;
  categoria: string;
  precio: number;
}

export interface MotoCatalogo {
  placa: string;
  marca: string;
  modelo: string;
  tipoMoto: TipoMoto;
  cilindraje: number;
  anio: number;
  color: string;
  precio: number;
  idSucursal: number;
  sucursal: string;
  ciudad: string;
}

export type OrigenMoto = 'INVENTARIO' | 'EXTERNA';

export type TipoEmpleado = 'DUENO' | 'VENDEDOR' | 'TECNICO';

export interface MotoAdmin {
  placa: string;
  idMarca: number;
  nroModelo: number;
  idSucursal: number | null;
  origen: OrigenMoto;
  anio: number;
  color: string;
  kilometraje: number;
  precio: number | null;
  fechaIngreso: string;
  marca: string;
  modelo: string;
  sucursal: string | null;
  vendida: boolean;
}

export interface EmpleadoAdmin {
  idEmpleado: number;
  documento: string;
  nombres: string;
  apellidos: string;
  fechaContratacion: string;
  tipoEmpleado: TipoEmpleado;
  idSucursal: number | null;
  idJefe: number | null;
  correoAcceso: string;
  telefonos: string[];
  certificadoVentas: string | null;
  comision: number | null;
  certificadoTecnico: string | null;
  especialidad: string | null;
  sucursal: string | null;
  jefe: string | null;
}

export interface Proveedor {
  nit: string;
  nombre: string;
  telefono: string;
  correo: string;
}

export interface Suministro {
  nit: string;
  idRepuesto: number;
  idSucursal: number;
  fechaSuministro: string;
  cantidad: number;
  costoUnitario: number;
  proveedor: string;
  repuesto: string;
  sucursal: string;
}
