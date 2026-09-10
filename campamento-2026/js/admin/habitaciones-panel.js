// habitaciones-panel.js — DOM y cableado de la seccion Habitaciones del panel.

import { traerDatoVivo } from "../util/datosVivos.js";
import { llamarApi, mensajeDeErrorAdmin } from "./clave.js";
import { agregarHabitacion, quitarHabitacion, agregarIntegrante, quitarIntegrante } from "./habitaciones-datos.js";

export async function iniciar(contenedor, clave) {
  contenedor.innerHTML = "";

  const titulo = document.createElement("h2");
  titulo.textContent = "Habitaciones";
  contenedor.append(titulo);

  const lista = document.createElement("div");
  lista.className = "panel-lista";

  const agregarBoton = document.createElement("button");
  agregarBoton.type = "button";
  agregarBoton.className = "pill";
  agregarBoton.textContent = "+ Agregar habitación";

  const guardarBoton = document.createElement("button");
  guardarBoton.type = "button";
  guardarBoton.className = "pill panel-guardar";
  guardarBoton.textContent = "Guardar cambios";

  const estadoGuardado = document.createElement("p");
  estadoGuardado.className = "panel-estado";
  estadoGuardado.setAttribute("aria-live", "polite");

  let habitaciones = [];

  function repintar() {
    lista.innerHTML = "";
    habitaciones.forEach((habitacion, indice) => {
      lista.append(construirTarjeta(habitacion, indice));
    });
  }

  function construirTarjeta(habitacion, indice) {
    const tarjeta = document.createElement("div");
    tarjeta.className = "panel-tarjeta";

    const campoNombre = document.createElement("input");
    campoNombre.type = "text";
    campoNombre.placeholder = "Nombre de la habitación";
    campoNombre.value = habitacion.nombre;
    campoNombre.addEventListener("input", () => {
      habitaciones[indice] = { ...habitaciones[indice], nombre: campoNombre.value };
    });

    const campoLider = document.createElement("input");
    campoLider.type = "text";
    campoLider.placeholder = "Líder";
    campoLider.value = habitacion.lider;
    campoLider.addEventListener("input", () => {
      habitaciones[indice] = { ...habitaciones[indice], lider: campoLider.value };
    });

    const listaIntegrantes = document.createElement("div");
    listaIntegrantes.className = "panel-integrantes";

    function repintarIntegrantes() {
      listaIntegrantes.innerHTML = "";
      habitaciones[indice].integrantes.forEach((nombre, indiceIntegrante) => {
        const fila = document.createElement("div");
        fila.className = "panel-fila";

        const campo = document.createElement("input");
        campo.type = "text";
        campo.placeholder = "Nombre del integrante";
        campo.value = nombre;
        campo.addEventListener("input", () => {
          const integrantes = [...habitaciones[indice].integrantes];
          integrantes[indiceIntegrante] = campo.value;
          habitaciones[indice] = { ...habitaciones[indice], integrantes };
        });

        const quitar = document.createElement("button");
        quitar.type = "button";
        quitar.className = "panel-quitar";
        quitar.textContent = "×";
        quitar.setAttribute("aria-label", `Quitar a ${nombre || "este integrante"}`);
        quitar.addEventListener("click", () => {
          habitaciones[indice] = quitarIntegrante(habitaciones[indice], indiceIntegrante);
          repintarIntegrantes();
        });

        fila.append(campo, quitar);
        listaIntegrantes.append(fila);
      });
    }
    repintarIntegrantes();

    const agregarIntegranteBoton = document.createElement("button");
    agregarIntegranteBoton.type = "button";
    agregarIntegranteBoton.className = "boton-reintentar";
    agregarIntegranteBoton.textContent = "+ Agregar integrante";
    agregarIntegranteBoton.addEventListener("click", () => {
      habitaciones[indice] = agregarIntegrante(habitaciones[indice]);
      repintarIntegrantes();
    });

    const quitarHabitacionBoton = document.createElement("button");
    quitarHabitacionBoton.type = "button";
    quitarHabitacionBoton.className = "panel-quitar-habitacion";
    quitarHabitacionBoton.textContent = "Quitar esta habitación";
    quitarHabitacionBoton.addEventListener("click", () => {
      habitaciones = quitarHabitacion(habitaciones, indice);
      repintar();
    });

    tarjeta.append(campoNombre, campoLider, listaIntegrantes, agregarIntegranteBoton, quitarHabitacionBoton);
    return tarjeta;
  }

  agregarBoton.addEventListener("click", () => {
    habitaciones = agregarHabitacion(habitaciones);
    repintar();
  });

  guardarBoton.addEventListener("click", async () => {
    estadoGuardado.textContent = "Guardando…";
    try {
      await llamarApi("guardarHabitaciones", habitaciones, clave);
      estadoGuardado.textContent = "Guardado.";
    } catch (error) {
      estadoGuardado.textContent = mensajeDeErrorAdmin(error);
    }
  });

  try {
    habitaciones = await traerDatoVivo("habitaciones");
  } catch {
    habitaciones = [];
  }
  repintar();

  contenedor.append(lista, agregarBoton, guardarBoton, estadoGuardado);
}
