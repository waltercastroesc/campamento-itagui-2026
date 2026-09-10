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

  // Aparte de los cuatro accesos principales: no se reparte el mismo ancho,
  // se empuja al extremo derecho de la barra.
  const celdaAdmin = document.createElement("li");
  celdaAdmin.className = "navegacion__item-admin";
  const enlaceAdmin = document.createElement("a");
  enlaceAdmin.className = "navegacion__enlace navegacion__enlace-admin";
  enlaceAdmin.href = "admin.html";
  enlaceAdmin.textContent = "Admin";
  celdaAdmin.append(enlaceAdmin);
  lista.append(celdaAdmin);

  contenedor.append(lista);
}
