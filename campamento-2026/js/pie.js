// pie.js — logos y grupo de WhatsApp.

import { cargarJSON, montarSeccion } from "./util/datos.js";

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

  // Una sola imagen con todo: logo de la iglesia, separador, logo de
  // TRASCIENDE y "Jóvenes Itagüí Central" — así la entregó el liderazgo.
  const marcas = document.createElement("img");
  marcas.className = "pie__logo-marcas";
  marcas.src = "img/logo-pie.png";
  marcas.alt = "Iglesia Pentecostal Unida de Colombia — TRASCIENDE, Jóvenes Itagüí Central";
  // Si el archivo definitivo aun no esta, no se deja un icono roto en pantalla.
  marcas.addEventListener("error", () => marcas.remove());

  bloque.append(marcas);
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

/** Icono + texto en dos lineas (ej. "GRUPO DE WHATSAPP" / "DEL CAMPAMENTO"), lado a lado. */
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
    whatsapp.append(construirEtiquetaConIcono(crearIconoChat(), "Grupo de WhatsApp", "del Campamento"));
    bloque.append(whatsapp);
  }

  return bloque;
}
