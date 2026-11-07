import { Routes } from '@angular/router';
import { LayoutTecnico } from './layout-tecnico';

export default [
  {
    path: '',
    component: LayoutTecnico,
    children: [
      {
        path: '',
        title: 'Reparaciones del taller',
        loadComponent: () => import('./reparaciones'),
      },
      {
        path: 'nueva',
        title: 'Registrar reparación',
        loadComponent: () => import('./formulario-reparacion'),
      },
      {
        path: 'historial',
        title: 'Historial de una moto',
        loadComponent: () => import('./historial'),
      },
      {
        path: 'reparaciones/:idReparacion',
        title: 'Reparación',
        loadComponent: () => import('./reparacion'),
      },
      {
        path: 'reparaciones/:idReparacion/editar',
        title: 'Corregir reparación',
        loadComponent: () => import('./formulario-reparacion'),
      },
    ],
  },
] satisfies Routes;
