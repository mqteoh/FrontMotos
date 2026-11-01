import { Routes } from '@angular/router';
import { AreaPendiente } from '../../shared/ui/area-pendiente/area-pendiente';

export default [
  {
    path: '',
    title: 'Mi cuenta',
    component: AreaPendiente,
    data: {
      titulo: 'Mi cuenta',
      descripcion: 'Aquí estarán tus reservas, las reparaciones que agendes, tus compras y tu perfil.',
      fase: 'F5',
    },
  },
  {
    path: 'reservar/:placa',
    title: 'Confirmar reserva',
    component: AreaPendiente,
    data: {
      titulo: 'Confirmar reserva',
      descripcion: 'Aquí confirmarás la reserva de la moto y verás hasta qué día queda apartada.',
      fase: 'F5',
    },
  },
] satisfies Routes;
