export interface ColumnaCsv {
  clave: string;
  titulo: string;
}

const MARCA_UTF8 = String.fromCharCode(0xfeff);

function celda(valor: unknown): string {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function aCsv(
  columnas: readonly ColumnaCsv[],
  filas: readonly Record<string, unknown>[],
): string {
  const lineas = [
    columnas.map((columna) => celda(columna.titulo)).join(';'),
    ...filas.map((fila) => columnas.map((columna) => celda(fila[columna.clave])).join(';')),
  ];
  return `${MARCA_UTF8}${lineas.join('\r\n')}\r\n`;
}

export function descargarCsv(nombre: string, contenido: string): void {
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `${nombre}.csv`;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url));
}
