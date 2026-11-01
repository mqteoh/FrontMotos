import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';
import { conRol, soloInvitado } from './core/auth/guards';
import { LayoutPanel } from './core/layout/layout-panel';
import { LayoutPublico } from './core/layout/layout-publico';
import { NoEncontrada } from './core/paginas/no-encontrada';
import { SinPermiso } from './core/paginas/sin-permiso';

declare const ngDevMode: unknown;

const soloDesarrollo: Routes = ngDevMode
  ? [
      {
        path: 'componentes',
        title: 'Componentes',
        loadComponent: () => import('./features/galeria/galeria'),
      },
    ]
  : [];

const AREAS_PANEL = ['vendedor', 'tecnico', 'admin'];

export function areaDePanel(segmentos: UrlSegment[]): UrlMatchResult | null {
  return segmentos.length > 0 && AREAS_PANEL.includes(segmentos[0].path) ? { consumed: [] } : null;
}

export const routes: Routes = [
  {
    matcher: areaDePanel,
    component: LayoutPanel,
    children: [
      {
        path: 'vendedor',
        canActivate: [conRol('VENDEDOR', 'DUENO')],
        loadChildren: () => import('./features/vendedor/vendedor.routes'),
      },
      {
        path: 'tecnico',
        canActivate: [conRol('TECNICO', 'DUENO')],
        loadChildren: () => import('./features/tecnico/tecnico.routes'),
      },
      {
        path: 'admin',
        canActivate: [conRol('DUENO')],
        loadChildren: () => import('./features/admin/admin.routes'),
      },
    ],
  },
  {
    path: '',
    component: LayoutPublico,
    children: [
      {
        path: 'ingresar',
        title: 'Iniciar sesión',
        canActivate: [soloInvitado],
        loadComponent: () => import('./features/acceso/ingresar'),
      },
      {
        path: 'registro',
        title: 'Crear cuenta',
        canActivate: [soloInvitado],
        loadComponent: () => import('./features/acceso/registro'),
      },
      {
        path: 'cliente',
        canActivate: [conRol('CLIENTE')],
        loadChildren: () => import('./features/cliente/cliente.routes'),
      },
      { path: 'sin-permiso', title: 'Sin permiso', component: SinPermiso },
      ...soloDesarrollo,
      { path: '', loadChildren: () => import('./features/publico/publico.routes') },
      { path: '**', title: 'Página no encontrada', component: NoEncontrada },
    ],
  },
];
