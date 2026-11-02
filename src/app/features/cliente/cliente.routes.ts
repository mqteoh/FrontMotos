import { Routes } from '@angular/router';
import { LayoutCliente } from './layout-cliente';

export default [
  {
    path: '',
    component: LayoutCliente,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'reservas' },
      {
        path: 'reservas',
        title: 'Mis reservas',
        loadComponent: () => import('./mis-reservas'),
      },
      {
        path: 'reservar/:placa',
        title: 'Confirmar reserva',
        loadComponent: () => import('./confirmar-reserva'),
      },
      {
        path: 'reparaciones',
        title: 'Mis reparaciones',
        loadComponent: () => import('./mis-reparaciones'),
      },
      {
        path: 'reparaciones/agendar',
        title: 'Agendar reparación',
        loadComponent: () => import('./agendar-reparacion'),
      },
      {
        path: 'compras',
        title: 'Mis compras',
        loadComponent: () => import('./mis-compras'),
      },
      {
        path: 'perfil',
        title: 'Mi perfil',
        loadComponent: () => import('./perfil'),
      },
    ],
  },
] satisfies Routes;
