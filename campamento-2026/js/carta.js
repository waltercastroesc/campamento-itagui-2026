// carta.js — portada y sobre animado. No conoce ninguna otra seccion.

import { cargarJSON, montarSeccion } from "./util/datos.js";

export function iniciar(contenedor) {
  return montarSeccion(
    contenedor,
    () => cargarJSON("datos/carta.json"),
    pintarPortada
  );
}

function pintarPortada(contenedor, carta) {
  const envoltorio = document.createElement("div");
  envoltorio.className = "portada contenedor";

  const lema = document.createElement("h1");
  lema.className = "portada__lema";
  // Dos lineas, como en el boceto.
  const primera = document.createElement("span");
  primera.textContent = "Derramaré de mi";
  const segunda = document.createElement("span");
  segunda.textContent = "Espíritu";
  lema.append(primera, segunda);

  const marca = document.createElement("p");
  marca.className = "portada__marca";
  marca.textContent = "CAMP 2026";

  // El boton pill del boceto: lleva directo a la seccion de habitaciones.
  const aHabitacion = document.createElement("a");
  aHabitacion.className = "pill portada__pill";
  aHabitacion.href = "#habitaciones";
  aHabitacion.textContent = "Conoce tu habitación";

  envoltorio.append(lema, marca, construirSobre(carta), aHabitacion);
  contenedor.append(envoltorio);
}

/** Reparte un rotulo en dos lineas: la primera palabra arriba, el resto abajo. */
function partirEnDosLineas(texto) {
  const [primera, ...resto] = texto.split(" ");
  return [primera, resto.join(" ")];
}

function construirSobre(carta) {
  const bloque = document.createElement("div");
  bloque.className = "sobre";

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "sobre__tapa";
  boton.id = "sobre";
  boton.setAttribute("aria-expanded", "false");
  boton.setAttribute("aria-controls", "sobre-contenido");

  const interior = document.createElement("span");
  interior.className = "sobre__interior";

  const vista = document.createElement("span");
  vista.className = "sobre__carta-vista";

  const linea1 = document.createElement("span");
  linea1.className = "sobre__linea";
  const linea2 = document.createElement("span");
  linea2.className = "sobre__linea";
  const [primeraLinea, segundaLinea] = partirEnDosLineas(carta.titulo || "Carta para ti");
  linea1.textContent = primeraLinea;
  linea2.textContent = segundaLinea;
  vista.append(linea1, linea2);

  const cuerpo = document.createElement("span");
  cuerpo.className = "sobre__cuerpo";

  const pliegue = document.createElement("span");
  pliegue.className = "sobre__pliegue";
  pliegue.setAttribute("aria-hidden", "true");

  const sello = document.createElement("span");
  sello.className = "sobre__sello";
  sello.textContent = "TRASCIENDE";

  cuerpo.append(pliegue, sello);
  interior.append(vista, cuerpo);
  boton.append(interior);

  const hoja = document.createElement("div");
  hoja.className = "sobre__hoja";
  hoja.id = "sobre-contenido";
  hoja.hidden = true;

  const titulo = document.createElement("h2");
  titulo.className = "sobre__titulo";
  titulo.textContent = carta.titulo || "Carta para ti";
  hoja.append(titulo);

  for (const parrafo of carta.parrafos || []) {
    const p = document.createElement("p");
    p.textContent = parrafo;
    hoja.append(p);
  }

  if (carta.firma) {
    const firma = document.createElement("p");
    firma.className = "sobre__firma";
    firma.textContent = carta.firma;
    hoja.append(firma);
  }

  boton.addEventListener("click", () => {
    const abierto = boton.getAttribute("aria-expanded") === "true";
    boton.setAttribute("aria-expanded", String(!abierto));
    bloque.classList.toggle("sobre--abierto", !abierto);
    hoja.hidden = abierto;
    const [nuevaPrimera, nuevaSegunda] = partirEnDosLineas(
      abierto ? (carta.titulo || "Carta para ti") : "Cerrar la carta"
    );
    linea1.textContent = nuevaPrimera;
    linea2.textContent = nuevaSegunda;
  });

  bloque.append(boton, hoja);
  return bloque;
}
