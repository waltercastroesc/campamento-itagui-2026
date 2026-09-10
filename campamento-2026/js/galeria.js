// galeria.js — subida de fotos a Drive y carrusel publico.

import { CONFIG } from "./config.js";
import { aBase64, comprimir, validarArchivo } from "./imagen.js";
import { conReintento } from "./util/red.js";
import { mostrarFallo } from "./util/datos.js";

const MENSAJES = {
  sin_conexion: "Parece que no hay conexión. Revisa tus datos e inténtalo otra vez.",
  tipo_no_permitido: "Ese archivo no es una imagen. Elige una foto.",
  demasiado_grande: "La foto pesa más de 10 MB. Elige una más liviana.",
  archivo_vacio: "Esa foto llegó vacía. Intenta con otra.",
  respuesta_invalida: "El servidor respondió algo que no entendimos. Inténtalo otra vez.",
  fallo_servidor: "No pudimos guardar la foto en este momento. Inténtalo otra vez.",
  sin_configurar: "La subida de fotos todavía no está configurada. Avisa al liderazgo.",
};

function mensajeDe(error) {
  return MENSAJES[error?.message] || MENSAJES.fallo_servidor;
}

function urlMiniatura(id) {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${CONFIG.anchoMiniatura}`;
}

function urlGrande(id) {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`;
}

/**
 * Sube una foto con XMLHttpRequest. El Content-Type text/plain mantiene la
 * peticion "simple" para evitar la verificacion CORS previa — Apps Script no
 * tiene forma de responder a esa verificacion, asi que dispararla rompe la
 * subida por completo. Por eso NO se escucha "upload.progress": agregar ese
 * oyente, aunque no cambie las cabeceras, hace que el navegador exija la
 * verificacion previa igual, y con Apps Script eso significa que ninguna
 * subida llega a completarse. El indicador de "Subiendo..." queda
 * indeterminado (un pulso, no un porcentaje real) por esta misma razon.
 */
function subirFoto(cuerpo) {
  return new Promise((entregar, rechazar) => {
    const peticion = new XMLHttpRequest();
    peticion.open("POST", CONFIG.urlAppsScript, true);
    peticion.setRequestHeader("Content-Type", "text/plain;charset=utf-8");

    peticion.addEventListener("load", () => {
      let datos;
      try {
        datos = JSON.parse(peticion.responseText);
      } catch {
        rechazar(new Error("respuesta_invalida"));
        return;
      }
      if (datos.ok) entregar(datos);
      else rechazar(new Error(datos.error || "fallo_servidor"));
    });

    peticion.addEventListener("error", () => rechazar(new Error("sin_conexion")));
    peticion.addEventListener("timeout", () => rechazar(new Error("sin_conexion")));

    peticion.send(JSON.stringify(cuerpo));
  });
}

async function listarFotos() {
  const respuesta = await fetch(`${CONFIG.urlAppsScript}?recurso=fotos`, { redirect: "follow" });
  if (!respuesta.ok) throw new Error("fallo_servidor");
  const datos = await respuesta.json();
  if (!datos.ok) throw new Error(datos.error || "fallo_servidor");
  return datos.fotos || [];
}

export function iniciar(contenedor) {
  contenedor.innerHTML = "";

  const envoltorio = document.createElement("div");
  envoltorio.className = "contenedor";

  const titulo = document.createElement("h2");
  titulo.className = "seccion__titulo";
  titulo.id = "titulo-fotos";
  titulo.textContent = "Fotos";

  envoltorio.append(titulo, construirSubida(), construirCarrusel());
  contenedor.append(envoltorio);
}

// ---------- Subida ----------

let listaDeProgreso;
let alTerminarUnaSubida = () => {};

