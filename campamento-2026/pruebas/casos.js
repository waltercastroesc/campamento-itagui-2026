// casos.js — fuente unica de casos de prueba.
// entorno "ambos": corre en Node y en el navegador.
// entorno "navegador": necesita DOM, canvas o APIs del navegador; Node lo salta.

import { igual, cierto, lanza } from "./afirmar.js";
import { cargarJSON } from "../js/util/datos.js";
import { validarProgramacion } from "../js/programacion.js";
import { contarIntegrantes } from "../js/habitaciones.js";
import { normalizar } from "../js/util/texto.js";
import { filtrarCanciones, textoDeCancion } from "../js/canciones.js";
import { calcularMedidas, comprimir, validarArchivo, LADO_MAXIMO } from "../js/imagen.js";
import { conReintento } from "../js/util/red.js";
import { enlaceTelefono } from "../js/pie.js";
import { cargarConRespaldo, traerDatoVivo } from "../js/util/datosVivos.js";

/** Un almacen tipo localStorage, pero en memoria, para no depender del navegador. */
function crearAlmacenFalso() {
  const mapa = new Map();
  return {
    getItem: (clave) => (mapa.has(clave) ? mapa.get(clave) : null),
    setItem: (clave, valor) => mapa.set(clave, valor),
  };
}

const CANCIONES_DE_PRUEBA = [
  {
    id: "derrama",
    titulo: "Derrama",
    numero: 1,
    bloques: [
      { tipo: "estrofa", lineas: ["Tu ser me estremece", "Anhelo tu espíritu"] },
      { tipo: "coro", lineas: ["Soy una vasija esperando ser llena", "Rindo mi corazón"] },
    ],
  },
  {
    id: "derrama-tu-poder",
    titulo: "Derrama tu poder",
    numero: 2,
    bloques: [{ tipo: "estrofa", lineas: ["Muéveme como nunca me has movido"] }],
  },
];

