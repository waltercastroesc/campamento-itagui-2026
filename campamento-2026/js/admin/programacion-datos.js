// programacion-datos.js — operaciones puras sobre los bloques de un dia del panel.

/** Agrega un bloque vacio al final de un dia. No muta el dia recibido. */
export function agregarBloque(dia) {
  return { ...dia, bloques: [...dia.bloques, { hora: "", actividad: "" }] };
}

/** Quita el bloque en `indice`. No muta el dia recibido. */
export function quitarBloque(dia, indice) {
  return { ...dia, bloques: dia.bloques.filter((_, i) => i !== indice) };
}
