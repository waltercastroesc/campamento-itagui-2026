// navegacion.js — barra fija de accesos directos.
// La pagina mide unos 6000 pixeles; sin esto hay que hacer mucho scroll.

const DESTINOS = [
  { id: "programacion", texto: "Programa" },
  { id: "canciones", texto: "Canciones" },
  { id: "habitaciones", texto: "Habitación" },
  { id: "fotos", texto: "Fotos" },
];

export function iniciar(contenedor) {
  contenedor.innerHTML = "";
  contenedor.className = "navegacion";

  const lista = document.createElement("ul");
  lista.className = "navegacion__lista";

  for (const destino of DESTINOS) {
    const celda = document.createElement("li");
    const enlace = document.createElement("a");
    enlace.className = "navegacion__enlace";
    enlace.href = `#${destino.id}`;
    enlace.textContent = destino.texto;
    celda.append(enlace);
    lista.append(celda);
  }

  contenedor.append(lista);
}
