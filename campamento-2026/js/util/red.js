// red.js — reintento con espera, para peticiones que pueden fallar por señal irregular.

/**
 * Ejecuta `accion` hasta `intentos` veces, esperando `espera` ms entre una y otra.
 * Si todas fallan, propaga el ultimo error.
 */
export async function conReintento(accion, intentos = 2, espera = 1500) {
  let ultimoError;
  for (let numero = 1; numero <= intentos; numero += 1) {
    try {
      return await accion();
    } catch (error) {
      ultimoError = error;
      if (numero < intentos) {
        await new Promise((seguir) => setTimeout(seguir, espera));
      }
    }
  }
  throw ultimoError;
}
