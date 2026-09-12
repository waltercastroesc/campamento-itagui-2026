// experiencias.js — muro de experiencias: cada quien cuenta como le fue,
// firmando o no, y se leen de a una, como las paginas de un libro.

import { CONFIG } from "./config.js";
import { conReintento } from "./util/red.js";
import { mostrarFallo } from "./util/datos.js";

export const MAXIMO_CARACTERES = 600;

const MENSAJES = {
  sin_conexion: "Parece que no hay conexión. Revisa tus datos e inténtalo otra vez.",
  texto_vacio: "Escribe algo antes de enviar.",
  demasiado_largo: `Máximo ${MAXIMO_CARACTERES} caracteres.`,
  respuesta_invalida: "El servidor respondió algo que no entendimos. Inténtalo otra vez.",
  fallo_servidor: "No pudimos guardar tu experiencia en este momento. Inténtalo otra vez.",
  sin_configurar: "Todavía no está listo para recibir experiencias. Avisa al liderazgo.",
};

function mensajeDe(error) {
  return MENSAJES[error?.message] || MENSAJES.fallo_servidor;
}

/**
 * Revisa el texto antes de gastar red: ni vacio ni mas largo de lo que el
 * servidor va a aceptar. Funcion pura.
 */
export function validarExperiencia(texto) {
  const limpio = String(texto ?? "").trim();
  if (!limpio) return { valida: false, motivo: MENSAJES.texto_vacio };
  if (limpio.length > MAXIMO_CARACTERES) return { valida: false, motivo: MENSAJES.demasiado_largo };
  return { valida: true };
}

/**
 * Igual que la subida de fotos: Content-Type text/plain para que la peticion
 * quede "simple" y no dispare la verificacion CORS previa, que Apps Script no
 * puede responder.
 */
function enviarExperiencia(cuerpo) {
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

async function listarExperiencias() {
  const respuesta = await fetch(`${CONFIG.urlAppsScript}?recurso=datos&tipo=experiencias`, {
    cache: "no-cache",
  });
  if (!respuesta.ok) throw new Error("fallo_servidor");
  const datos = await respuesta.json();
  if (!datos.ok) throw new Error(datos.error || "fallo_servidor");
  return datos.datos || [];
}

export function iniciar(contenedor) {
  contenedor.innerHTML = "";

  const envoltorio = document.createElement("div");
  envoltorio.className = "contenedor";

  const titulo = document.createElement("h2");
  titulo.className = "seccion__titulo";
  titulo.id = "titulo-experiencias";
  titulo.textContent = "Cuéntanos tu experiencia";

  const libro = construirLibro();
  const formulario = construirFormulario(libro.agregarYMostrar);

  envoltorio.append(titulo, formulario, libro.elemento);
  contenedor.append(envoltorio);

  libro.cargar();
}

// ---------- Formulario ----------

function construirFormulario(alGuardarConExito) {
  const formulario = document.createElement("form");
  formulario.className = "experiencias__formulario";

  const etiquetaNombre = document.createElement("label");
  etiquetaNombre.className = "experiencias__campo-nombre";
  const textoNombre = document.createElement("span");
  textoNombre.textContent = "Tu nombre (opcional)";
  const campoNombre = document.createElement("input");
  campoNombre.type = "text";
  campoNombre.className = "subida__campo";
  campoNombre.maxLength = 40;
  campoNombre.placeholder = "Cómo quieres firmar";
  etiquetaNombre.append(textoNombre, campoNombre);

  const etiquetaTexto = document.createElement("label");
  etiquetaTexto.className = "experiencias__campo-texto";
  const textoEtiqueta = document.createElement("span");
  textoEtiqueta.className = "solo-lectores";
  textoEtiqueta.textContent = "Cuéntanos cómo te fue en el campamento";
  const campoTexto = document.createElement("textarea");
  campoTexto.className = "experiencias__textarea";
  campoTexto.maxLength = MAXIMO_CARACTERES;
  campoTexto.rows = 4;
  campoTexto.placeholder = "Cuéntanos cómo te fue…";
  etiquetaTexto.append(textoEtiqueta, campoTexto);

  const contador = document.createElement("p");
  contador.className = "experiencias__contador";
  contador.textContent = `0/${MAXIMO_CARACTERES}`;
  campoTexto.addEventListener("input", () => {
    contador.textContent = `${campoTexto.value.length}/${MAXIMO_CARACTERES}`;
  });

  const boton = document.createElement("button");
  boton.type = "submit";
  boton.className = "pill";
  boton.textContent = "Enviar";

  const estado = document.createElement("p");
  estado.className = "experiencias__estado";
  estado.setAttribute("aria-live", "polite");
  estado.hidden = true;

  formulario.append(etiquetaNombre, etiquetaTexto, contador, boton, estado);

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const revision = validarExperiencia(campoTexto.value);
    estado.hidden = false;
    if (!revision.valida) {
      estado.classList.add("experiencias__estado--error");
      estado.textContent = revision.motivo;
      return;
    }

    const nombre = campoNombre.value.trim();
    const texto = campoTexto.value.trim();

    boton.disabled = true;
    estado.classList.remove("experiencias__estado--error");
    estado.textContent = "Enviando…";

    try {
      if (!CONFIG.urlAppsScript) throw new Error("sin_configurar");
      await conReintento(
        () => enviarExperiencia({ accion: "enviarExperiencia", nombre, texto }),
        2,
        2000
      );
      estado.textContent = "¡Gracias por compartir!";
      campoTexto.value = "";
      campoNombre.value = "";
      contador.textContent = `0/${MAXIMO_CARACTERES}`;
      await alGuardarConExito({ nombre, texto });
    } catch (error) {
      estado.classList.add("experiencias__estado--error");
      estado.textContent = mensajeDe(error);
    } finally {
      boton.disabled = false;
    }
  });

  return formulario;
}

