// config.js — lo unico que hay que tocar al cambiar de despliegue.

export const CONFIG = {
  urlAppsScript: "https://script.google.com/macros/s/AKfycbyjdTC4F7Grm3-UQ7qOpbrhwBNrcPn1eOo_dY0Xa1oy9bZK3Z5EGp6dvozKT1KjeawSdQ/exec",

  // Cuantas fotos se piden por tanda al hacer scroll.
  fotosPorPagina: 30,

  // Ancho de la miniatura que se pide a Drive. Se piden miniaturas, no las
  // fotos completas, porque Drive limita las peticiones a imagenes muy solicitadas.
  anchoMiniatura: 800,
};
