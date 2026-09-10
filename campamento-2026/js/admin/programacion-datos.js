// programacion-datos.js — operaciones puras sobre los bloques de un dia del panel.

/** Agrega un bloque vacio al final de un dia. No muta el dia recibido. */
export function agregarBloque(dia) {
  return { ...dia, bloques: [...dia.bloques, { hora: "", actividad: "" }] };
}

/** Quita el bloque en `indice`. No muta el dia recibido. */
export function quitarBloque(dia, indice) {
  return { ...dia, bloques: dia.bloques.filter((_, i) => i !== indice) };
}

/** Agrega un dia vacio al final, con un bloque para empezar a escribir. No muta el arreglo recibido. */
export function agregarDia(dias) {
  return [...dias, { dia: "", numero: dias.length + 1, bloques: [{ hora: "", actividad: "" }] }];
}

/** Quita el dia en `indice`. No muta el arreglo recibido. */
export function quitarDia(dias, indice) {
  return dias.filter((_, i) => i !== indice);
}