export const casos = [
  {
    nombre: "El arnes de pruebas funciona",
    entorno: "ambos",
    ejecutar() {
      igual(1 + 1, 2, "La suma basica deberia funcionar");
    },
  },
  {
    nombre: "cargarJSON devuelve el objeto cuando la respuesta es correcta",
    entorno: "ambos",
    async ejecutar() {
      const traerFalso = async () => ({ ok: true, status: 200, json: async () => ({ titulo: "Hola" }) });
      const resultado = await cargarJSON("datos/carta.json", traerFalso);
      igual(resultado, { titulo: "Hola" }, "Deberia devolver el JSON tal cual");
    },
  },
  {
    nombre: "cargarJSON lanza cuando el servidor responde 404",
    entorno: "ambos",
    async ejecutar() {
      const traerFalso = async () => ({ ok: false, status: 404, json: async () => ({}) });
      const error = await lanza(
        () => cargarJSON("datos/nada.json", traerFalso),
        "Un 404 deberia lanzar"
      );
      cierto(error.message.includes("404"), "El mensaje deberia mencionar el estado 404");
    },
  },
  {
    nombre: "cargarJSON propaga el fallo de red",
    entorno: "ambos",
    async ejecutar() {
      const traerFalso = async () => {
        throw new TypeError("Failed to fetch");
      };
      await lanza(
        () => cargarJSON("datos/carta.json", traerFalso),
        "Un fallo de red deberia propagarse"
      );
    },
  },
  {
    nombre: "validarProgramacion acepta la forma correcta",
    entorno: "ambos",
    ejecutar() {
      const datos = [{ dia: "Viernes", numero: 1, bloques: [{ hora: "5:00 PM", actividad: "Salida" }] }];
      igual(validarProgramacion(datos), { valida: true }, "Un dia bien formado deberia pasar");
    },
  },
  {
    nombre: "validarProgramacion rechaza lo que no es una lista",
    entorno: "ambos",
    ejecutar() {
      const resultado = validarProgramacion({ dia: "Viernes" });
      cierto(resultado.valida === false, "Un objeto suelto no es una programacion valida");
    },
  },
  {
    nombre: "validarProgramacion rechaza un dia sin bloques",
    entorno: "ambos",
    ejecutar() {
      const resultado = validarProgramacion([{ dia: "Viernes", numero: 1 }]);
      cierto(resultado.valida === false, "Un dia sin bloques no es valido");
      cierto(resultado.motivo.includes("Viernes"), "El motivo deberia nombrar el dia problematico");
    },
  },
  {
    nombre: "validarProgramacion rechaza un bloque sin hora",
    entorno: "ambos",
    ejecutar() {
      const datos = [{ dia: "Sábado", numero: 2, bloques: [{ actividad: "Desayuno" }] }];
      cierto(validarProgramacion(datos).valida === false, "Un bloque sin hora no es valido");
    },
  },
  {
    nombre: "contarIntegrantes suma al lider y a los integrantes",
    entorno: "ambos",
    ejecutar() {
      const habitacion = { nombre: "Habitación 1", lider: "Ana", integrantes: ["Luis", "Sara"] };
      igual(contarIntegrantes(habitacion), 3, "Dos integrantes mas el lider son tres personas");
    },
  },
  {
    nombre: "contarIntegrantes tolera una habitacion sin datos",
    entorno: "ambos",
    ejecutar() {
      igual(contarIntegrantes({ nombre: "Habitación 9" }), 0, "Sin lider ni integrantes son cero");
    },
  },
  {
    nombre: "normalizar quita acentos y pasa a minusculas",
    entorno: "ambos",
    ejecutar() {
      igual(normalizar("ESPÍRITU"), "espiritu", "Deberia quedar sin tilde y en minusculas");
      igual(normalizar("  Corazón  "), "corazon", "Deberia recortar los espacios de los bordes");
      igual(normalizar(null), "", "Un valor nulo deberia dar cadena vacia");
    },
  },
  {
    nombre: "textoDeCancion junta el titulo con todas las lineas",
    entorno: "ambos",
    ejecutar() {
      const cancion = {
        titulo: "Derrama",
        bloques: [
          { tipo: "estrofa", lineas: ["Eres poderoso", "No lo puedo explicar"] },
          { tipo: "coro", lineas: ["Soy una vasija esperando ser llena"] },
        ],
      };
      igual(
        textoDeCancion(cancion),
        "Derrama Eres poderoso No lo puedo explicar Soy una vasija esperando ser llena",
        "Deberia concatenar titulo y lineas separados por espacio"
      );
    },
  },
  {
    nombre: "filtrarCanciones encuentra por titulo",
    entorno: "ambos",
    ejecutar() {
      const resultado = filtrarCanciones(CANCIONES_DE_PRUEBA, "poder");
      igual(resultado.map((c) => c.id), ["derrama-tu-poder"], "Solo la segunda tiene 'poder' en el titulo");
    },
  },
  {
    nombre: "filtrarCanciones encuentra por una palabra de la letra",
    entorno: "ambos",
    ejecutar() {
      const resultado = filtrarCanciones(CANCIONES_DE_PRUEBA, "vasija");
      igual(resultado.map((c) => c.id), ["derrama"], "'vasija' solo aparece en la letra de la primera");
    },
  },
  {
    nombre: "filtrarCanciones ignora los acentos de la consulta y de la letra",
    entorno: "ambos",
    ejecutar() {
      const resultado = filtrarCanciones(CANCIONES_DE_PRUEBA, "corazon");
      igual(resultado.map((c) => c.id), ["derrama"], "'corazon' sin tilde deberia hallar 'corazón'");
    },
  },
  {
    nombre: "filtrarCanciones devuelve todo con consulta vacia y nada cuando no hay coincidencia",
    entorno: "ambos",
    ejecutar() {
      igual(filtrarCanciones(CANCIONES_DE_PRUEBA, "").length, 2, "Sin consulta se ven todas");
      igual(filtrarCanciones(CANCIONES_DE_PRUEBA, "   ").length, 2, "Solo espacios equivale a sin consulta");
      igual(filtrarCanciones(CANCIONES_DE_PRUEBA, "zamba").length, 0, "Una palabra ausente no deberia hallar nada");
    },
  },
  {
    nombre: "validarArchivo acepta una imagen dentro del limite",
    entorno: "ambos",
    ejecutar() {
      igual(
        validarArchivo({ type: "image/jpeg", size: 3 * 1024 * 1024 }),
        { valido: true },
        "Un JPEG de 3 MB deberia pasar"
      );
    },
  },
  {
    nombre: "validarArchivo rechaza lo que no es imagen",
    entorno: "ambos",
    ejecutar() {
      const resultado = validarArchivo({ type: "application/pdf", size: 1000 });
      cierto(resultado.valido === false, "Un PDF no deberia pasar");
      cierto(resultado.motivo.includes("imagen"), "El motivo deberia hablar de imagenes");
    },
  },
  {
    nombre: "validarArchivo rechaza mas de 10 MB",
    entorno: "ambos",
    ejecutar() {
      const resultado = validarArchivo({ type: "image/jpeg", size: 11 * 1024 * 1024 });
      cierto(resultado.valido === false, "11 MB supera el limite");
      cierto(resultado.motivo.includes("10 MB"), "El motivo deberia decir cual es el limite");
    },
  },
  {
    nombre: "validarArchivo rechaza la ausencia de archivo",
    entorno: "ambos",
    ejecutar() {
      cierto(validarArchivo(null).valido === false, "Sin archivo no hay nada que subir");
    },
  },
  {
    nombre: "calcularMedidas no agranda una imagen pequeña",
    entorno: "ambos",
    ejecutar() {
      igual(calcularMedidas(800, 600), { ancho: 800, alto: 600 }, "Por debajo del limite se deja igual");
    },
  },
  {
    nombre: "calcularMedidas reduce el lado mayor a 1600 conservando la proporcion",
    entorno: "ambos",
    ejecutar() {
      igual(calcularMedidas(4000, 3000), { ancho: 1600, alto: 1200 }, "Horizontal: manda el ancho");
      igual(calcularMedidas(3000, 4000), { ancho: 1200, alto: 1600 }, "Vertical: manda el alto");
      igual(LADO_MAXIMO, 1600, "El lado maximo deberia ser 1600 px");
    },
  },
  {
    nombre: "conReintento vuelve a intentar una vez antes de rendirse",
    entorno: "ambos",
    async ejecutar() {
      let intentos = 0;
      const resultado = await conReintento(
        async () => {
          intentos += 1;
          if (intentos === 1) throw new Error("fallo pasajero");
          return "listo";
        },
        2,
        1
      );
      igual(resultado, "listo", "El segundo intento deberia funcionar");
      igual(intentos, 2, "Deberia haber intentado exactamente dos veces");

      let siempreFalla = 0;
      await lanza(
        () =>
          conReintento(
            async () => {
              siempreFalla += 1;
              throw new Error("no hay red");
            },
            2,
            1
          ),
        "Si fallan todos los intentos deberia lanzar"
      );
      igual(siempreFalla, 2, "No deberia intentar mas de lo pedido");
    },
  },
  {
    nombre: "comprimir reduce una imagen grande por debajo del lado maximo",
    entorno: "navegador",
    async ejecutar() {
      // Se fabrica una imagen de 2400x1200 en un canvas y se convierte en Blob.
      const lienzo = document.createElement("canvas");
      lienzo.width = 2400;
      lienzo.height = 1200;
      const pincel = lienzo.getContext("2d");
      pincel.fillStyle = "#550b18";
      pincel.fillRect(0, 0, 2400, 1200);
      const original = await new Promise((r) => lienzo.toBlob(r, "image/png"));

      const comprimida = await comprimir(original);
      const mapa = await createImageBitmap(comprimida);

      igual(mapa.width, 1600, "El ancho deberia bajar a 1600");
      igual(mapa.height, 800, "El alto deberia bajar proporcionalmente a 800");
      cierto(comprimida.type === "image/jpeg", "El resultado deberia ser JPEG");
      cierto(comprimida.size < original.size, "La version comprimida deberia pesar menos");
    },
  },
  {
    nombre: "enlaceTelefono deja el numero listo para marcar",
    entorno: "ambos",
    ejecutar() {
      igual(enlaceTelefono("+57 300 000 0000"), "tel:+573000000000", "Deberia quitar los espacios");
      igual(enlaceTelefono("(604) 123-4567"), "tel:6041234567", "Deberia quitar parentesis y guiones");
      igual(enlaceTelefono(""), "", "Sin numero no deberia haber enlace");
    },
  },
  {
    nombre: "cargarConRespaldo devuelve el dato en vivo y lo guarda",
    entorno: "ambos",
    async ejecutar() {
      const almacen = crearAlmacenFalso();
      const resultado = await cargarConRespaldo("clave-1", async () => ({ a: 1 }), almacen);
      igual(resultado, { datos: { a: 1 }, desdeCache: false }, "Deberia devolver el dato en vivo");
      igual(JSON.parse(almacen.getItem("clave-1")), { a: 1 }, "Deberia haber guardado una copia");
    },
  },
  {
    nombre: "cargarConRespaldo usa la copia guardada si falla el dato en vivo",
    entorno: "ambos",
    async ejecutar() {
      const almacen = crearAlmacenFalso();
      almacen.setItem("clave-2", JSON.stringify({ b: 2 }));
      const resultado = await cargarConRespaldo(
        "clave-2",
        async () => { throw new Error("sin_conexion"); },
        almacen
      );
      igual(resultado, { datos: { b: 2 }, desdeCache: true }, "Deberia devolver la copia guardada");
    },
  },
  {
    nombre: "cargarConRespaldo relanza el error si falla y no hay copia guardada",
    entorno: "ambos",
    async ejecutar() {
      const almacen = crearAlmacenFalso();
      const error = await lanza(
        () => cargarConRespaldo("clave-3", async () => { throw new Error("sin_conexion"); }, almacen),
        "Sin copia guardada deberia relanzar"
      );
      igual(error.message, "sin_conexion", "Deberia ser el mismo error original");
    },
  },
  {
    nombre: "cargarConRespaldo tolera un almacen que lanza al guardar o leer",
    entorno: "ambos",
    async ejecutar() {
      const almacenRoto = {
        getItem() { throw new Error("bloqueado"); },
        setItem() { throw new Error("bloqueado"); },
      };
      const resultado = await cargarConRespaldo("clave-4", async () => ({ c: 3 }), almacenRoto);
      igual(resultado, { datos: { c: 3 }, desdeCache: false }, "Un almacen roto no deberia impedir devolver el dato en vivo");
    },
  },
  {
    nombre: "traerDatoVivo devuelve datos cuando el servidor responde ok",
    entorno: "ambos",
    async ejecutar() {
      const traerFalso = async (url) => {
        igual(url, "https://ejemplo.test/exec?recurso=datos&tipo=habitaciones", "Deberia armar la URL con recurso y tipo");
        return { ok: true, status: 200, json: async () => ({ ok: true, datos: [{ nombre: "Habitación 1" }] }) };
      };
      const datos = await traerDatoVivo("habitaciones", traerFalso, "https://ejemplo.test/exec");
      igual(datos, [{ nombre: "Habitación 1" }], "Deberia devolver el arreglo de datos");
    },
  },
  {
    nombre: "traerDatoVivo lanza si el servidor responde ok:false",
    entorno: "ambos",
    async ejecutar() {
      const traerFalso = async () => ({ ok: true, status: 200, json: async () => ({ ok: false, error: "fallo_servidor" }) });
      const error = await lanza(
        () => traerDatoVivo("canciones", traerFalso, "https://ejemplo.test/exec"),
        "ok:false deberia lanzar"
      );
      igual(error.message, "fallo_servidor", "Deberia propagar el codigo de error del servidor");
    },
  },
];
