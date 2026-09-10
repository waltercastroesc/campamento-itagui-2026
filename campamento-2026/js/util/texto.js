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
