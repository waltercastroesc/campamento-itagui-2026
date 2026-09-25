// texto.js — normalizacion para buscar.

/**
 * Minusculas, sin acentos y sin espacios en los bordes.
 * Descompone en NFD y borra los diacriticos: asi "espíritu" y "espiritu"
 * son la misma cadena, que es lo que la gente espera al buscar en un celular.
 */
export function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Identificador de una sola palabra a partir de un titulo: minusculas, sin acentos, con guiones. */
export function aSlug(texto) {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Solo los digitos de una cedula, para poder comparar sin importar puntos,
 * espacios o guiones ("1.042.265.174" y "1042265174" son la misma).
 */
export function normalizarCedula(texto) {
  return String(texto ?? "").replace(/\D+/g, "");
}
