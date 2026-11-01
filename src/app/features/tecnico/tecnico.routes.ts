import { Routes } from '@angular/router';
import { AreaPendiente } from '../../shared/ui/area-pendiente/area-pendiente';

export default [
  {
    path: '',
    title: 'Panel del técnico',
    component: AreaPendiente,
    data: {
      titulo: 'Panel del técnico',
      descripcion: 'Aquí estará la agenda del taller, el registro de repuestos usados y el cierre de reparaciones.',
      fase: 'F7',
    },
  },
] satisfies Routes;
