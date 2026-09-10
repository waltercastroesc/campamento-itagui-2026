// datos.js — lectura de los archivos de datos/ y el aviso de fallo compartido.

/**
 * Lee un JSON de datos/. El segundo parametro existe para poder probar
 * la funcion sin servidor: las pruebas le pasan un fetch falso.
 */
export async function cargarJSON(ruta, traer = fetch) {
  const respuesta = await traer(ruta, { cache: "no-cache" });
  if (!respuesta.ok) {
    throw new Error(`No se pudo leer ${ruta} (estado ${respuesta.status})`);
  }
  return await respuesta.json();
}

/**
 * Vacia el contenedor y deja un aviso con boton de reintentar.
 * El resto de la pagina no se toca.
 */
export function mostrarFallo(contenedor, alReintentar) {
  contenedor.innerHTML = "";

  const aviso = document.createElement("div");
  aviso.className = "aviso-fallo";
  aviso.setAttribute("role", "alert");

  const texto = document.createElement("p");
  texto.textContent = "No pudimos cargar esta información.";

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "boton-reintentar";
  boton.textContent = "Reintentar";
  boton.addEventListener("click", alReintentar);

  aviso.append(texto, boton);
  contenedor.append(aviso);
}

/**
 * Ciclo completo de una seccion que lee datos: carga, pinta y, si algo falla,
 * deja el aviso con reintento en su propio contenedor.
 */
export async function montarSeccion(contenedor, cargar, pintar) {
  try {
    const datos = await cargar();
    contenedor.innerHTML = "";
    pintar(contenedor, datos);
  } catch (error) {
    console.error("Fallo al montar una seccion:", error);
    mostrarFallo(contenedor, () => montarSeccion(contenedor, cargar, pintar));
  }
}
