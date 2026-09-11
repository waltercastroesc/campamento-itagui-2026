// habitaciones.js — quien duerme donde.
// Se ve una habitacion a la vez, como las paginas de un libro; el buscador
// salta directo a la habitacion de la persona que se busque.

import { normalizar } from "./util/texto.js";
import { cargarJSON, montarSeccion } from "./util/datos.js";
import { cargarConRespaldo, traerDatoVivo } from "./util/datosVivos.js";
import { CONFIG } from "./config.js";

/** Personas de una habitacion, contando al lider. Funcion pura. */
export function contarIntegrantes(habitacion) {
  const integrantes = Array.isArray(habitacion?.integrantes) ? habitacion.integrantes.length : 0;
  const lider = habitacion?.lider ? 1 : 0;
  return integrantes + lider;
}

/**
 * Indice de la primera habitacion donde el lider o algun integrante
 * coincide con la busqueda, sin importar mayusculas ni acentos.
 * -1 si la busqueda esta vacia o no se encuentra a nadie. Funcion pura.
 */
export function buscarHabitacionPorPersona(habitaciones, consulta) {
  const buscado = normalizar(consulta);
  if (!buscado) return -1;
  return habitaciones.findIndex((habitacion) => {
    const nombres = [habitacion?.lider, ...(habitacion?.integrantes || [])];
    return nombres.some((nombre) => nombre && normalizar(nombre).includes(buscado));
  });
}

export function iniciar(contenedor) {
  return montarSeccion(contenedor, cargarHabitaciones, pintarHabitaciones);
}

/**
 * Mientras no haya Apps Script configurado (desarrollo local), usa el JSON
 * de ejemplo. Una vez configurado, lee en vivo con respaldo en el dispositivo.
 */
async function cargarHabitaciones() {
  if (!CONFIG.urlAppsScript) {
    const lista = await cargarJSON("datos/habitaciones.json");
    return { lista, desdeCache: false };
  }
  const { datos: lista, desdeCache } = await cargarConRespaldo(
    "campamento2026:habitaciones",
    () => traerDatoVivo("habitaciones")
  );
  return { lista, desdeCache };
}

function pintarHabitaciones(contenedor, { lista: habitaciones, desdeCache }) {
  const envoltorio = document.createElement("div");
  envoltorio.className = "contenedor";

  const titulo = document.createElement("h2");
  titulo.className = "seccion__titulo";
  titulo.id = "titulo-habitaciones";
  titulo.textContent = "Conoce tu habitación";
  envoltorio.append(titulo);

  if (desdeCache) {
    const aviso = document.createElement("p");
    aviso.className = "aviso-cache";
    aviso.textContent = "Mostrando la última versión guardada en este dispositivo — puede no estar actualizada.";
    envoltorio.append(aviso);
  }

  if (!habitaciones || habitaciones.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "canciones__vacio";
    vacio.textContent = "Todavía no hay habitaciones para mostrar.";
    envoltorio.append(vacio);
    contenedor.append(envoltorio);
    return;
  }

  const { formulario, resultado, libro, paginador, mostrarPagina } = construirLibro(habitaciones);

  envoltorio.append(formulario, resultado, libro, paginador);
  contenedor.append(envoltorio);

  mostrarPagina(0);
}

