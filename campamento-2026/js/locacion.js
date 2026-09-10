// locacion.js — donde es y como llegar.

import { cargarJSON, montarSeccion } from "./util/datos.js";

export function iniciar(contenedor) {
  return montarSeccion(
    contenedor,
    () => cargarJSON("datos/locacion.json"),
    pintarLocacion
  );
}

function pintarLocacion(contenedor, locacion) {
  const envoltorio = document.createElement("div");
  envoltorio.className = "contenedor";

  const titulo = document.createElement("h2");
  titulo.className = "seccion__titulo";
  titulo.id = "titulo-locacion";
  titulo.textContent = "Locación";

  const nombre = document.createElement("p");
  nombre.className = "locacion__nombre";
  nombre.textContent = locacion.nombre || "";

  envoltorio.append(titulo, nombre);

  if (locacion.mapaEmbebido) {
    const marco = document.createElement("div");
    marco.className = "locacion__mapa";
    const mapa = document.createElement("iframe");
    mapa.src = locacion.mapaEmbebido;
    mapa.loading = "lazy";
    mapa.referrerPolicy = "no-referrer-when-downgrade";
    mapa.title = `Mapa de ${locacion.nombre || "la finca"}`;
    mapa.setAttribute("allowfullscreen", "");
    marco.append(mapa);
    envoltorio.append(marco);
  }

  const botones = document.createElement("div");
  botones.className = "locacion__botones";
  if (locacion.enlaceMaps) botones.append(enlaceNavegacion(locacion.enlaceMaps, "Abrir en Google Maps"));
  if (locacion.enlaceWaze) botones.append(enlaceNavegacion(locacion.enlaceWaze, "Abrir en Waze"));
  envoltorio.append(botones);

  if (locacion.direccion) {
    envoltorio.append(construirDireccion(locacion.direccion));
  }

  if (Array.isArray(locacion.puntos) && locacion.puntos.length > 0) {
    const subtitulo = document.createElement("h3");
    subtitulo.className = "locacion__subtitulo";
    subtitulo.textContent = "Puntos clave de la finca";

    const lista = document.createElement("ol");
    lista.className = "locacion__puntos";
    for (const punto of locacion.puntos) {
      const fila = document.createElement("li");
      fila.textContent = punto;
      lista.append(fila);
    }
    envoltorio.append(subtitulo, lista);
  }

  contenedor.append(envoltorio);
}

function enlaceNavegacion(url, texto) {
  const enlace = document.createElement("a");
  enlace.className = "pill locacion__boton";
  enlace.href = url;
  enlace.target = "_blank";
  enlace.rel = "noopener noreferrer";
  enlace.textContent = texto;
  return enlace;
}

function construirDireccion(direccion) {
  const fila = document.createElement("p");
  fila.className = "locacion__direccion";

  const texto = document.createElement("span");
  texto.textContent = direccion;

  const copiar = document.createElement("button");
  copiar.type = "button";
  copiar.className = "boton-reintentar locacion__copiar";
  copiar.textContent = "Copiar";
  copiar.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(direccion);
      copiar.textContent = "¡Copiada!";
    } catch {
      copiar.textContent = "Selecciónala y cópiala a mano";
    }
    setTimeout(() => {
      copiar.textContent = "Copiar";
    }, 2500);
  });

  fila.append(texto, copiar);
  return fila;
}
