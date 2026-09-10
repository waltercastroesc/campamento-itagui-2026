// clave.js — sesion de la contraseña del panel y llamadas protegidas al Apps Script.

import { CONFIG } from "../config.js";

const CLAVE_SESION = "campamento2026:clave-panel";

const MENSAJES = {
  clave_incorrecta: "Contraseña incorrecta.",
  sin_conexion: "No pudimos guardar los cambios. Verifica tu conexión e inténtalo de nuevo.",
  fallo_servidor: "No pudimos guardar los cambios. Verifica tu conexión e inténtalo de nuevo.",
};

export function obtenerClaveSesion() {
  try {
    return sessionStorage.getItem(CLAVE_SESION);
  } catch {
    return null;
  }
}

export function guardarClaveSesion(clave) {
  try {
    sessionStorage.setItem(CLAVE_SESION, clave);
  } catch {
    // Sesion privada o almacenamiento bloqueado: la clave simplemente no persiste entre recargas.
  }
}

export function borrarClaveSesion() {
  try {
    sessionStorage.removeItem(CLAVE_SESION);
  } catch {
    // No hay nada que limpiar si el almacenamiento no esta disponible.
  }
}

/**
 * Llama una accion protegida del Apps Script. Devuelve el cuerpo completo si
 * `ok` es verdadero; lanza un Error con el codigo del servidor si no.
 */
export async function llamarApi(accion, datos, clave, traer = fetch) {
  let respuesta;
  try {
    respuesta = await traer(CONFIG.urlAppsScript, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ accion, clave, datos }),
    });
  } catch {
    throw new Error("sin_conexion");
  }
  if (!respuesta.ok) throw new Error("fallo_servidor");
  const cuerpo = await respuesta.json();
  if (!cuerpo.ok) throw new Error(cuerpo.error || "fallo_servidor");
  return cuerpo;
}

/** Traduce el codigo de error de llamarApi a un mensaje en español para el panel. */
export function mensajeDeErrorAdmin(error) {
  return MENSAJES[error?.message] || MENSAJES.fallo_servidor;
}
