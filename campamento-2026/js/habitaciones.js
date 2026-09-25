// habitaciones.js — quien duerme donde.
// Solo hay un buscador por cedula: al escribir la propia, se muestra una
// tarjeta con la habitacion, el kit y el lider de esa persona. El listado
// completo de habitaciones no se ve en la pagina principal (para eso esta
// el panel de administracion).

import { normalizarCedula } from "./util/texto.js";
import { cargarJSON, montarSeccion } from "./util/datos.js";
import { cargarConRespaldo, traerDatoVivo } from "./util/datosVivos.js";
import { CONFIG } from "./config.js";

/**
 * Encuentra a la persona con esa cedula (sin importar puntos ni espacios):
 * en que indice de habitaciones esta, el nombre de esa habitacion, sus
 * propios datos (nombre, cedula, kit) y el nombre del lider de su
 * habitacion. null si la busqueda esta vacia o no se encuentra a nadie.
 * Funcion pura.
 */
export function buscarPersonaPorCedula(habitaciones, consulta) {
  const buscado = normalizarCedula(consulta);
  if (!buscado) return null;

  for (let indice = 0; indice < habitaciones.length; indice++) {
    const habitacion = habitaciones[indice];
    const lider = habitacion?.lider;
    const liderNombre = lider?.nombre || "";

    if (lider?.cedula && normalizarCedula(lider.cedula) === buscado) {
      return { habitacionIndice: indice, habitacionNombre: habitacion.nombre, persona: lider, liderNombre };
    }

    const encontrada = (habitacion?.integrantes || []).find(
      (persona) => persona?.cedula && normalizarCedula(persona.cedula) === buscado
    );
    if (encontrada) {
      return { habitacionIndice: indice, habitacionNombre: habitacion.nombre, persona: encontrada, liderNombre };
    }
  }

  return null;
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

  const { formulario, resultado } = construirBuscador(habitaciones);

  envoltorio.append(formulario, resultado);
  contenedor.append(envoltorio);
}

/** Arma el buscador y el hueco donde va su resultado. Sin tocar el DOM final: solo lo devuelve. */
function construirBuscador(habitaciones) {
  const formulario = document.createElement("form");
  formulario.className = "buscador habitaciones__buscador";

  const etiqueta = document.createElement("label");
  const textoEtiqueta = document.createElement("span");
  textoEtiqueta.className = "solo-lectores";
  textoEtiqueta.textContent = "Busca tu número de cédula para saber en qué habitación estás";
  const campo = document.createElement("input");
  campo.type = "search";
  campo.inputMode = "numeric";
  campo.className = "buscador__campo";
  campo.placeholder = "Escribe tu número de cédula…";
  campo.autocomplete = "off";
  etiqueta.append(textoEtiqueta, campo);

  const botonBuscar = document.createElement("button");
  botonBuscar.type = "submit";
  botonBuscar.className = "pill";
  botonBuscar.textContent = "Buscar";

  formulario.append(etiqueta, botonBuscar);

  const resultado = document.createElement("div");
  resultado.className = "habitaciones__resultado";
  resultado.setAttribute("aria-live", "polite");
  resultado.hidden = true;

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const hallazgo = buscarPersonaPorCedula(habitaciones, campo.value);
    resultado.innerHTML = "";
    resultado.hidden = false;

    if (!hallazgo) {
      const mensaje = document.createElement("p");
      mensaje.className = "habitaciones__mensaje habitaciones__mensaje--vacio";
      mensaje.textContent = campo.value.trim()
        ? "No encontramos a nadie con esa cédula. Revisa que esté bien escrita."
        : "Escribe tu número de cédula para buscar.";
      resultado.append(mensaje);
      return;
    }

    resultado.append(construirTarjetaPersona(hallazgo));
  });

  return { formulario, resultado };
}

/** La tarjeta de resultado del buscador: nombre propio, habitación, kit y líder. */
function construirTarjetaPersona({ habitacionNombre, persona, liderNombre }) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "resultado-persona";

  const nombre = document.createElement("h3");
  nombre.className = "resultado-persona__nombre";
  nombre.textContent = persona.nombre;
  tarjeta.append(nombre);

  tarjeta.append(construirFilaResultado("Habitación:", habitacionNombre, true));
  if (persona.kit) tarjeta.append(construirFilaResultado("Kit asignado:", persona.kit));
  if (liderNombre) tarjeta.append(construirFilaResultado("Nombre del líder:", liderNombre));

  return tarjeta;
}

function construirFilaResultado(etiquetaTexto, valorTexto, comoInsignia = false) {
  const fila = document.createElement("div");
  fila.className = "resultado-persona__fila";

  const etiqueta = document.createElement("span");
  etiqueta.textContent = etiquetaTexto;

  const valor = document.createElement("span");
  valor.className = comoInsignia ? "pill resultado-persona__insignia" : "resultado-persona__valor";
  valor.textContent = valorTexto;

  fila.append(etiqueta, valor);
  return fila;
}
