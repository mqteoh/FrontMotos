import { Routes } from '@angular/router';
import { conRol } from '../../core/auth/guards';
import { LayoutVendedor } from './layout-vendedor';

export default [
  {
    path: '',
    component: LayoutVendedor,
    children: [
      {
        path: '',
        title: 'Reservas por vencer',
        loadComponent: () => import('./inicio-vendedor'),
      },
      {
        path: 'clientes',
        title: 'Clientes',
        loadComponent: () => import('./clientes'),
      },
      {
        path: 'clientes/nuevo',
        title: 'Registrar cliente',
        loadComponent: () => import('./cliente-formulario'),
      },
      {
        path: 'clientes/:idCliente',
        title: 'Editar cliente',
        loadComponent: () => import('./cliente-formulario'),
      },
      {
        path: 'ventas',
        title: 'Ventas',
        loadComponent: () => import('./mis-ventas'),
      },
      {
        path: 'ventas/moto',
        title: 'Vender moto',
        canActivate: [conRol('VENDEDOR')],
        loadComponent: () => import('./venta-moto'),
      },
      {
        path: 'ventas/accesorios',
        title: 'Vender accesorios',
        canActivate: [conRol('VENDEDOR')],
        loadComponent: () => import('./venta-accesorios'),
      },
    ],
  },
] satisfies Routes;
