// canciones-datos.js — operaciones puras sobre el arreglo de canciones del panel.

import { aSlug } from "../util/texto.js";

/** Slug del titulo; si ya existe entre `cancionesExistentes`, le agrega un sufijo numerico. */
export function generarSlugCancion(titulo, cancionesExistentes) {
  const base = aSlug(titulo);
  const idsExistentes = new Set(cancionesExistentes.map((c) => c.id));
  if (!idsExistentes.has(base)) return base;
  let sufijo = 2;
  while (idsExistentes.has(`${base}-${sufijo}`)) sufijo += 1;
  return `${base}-${sufijo}`;
}

/** Agrega una cancion nueva, con un bloque de estrofa vacio para empezar a escribir. */
export function agregarCancion(canciones, titulo, numero, lema) {
  const id = generarSlugCancion(titulo, canciones);
  const nueva = { id, titulo, numero, lema, bloques: [{ tipo: "estrofa", lineas: [] }] };
  return [...canciones, nueva];
}

/** Quita la cancion en `indice`. No muta el arreglo recibido. */
export function quitarCancion(canciones, indice) {
  return canciones.filter((_, i) => i !== indice);
}

/** Agrega un bloque de estrofa vacio al final de una cancion. No muta la cancion recibida. */
export function agregarBloqueLetra(cancion) {
  return { ...cancion, bloques: [...cancion.bloques, { tipo: "estrofa", lineas: [] }] };
}

/** Quita el bloque de letra en `indice`. No muta la cancion recibida. */
export function quitarBloqueLetra(cancion, indice) {
  return { ...cancion, bloques: cancion.bloques.filter((_, i) => i !== indice) };
}

/** El texto de un cuadro grande, una linea por verso, a un arreglo de lineas. Descarta lineas en blanco. */
export function textoALineas(texto) {
  return texto
    .split("\n")
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0);
}

/** El arreglo de lineas de un bloque, de vuelta a texto para precargar el cuadro grande. */
export function lineasATexto(lineas) {
  return lineas.join("\n");
}