/** Arma el buscador, la pagina visible y el paginador. Sin tocar el DOM final: solo lo devuelve. */
function construirLibro(habitaciones) {
  let paginaActual = 0;

  const formulario = document.createElement("form");
  formulario.className = "buscador habitaciones__buscador";

  const etiqueta = document.createElement("label");
  const textoEtiqueta = document.createElement("span");
  textoEtiqueta.className = "solo-lectores";
  textoEtiqueta.textContent = "Busca tu nombre para saber en qué habitación estás";
  const campo = document.createElement("input");
  campo.type = "search";
  campo.className = "buscador__campo";
  campo.placeholder = "Escribe tu nombre…";
  campo.autocomplete = "off";
  etiqueta.append(textoEtiqueta, campo);

  const botonBuscar = document.createElement("button");
  botonBuscar.type = "submit";
  botonBuscar.className = "pill";
  botonBuscar.textContent = "Buscar";

  formulario.append(etiqueta, botonBuscar);

  const resultado = document.createElement("p");
  resultado.className = "habitaciones__resultado";
  resultado.setAttribute("aria-live", "polite");
  resultado.hidden = true;

  const libro = document.createElement("div");
  libro.className = "habitaciones__libro";

  const paginador = document.createElement("div");
  paginador.className = "habitaciones__paginador";
  const anterior = document.createElement("button");
  anterior.type = "button";
  anterior.className = "habitaciones__flecha";
  anterior.textContent = "‹";
  anterior.setAttribute("aria-label", "Habitación anterior");
  const indicador = document.createElement("span");
  indicador.className = "habitaciones__indicador";
  const siguiente = document.createElement("button");
  siguiente.type = "button";
  siguiente.className = "habitaciones__flecha";
  siguiente.textContent = "›";
  siguiente.setAttribute("aria-label", "Habitación siguiente");
  paginador.append(anterior, indicador, siguiente);

  function mostrarPagina(indice) {
    paginaActual = Math.min(Math.max(indice, 0), habitaciones.length - 1);
    libro.innerHTML = "";
    libro.append(construirHabitacion(habitaciones[paginaActual]));
    indicador.textContent = `Habitación ${paginaActual + 1} de ${habitaciones.length}`;
    anterior.disabled = paginaActual === 0;
    siguiente.disabled = paginaActual === habitaciones.length - 1;
  }

  anterior.addEventListener("click", () => mostrarPagina(paginaActual - 1));
  siguiente.addEventListener("click", () => mostrarPagina(paginaActual + 1));

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const indice = buscarHabitacionPorPersona(habitaciones, campo.value);
    resultado.hidden = false;
    if (indice === -1) {
      resultado.classList.add("habitaciones__resultado--vacio");
      resultado.textContent = campo.value.trim()
        ? "No encontramos a nadie con ese nombre. Revisa cómo lo escribiste."
        : "Escribe un nombre para buscar.";
      return;
    }
    resultado.classList.remove("habitaciones__resultado--vacio");
    resultado.textContent = `Está en la ${habitaciones[indice].nombre}.`;
    mostrarPagina(indice);
  });

  return { formulario, resultado, libro, paginador, mostrarPagina };
}

function construirHabitacion(habitacion) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "habitacion";

  const cabecera = document.createElement("div");
  cabecera.className = "habitacion__cabecera";

  const nombre = document.createElement("h3");
  nombre.className = "habitacion__nombre";
  nombre.textContent = habitacion.nombre;

  const cuantos = document.createElement("span");
  cuantos.className = "habitacion__cuantos";
  const total = contarIntegrantes(habitacion);
  cuantos.textContent = total === 1 ? "1 persona" : `${total} personas`;

  cabecera.append(nombre, cuantos);

  const cuerpo = document.createElement("div");
  cuerpo.className = "habitacion__cuerpo";

  if (habitacion.lider) {
    const lider = document.createElement("p");
    lider.className = "habitacion__lider";
    const etiquetaLider = document.createElement("span");
    etiquetaLider.textContent = "Líder: ";
    const quien = document.createElement("strong");
    quien.textContent = habitacion.lider;
    lider.append(etiquetaLider, quien);
    cuerpo.append(lider);
  }

  const lista = document.createElement("ul");
  lista.className = "habitacion__integrantes";
  for (const persona of habitacion.integrantes || []) {
    const fila = document.createElement("li");
    fila.textContent = persona;
    lista.append(fila);
  }
  cuerpo.append(lista);

  tarjeta.append(cabecera, cuerpo);
  return tarjeta;
}
