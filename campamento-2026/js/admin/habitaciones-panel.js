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

  /** Fila con nombre + cedula + kit, para el lider o para un integrante. */
  function construirFilaPersona(persona, alCambiar, alQuitar) {
    const fila = document.createElement("div");
    fila.className = "panel-fila";

    const campoNombre = document.createElement("input");
    campoNombre.type = "text";
    campoNombre.className = "panel-fila__nombre";
    campoNombre.placeholder = "Nombre";
    campoNombre.value = persona.nombre;
    campoNombre.addEventListener("input", () => alCambiar({ ...persona, nombre: campoNombre.value }));

    const campoCedula = document.createElement("input");
    campoCedula.type = "text";
    campoCedula.inputMode = "numeric";
    campoCedula.className = "panel-fila__cedula";
    campoCedula.placeholder = "Cédula";
    campoCedula.value = persona.cedula || "";
    campoCedula.addEventListener("input", () => alCambiar({ ...persona, cedula: campoCedula.value }));

    const campoKit = document.createElement("input");
    campoKit.type = "text";
    campoKit.inputMode = "numeric";
    campoKit.className = "panel-fila__kit";
    campoKit.placeholder = "Kit";
    campoKit.value = persona.kit || "";
    campoKit.addEventListener("input", () => alCambiar({ ...persona, kit: campoKit.value }));

    fila.append(campoNombre, campoCedula, campoKit);

    if (alQuitar) {
      const quitar = document.createElement("button");
      quitar.type = "button";
      quitar.className = "panel-quitar";
      quitar.textContent = "×";
      quitar.setAttribute("aria-label", `Quitar a ${persona.nombre || "este integrante"}`);
      quitar.addEventListener("click", alQuitar);
      fila.append(quitar);
    }

    return fila;
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

    const etiquetaLider = document.createElement("p");
    etiquetaLider.className = "panel-etiqueta";
    etiquetaLider.textContent = "Líder de la habitación";

    const filaLider = construirFilaPersona(habitacion.lider || { nombre: "", cedula: "", kit: "" }, (nuevoLider) => {
      habitaciones[indice] = { ...habitaciones[indice], lider: nuevoLider };
    });

    const etiquetaIntegrantes = document.createElement("p");
    etiquetaIntegrantes.className = "panel-etiqueta";
    etiquetaIntegrantes.textContent = "Integrantes";

    const listaIntegrantes = document.createElement("div");
    listaIntegrantes.className = "panel-integrantes";

    function repintarIntegrantes() {
      listaIntegrantes.innerHTML = "";
      habitaciones[indice].integrantes.forEach((persona, indiceIntegrante) => {
        const fila = construirFilaPersona(
          persona,
          (nuevaPersona) => {
            const integrantes = [...habitaciones[indice].integrantes];
            integrantes[indiceIntegrante] = nuevaPersona;
            habitaciones[indice] = { ...habitaciones[indice], integrantes };
          },
          () => {
            habitaciones[indice] = quitarIntegrante(habitaciones[indice], indiceIntegrante);
            repintarIntegrantes();
          }
        );
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

    tarjeta.append(
      campoNombre,
      etiquetaLider,
      filaLider,
      etiquetaIntegrantes,
      listaIntegrantes,
      agregarIntegranteBoton,
      quitarHabitacionBoton
    );
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
