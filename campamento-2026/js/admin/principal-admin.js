// principal-admin.js — pide la contraseña y monta las tres secciones del panel.

import { obtenerClaveSesion, guardarClaveSesion, borrarClaveSesion, llamarApi } from "./clave.js";

async function iniciarPanel() {
  const contenedorClave = document.querySelector("#admin-clave");
  const contenedorSecciones = document.querySelector("#admin-secciones");

  async function intentarConClave(clave) {
    try {
      await llamarApi("verificarClave", null, clave);
      guardarClaveSesion(clave);
      await montarSecciones(clave);
      return true;
    } catch (error) {
      return false;
    }
  }

  async function montarSecciones(clave) {
    contenedorClave.hidden = true;
    contenedorSecciones.hidden = false;

    const [habitacionesPanel, programacionPanel, cancionesPanel] = await Promise.all([
      import("./habitaciones-panel.js"),
      import("./programacion-panel.js"),
      import("./canciones-panel.js"),
    ]);

    const seccionHabitaciones = document.createElement("section");
    seccionHabitaciones.className = "admin-seccion";
    const seccionProgramacion = document.createElement("section");
    seccionProgramacion.className = "admin-seccion";
    const seccionCanciones = document.createElement("section");
    seccionCanciones.className = "admin-seccion";

    contenedorSecciones.append(seccionHabitaciones, seccionProgramacion, seccionCanciones);

    await habitacionesPanel.iniciar(seccionHabitaciones, clave);
    await programacionPanel.iniciar(seccionProgramacion, clave);
    await cancionesPanel.iniciar(seccionCanciones, clave);
  }

  const formulario = document.querySelector("#admin-clave-formulario");
  const campoClave = document.querySelector("#admin-clave-campo");
  const errorClave = document.querySelector("#admin-clave-error");

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    errorClave.textContent = "Verificando…";
    const exito = await intentarConClave(campoClave.value);
    if (!exito) {
      errorClave.textContent = "Contraseña incorrecta.";
      borrarClaveSesion();
    }
  });

  const claveGuardada = obtenerClaveSesion();
  if (claveGuardada) {
    const exito = await intentarConClave(claveGuardada);
    if (!exito) borrarClaveSesion();
  }
}

iniciarPanel().catch((error) => {
  console.error("No se pudo iniciar el panel:", error);
});
