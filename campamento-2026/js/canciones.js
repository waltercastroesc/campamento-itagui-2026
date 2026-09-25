// canciones.js — libro de canciones: buscador, letra y modo pantalla completa.

import { normalizar } from "./util/texto.js";
import { cargarJSON, montarSeccion } from "./util/datos.js";
import { cargarConRespaldo, traerDatoVivo } from "./util/datosVivos.js";
import { CONFIG } from "./config.js";

const PASO_TAMANO = 0.125;
const TAMANO_MINIMO = 1;
const TAMANO_MAXIMO = 2.5;

/** Titulo y todas las lineas en una sola cadena, para poder buscar dentro. */
export function textoDeCancion(cancion) {
  const lineas = (cancion?.bloques || []).flatMap((bloque) => bloque?.lineas || []);
  return [cancion?.titulo || "", ...lineas].join(" ");
}

/**
 * Filtra por titulo y por el texto de la letra, ignorando acentos.
 * Buscar por un verso suelto sirve cuando alguien recuerda la linea
 * pero no el nombre de la cancion.
 */
export function filtrarCanciones(canciones, consulta) {
  const buscado = normalizar(consulta);
  if (!buscado) return canciones;
  return canciones.filter((cancion) => normalizar(textoDeCancion(cancion)).includes(buscado));
}

export function iniciar(contenedor) {
  return montarSeccion(contenedor, cargarCanciones, pintarCanciones);
}

async function cargarCanciones() {
  if (!CONFIG.urlAppsScript) {
    const lista = await cargarJSON("datos/canciones.json");
    return { lista, desdeCache: false };
  }
  const { datos: lista, desdeCache } = await cargarConRespaldo(
    "campamento2026:canciones",
    () => traerDatoVivo("canciones")
  );
  return { lista, desdeCache };
}

function pintarCanciones(contenedor, { lista: canciones, desdeCache }) {
  const envoltorio = document.createElement("div");
  envoltorio.className = "contenedor";

  const titulo = document.createElement("h2");
  titulo.className = "seccion__titulo";
  titulo.id = "titulo-canciones";
  titulo.textContent = "Canciones";

  const avisoCache = desdeCache ? document.createElement("p") : null;
  if (avisoCache) {
    avisoCache.className = "aviso-cache";
    avisoCache.textContent = "Mostrando la última versión guardada en este dispositivo — puede no estar actualizada.";
  }

  const etiquetaBuscador = document.createElement("label");
  etiquetaBuscador.className = "buscador";
  const textoEtiqueta = document.createElement("span");
  textoEtiqueta.className = "solo-lectores";
  textoEtiqueta.textContent = "Buscar una canción por título o por su letra";
  const campo = document.createElement("input");
  campo.type = "search";
  campo.className = "buscador__campo";
  campo.placeholder = "Busca por título o por un verso…";
  campo.autocomplete = "off";
  etiquetaBuscador.append(textoEtiqueta, campo);

  const aviso = document.createElement("p");
  aviso.className = "canciones__vacio";
  aviso.hidden = true;
  aviso.textContent = "No encontramos ninguna canción con eso. Prueba con otra palabra.";

  const libro = document.createElement("div");
  libro.className = "libro-paginado";

  const paginador = document.createElement("div");
  paginador.className = "paginador";
  const anterior = document.createElement("button");
  anterior.type = "button";
  anterior.className = "paginador__flecha";
  anterior.textContent = "‹";
  anterior.setAttribute("aria-label", "Canción anterior");
  const indicador = document.createElement("span");
  indicador.className = "paginador__indicador";
  const siguiente = document.createElement("button");
  siguiente.type = "button";
  siguiente.className = "paginador__flecha";
  siguiente.textContent = "›";
  siguiente.setAttribute("aria-label", "Canción siguiente");
  paginador.append(anterior, indicador, siguiente);

  let encontradas = canciones;
  let paginaActual = 0;

  function mostrarPagina(indice) {
    paginaActual = Math.min(Math.max(indice, 0), encontradas.length - 1);
    libro.innerHTML = "";
    libro.append(construirCancion(encontradas[paginaActual]));
    indicador.textContent = `Canción ${paginaActual + 1} de ${encontradas.length}`;
    anterior.disabled = paginaActual === 0;
    siguiente.disabled = paginaActual === encontradas.length - 1;
  }

  function repintar() {
    encontradas = filtrarCanciones(canciones, campo.value);
    const hayResultados = encontradas.length > 0;
    aviso.hidden = hayResultados;
    libro.hidden = !hayResultados;
    paginador.hidden = !hayResultados;
    if (hayResultados) mostrarPagina(0);
  }

  anterior.addEventListener("click", () => mostrarPagina(paginaActual - 1));
  siguiente.addEventListener("click", () => mostrarPagina(paginaActual + 1));
  campo.addEventListener("input", repintar);
  repintar();

  envoltorio.append(titulo);
  if (avisoCache) envoltorio.append(avisoCache);
  envoltorio.append(etiquetaBuscador, aviso, libro, paginador);
  contenedor.append(envoltorio);
}

