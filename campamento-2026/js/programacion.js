// programacion.js — los tres dias del campamento.
// Escritorio: tres columnas. Celular: pestañas, porque apilarlos son tres pantallas de scroll.

import { cargarJSON, montarSeccion } from "./util/datos.js";
import { cargarConRespaldo, traerDatoVivo } from "./util/datosVivos.js";
import { CONFIG } from "./config.js";

/**
 * Comprueba la forma de programacion.json antes de pintarlo.
 * Funcion pura: no toca el DOM, para poder probarla en la terminal.
 */
export function validarProgramacion(datos) {
  if (!Array.isArray(datos)) {
    return { valida: false, motivo: "programacion.json debe ser una lista de dias" };
  }
  for (const dia of datos) {
    if (!dia || typeof dia.dia !== "string") {
      return { valida: false, motivo: "Hay un dia sin nombre" };
    }
    if (!Array.isArray(dia.bloques) || dia.bloques.length === 0) {
      return { valida: false, motivo: `El dia ${dia.dia} no tiene bloques` };
    }
    for (const bloque of dia.bloques) {
      if (!bloque || typeof bloque.hora !== "string" || typeof bloque.actividad !== "string") {
        return { valida: false, motivo: `Hay un bloque incompleto en ${dia.dia}` };
      }
    }
  }
  return { valida: true };
}

export function iniciar(contenedor) {
  return montarSeccion(contenedor, cargarProgramacion, pintarProgramacion);
}

async function cargarProgramacion() {
  let lista;
  let desdeCache = false;
  if (!CONFIG.urlAppsScript) {
    lista = await cargarJSON("datos/programacion.json");
  } else {
    const resultado = await cargarConRespaldo(
      "campamento2026:programacion",
      () => traerDatoVivo("programacion")
    );
    lista = resultado.datos;
    desdeCache = resultado.desdeCache;
  }
  const revision = validarProgramacion(lista);
  if (!revision.valida) throw new Error(revision.motivo);
  return { lista, desdeCache };
}

function pintarProgramacion(contenedor, { lista: dias, desdeCache }) {
  const envoltorio = document.createElement("div");
  envoltorio.className = "contenedor";

  const titulo = document.createElement("h2");
  titulo.className = "seccion__titulo";
  titulo.id = "titulo-programacion";
  titulo.textContent = "Programación";
  envoltorio.append(titulo);

  if (desdeCache) {
    const aviso = document.createElement("p");
    aviso.className = "aviso-cache";
    aviso.textContent = "Mostrando la última versión guardada en este dispositivo — puede no estar actualizada.";
    envoltorio.append(aviso);
  }

  const pestanas = document.createElement("div");
  pestanas.className = "pestanas";
  pestanas.setAttribute("role", "tablist");
  pestanas.setAttribute("aria-label", "Días del campamento");

  const panelesEnvoltorio = document.createElement("div");
  panelesEnvoltorio.className = "dias";

  const botones = [];
  const paneles = [];

  dias.forEach((dia, indice) => {
    const idPestana = `pestana-dia-${dia.numero}`;
    const idPanel = `panel-dia-${dia.numero}`;

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "pestanas__boton";
    boton.id = idPestana;
    boton.setAttribute("role", "tab");
    boton.setAttribute("aria-controls", idPanel);
    boton.setAttribute("aria-selected", String(indice === 0));
    boton.tabIndex = indice === 0 ? 0 : -1;
    boton.textContent = dia.dia;
    botones.push(boton);
    pestanas.append(boton);

    const panel = construirDia(dia, idPanel, idPestana);
    panel.hidden = indice !== 0;
    paneles.push(panel);
    panelesEnvoltorio.append(panel);
  });

  function seleccionar(indice) {
    botones.forEach((boton, i) => {
      boton.setAttribute("aria-selected", String(i === indice));
      boton.tabIndex = i === indice ? 0 : -1;
    });
    paneles.forEach((panel, i) => {
      panel.hidden = i !== indice;
    });
  }

  botones.forEach((boton, indice) => {
    boton.addEventListener("click", () => seleccionar(indice));
    boton.addEventListener("keydown", (evento) => {
      if (evento.key !== "ArrowRight" && evento.key !== "ArrowLeft") return;
      evento.preventDefault();
      const paso = evento.key === "ArrowRight" ? 1 : -1;
      const siguiente = (indice + paso + botones.length) % botones.length;
      seleccionar(siguiente);
      botones[siguiente].focus();
    });
  });

  envoltorio.append(pestanas, panelesEnvoltorio);
  contenedor.append(envoltorio);
}

function construirDia(dia, idPanel, idPestana) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "dia";
  tarjeta.id = idPanel;
  tarjeta.setAttribute("role", "tabpanel");
  tarjeta.setAttribute("aria-labelledby", idPestana);

  const numero = document.createElement("span");
  numero.className = "dia__numero";
  numero.setAttribute("aria-hidden", "true");
  numero.textContent = String(dia.numero);

  const nombre = document.createElement("h3");
  nombre.className = "dia__nombre";
  nombre.textContent = dia.dia;

  const lista = document.createElement("ol");
  lista.className = "dia__bloques";

  for (const bloque of dia.bloques) {
    const fila = document.createElement("li");
    fila.className = "bloque";

    const hora = document.createElement("span");
    hora.className = "bloque__hora";
    hora.textContent = bloque.hora;

    const actividad = document.createElement("span");
    actividad.className = "bloque__actividad";
    actividad.textContent = bloque.actividad;

    fila.append(hora, actividad);
    lista.append(fila);
  }

  tarjeta.append(numero, nombre, lista);
  return tarjeta;
}
