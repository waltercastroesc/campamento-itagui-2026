// habitaciones.js — quien duerme donde.
// Celular: tarjetas plegadas, porque quince habitaciones abiertas son un scroll interminable.

import { cargarJSON, montarSeccion } from "./util/datos.js";

/** Personas de una habitacion, contando al lider. Funcion pura. */
export function contarIntegrantes(habitacion) {
  const integrantes = Array.isArray(habitacion?.integrantes) ? habitacion.integrantes.length : 0;
  const lider = habitacion?.lider ? 1 : 0;
  return integrantes + lider;
}

export function iniciar(contenedor) {
  return montarSeccion(
    contenedor,
    () => cargarJSON("datos/habitaciones.json"),
    pintarHabitaciones
  );
}

function pintarHabitaciones(contenedor, habitaciones) {
  const envoltorio = document.createElement("div");
  envoltorio.className = "contenedor";

  const titulo = document.createElement("h2");
  titulo.className = "seccion__titulo";
  titulo.id = "titulo-habitaciones";
  titulo.textContent = "Conoce tu habitación";

  const rejilla = document.createElement("div");
  rejilla.className = "habitaciones";

  for (const habitacion of habitaciones) {
    rejilla.append(construirHabitacion(habitacion));
  }

  envoltorio.append(titulo, rejilla);
  contenedor.append(envoltorio);

  // En escritorio se ven todas abiertas; en celular, plegadas.
  const esEscritorio = window.matchMedia("(min-width: 48rem)");
  const aplicarAnchura = () => {
    for (const tarjeta of rejilla.querySelectorAll(".habitacion")) {
      tarjeta.open = esEscritorio.matches;
    }
  };
  aplicarAnchura();
  esEscritorio.addEventListener("change", aplicarAnchura);
}

function construirHabitacion(habitacion) {
  // <details> da el plegado nativo: funciona con teclado y sin JavaScript extra.
  const tarjeta = document.createElement("details");
  tarjeta.className = "habitacion";

  const cabecera = document.createElement("summary");
  cabecera.className = "habitacion__cabecera";

  const nombre = document.createElement("span");
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
    const etiqueta = document.createElement("span");
    etiqueta.textContent = "Líder: ";
    const quien = document.createElement("strong");
    quien.textContent = habitacion.lider;
    lider.append(etiqueta, quien);
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
