// experiencias-panel.js — revisar y borrar las experiencias que envia el publico.

import { traerDatoVivo } from "../util/datosVivos.js";
import { llamarApi, mensajeDeErrorAdmin } from "./clave.js";

export async function iniciar(contenedor, clave) {
  contenedor.innerHTML = "";

  const titulo = document.createElement("h2");
  titulo.textContent = "Experiencias";
  contenedor.append(titulo);

  const lista = document.createElement("div");
  lista.className = "panel-lista";

  const estado = document.createElement("p");
  estado.className = "panel-estado";
  estado.setAttribute("aria-live", "polite");

  let experiencias = [];

  function repintar() {
    lista.innerHTML = "";

    if (experiencias.length === 0) {
      const vacio = document.createElement("p");
      vacio.textContent = "Todavía no hay experiencias enviadas.";
      lista.append(vacio);
      return;
    }

    experiencias.forEach((experiencia) => {
      const tarjeta = document.createElement("div");
      tarjeta.className = "panel-tarjeta";

      const texto = document.createElement("p");
      texto.textContent = `“${experiencia.texto}”`;

      const autor = document.createElement("p");
      autor.className = "panel-etiqueta";
      autor.textContent = `— ${experiencia.nombre || "Anónimo"}`;

      const eliminarBoton = document.createElement("button");
      eliminarBoton.type = "button";
      eliminarBoton.className = "panel-quitar-habitacion";
      eliminarBoton.textContent = "Eliminar";
      eliminarBoton.addEventListener("click", async () => {
        estado.textContent = "Eliminando…";
        try {
          await llamarApi("eliminarExperiencia", { fecha: experiencia.fecha }, clave);
          experiencias = experiencias.filter((e) => e.fecha !== experiencia.fecha);
          repintar();
          estado.textContent = "Eliminada.";
        } catch (error) {
          estado.textContent = mensajeDeErrorAdmin(error);
        }
      });

      tarjeta.append(texto, autor, eliminarBoton);
      lista.append(tarjeta);
    });
  }

  try {
    experiencias = await traerDatoVivo("experiencias");
  } catch {
    experiencias = [];
  }
  repintar();

  contenedor.append(lista, estado);
}