function construirSubida() {
  const bloque = document.createElement("div");
  bloque.className = "subida";

  const etiquetaAutor = document.createElement("label");
  etiquetaAutor.className = "subida__autor";
  const textoAutor = document.createElement("span");
  textoAutor.textContent = "Tu nombre (opcional)";
  const campoAutor = document.createElement("input");
  campoAutor.type = "text";
  campoAutor.className = "subida__campo";
  campoAutor.maxLength = 40;
  campoAutor.placeholder = "Para saber de quién es la foto";
  etiquetaAutor.append(textoAutor, campoAutor);

  const selector = document.createElement("input");
  selector.type = "file";
  selector.accept = "image/*";
  selector.multiple = true;
  selector.className = "solo-lectores";
  selector.id = "selector-fotos";

  const boton = document.createElement("label");
  boton.className = "pill subida__boton";
  boton.setAttribute("for", "selector-fotos");
  boton.textContent = "Sube tus fotos aquí";

  listaDeProgreso = document.createElement("ul");
  listaDeProgreso.className = "subida__progreso";
  listaDeProgreso.setAttribute("aria-live", "polite");

  selector.addEventListener("change", async () => {
    const elegidas = Array.from(selector.files || []);
    // Se vacia el selector para poder volver a elegir el mismo archivo si hace falta.
    selector.value = "";
    for (const archivo of elegidas) {
      await procesarUna(archivo, campoAutor.value.trim());
    }
  });

  bloque.append(etiquetaAutor, selector, boton, listaDeProgreso);
  return bloque;
}

async function procesarUna(archivo, autor) {
  const fila = document.createElement("li");
  fila.className = "progreso";

  const nombre = document.createElement("span");
  nombre.className = "progreso__nombre";
  nombre.textContent = archivo.name;

  const barra = document.createElement("div");
  barra.className = "progreso__barra";
  const relleno = document.createElement("div");
  relleno.className = "progreso__relleno";
  barra.append(relleno);

  const estado = document.createElement("span");
  estado.className = "progreso__estado";
  estado.textContent = "Preparando…";

  fila.append(nombre, barra, estado);
  listaDeProgreso.append(fila);

  const revision = validarArchivo(archivo);
  if (!revision.valido) {
    fila.classList.add("progreso--error");
    estado.textContent = revision.motivo;
    return;
  }

  const intentar = async () => {
    estado.textContent = "Comprimiendo…";
    const comprimida = await comprimir(archivo);
    const datos = await aBase64(comprimida);
    estado.textContent = "Subiendo…";
    // Barra indeterminada (un pulso, no un porcentaje): no se puede medir el
    // progreso real sin romper la subida (ver nota en subirFoto).
    relleno.classList.add("progreso__relleno--indeterminado");
    return subirFoto({ accion: "subirFoto", nombre: archivo.name, mime: "image/jpeg", datos, autor });
  };

  try {
    if (!CONFIG.urlAppsScript) throw new Error("sin_configurar");
    // Un reintento automatico con espera, como pide el manejo de errores.
    await conReintento(intentar, 2, 2000);
    relleno.classList.remove("progreso__relleno--indeterminado");
    relleno.style.width = "100%";
    fila.classList.add("progreso--listo");
    estado.textContent = "¡Lista!";
    alTerminarUnaSubida();
  } catch (error) {
    fila.classList.add("progreso--error");
    estado.textContent = mensajeDe(error);

    const reintentar = document.createElement("button");
    reintentar.type = "button";
    reintentar.className = "boton-reintentar";
    reintentar.textContent = "Reintentar";
    reintentar.addEventListener("click", () => {
      // La foto elegida no se pierde: se vuelve a procesar el mismo archivo.
      fila.remove();
      procesarUna(archivo, autor);
    });
    fila.append(reintentar);
  }
}

// ---------- Carrusel ----------

