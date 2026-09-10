// pie.js — logos, grupo de WhatsApp y contactos de emergencia.

import { cargarJSON, montarSeccion } from "./util/datos.js";

/**
 * Convierte un telefono escrito para humanos en un enlace marcable.
 * Conserva el + inicial, que es lo que distingue un numero internacional.
 */
export function enlaceTelefono(telefono) {
  const limpio = String(telefono ?? "").replace(/[^\d+]/g, "");
  return limpio ? `tel:${limpio}` : "";
}

export function iniciar(contenedor) {
  return montarSeccion(
    contenedor,
    () => cargarJSON("datos/contactos.json"),
    pintarPie
  );
}

function pintarPie(contenedor, contactos) {
  const envoltorio = document.createElement("div");
  envoltorio.className = "contenedor pie";

  envoltorio.append(construirMarcas(), construirEnlaces(contactos));
  contenedor.append(envoltorio);
}

function construirMarcas() {
  const bloque = document.createElement("div");
  bloque.className = "pie__marcas";

  const iglesia = document.createElement("img");
  iglesia.className = "pie__logo";
  iglesia.src = "img/logo-iglesia.svg";
  iglesia.alt = "Logo de la iglesia";
  // Si el logo definitivo aun no esta, no se deja un icono roto en pantalla.
  iglesia.addEventListener("error", () => iglesia.remove());

  const separador = document.createElement("span");
  separador.className = "pie__separador";
  separador.setAttribute("aria-hidden", "true");

  const trasciende = document.createElement("div");
  trasciende.className = "pie__trasciende";

  const logo = document.createElement("img");
  logo.className = "pie__logo";
  logo.src = "img/logo-trasciende.svg";
  logo.alt = "Logo de TRASCIENDE";
  logo.addEventListener("error", () => logo.remove());

  const leyenda = document.createElement("p");
  leyenda.className = "pie__leyenda";
  leyenda.textContent = "Jóvenes Itagüí Central";

  trasciende.append(logo, leyenda);
  bloque.append(iglesia, separador, trasciende);
  return bloque;
}

/** SVG en linea, coloreado con currentColor para heredar el vino del texto. */
function crearIconoChat() {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("pie__enlace-icono");
  const path = document.createElementNS(ns, "path");
  path.setAttribute(
    "d",
    "M12 2C6.5 2 2 6 2 11c0 2.2 1 4.2 2.6 5.7L4 22l5.5-1.4c.8.2 1.6.3 2.5.3 5.5 0 10-4 10-9S17.5 2 12 2z"
  );
  svg.append(path);
  return svg;
}

function crearIconoEmergencia() {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("pie__enlace-icono");

  const corazon = document.createElementNS(ns, "path");
  corazon.setAttribute("fill", "currentColor");
  corazon.setAttribute(
    "d",
    "M12 21s-7.5-4.6-10-9.5C0.3 7.9 2 4 6 4c2.1 0 3.5 1.2 4.2 2.2C10.9 5.2 12.3 4 14.4 4c4 0 5.7 3.9 4 7.5-2.5 4.9-10 9.5-10 9.5z"
  );

  const pulso = document.createElementNS(ns, "polyline");
  pulso.setAttribute("points", "6 12 9 12 10.5 8.5 13 15.5 14.5 12 18 12");
  pulso.setAttribute("fill", "none");
  pulso.setAttribute("stroke", "var(--hueso)");
  pulso.setAttribute("stroke-width", "1.5");
  pulso.setAttribute("stroke-linecap", "round");
  pulso.setAttribute("stroke-linejoin", "round");

  svg.append(corazon, pulso);
  return svg;
}

/** Icono + texto en dos lineas (ej. "GRUPO DE" / "WHATSAPP"), lado a lado. */
function construirEtiquetaConIcono(icono, primeraLinea, segundaLinea) {
  const envoltorio = document.createElement("span");
  envoltorio.className = "pie__enlace-fila";

  const texto = document.createElement("span");
  texto.className = "pie__enlace-texto";
  const l1 = document.createElement("span");
  l1.textContent = primeraLinea;
  const l2 = document.createElement("span");
  l2.textContent = segundaLinea;
  texto.append(l1, l2);

  envoltorio.append(icono, texto);
  return envoltorio;
}

function construirEnlaces(contactos) {
  const bloque = document.createElement("div");
  bloque.className = "pie__enlaces";

  if (contactos.whatsapp && !contactos.whatsapp.startsWith("PENDIENTE")) {
    const whatsapp = document.createElement("a");
    whatsapp.className = "pie__whatsapp";
    whatsapp.href = contactos.whatsapp;
    whatsapp.target = "_blank";
    whatsapp.rel = "noopener noreferrer";
    whatsapp.append(construirEtiquetaConIcono(crearIconoChat(), "Grupo de", "WhatsApp"));
    bloque.append(whatsapp);
  }

  const emergencia = document.createElement("details");
  emergencia.className = "pie__emergencia";

  const cabecera = document.createElement("summary");
  cabecera.className = "pie__emergencia-titulo";
  cabecera.append(construirEtiquetaConIcono(crearIconoEmergencia(), "Contactos de", "emergencia"));

  const lista = document.createElement("ul");
  lista.className = "pie__contactos";

  for (const contacto of contactos.emergencia || []) {
    const fila = document.createElement("li");

    const quien = document.createElement("span");
    quien.className = "pie__contacto-quien";
    quien.textContent = `${contacto.nombre} · ${contacto.rol}`;

    const marcar = document.createElement("a");
    marcar.className = "pie__contacto-tel";
    marcar.href = enlaceTelefono(contacto.telefono);
    marcar.textContent = contacto.telefono;

    fila.append(quien, marcar);
    lista.append(fila);
  }

  emergencia.append(cabecera, lista);
  bloque.append(emergencia);

  return bloque;
}
