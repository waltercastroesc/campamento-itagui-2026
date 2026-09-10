// canciones-panel.js — DOM y cableado de la seccion Canciones del panel.

import { traerDatoVivo } from "../util/datosVivos.js";
import { llamarApi, mensajeDeErrorAdmin } from "./clave.js";
import {
  agregarCancion,
  quitarCancion,
  agregarBloqueLetra,
  quitarBloqueLetra,
  textoALineas,
  lineasATexto,
} from "./canciones-datos.js";

export async function iniciar(contenedor, clave) {
  contenedor.innerHTML = "";

  const titulo = document.createElement("h2");
  titulo.textContent = "Canciones";
  contenedor.append(titulo);

  const lista = document.createElement("div");
  lista.className = "panel-lista";

  const formularioNueva = document.createElement("div");
  formularioNueva.className = "panel-fila";

  const campoTituloNueva = document.createElement("input");
  campoTituloNueva.type = "text";
  campoTituloNueva.placeholder = "Título de la canción nueva";

  const campoNumeroNueva = document.createElement("input");
  campoNumeroNueva.type = "number";
  campoNumeroNueva.placeholder = "Número (opcional)";

  const campoLemaNueva = document.createElement("label");
  const casillaLemaNueva = document.createElement("input");
  casillaLemaNueva.type = "checkbox";
  campoLemaNueva.append(casillaLemaNueva, document.createTextNode(" Es canción lema"));

  const agregarCancionBoton = document.createElement("button");
  agregarCancionBoton.type = "button";
  agregarCancionBoton.className = "pill";
  agregarCancionBoton.textContent = "+ Agregar canción";

  formularioNueva.append(campoTituloNueva, campoNumeroNueva, campoLemaNueva, agregarCancionBoton);

  const guardarBoton = document.createElement("button");
  guardarBoton.type = "button";
  guardarBoton.className = "pill panel-guardar";
  guardarBoton.textContent = "Guardar cambios";

  const estadoGuardado = document.createElement("p");
  estadoGuardado.className = "panel-estado";
  estadoGuardado.setAttribute("aria-live", "polite");

  let canciones = [];

  function repintar() {
    lista.innerHTML = "";
    canciones.forEach((cancion, indice) => {
      lista.append(construirCancion(cancion, indice));
    });
  }

  function construirCancion(cancion, indice) {
    const tarjeta = document.createElement("div");
    tarjeta.className = "panel-tarjeta";

    const encabezado = document.createElement("h3");
    encabezado.textContent = `${cancion.titulo}${cancion.lema ? " (lema)" : ""}`;
    tarjeta.append(encabezado);

    const campoTitulo = document.createElement("input");
    campoTitulo.type = "text";
    campoTitulo.placeholder = "Título";
    campoTitulo.value = cancion.titulo;
    campoTitulo.addEventListener("input", () => {
      canciones[indice] = { ...canciones[indice], titulo: campoTitulo.value };
      encabezado.textContent = `${campoTitulo.value}${canciones[indice].lema ? " (lema)" : ""}`;
    });
    tarjeta.append(campoTitulo);

    const listaBloques = document.createElement("div");

    function repintarBloques() {
      listaBloques.innerHTML = "";
      canciones[indice].bloques.forEach((bloque, indiceBloque) => {
        const filaBloque = document.createElement("div");
        filaBloque.className = "panel-bloque-letra";

        const selectorTipo = document.createElement("select");
        ["estrofa", "coro"].forEach((tipo) => {
          const opcion = document.createElement("option");
          opcion.value = tipo;
          opcion.textContent = tipo === "estrofa" ? "Estrofa" : "Coro";
          if (tipo === bloque.tipo) opcion.selected = true;
          selectorTipo.append(opcion);
        });
        selectorTipo.addEventListener("change", () => {
          const bloques = [...canciones[indice].bloques];
          bloques[indiceBloque] = { ...bloques[indiceBloque], tipo: selectorTipo.value };
          canciones[indice] = { ...canciones[indice], bloques };
        });

        const areaTexto = document.createElement("textarea");
        areaTexto.rows = 4;
        areaTexto.placeholder = "Una línea de la canción por línea de texto";
        areaTexto.value = lineasATexto(bloque.lineas);
        areaTexto.addEventListener("input", () => {
          const bloques = [...canciones[indice].bloques];
          bloques[indiceBloque] = { ...bloques[indiceBloque], lineas: textoALineas(areaTexto.value) };
          canciones[indice] = { ...canciones[indice], bloques };
        });

        const quitarBloqueBoton = document.createElement("button");
        quitarBloqueBoton.type = "button";
        quitarBloqueBoton.className = "panel-quitar";
        quitarBloqueBoton.textContent = "× Quitar este bloque";
        quitarBloqueBoton.addEventListener("click", () => {
          canciones[indice] = quitarBloqueLetra(canciones[indice], indiceBloque);
          repintarBloques();
        });

        filaBloque.append(selectorTipo, areaTexto, quitarBloqueBoton);
        listaBloques.append(filaBloque);
      });
    }
    repintarBloques();

    const agregarBloqueBoton = document.createElement("button");
    agregarBloqueBoton.type = "button";
    agregarBloqueBoton.className = "boton-reintentar";
    agregarBloqueBoton.textContent = "+ Agregar bloque de letra";
    agregarBloqueBoton.addEventListener("click", () => {
      canciones[indice] = agregarBloqueLetra(canciones[indice]);
      repintarBloques();
    });

    const quitarCancionBoton = document.createElement("button");
    quitarCancionBoton.type = "button";
    quitarCancionBoton.className = "panel-quitar-habitacion";
    quitarCancionBoton.textContent = "Quitar esta canción";
    quitarCancionBoton.addEventListener("click", () => {
      canciones = quitarCancion(canciones, indice);
      repintar();
    });

    tarjeta.append(listaBloques, agregarBloqueBoton, quitarCancionBoton);
    return tarjeta;
  }

  agregarCancionBoton.addEventListener("click", () => {
    const titulo = campoTituloNueva.value.trim();
    if (!titulo) return;
    const numero = campoNumeroNueva.value ? Number(campoNumeroNueva.value) : undefined;
    canciones = agregarCancion(canciones, titulo, numero, casillaLemaNueva.checked);
    campoTituloNueva.value = "";
    campoNumeroNueva.value = "";
    casillaLemaNueva.checked = false;
    repintar();
  });

  guardarBoton.addEventListener("click", async () => {
    estadoGuardado.textContent = "Guardando…";
    try {
      await llamarApi("guardarCanciones", canciones, clave);
      estadoGuardado.textContent = "Guardado.";
    } catch (error) {
      estadoGuardado.textContent = mensajeDeErrorAdmin(error);
    }
  });

  try {
    canciones = await traerDatoVivo("canciones");
  } catch {
    canciones = [];
  }
  repintar();

  contenedor.append(lista, formularioNueva, guardarBoton, estadoGuardado);
}
