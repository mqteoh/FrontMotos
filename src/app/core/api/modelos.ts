export type TipoMoto =
  'CALLE' | 'DEPORTIVA' | 'NAKED' | 'SCOOTER' | 'ENDURO' | 'TOURING' | 'DOBLE_PROPOSITO';

export type EstadoReserva = 'ACTIVA' | 'CONCRETADA' | 'CANCELADA' | 'VENCIDA';

export type EstadoMoto = 'DISPONIBLE' | 'RESERVADA' | 'VENDIDA';

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

export interface TecnicoParticipante {
  idEmpleado: number;
  nombre: string;
  idSucursal: number;
  sucursal: string;
}

export interface Reparacion {
  idReparacion: number;
  placa: string;
  marca: string;
  modelo: string;
  fecha: string;
  descripcion: string;
  idSucursal: number | null;
  sucursal: string | null;
  idCliente: number | null;
  cliente: string | null;
  tecnicos: TecnicoParticipante[];
  costoManoObra: number;
  costoRepuestos: number;
  costoTotal: number;
  repuestos: RepuestoUsado[];
}

export interface UsoRepuesto {
  idRepuesto: number;
  cantidad: number;
  precioUnitario: number | null;
}

export interface NuevaReparacion {
  placa: string;
  fecha: string;
  descripcion: string;
  costo: number;
  idTecnicos: number[];
  repuestos: UsoRepuesto[];
}

export interface MotoCliente {
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
}

export interface VentaMoto {
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

export type TipoEmpleado = 'DUENO' | 'VENDEDOR' | 'TECNICO';

export interface MotoAdmin {
  placa: string;
  idMarca: number;
  nroModelo: number;
  idSucursal: number;
  anio: number;
  color: string;
  kilometraje: number;
  precio: number;
  fechaIngreso: string;
  marca: string;
  modelo: string;
  sucursal: string;
  estado: EstadoMoto;
}

export interface EmpleadoAdmin {
  idEmpleado: number;
  documento: string;
  nombres: string;
  apellidos: string;
  fechaContratacion: string;
  tipoEmpleado: TipoEmpleado;
  salario: number;
  idSucursal: number;
  idJefe: number | null;
  correoAcceso: string;
  telefonos: string[];
  certificadoVentas: string | null;
  comision: number | null;
  certificadoTecnico: string | null;
  especialidad: string | null;
  sucursal: string;
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

export interface ResumenGestion {
  mes: string;
  motosDisponibles: number;
  reservasActivas: number;
  reparacionesMes: number;
  motosVendidasMes: number;
  ventasMotosMes: number;
  ventasAccesoriosMes: number;
  clientes: number;
  empleados: number;
}

export interface VentasVendedor {
  idEmpleado: number;
  vendedor: string;
  sucursal: string;
  motosVendidas: number;
  totalMotos: number;
  totalAccesorios: number;
  total: number;
}

export interface VentasMes {
  mes: number;
  motosVendidas: number;
  totalMotos: number;
  ventasAccesorios: number;
  totalAccesorios: number;
  total: number;
}

export interface CostosSede {
  idSucursal: number;
  sucursal: string;
  reparaciones: number;
  manoObra: number;
  repuestos: number;
  total: number;
}

export interface RepuestosSede {
  idSucursal: number;
  sucursal: string;
  idRepuesto: number;
  repuesto: string;
  recibidas: number;
  usadas: number;
}

export interface DisponiblesSede {
  idSucursal: number;
  sucursal: string;
  ciudad: string;
  disponibles: number;
}
