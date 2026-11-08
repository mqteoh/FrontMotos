import { HttpResourceRef, httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { API_ADMIN } from '../../core/api/admin-api';
import {
  EmpleadoAdmin,
  Marca,
  Modelo,
  Proveedor,
  Repuesto,
  Sucursal,
} from '../../core/api/modelos';
import { valorDe } from '../../core/api/recurso';

export interface TiposCatalogo {
  marcas: Marca[];
  modelos: Modelo[];
  sedes: Sucursal[];
  proveedores: Proveedor[];
  repuestos: Repuesto[];
  empleados: EmpleadoAdmin[];
}

export type NombreCatalogo = keyof TiposCatalogo;

const RUTAS: Record<NombreCatalogo, string> = {
  marcas: `${API_ADMIN}/marcas`,
  modelos: `${API_ADMIN}/modelos`,
  sedes: `${API_ADMIN}/sucursales`,
  proveedores: `${API_ADMIN}/proveedores`,
  repuestos: `${API_ADMIN}/repuestos`,
  empleados: `${API_ADMIN}/empleados`,
};

@Injectable({ providedIn: 'root' })
export class CatalogosAdmin {
  private readonly pedidos = signal<ReadonlySet<NombreCatalogo>>(new Set());

  private readonly recursos: {
    [N in NombreCatalogo]: HttpResourceRef<TiposCatalogo[N] | undefined>;
  } = {
    marcas: this.crear('marcas'),
    modelos: this.crear('modelos'),
    sedes: this.crear('sedes'),
    proveedores: this.crear('proveedores'),
    repuestos: this.crear('repuestos'),
    empleados: this.crear('empleados'),
  };

  usar(nombres: readonly NombreCatalogo[]): void {
    if (nombres.some((nombre) => !this.pedidos().has(nombre))) {
      this.pedidos.update((actuales) => new Set([...actuales, ...nombres]));
    }
  }

  lista<N extends NombreCatalogo>(nombre: N): TiposCatalogo[N] | undefined {
    return valorDe(this.recursos[nombre]);
  }

  conError(nombres: readonly NombreCatalogo[]): boolean {
    return nombres.some((nombre) => Boolean(this.recursos[nombre].error()));
  }

  recargar(nombres: readonly NombreCatalogo[]): void {
    nombres
      .filter((nombre) => this.pedidos().has(nombre))
      .forEach((nombre) => this.recursos[nombre].reload());
  }

  private crear<N extends NombreCatalogo>(
    nombre: N,
  ): HttpResourceRef<TiposCatalogo[N] | undefined> {
    return httpResource<TiposCatalogo[N]>(() =>
      this.pedidos().has(nombre) ? RUTAS[nombre] : undefined,
    );
  }
}
