// programacion-panel.js — DOM y cableado de la seccion Programacion del panel.

import { traerDatoVivo } from "../util/datosVivos.js";
import { llamarApi, mensajeDeErrorAdmin } from "./clave.js";
import { agregarBloque, quitarBloque, agregarDia, quitarDia } from "./programacion-datos.js";

export async function iniciar(contenedor, clave) {
  contenedor.innerHTML = "";

  const titulo = document.createElement("h2");
  titulo.textContent = "Programación";
  contenedor.append(titulo);

  const lista = document.createElement("div");
  lista.className = "panel-lista";

  const agregarDiaBoton = document.createElement("button");
  agregarDiaBoton.type = "button";
  agregarDiaBoton.className = "pill";
  agregarDiaBoton.textContent = "+ Agregar día";

  const guardarBoton = document.createElement("button");
  guardarBoton.type = "button";
  guardarBoton.className = "pill panel-guardar";
  guardarBoton.textContent = "Guardar cambios";

  const estadoGuardado = document.createElement("p");
  estadoGuardado.className = "panel-estado";
  estadoGuardado.setAttribute("aria-live", "polite");

  let dias = [];

  function repintar() {
    lista.innerHTML = "";
    dias.forEach((dia, indiceDia) => {
      lista.append(construirDia(dia, indiceDia));
    });
  }

  function construirDia(dia, indiceDia) {
    const bloqueDia = document.createElement("div");
    bloqueDia.className = "panel-tarjeta";

    const campoNombreDia = document.createElement("input");
    campoNombreDia.type = "text";
    campoNombreDia.placeholder = "Nombre del día (ej. Sábado)";
    campoNombreDia.value = dia.dia;
    campoNombreDia.addEventListener("input", () => {
      dias[indiceDia] = { ...dias[indiceDia], dia: campoNombreDia.value };
    });
    bloqueDia.append(campoNombreDia);

    const listaBloques = document.createElement("div");

    function repintarBloques() {
      listaBloques.innerHTML = "";
      dias[indiceDia].bloques.forEach((bloque, indiceBloque) => {
        const fila = document.createElement("div");
        fila.className = "panel-fila";

        const campoHora = document.createElement("input");
        campoHora.type = "text";
        campoHora.placeholder = "Hora (ej. 5:00 PM)";
        campoHora.value = bloque.hora;
        campoHora.addEventListener("input", () => {
          const bloques = [...dias[indiceDia].bloques];
          bloques[indiceBloque] = { ...bloques[indiceBloque], hora: campoHora.value };
          dias[indiceDia] = { ...dias[indiceDia], bloques };
        });

        const campoActividad = document.createElement("input");
        campoActividad.type = "text";
        campoActividad.placeholder = "Actividad";
        campoActividad.value = bloque.actividad;
        campoActividad.addEventListener("input", () => {
          const bloques = [...dias[indiceDia].bloques];
          bloques[indiceBloque] = { ...bloques[indiceBloque], actividad: campoActividad.value };
          dias[indiceDia] = { ...dias[indiceDia], bloques };
        });

        const quitar = document.createElement("button");
        quitar.type = "button";
        quitar.className = "panel-quitar";
        quitar.textContent = "×";
        quitar.setAttribute("aria-label", "Quitar esta actividad");
        quitar.addEventListener("click", () => {
          dias[indiceDia] = quitarBloque(dias[indiceDia], indiceBloque);
          repintarBloques();
        });

        fila.append(campoHora, campoActividad, quitar);
        listaBloques.append(fila);
      });
    }
    repintarBloques();

    const agregarBoton = document.createElement("button");
    agregarBoton.type = "button";
    agregarBoton.className = "boton-reintentar";
    agregarBoton.textContent = "+ Agregar actividad";
    agregarBoton.addEventListener("click", () => {
      dias[indiceDia] = agregarBloque(dias[indiceDia]);
      repintarBloques();
    });

    const quitarDiaBoton = document.createElement("button");
    quitarDiaBoton.type = "button";
    quitarDiaBoton.className = "panel-quitar-habitacion";
    quitarDiaBoton.textContent = "Quitar este día";
    quitarDiaBoton.addEventListener("click", () => {
      dias = quitarDia(dias, indiceDia);
      repintar();
    });

    bloqueDia.append(listaBloques, agregarBoton, quitarDiaBoton);
    return bloqueDia;
  }

  agregarDiaBoton.addEventListener("click", () => {
    dias = agregarDia(dias);
    repintar();
  });

  guardarBoton.addEventListener("click", async () => {
    estadoGuardado.textContent = "Guardando…";
    try {
      await llamarApi("guardarProgramacion", dias, clave);
      estadoGuardado.textContent = "Guardado.";
    } catch (error) {
      estadoGuardado.textContent = mensajeDeErrorAdmin(error);
    }
  });

  try {
    dias = await traerDatoVivo("programacion");
  } catch {
    dias = [];
  }
  repintar();

  contenedor.append(lista, agregarDiaBoton, guardarBoton, estadoGuardado);
}
