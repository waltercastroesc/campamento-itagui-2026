// casos.js — fuente unica de casos de prueba.
// entorno "ambos": corre en Node y en el navegador.
// entorno "navegador": necesita DOM, canvas o APIs del navegador; Node lo salta.

import { igual, cierto, lanza } from "./afirmar.js";
import { cargarJSON } from "../js/util/datos.js";
import { validarProgramacion } from "../js/programacion.js";
import { contarIntegrantes } from "../js/habitaciones.js";

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
];
