// datosVivos.js — dato en vivo con respaldo en localStorage para senal irregular.

import { CONFIG } from "../config.js";

/**
 * Intenta traer el dato en vivo; si falla, usa la ultima copia guardada en
 * este dispositivo. Si no hay ninguna copia guardada, propaga el error para
 * que la seccion muestre su aviso de siempre.
 */
export async function cargarConRespaldo(clave, traerEnVivo, almacen = globalThis.localStorage) {
  try {
    const datos = await traerEnVivo();
    guardarEnAlmacen(almacen, clave, datos);
    return { datos, desdeCache: false };
  } catch (errorEnVivo) {
    const guardado = leerDeAlmacen(almacen, clave);
    if (guardado === null) throw errorEnVivo;
    return { datos: guardado, desdeCache: true };
  }
}

function guardarEnAlmacen(almacen, clave, datos) {
  try {
    almacen?.setItem(clave, JSON.stringify(datos));
  } catch {
    // Sin espacio o almacenamiento bloqueado: no es motivo para fallar la carga.
  }
}

function leerDeAlmacen(almacen, clave) {
  try {
    const crudo = almacen?.getItem(clave);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

/** Pide un recurso de datos en vivo al Apps Script. Lanza si la respuesta no es valida. */
export async function traerDatoVivo(tipo, traer = fetch, urlBase = CONFIG.urlAppsScript) {
  const url = `${urlBase}?recurso=datos&tipo=${encodeURIComponent(tipo)}`;
  const respuesta = await traer(url, { cache: "no-cache" });
  if (!respuesta.ok) throw new Error(`No se pudo leer ${tipo} (estado ${respuesta.status})`);
  const cuerpo = await respuesta.json();
  if (!cuerpo.ok) throw new Error(cuerpo.error || "fallo_servidor");
  return cuerpo.datos;
}
