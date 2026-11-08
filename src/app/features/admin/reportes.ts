import { HttpResourceRef, httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { API_ADMIN } from '../../core/api/admin-api';
import { mensajeDeError } from '../../core/api/errores';
import {
  CostosSede,
  DisponiblesSede,
  RepuestosSede,
  ResumenGestion,
  VentasMes,
  VentasVendedor,
} from '../../core/api/modelos';
import { valorDe } from '../../core/api/recurso';
import { NumeroPipe } from '../../shared/formato/numero.pipe';
import { PesosPipe } from '../../shared/formato/pesos.pipe';
import { EstadoError } from '../../shared/ui/estado-error/estado-error';
import { CategoriaGrafico, GraficoBarras } from '../../shared/ui/grafico-barras/grafico-barras';
import { Columna } from '../../shared/ui/tabla/tabla';
import { Fila, conMayuscula } from './recurso';
import { SeccionReporte } from './seccion-reporte';

const API_REPORTES = `${API_ADMIN}/reportes`;
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
const ANIOS_ATRAS = 4;

const COLUMNAS_MES: Columna<Fila>[] = [
  { clave: 'nombreMes', titulo: 'Mes' },
  { clave: 'motosVendidas', titulo: 'Motos vendidas', tipo: 'numero' },
  { clave: 'totalMotos', titulo: 'Total motos', tipo: 'pesos' },
  { clave: 'ventasAccesorios', titulo: 'Ventas de accesorios', tipo: 'numero' },
  { clave: 'totalAccesorios', titulo: 'Total accesorios', tipo: 'pesos' },
  { clave: 'total', titulo: 'Total', tipo: 'pesos', ordenable: true },
];

const COLUMNAS_VENDEDOR: Columna<Fila>[] = [
  { clave: 'vendedor', titulo: 'Vendedor', ordenable: true },
  { clave: 'sucursal', titulo: 'Sede', ordenable: true },
  { clave: 'motosVendidas', titulo: 'Motos vendidas', tipo: 'numero', ordenable: true },
  { clave: 'totalMotos', titulo: 'Total motos', tipo: 'pesos', ordenable: true },
  { clave: 'totalAccesorios', titulo: 'Total accesorios', tipo: 'pesos', ordenable: true },
  { clave: 'total', titulo: 'Total', tipo: 'pesos', ordenable: true },
];

const COLUMNAS_DISPONIBLES: Columna<Fila>[] = [
  { clave: 'sucursal', titulo: 'Sede', ordenable: true },
  { clave: 'ciudad', titulo: 'Ciudad', ordenable: true },
  { clave: 'disponibles', titulo: 'Motos disponibles', tipo: 'numero', ordenable: true },
];

const COLUMNAS_COSTOS: Columna<Fila>[] = [
  { clave: 'sucursal', titulo: 'Sede', ordenable: true },
  { clave: 'reparaciones', titulo: 'Reparaciones', tipo: 'numero', ordenable: true },
  { clave: 'manoObra', titulo: 'Mano de obra', tipo: 'pesos', ordenable: true },
  { clave: 'repuestos', titulo: 'Repuestos', tipo: 'pesos', ordenable: true },
  { clave: 'total', titulo: 'Total', tipo: 'pesos', ordenable: true },
];

const COLUMNAS_REPUESTOS: Columna<Fila>[] = [
  { clave: 'sucursal', titulo: 'Sede', ordenable: true },
  { clave: 'repuesto', titulo: 'Repuesto', ordenable: true },
  { clave: 'recibidas', titulo: 'Recibidas', tipo: 'numero', ordenable: true },
  { clave: 'usadas', titulo: 'Usadas', tipo: 'numero', ordenable: true },
  { clave: 'diferencia', titulo: 'Recibidas menos usadas', tipo: 'numero', ordenable: true },
];

export function nombreMes(mes: number): string {
  return MESES[mes - 1] ?? String(mes);
}

export function textoPeriodo(periodo: string): string {
  const [anio, mes] = periodo.split('-').map(Number);
  return `${nombreMes(mes)} de ${anio}`;
}

export function sumarPorSede(filas: readonly RepuestosSede[]): CategoriaGrafico[] {
  const sedes = new Map<string, { recibidas: number; usadas: number }>();
  for (const fila of filas) {
    const sede = sedes.get(fila.sucursal) ?? { recibidas: 0, usadas: 0 };
    sede.recibidas += fila.recibidas;
    sede.usadas += fila.usadas;
    sedes.set(fila.sucursal, sede);
  }
  return [...sedes.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'es'))
    .map(([sucursal, { recibidas, usadas }]) => ({
      etiqueta: sucursal,
      valores: [recibidas, usadas],
    }));
}

function porTotal<T extends { total: number }>(lista: readonly T[]): T[] {
  return [...lista].sort((a, b) => b.total - a.total);
}