function construirCarrusel() {
  const bloque = document.createElement("div");
  bloque.className = "carrusel";

  const marco = document.createElement("div");
  marco.className = "carrusel__marco";

  const pista = document.createElement("ul");
  pista.className = "carrusel__pista";

  // La flecha del boceto. La fila tambien se desliza con el dedo;
  // la flecha existe para quien usa raton o teclado.
  const flecha = document.createElement("button");
  flecha.type = "button";
  flecha.className = "carrusel__flecha";
  flecha.textContent = "›";
  flecha.setAttribute("aria-label", "Ver las fotos siguientes");
  flecha.hidden = true;
  flecha.addEventListener("click", () => {
    const celda = pista.querySelector(".carrusel__celda");
    const paso = celda ? celda.getBoundingClientRect().width + 16 : 240;
    pista.scrollBy({ left: paso, behavior: "smooth" });
  });

  marco.append(pista, flecha);

  const masBoton = document.createElement("button");
  masBoton.type = "button";
  masBoton.className = "boton-reintentar carrusel__mas";
  masBoton.textContent = "Ver más fotos";
  masBoton.hidden = true;

  let todas = [];
  let mostradas = 0;

  function pintarTanda() {
    const siguiente = todas.slice(mostradas, mostradas + CONFIG.fotosPorPagina);
    for (const foto of siguiente) {
      pista.append(construirMiniatura(foto, () => abrirVisor(todas, todas.indexOf(foto))));
    }
    mostradas += siguiente.length;
    masBoton.hidden = mostradas >= todas.length;
  }

  async function cargar() {
    bloque.querySelector(".aviso-fallo")?.remove();
    try {
      if (!CONFIG.urlAppsScript) throw new Error("sin_configurar");
      todas = await listarFotos();
      pista.innerHTML = "";
      mostradas = 0;

      if (todas.length === 0) {
        const vacio = document.createElement("p");
        vacio.className = "carrusel__vacio";
        vacio.textContent = "Todavía no hay fotos. Sé el primero en subir una.";
        pista.append(vacio);
        masBoton.hidden = true;
        flecha.hidden = true;
        return;
      }
      flecha.hidden = false;
      pintarTanda();
    } catch (error) {
      pista.innerHTML = "";
      masBoton.hidden = true;
      flecha.hidden = true;
      const aviso = document.createElement("div");
      bloque.append(aviso);
      mostrarFallo(aviso, cargar);
      console.error("No se pudo listar las fotos:", error);
    }
  }

  masBoton.addEventListener("click", pintarTanda);
  // Cuando termina una subida, el carrusel se refresca sin recargar la pagina.
  alTerminarUnaSubida = cargar;

  bloque.append(marco, masBoton);
  cargar();
  return bloque;
}

function construirMiniatura(foto, alAbrir) {
  const celda = document.createElement("li");
  celda.className = "carrusel__celda";

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "carrusel__abrir";

  const imagen = document.createElement("img");
  imagen.src = urlMiniatura(foto.id);
  imagen.loading = "lazy";
  imagen.decoding = "async";
  imagen.alt = foto.autor ? `Foto del campamento subida por ${foto.autor}` : "Foto del campamento";

  boton.append(imagen);
  boton.addEventListener("click", alAbrir);
  celda.append(boton);
  return celda;
}

function abrirVisor(fotos, indiceInicial) {
  let indice = indiceInicial;

  const capa = document.createElement("div");
  capa.className = "visor";
  capa.setAttribute("role", "dialog");
  capa.setAttribute("aria-modal", "true");
  capa.setAttribute("aria-label", "Foto ampliada");

  const imagen = document.createElement("img");
  imagen.className = "visor__imagen";

  const anterior = botonVisor("‹", "Foto anterior", () => mover(-1));
  const siguiente = botonVisor("›", "Foto siguiente", () => mover(1));
  const cerrar = botonVisor("✕", "Cerrar la foto", cerrarTodo);
  cerrar.classList.add("visor__cerrar");

  function mostrar() {
    const foto = fotos[indice];
    imagen.src = urlGrande(foto.id);
    imagen.alt = foto.autor ? `Foto del campamento subida por ${foto.autor}` : "Foto del campamento";
  }

  function mover(paso) {
    indice = (indice + paso + fotos.length) % fotos.length;
    mostrar();
  }

  function alPulsarTecla(evento) {
    if (evento.key === "Escape") cerrarTodo();
    if (evento.key === "ArrowRight") mover(1);
    if (evento.key === "ArrowLeft") mover(-1);
  }

  function cerrarTodo() {
    document.removeEventListener("keydown", alPulsarTecla);
    document.body.style.overflow = "";
    capa.remove();
  }

  document.addEventListener("keydown", alPulsarTecla);
  document.body.style.overflow = "hidden";

  capa.append(cerrar, anterior, imagen, siguiente);
  document.body.append(capa);
  mostrar();
  cerrar.focus();
}

function botonVisor(texto, etiqueta, alPulsar) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "visor__boton";
  boton.textContent = texto;
  boton.setAttribute("aria-label", etiqueta);
  boton.addEventListener("click", alPulsar);
  return boton;
}
