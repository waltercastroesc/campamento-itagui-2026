// habitaciones-datos.js — operaciones puras sobre el arreglo de habitaciones del panel.

/** Agrega una habitacion vacia al final. No muta el arreglo recibido. */
export function agregarHabitacion(habitaciones) {
  return [...habitaciones, { nombre: "", lider: { nombre: "", cedula: "", kit: "" }, integrantes: [] }];
}

/** Quita la habitacion en `indice`. No muta el arreglo recibido. */
export function quitarHabitacion(habitaciones, indice) {
  return habitaciones.filter((_, i) => i !== indice);
}

/** Agrega un integrante vacio al final de una habitacion. No muta la habitacion recibida. */
export function agregarIntegrante(habitacion) {
  return { ...habitacion, integrantes: [...habitacion.integrantes, { nombre: "", cedula: "", kit: "" }] };
}

/** Quita el integrante en `indice`. No muta la habitacion recibida. */
export function quitarIntegrante(habitacion, indice) {
  return { ...habitacion, integrantes: habitacion.integrantes.filter((_, i) => i !== indice) };
}
