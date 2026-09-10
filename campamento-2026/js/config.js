// config.js — lo unico que hay que tocar al cambiar de despliegue.

export const CONFIG = {
  // PENDIENTE: pega aqui la URL /exec de la aplicacion web de Apps Script.
  // Mientras este vacia, la galeria muestra un aviso en lugar de fallar.
  urlAppsScript: "",

  // Cuantas fotos se piden por tanda al hacer scroll.
  fotosPorPagina: 30,

  // Ancho de la miniatura que se pide a Drive. Se piden miniaturas, no las
  // fotos completas, porque Drive limita las peticiones a imagenes muy solicitadas.
  anchoMiniatura: 800,
};
