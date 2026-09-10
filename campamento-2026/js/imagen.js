// imagen.js — validar y encoger una foto antes de gastarle datos moviles a nadie.

export const MAXIMO_BYTES = 10 * 1024 * 1024;
export const LADO_MAXIMO = 1600;
export const CALIDAD = 0.8;

/**
 * Comprueba tipo y peso antes de tocar la red. Funcion pura.
 * Ojo: esto es comodidad para quien sube, no seguridad. El Apps Script
 * revalida lo mismo en el servidor.
 */
export function validarArchivo(archivo) {
  if (!archivo || typeof archivo.type !== "string" || !archivo.type.startsWith("image/")) {
    return { valido: false, motivo: "Ese archivo no es una imagen. Elige una foto." };
  }
  if (archivo.size > MAXIMO_BYTES) {
    return { valido: false, motivo: "La foto pesa más de 10 MB. Elige una más liviana." };
  }
  return { valido: true };
}

/** Medidas finales conservando la proporcion. Nunca agranda. Funcion pura. */
export function calcularMedidas(ancho, alto, ladoMaximo = LADO_MAXIMO) {
  const mayor = Math.max(ancho, alto);
  if (mayor <= ladoMaximo) return { ancho, alto };
  const factor = ladoMaximo / mayor;
  return { ancho: Math.round(ancho * factor), alto: Math.round(alto * factor) };
}

/**
 * Redimensiona a LADO_MAXIMO y recomprime a JPEG.
 * Una foto de celular pasa de unos 4 MB a unos 300 KB.
 */
export async function comprimir(archivo, ladoMaximo = LADO_MAXIMO, calidad = CALIDAD) {
  const mapa = await createImageBitmap(archivo);
  const medidas = calcularMedidas(mapa.width, mapa.height, ladoMaximo);

  const lienzo = document.createElement("canvas");
  lienzo.width = medidas.ancho;
  lienzo.height = medidas.alto;
  lienzo.getContext("2d").drawImage(mapa, 0, 0, medidas.ancho, medidas.alto);
  mapa.close?.();

  const comprimida = await new Promise((entregar) =>
    lienzo.toBlob(entregar, "image/jpeg", calidad)
  );
  if (!comprimida) {
    throw new Error("No pudimos procesar esta foto. Intenta con otra.");
  }
  return comprimida;
}

/** Devuelve solo la parte base64, sin el prefijo "data:...;base64,". */
export function aBase64(blob) {
  return new Promise((entregar, rechazar) => {
    const lector = new FileReader();
    lector.addEventListener("load", () => {
      entregar(String(lector.result).split(",")[1] || "");
    });
    lector.addEventListener("error", () => {
      rechazar(new Error("No pudimos leer esta foto. Intenta con otra."));
    });
    lector.readAsDataURL(blob);
  });
}
