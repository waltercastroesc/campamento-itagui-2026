// afirmar.js — tres comprobaciones. Fallar es lanzar un Error con un mensaje util.

export function igual(real, esperado, mensaje) {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a !== b) {
    throw new Error(
      `${mensaje || "Los valores no coinciden"}\n    esperado: ${b}\n    recibido: ${a}`
    );
  }
}

export function cierto(condicion, mensaje) {
  if (!condicion) {
    throw new Error(mensaje || "Se esperaba una condicion verdadera");
  }
}

export async function lanza(accion, mensaje) {
  try {
    await accion();
  } catch (error) {
    return error;
  }
  throw new Error(mensaje || "Se esperaba un error y no ocurrio");
}