function construirCancion(cancion) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "cancion";

  const cabecera = document.createElement("header");
  cabecera.className = "cancion__cabecera";

  const nombre = document.createElement("h3");
  nombre.className = "cancion__titulo";
  nombre.textContent = cancion.titulo;
  cabecera.append(nombre);

  if (cancion.lema) {
    const insignia = document.createElement("span");
    insignia.className = "cancion__insignia";
    insignia.textContent = `#${cancion.numero}`;
    const aclaracion = document.createElement("span");
    aclaracion.className = "solo-lectores";
    aclaracion.textContent = " Canción lema";
    insignia.append(aclaracion);
    cabecera.append(insignia);
  }

  const letra = document.createElement("div");
  letra.className = "cancion__letra";
  letra.append(construirLetra(cancion));

  const cantar = document.createElement("button");
  cantar.type = "button";
  cantar.className = "pill cancion__cantar";
  cantar.textContent = "Cantar";
  cantar.addEventListener("click", () => abrirPantallaCompleta(cancion));

  tarjeta.append(cabecera, letra, cantar);
  return tarjeta;
}

/** Devuelve un fragmento con un bloque por estrofa o coro. */
function construirLetra(cancion) {
  const fragmento = document.createDocumentFragment();
  for (const bloque of cancion.bloques || []) {
    const parrafo = document.createElement("p");
    parrafo.className = bloque.tipo === "coro" ? "letra-bloque letra-bloque--coro" : "letra-bloque";
    (bloque.lineas || []).forEach((linea, indice) => {
      if (indice > 0) parrafo.append(document.createElement("br"));
      parrafo.append(document.createTextNode(linea));
    });
    fragmento.append(parrafo);
  }
  return fragmento;
}

function abrirPantallaCompleta(cancion) {
  let tamano = 1.25;
  let bloqueoPantalla = null;

  const capa = document.createElement("div");
  capa.className = "cantar";
  capa.setAttribute("role", "dialog");
  capa.setAttribute("aria-modal", "true");
  capa.setAttribute("aria-label", `Letra de ${cancion.titulo}`);

  const barra = document.createElement("div");
  barra.className = "cantar__barra";

  const menos = botonDeBarra("A−", "Reducir el tamaño de la letra", () => cambiarTamano(-PASO_TAMANO));
  const mas = botonDeBarra("A+", "Aumentar el tamaño de la letra", () => cambiarTamano(PASO_TAMANO));
  const cerrar = botonDeBarra("✕", "Cerrar la letra", cerrarTodo);
  cerrar.classList.add("cantar__cerrar");

  barra.append(menos, mas, cerrar);

  const cuerpo = document.createElement("div");
  cuerpo.className = "cantar__cuerpo";

  const nombre = document.createElement("h2");
  nombre.className = "cantar__titulo";
  nombre.textContent = cancion.titulo;

  const letra = document.createElement("div");
  letra.className = "cantar__letra";
  letra.append(construirLetra(cancion));

  cuerpo.append(nombre, letra);
  capa.append(barra, cuerpo);
  document.body.append(capa);
  document.body.style.overflow = "hidden";
  cerrar.focus();

  function cambiarTamano(delta) {
    tamano = Math.min(TAMANO_MAXIMO, Math.max(TAMANO_MINIMO, tamano + delta));
    letra.style.fontSize = `${tamano}rem`;
  }
  cambiarTamano(0);

  function alPulsarTecla(evento) {
    if (evento.key === "Escape") cerrarTodo();
  }
  document.addEventListener("keydown", alPulsarTecla);

  function cerrarTodo() {
    document.removeEventListener("keydown", alPulsarTecla);
    document.body.style.overflow = "";
    capa.remove();
    bloqueoPantalla?.release?.().catch(() => {});
  }

  // Que la pantalla no se apague a mitad de la cancion.
  // Si el navegador no lo soporta, se ignora en silencio.
  if ("wakeLock" in navigator) {
    navigator.wakeLock
      .request("screen")
      .then((bloqueo) => {
        bloqueoPantalla = bloqueo;
      })
      .catch(() => {});
  }
}

function botonDeBarra(texto, etiqueta, alPulsar) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "cantar__boton";
  boton.textContent = texto;
  boton.setAttribute("aria-label", etiqueta);
  boton.addEventListener("click", alPulsar);
  return boton;
}
