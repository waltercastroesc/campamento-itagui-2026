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

function construirEnlaces(contactos) {
  const bloque = document.createElement("div");
  bloque.className = "pie__enlaces";

  if (contactos.whatsapp && !contactos.whatsapp.startsWith("PENDIENTE")) {
    const whatsapp = document.createElement("a");
    whatsapp.className = "pill pie__whatsapp";
    whatsapp.href = contactos.whatsapp;
    whatsapp.target = "_blank";
    whatsapp.rel = "noopener noreferrer";
    whatsapp.textContent = "Grupo de WhatsApp";
    bloque.append(whatsapp);
  }

  const emergencia = document.createElement("details");
  emergencia.className = "pie__emergencia";

  const cabecera = document.createElement("summary");
  cabecera.className = "pie__emergencia-titulo";
  cabecera.textContent = "Contactos de emergencia";

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

  const admin = document.createElement("a");
  admin.className = "pie__admin";
  admin.href = "admin.html";
  admin.textContent = "Panel de administración";
  bloque.append(admin);

  return bloque;
}
