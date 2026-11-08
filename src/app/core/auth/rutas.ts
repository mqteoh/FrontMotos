export function rutaSegura(ruta: string | null): string | null {
  return ruta?.startsWith('/') && !ruta.startsWith('//') ? ruta : null;
}