// ---------- Libro de experiencias ----------

function construirLibro() {
  const elemento = document.createDocumentFragment();

  const aviso = document.createElement("p");
  aviso.className = "canciones__vacio";
  aviso.hidden = true;
  aviso.textContent = "Todavía no hay experiencias para mostrar. ¡Sé el primero en contar la tuya!";

  const pagina = document.createElement("div");
  pagina.className = "libro-paginado";

  const paginador = document.createElement("div");
  paginador.className = "paginador";
  const anterior = document.createElement("button");
  anterior.type = "button";
  anterior.className = "paginador__flecha";
  anterior.textContent = "‹";
  anterior.setAttribute("aria-label", "Experiencia anterior");
  const indicador = document.createElement("span");
  indicador.className = "paginador__indicador";
  const siguiente = document.createElement("button");
  siguiente.type = "button";
  siguiente.className = "paginador__flecha";
  siguiente.textContent = "›";
  siguiente.setAttribute("aria-label", "Experiencia siguiente");
  paginador.append(anterior, indicador, siguiente);

  const cuerpo = document.createElement("div");
  cuerpo.append(aviso, pagina, paginador);
  elemento.append(cuerpo);

  let experiencias = [];
  let paginaActual = 0;

  function mostrarPagina(indice) {
    paginaActual = Math.min(Math.max(indice, 0), experiencias.length - 1);
    pagina.innerHTML = "";
    pagina.append(construirExperiencia(experiencias[paginaActual]));
    indicador.textContent = `Experiencia ${paginaActual + 1} de ${experiencias.length}`;
    anterior.disabled = paginaActual === 0;
    siguiente.disabled = paginaActual === experiencias.length - 1;
  }

  function actualizarVista() {
    const hayExperiencias = experiencias.length > 0;
    aviso.hidden = hayExperiencias;
    pagina.hidden = !hayExperiencias;
    paginador.hidden = !hayExperiencias;
    if (hayExperiencias) mostrarPagina(0);
  }

  anterior.addEventListener("click", () => mostrarPagina(paginaActual - 1));
  siguiente.addEventListener("click", () => mostrarPagina(paginaActual + 1));

  async function cargar() {
    cuerpo.querySelector(".aviso-fallo")?.remove();
    try {
      if (!CONFIG.urlAppsScript) throw new Error("sin_configurar");
      experiencias = await listarExperiencias();
      actualizarVista();
    } catch (error) {
      pagina.hidden = true;
      paginador.hidden = true;
      aviso.hidden = true;
      const contenedorFallo = document.createElement("div");
      cuerpo.append(contenedorFallo);
      mostrarFallo(contenedorFallo, cargar);
      console.error("No se pudieron listar las experiencias:", error);
    }
  }

  /** La experiencia recien enviada se ve de una, sin esperar al cache del servidor. */
  async function agregarYMostrar(nueva) {
    experiencias = [nueva, ...experiencias];
    actualizarVista();
  }

  return { elemento, cargar, agregarYMostrar };
}

function construirExperiencia(experiencia) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "experiencia";

  const texto = document.createElement("p");
  texto.className = "experiencia__texto";
  texto.textContent = `“${experiencia.texto}”`;

  const autor = document.createElement("p");
  autor.className = "experiencia__autor";
  autor.textContent = `— ${experiencia.nombre ? experiencia.nombre : "Anónimo"}`;

  tarjeta.append(texto, autor);
  return tarjeta;
}
