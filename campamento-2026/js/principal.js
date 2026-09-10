// principal.js — monta cada seccion por separado.
// Si un modulo revienta, se registra en consola y los demas siguen su curso.
// Es el unico archivo del proyecto que conoce a todos los modulos.

const secciones = [
  ["#portada", () => import("./carta.js")],
  ["#habitaciones", () => import("./habitaciones.js")],
  ["#programacion", () => import("./programacion.js")],
  // ["#canciones", () => import("./canciones.js")],
  // ["#locacion", () => import("./locacion.js")],
  // ["#fotos", () => import("./galeria.js")],
  // ["#pie", () => import("./pie.js")],
  // ["#navegacion", () => import("./navegacion.js")],
];

for (const [selector, traerModulo] of secciones) {
  const contenedor = document.querySelector(selector);
  if (!contenedor) {
    console.error(`No existe el contenedor ${selector} en index.html`);
    continue;
  }
  traerModulo()
    .then((modulo) => modulo.iniciar(contenedor))
    .catch((error) => console.error(`Fallo la seccion ${selector}:`, error));
}