@Component({
  selector: 'app-reportes',
  imports: [EstadoError, GraficoBarras, SeccionReporte, PesosPipe, NumeroPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cuenta__pagina cuenta__pagina--ancha reportes' },
  templateUrl: './reportes.html',
})
export default class Reportes {
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  private readonly anioActual = new Date().getFullYear();
  protected readonly tarjetasCarga = [0, 1, 2, 3, 4, 5, 6];
  protected readonly anios = Array.from({ length: ANIOS_ATRAS + 1 }, (_, i) => this.anioActual - i);
  protected readonly anio = toSignal(
    this.ruta.queryParamMap.pipe(
      map((params) => {
        const anio = Number(params.get('anio'));
        return this.anios.includes(anio) ? anio : this.anioActual;
      }),
    ),
    { initialValue: this.anioActual },
  );

  protected readonly resumen = httpResource<ResumenGestion>(() => `${API_REPORTES}/resumen`);
  protected readonly porMes = httpResource<VentasMes[]>(() => ({
    url: `${API_REPORTES}/ventas-por-mes`,
    params: { anio: this.anio() },
  }));
  protected readonly porVendedor = httpResource<VentasVendedor[]>(
    () => `${API_REPORTES}/ventas-por-vendedor`,
  );
  protected readonly disponibles = httpResource<DisponiblesSede[]>(
    () => `${API_REPORTES}/disponibles-por-sede`,
  );
  protected readonly costos = httpResource<CostosSede[]>(() => `${API_REPORTES}/costos-reparacion`);
  protected readonly repuestos = httpResource<RepuestosSede[]>(
    () => `${API_REPORTES}/repuestos-por-sucursal`,
  );

  protected readonly datosResumen = computed(() => valorDe(this.resumen));
  protected readonly periodo = computed(() => {
    const resumen = this.datosResumen();
    return resumen ? textoPeriodo(resumen.mes) : '';
  });
  protected readonly mesResumen = computed(() => this.periodo().split(' de ')[0]);

  protected readonly filasMes = computed<Fila[]>(() =>
    (valorDe(this.porMes) ?? []).map((fila) => ({
      ...fila,
      nombreMes: conMayuscula(nombreMes(fila.mes)),
    })),
  );
  protected readonly categoriasMes = computed<CategoriaGrafico[]>(() =>
    (valorDe(this.porMes) ?? []).map((fila) => ({
      etiqueta: nombreMes(fila.mes).slice(0, 3),
      completa: `${conMayuscula(nombreMes(fila.mes))} de ${this.anio()}`,
      valores: [fila.totalMotos, fila.totalAccesorios],
    })),
  );
  protected readonly sinVentasEnAnio = computed(() =>
    (valorDe(this.porMes) ?? []).every((fila) => fila.total === 0),
  );

  protected readonly filasVendedor = computed<Fila[]>(() =>
    porTotal(valorDe(this.porVendedor) ?? []).map((fila) => ({ ...fila })),
  );
  protected readonly categoriasVendedor = computed<CategoriaGrafico[]>(() =>
    porTotal(valorDe(this.porVendedor) ?? []).map((fila) => ({
      etiqueta: fila.vendedor,
      detalle: fila.sucursal,
      valores: [fila.totalMotos, fila.totalAccesorios],
    })),
  );

  protected readonly filasDisponibles = computed<Fila[]>(() =>
    (valorDe(this.disponibles) ?? []).map((fila) => ({ ...fila })),
  );
  protected readonly categoriasDisponibles = computed<CategoriaGrafico[]>(() =>
    [...(valorDe(this.disponibles) ?? [])]
      .sort((a, b) => b.disponibles - a.disponibles)
      .map((fila) => ({
        etiqueta: fila.sucursal,
        detalle: fila.ciudad,
        valores: [fila.disponibles],
      })),
  );

  protected readonly filasCostos = computed<Fila[]>(() =>
    porTotal(valorDe(this.costos) ?? []).map((fila) => ({ ...fila })),
  );
  protected readonly categoriasCostos = computed<CategoriaGrafico[]>(() =>
    porTotal(valorDe(this.costos) ?? []).map((fila) => ({
      etiqueta: fila.sucursal,
      detalle: `${fila.reparaciones} ${fila.reparaciones === 1 ? 'reparación' : 'reparaciones'}`,
      valores: [fila.manoObra, fila.repuestos],
    })),
  );

  protected readonly filasRepuestos = computed<Fila[]>(() =>
    (valorDe(this.repuestos) ?? []).map((fila) => ({
      ...fila,
      diferencia: fila.recibidas - fila.usadas,
    })),
  );
  protected readonly categoriasRepuestos = computed(() =>
    sumarPorSede(valorDe(this.repuestos) ?? []),
  );

  protected readonly columnasMes = COLUMNAS_MES;
  protected readonly columnasVendedor = COLUMNAS_VENDEDOR;
  protected readonly columnasDisponibles = COLUMNAS_DISPONIBLES;
  protected readonly columnasCostos = COLUMNAS_COSTOS;
  protected readonly columnasRepuestos = COLUMNAS_REPUESTOS;

  protected readonly claveMes = (fila: Fila) => Number(fila['mes']);
  protected readonly claveVendedor = (fila: Fila) => Number(fila['idEmpleado']);
  protected readonly claveSede = (fila: Fila) => Number(fila['idSucursal']);
  protected readonly claveRepuesto = (fila: Fila) => `${fila['idSucursal']}-${fila['idRepuesto']}`;

  protected cargando(recurso: HttpResourceRef<unknown>): boolean {
    return !recurso.hasValue() && recurso.isLoading();
  }

  protected error(recurso: HttpResourceRef<unknown>): string | null {
    return recurso.error() ? mensajeDeError(recurso.error()) : null;
  }

  protected cambiarAnio(evento: Event): void {
    const anio = Number((evento.target as HTMLSelectElement).value);
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: { anio: anio === this.anioActual ? null : anio },
      replaceUrl: true,
    });
  }
}
