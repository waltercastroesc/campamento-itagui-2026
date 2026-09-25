// habitaciones.js — quien duerme donde.
// Se ve una habitacion a la vez, como las paginas de un libro; el buscador
// salta directo a la habitacion de la persona que se busque, por cedula.

import { normalizarCedula } from "./util/texto.js";
import { cargarJSON, montarSeccion } from "./util/datos.js";
import { cargarConRespaldo, traerDatoVivo } from "./util/datosVivos.js";
import { CONFIG } from "./config.js";

/** Personas de una habitacion, contando al lider. Funcion pura. */
export function contarIntegrantes(habitacion) {
  const integrantes = Array.isArray(habitacion?.integrantes) ? habitacion.integrantes.length : 0;
  const lider = habitacion?.lider?.nombre ? 1 : 0;
  return integrantes + lider;
}

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

  const libro = document.createElement("div");
  libro.className = "libro-paginado";

  const paginador = document.createElement("div");
  paginador.className = "paginador";
  const anterior = document.createElement("button");
  anterior.type = "button";
  anterior.className = "paginador__flecha";
  anterior.textContent = "‹";
  anterior.setAttribute("aria-label", "Habitación anterior");
  const indicador = document.createElement("span");
  indicador.className = "paginador__indicador";
  const siguiente = document.createElement("button");
  siguiente.type = "button";
  siguiente.className = "paginador__flecha";
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
    mostrarPagina(hallazgo.habitacionIndice);
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

  if (habitacion.lider?.nombre) {
    const lider = document.createElement("p");
    lider.className = "habitacion__lider";
    const etiquetaLider = document.createElement("span");
    etiquetaLider.textContent = "Líder: ";
    const quien = document.createElement("strong");
    quien.textContent = habitacion.lider.nombre;
    lider.append(etiquetaLider, quien);
    if (habitacion.lider.kit) {
      lider.append(construirInsigniaKit(habitacion.lider.kit));
    }
    cuerpo.append(lider);
  }

  const lista = document.createElement("ul");
  lista.className = "habitacion__integrantes";
  for (const persona of habitacion.integrantes || []) {
    const fila = document.createElement("li");
    const nombrePersona = document.createElement("span");
    nombrePersona.textContent = persona?.nombre ?? persona;
    fila.append(nombrePersona);
    if (persona?.kit) {
      fila.append(construirInsigniaKit(persona.kit));
    }
    lista.append(fila);
  }
  cuerpo.append(lista);

  tarjeta.append(cabecera, cuerpo);
  return tarjeta;
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

function construirInsigniaKit(kit) {
  const insignia = document.createElement("span");
  insignia.className = "habitacion__kit";
  insignia.textContent = `Kit ${kit}`;
  return insignia;
}
