// casos.js — fuente unica de casos de prueba.
// entorno "ambos": corre en Node y en el navegador.
// entorno "navegador": necesita DOM, canvas o APIs del navegador; Node lo salta.

import { igual, cierto, lanza } from "./afirmar.js";
import { cargarJSON } from "../js/util/datos.js";
import { validarProgramacion } from "../js/programacion.js";
import { contarIntegrantes } from "../js/habitaciones.js";
import { normalizar } from "../js/util/texto.js";
import { filtrarCanciones, textoDeCancion } from "../js/canciones.js";

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
];
