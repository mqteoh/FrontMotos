import { Routes } from '@angular/router';
import { conRol } from '../../core/auth/guards';
import { LayoutTecnico } from './layout-tecnico';

export default [
  {
    path: '',
    component: LayoutTecnico,
    children: [
      {
        path: '',
        title: 'Agenda del taller',
        loadComponent: () => import('./agenda'),
      },
      {
        path: 'mis-trabajos',
        title: 'Mis trabajos',
        canActivate: [conRol('TECNICO')],
        loadComponent: () => import('./mis-trabajos'),
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
    ],
  },
] satisfies Routes;
