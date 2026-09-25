// casos.js — fuente unica de casos de prueba.
// entorno "ambos": corre en Node y en el navegador.
// entorno "navegador": necesita DOM, canvas o APIs del navegador; Node lo salta.

import { igual, cierto, lanza } from "./afirmar.js";
import { cargarJSON } from "../js/util/datos.js";
import { validarProgramacion } from "../js/programacion.js";
import { contarIntegrantes, buscarHabitacionPorCedula } from "../js/habitaciones.js";
import { validarExperiencia, MAXIMO_CARACTERES } from "../js/experiencias.js";
import { normalizar, aSlug, normalizarCedula } from "../js/util/texto.js";
import { filtrarCanciones, textoDeCancion } from "../js/canciones.js";
import { calcularMedidas, comprimir, validarArchivo, LADO_MAXIMO } from "../js/imagen.js";
import { conReintento } from "../js/util/red.js";
import { cargarConRespaldo, traerDatoVivo } from "../js/util/datosVivos.js";
import { llamarApi, mensajeDeErrorAdmin } from "../js/admin/clave.js";
import {
  agregarHabitacion,
  quitarHabitacion,
  agregarIntegrante,
  quitarIntegrante,
} from "../js/admin/habitaciones-datos.js";
import { agregarBloque, quitarBloque, agregarDia, quitarDia } from "../js/admin/programacion-datos.js";
import {
  generarSlugCancion,
  agregarCancion,
  quitarCancion,
  agregarBloqueLetra,
  quitarBloqueLetra,
  textoALineas,
  lineasATexto,
} from "../js/admin/canciones-datos.js";

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
      const habitacion = {
        nombre: "Habitación 1",
        lider: { nombre: "Ana", cedula: "1", kit: "1" },
        integrantes: [
          { nombre: "Luis", cedula: "2", kit: "2" },
          { nombre: "Sara", cedula: "3", kit: "3" },
        ],
      };
      igual(contarIntegrantes(habitacion), 3, "Dos integrantes mas el lider son tres personas");
    },
  },
  {
    nombre: "contarIntegrantes tolera una habitacion sin datos",
    entorno: "ambos",
    ejecutar() {
      igual(contarIntegrantes({ nombre: "Habitación 9" }), 0, "Sin lider ni integrantes son cero");
      igual(
        contarIntegrantes({ nombre: "Habitación 9", lider: { nombre: "", cedula: "", kit: "" }, integrantes: [] }),
        0,
        "Un lider vacio (recien agregado en el panel) no cuenta como persona"
      );
    },
  },
  {
    nombre: "buscarHabitacionPorCedula encuentra a un integrante sin importar puntos ni espacios",
    entorno: "ambos",
    ejecutar() {
      const habitaciones = [
        {
          nombre: "Habitación 1",
          lider: { nombre: "Ana", cedula: "1000000001", kit: "1" },
          integrantes: [
            { nombre: "Luis", cedula: "1000000002", kit: "2" },
            { nombre: "Sara", cedula: "1000000003", kit: "3" },
          ],
        },
        {
          nombre: "Habitación 2",
          lider: { nombre: "María José", cedula: "1000000004", kit: "4" },
          integrantes: [{ nombre: "Andrés", cedula: "1.000.000.005", kit: "5" }],
        },
      ];
      igual(buscarHabitacionPorCedula(habitaciones, "1000000005"), 1, "Deberia encontrar a Andrés sin los puntos");
      igual(buscarHabitacionPorCedula(habitaciones, "1.000.000.003"), 0, "Deberia encontrar a Sara aunque se busque con puntos");
    },
  },
  {
    nombre: "buscarHabitacionPorCedula tambien busca por la cedula del lider",
    entorno: "ambos",
    ejecutar() {
      const habitaciones = [
        { nombre: "Habitación 1", lider: { nombre: "María José", cedula: "1000000009", kit: "1" }, integrantes: [] },
      ];
      igual(buscarHabitacionPorCedula(habitaciones, "1000000009"), 0, "Deberia encontrar al lider por su cedula");
    },
  },
  {
    nombre: "buscarHabitacionPorCedula devuelve -1 si no hay coincidencia o la busqueda esta vacia",
    entorno: "ambos",
    ejecutar() {
      const habitaciones = [
        {
          nombre: "Habitación 1",
          lider: { nombre: "Ana", cedula: "1000000001", kit: "1" },
          integrantes: [{ nombre: "Luis", cedula: "1000000002", kit: "2" }],
        },
      ];
      igual(buscarHabitacionPorCedula(habitaciones, "999"), -1, "Esa cedula no esta en la lista");
      igual(buscarHabitacionPorCedula(habitaciones, "   "), -1, "Una busqueda vacia no encuentra nada");
    },
  },
  {
    nombre: "normalizarCedula deja solo los digitos",
    entorno: "ambos",
    ejecutar() {
      igual(normalizarCedula("1.042.265.174"), "1042265174", "Deberia quitar los puntos");
      igual(normalizarCedula("  1042 265 174  "), "1042265174", "Deberia quitar los espacios");
      igual(normalizarCedula(""), "", "Vacio sigue vacio");
    },
  },
  {
    nombre: "validarExperiencia rechaza un texto vacio",
    entorno: "ambos",
    ejecutar() {
      const revision = validarExperiencia("   ");
      cierto(revision.valida === false, "Un texto solo de espacios no es valido");
    },
  },
  {
    nombre: "validarExperiencia rechaza un texto mas largo que el maximo",
    entorno: "ambos",
    ejecutar() {
      const revision = validarExperiencia("a".repeat(MAXIMO_CARACTERES + 1));
      cierto(revision.valida === false, "Un texto mas largo que el maximo no es valido");
    },
  },
  {
    nombre: "validarExperiencia acepta un texto normal",
    entorno: "ambos",
    ejecutar() {
      const revision = validarExperiencia("Fue el mejor fin de semana de mi vida.");
      cierto(revision.valida === true, "Un texto normal, dentro del limite, es valido");
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
  {
    nombre: "aSlug convierte un titulo en un identificador de una sola palabra",
    entorno: "ambos",
    ejecutar() {
      igual(aSlug("Derrama tu poder"), "derrama-tu-poder", "Deberia usar guiones y minusculas");
      igual(aSlug("¡Corazón Nuevo!"), "corazon-nuevo", "Deberia quitar acentos y signos");
      igual(aSlug("  Espacios   raros  "), "espacios-raros", "Deberia colapsar espacios y recortar bordes");
    },
  },
  {
    nombre: "llamarApi devuelve el cuerpo cuando el servidor responde ok",
    entorno: "ambos",
    async ejecutar() {
      let cuerpoEnviado;
      const traerFalso = async (url, opciones) => {
        cuerpoEnviado = JSON.parse(opciones.body);
        return { ok: true, status: 200, json: async () => ({ ok: true, datos: [1, 2] }) };
      };
      const resultado = await llamarApi("guardarHabitaciones", [{ nombre: "X" }], "clave-1", traerFalso);
      igual(resultado, { ok: true, datos: [1, 2] }, "Deberia devolver el cuerpo completo");
      igual(
        cuerpoEnviado,
        { accion: "guardarHabitaciones", clave: "clave-1", datos: [{ nombre: "X" }] },
        "Deberia enviar accion, clave y datos"
      );
    },
  },
  {
    nombre: "llamarApi lanza con el codigo de error del servidor",
    entorno: "ambos",
    async ejecutar() {
      const traerFalso = async () => ({ ok: true, status: 200, json: async () => ({ ok: false, error: "clave_incorrecta" }) });
      const error = await lanza(
        () => llamarApi("verificarClave", null, "mala", traerFalso),
        "Deberia lanzar cuando ok es falso"
      );
      igual(error.message, "clave_incorrecta", "Deberia propagar el codigo exacto");
    },
  },
  {
    nombre: "llamarApi lanza sin_conexion si falla la peticion",
    entorno: "ambos",
    async ejecutar() {
      const traerFalso = async () => { throw new TypeError("Failed to fetch"); };
      const error = await lanza(
        () => llamarApi("guardarCanciones", [], "clave-1", traerFalso),
        "Un fallo de red deberia lanzar sin_conexion"
      );
      igual(error.message, "sin_conexion", "Deberia normalizar el error de red");
    },
  },
  {
    nombre: "mensajeDeErrorAdmin traduce los codigos conocidos",
    entorno: "ambos",
    ejecutar() {
      igual(mensajeDeErrorAdmin(new Error("clave_incorrecta")), "Contraseña incorrecta.", "Deberia traducir clave_incorrecta");
      igual(
        mensajeDeErrorAdmin(new Error("sin_conexion")),
        "No pudimos guardar los cambios. Verifica tu conexión e inténtalo de nuevo.",
        "Deberia traducir sin_conexion"
      );
      igual(
        mensajeDeErrorAdmin(new Error("codigo-desconocido")),
        "No pudimos guardar los cambios. Verifica tu conexión e inténtalo de nuevo.",
        "Un codigo desconocido deberia caer en el mensaje generico"
      );
    },
  },
  {
    nombre: "agregarHabitacion añade una habitacion vacia al final",
    entorno: "ambos",
    ejecutar() {
      const original = { nombre: "Habitación 1", lider: { nombre: "", cedula: "", kit: "" }, integrantes: [] };
      const resultado = agregarHabitacion([original]);
      igual(resultado.length, 2, "Deberia haber dos habitaciones");
      igual(
        resultado[1],
        { nombre: "", lider: { nombre: "", cedula: "", kit: "" }, integrantes: [] },
        "La nueva deberia estar vacia, con el lider como objeto vacio"
      );
      igual(resultado[0].nombre, "Habitación 1", "La primera no deberia cambiar");
    },
  },
  {
    nombre: "quitarHabitacion elimina por indice sin mutar el arreglo original",
    entorno: "ambos",
    ejecutar() {
      const original = [{ nombre: "A" }, { nombre: "B" }, { nombre: "C" }];
      const resultado = quitarHabitacion(original, 1);
      igual(resultado.map((h) => h.nombre), ["A", "C"], "Deberia quitar solo la del medio");
      igual(original.length, 3, "El arreglo original no deberia mutarse");
    },
  },
  {
    nombre: "agregarIntegrante añade una persona vacia a una habitacion",
    entorno: "ambos",
    ejecutar() {
      const ana = { nombre: "Ana", cedula: "1", kit: "1" };
      const habitacion = { nombre: "H1", lider: { nombre: "", cedula: "", kit: "" }, integrantes: [ana] };
      const resultado = agregarIntegrante(habitacion);
      igual(
        resultado.integrantes,
        [ana, { nombre: "", cedula: "", kit: "" }],
        "Deberia agregar una persona vacia al final"
      );
      igual(habitacion.integrantes, [ana], "La habitacion original no deberia mutarse");
    },
  },
  {
    nombre: "quitarIntegrante elimina por indice",
    entorno: "ambos",
    ejecutar() {
      const habitacion = {
        nombre: "H1",
        lider: { nombre: "", cedula: "", kit: "" },
        integrantes: [
          { nombre: "Ana", cedula: "1", kit: "1" },
          { nombre: "Luis", cedula: "2", kit: "2" },
          { nombre: "Sara", cedula: "3", kit: "3" },
        ],
      };
      const resultado = quitarIntegrante(habitacion, 0);
      igual(
        resultado.integrantes.map((p) => p.nombre),
        ["Luis", "Sara"],
        "Deberia quitar el primero"
      );
    },
  },
  {
    nombre: "agregarBloque añade un bloque vacio al final del dia",
    entorno: "ambos",
    ejecutar() {
      const dia = { dia: "Viernes", numero: 1, bloques: [{ hora: "5:00 PM", actividad: "Salida" }] };
      const resultado = agregarBloque(dia);
      igual(resultado.bloques.length, 2, "Deberia haber dos bloques");
      igual(resultado.bloques[1], { hora: "", actividad: "" }, "El nuevo deberia estar vacio");
      igual(dia.bloques.length, 1, "El dia original no deberia mutarse");
    },
  },
  {
    nombre: "quitarBloque elimina por indice",
    entorno: "ambos",
    ejecutar() {
      const dia = {
        dia: "Sábado",
        numero: 2,
        bloques: [
          { hora: "6:00 AM", actividad: "Alborada" },
          { hora: "8:00 AM", actividad: "Desayuno" },
        ],
      };
      const resultado = quitarBloque(dia, 0);
      igual(resultado.bloques, [{ hora: "8:00 AM", actividad: "Desayuno" }], "Deberia quedar solo el segundo");
    },
  },
  {
    nombre: "agregarDia añade un dia vacio al final con un bloque para empezar",
    entorno: "ambos",
    ejecutar() {
      const dias = [{ dia: "Viernes", numero: 1, bloques: [{ hora: "5:00 PM", actividad: "Salida" }] }];
      const resultado = agregarDia(dias);
      igual(resultado.length, 2, "Deberia haber dos dias");
      igual(
        resultado[1],
        { dia: "", numero: 2, bloques: [{ hora: "", actividad: "" }] },
        "El dia nuevo deberia traer un bloque vacio para empezar a escribir"
      );
      igual(dias.length, 1, "El arreglo original no deberia mutarse");
    },
  },
  {
    nombre: "quitarDia elimina por indice",
    entorno: "ambos",
    ejecutar() {
      const dias = [{ dia: "Viernes" }, { dia: "Sábado" }, { dia: "Domingo" }];
      const resultado = quitarDia(dias, 1);
      igual(resultado.map((d) => d.dia), ["Viernes", "Domingo"], "Deberia quitar solo el del medio");
    },
  },
  {
    nombre: "generarSlugCancion usa el slug del titulo si esta libre",
    entorno: "ambos",
    ejecutar() {
      igual(generarSlugCancion("Nueva canción", []), "nueva-cancion", "Deberia ser el slug simple");
    },
  },
  {
    nombre: "generarSlugCancion agrega un sufijo si el slug ya existe",
    entorno: "ambos",
    ejecutar() {
      const existentes = [{ id: "derrama" }, { id: "derrama-2" }];
      igual(generarSlugCancion("Derrama", existentes), "derrama-3", "Deberia probar sufijos hasta encontrar uno libre");
    },
  },
  {
    nombre: "agregarCancion añade una cancion nueva con id generado y un bloque vacio",
    entorno: "ambos",
    ejecutar() {
      const resultado = agregarCancion([], "Mi canción", 3, true);
      igual(resultado.length, 1, "Deberia haber una cancion");
      igual(
        resultado[0],
        { id: "mi-cancion", titulo: "Mi canción", numero: 3, lema: true, bloques: [{ tipo: "estrofa", lineas: [] }] },
        "Deberia traer un bloque de estrofa vacio para empezar a escribir"
      );
    },
  },
  {
    nombre: "quitarCancion elimina por indice",
    entorno: "ambos",
    ejecutar() {
      const original = [{ id: "a" }, { id: "b" }];
      igual(quitarCancion(original, 0).map((c) => c.id), ["b"], "Deberia quedar solo la segunda");
    },
  },
  {
    nombre: "agregarBloqueLetra añade una estrofa vacia al final",
    entorno: "ambos",
    ejecutar() {
      const cancion = { id: "x", titulo: "X", bloques: [{ tipo: "coro", lineas: ["Solo esto"] }] };
      const resultado = agregarBloqueLetra(cancion);
      igual(resultado.bloques.length, 2, "Deberia haber dos bloques");
      igual(resultado.bloques[1], { tipo: "estrofa", lineas: [] }, "El nuevo deberia ser una estrofa vacia");
    },
  },
  {
    nombre: "quitarBloqueLetra elimina por indice",
    entorno: "ambos",
    ejecutar() {
      const cancion = {
        id: "x",
        bloques: [
          { tipo: "estrofa", lineas: ["Uno"] },
          { tipo: "coro", lineas: ["Dos"] },
        ],
      };
      const resultado = quitarBloqueLetra(cancion, 1);
      igual(resultado.bloques, [{ tipo: "estrofa", lineas: ["Uno"] }], "Deberia quedar solo la estrofa");
    },
  },
  {
    nombre: "textoALineas separa por saltos de linea y descarta lineas vacias",
    entorno: "ambos",
    ejecutar() {
      igual(
        textoALineas("Primera línea\n\n  Segunda línea  \n"),
        ["Primera línea", "Segunda línea"],
        "Deberia recortar espacios y descartar lineas en blanco"
      );
      igual(textoALineas(""), [], "Un texto vacio deberia dar un arreglo vacio");
    },
  },
  {
    nombre: "lineasATexto une las lineas con saltos de linea",
    entorno: "ambos",
    ejecutar() {
      igual(lineasATexto(["Uno", "Dos", "Tres"]), "Uno\nDos\nTres", "Deberia unir con saltos de linea");
    },
  },
];
