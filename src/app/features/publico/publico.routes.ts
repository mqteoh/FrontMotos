import { Routes } from '@angular/router';

export default [
  {
    path: '',
    title: 'Motos disponibles',
    loadComponent: () => import('./catalogo'),
  },
  {
    path: 'motos/:placa',
    title: 'Ficha de la moto',
    loadComponent: () => import('./ficha-moto'),
  },
  {
    path: 'accesorios',
    title: 'Accesorios',
    loadComponent: () => import('./accesorios'),
  },
  {
    path: 'sedes',
    title: 'Sedes',
    loadComponent: () => import('./sedes'),
  },
] satisfies Routes;
