# Panel de administración — Plan de implementación

> **Para agentes ejecutores:** SUB-SKILL REQUERIDA: usa `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para implementar este plan tarea por tarea.

**Objetivo:** dar al liderazgo un panel web (`admin.html`) para editar habitaciones, programación y canciones sin tocar código, con los datos viviendo en Google Sheets y el sitio público leyéndolos en vivo con respaldo local.

**Arquitectura:** se extiende el `apps-script/Codigo.gs` ya existente (mismo Apps Script de las fotos) con lectura pública de datos y escritura protegida por contraseña. El sitio público cambia de dónde lee tres secciones (habitaciones, programación, canciones) pero no cómo las pinta. Un panel nuevo (`admin.html` + `js/admin/*.js`) escribe esos datos.

**Especificación de origen:** `docs/superpowers/specs/2026-09-10-panel-administracion-design.md`

---

## Restricciones globales

- Todo en español: contenido, nombres, comentarios, mensajes de error (qué pasó y qué hacer).
- Paleta cerrada: `--vino`, `--crema`, `--hueso` (de `css/tokens.css`, ya existen). El panel reutiliza esos tokens.
- Sin dependencias externas ni CDN. Sin paso de compilación.
- Aislamiento: un módulo de `js/admin/` no importa de otro módulo de sección pública (`habitaciones.js`, etc.) ni viceversa. Solo importa de `js/util/`, `js/config.js` y de otros módulos dentro de `js/admin/`.
- `innerHTML` solo con cadena vacía para limpiar; el contenido de datos siempre por `textContent`/`createElement`.
- Pruebas: se agregan a los mismos `pruebas/afirmar.js` / `pruebas/casos.js` / `pruebas/ejecutar-en-node.js` / `pruebas.html` que ya existen. Mismo formato de caso `{ nombre, entorno, ejecutar }`.
- Commits en español, `tipo: descripción`.
- El `id` de la carpeta de Drive (`1p-ykfs2etU-lzjuuQkesMDApvR9PC0Tb`) y la contraseña del panel viven solo en `apps-script/Codigo.gs` / `PropertiesService`, nunca en el código público del sitio.

### Decisión tomada al planificar

**Los campos de texto simples (nombre, líder, hora, actividad, título, número, tipo de bloque) no tienen función pura dedicada.** El diseño (§9) pide probar "las funciones que agregan/quitan una fila" — eso son `agregarHabitacion`, `quitarHabitacion`, `agregarIntegrante`, `quitarIntegrante`, `agregarBloque`, `quitarBloque`, `agregarCancion`, `quitarCancion`, `agregarBloqueLetra`, `quitarBloqueLetra`, y la conversión de texto a líneas. Una edición de un campo de texto (`habitacion.nombre = valor`) es una asignación de una línea sin lógica que probar; extraerla a una función pura sería una prueba que solo repite `igual(f(x, v), {...x, campo: v})` sin valor real. Se mutan directamente en el manejador de evento del panel, sobre una copia local del arreglo que se envía completa al guardar.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `js/util/datosVivos.js` | `cargarConRespaldo` (con localStorage) y `traerDatoVivo` (GET al Apps Script). Usado por las tres secciones públicas. |
| `js/util/texto.js` | Ya existe (`normalizar`); se agrega `aSlug`. |
| `js/habitaciones.js` | Modificado: lee en vivo con respaldo en vez de JSON fijo. |
| `js/programacion.js` | Modificado: ídem. |
| `js/canciones.js` | Modificado: ídem. |
| `js/galeria.js` | Modificado: el `POST` de subida ahora incluye `accion: "subirFoto"`. |
| `apps-script/Codigo.gs` | Modificado: `doGet`/`doPost` con `recurso`/`accion`, lectura y escritura de Sheets, `configurarPanel()`, `establecerClave()`. |
| `admin.html` | Página del panel: entrada de contraseña + monta las tres secciones de edición. |
| `css/admin.css` | Estilos del panel (formularios, listas editables). |
| `js/admin/clave.js` | Sesión de la contraseña + `llamarApi` + mensajes de error del panel. |
| `js/admin/habitaciones-datos.js` | Funciones puras: agregar/quitar habitación e integrante. |
| `js/admin/habitaciones-panel.js` | DOM y cableado de la sección Habitaciones del panel. |
| `js/admin/programacion-datos.js` | Funciones puras: agregar/quitar bloque de horario. |
| `js/admin/programacion-panel.js` | DOM y cableado de la sección Programación del panel. |
| `js/admin/canciones-datos.js` | Funciones puras: slug, agregar/quitar canción y bloque de letra, texto↔líneas. |
| `js/admin/canciones-panel.js` | DOM y cableado de la sección Canciones del panel. |
| `js/admin/principal-admin.js` | Monta el panel: pide contraseña, luego las tres secciones. |
| `README.md` | Modificado: cómo configurar el panel. |
| `VERIFICACION.md` | Modificado: pendientes del panel. |

---

## Tarea 1: Carga en vivo con respaldo local

Lo que usan las tres secciones públicas para leer datos sin depender por completo de la red.

**Archivos:**
- Crear: `campamento-2026/js/util/datosVivos.js`
- Modificar: `campamento-2026/pruebas/casos.js`

**Interfaces:**
- Produce: `cargarConRespaldo(clave, traerEnVivo, almacen = globalThis.localStorage) -> Promise<{datos, desdeCache}>`. Si `traerEnVivo()` tiene éxito, guarda el resultado en `almacen` bajo `clave` y devuelve `{datos, desdeCache:false}`. Si falla, intenta leer `clave` de `almacen`; si existe, devuelve `{datos, desdeCache:true}`; si no, relanza el error de `traerEnVivo()`.
- Produce: `traerDatoVivo(tipo, traer = fetch, urlBase = CONFIG.urlAppsScript) -> Promise<any>`. Pide `${urlBase}?recurso=datos&tipo=${tipo}`; lanza si la respuesta no es `ok` o si `cuerpo.ok` es falso; devuelve `cuerpo.datos`. El tercer parámetro existe solo para poder probar la función sin depender del valor real de `CONFIG`.

- [ ] **Paso 1: Escribir los casos que fallan**

Añade a `pruebas/casos.js`, junto a los demás imports:

```js
import { cargarConRespaldo, traerDatoVivo } from "../js/util/datosVivos.js";
```

Y estos seis casos al final del array `casos`:

```js
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
```

Y esta función auxiliar de prueba justo antes de `export const casos`:

```js
/** Un almacen tipo localStorage, pero en memoria, para no depender del navegador. */
function crearAlmacenFalso() {
  const mapa = new Map();
  return {
    getItem: (clave) => (mapa.has(clave) ? mapa.get(clave) : null),
    setItem: (clave, valor) => mapa.set(clave, valor),
  };
}
```

Nota: el caso de `traerDatoVivo` pasa una URL como tercer argumento porque la función necesita saber la URL base sin depender de `CONFIG` importado con un valor fijo; ver la firma real en el Paso 3.

- [ ] **Paso 2: Correr las pruebas y verificar que fallan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `Cannot find module` apuntando a `js/util/datosVivos.js`.

- [ ] **Paso 3: Escribir `js/util/datosVivos.js`**

```js
// datosVivos.js — dato en vivo con respaldo en localStorage para senal irregular.

import { CONFIG } from "../config.js";

/**
 * Intenta traer el dato en vivo; si falla, usa la ultima copia guardada en
 * este dispositivo. Si no hay ninguna copia guardada, propaga el error para
 * que la seccion muestre su aviso de siempre.
 */
export async function cargarConRespaldo(clave, traerEnVivo, almacen = globalThis.localStorage) {
  try {
    const datos = await traerEnVivo();
    guardarEnAlmacen(almacen, clave, datos);
    return { datos, desdeCache: false };
  } catch (errorEnVivo) {
    const guardado = leerDeAlmacen(almacen, clave);
    if (guardado === null) throw errorEnVivo;
    return { datos: guardado, desdeCache: true };
  }
}

function guardarEnAlmacen(almacen, clave, datos) {
  try {
    almacen?.setItem(clave, JSON.stringify(datos));
  } catch {
    // Sin espacio o almacenamiento bloqueado: no es motivo para fallar la carga.
  }
}

function leerDeAlmacen(almacen, clave) {
  try {
    const crudo = almacen?.getItem(clave);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

/** Pide un recurso de datos en vivo al Apps Script. Lanza si la respuesta no es valida. */
export async function traerDatoVivo(tipo, traer = fetch, urlBase = CONFIG.urlAppsScript) {
  const url = `${urlBase}?recurso=datos&tipo=${encodeURIComponent(tipo)}`;
  const respuesta = await traer(url, { cache: "no-cache" });
  if (!respuesta.ok) throw new Error(`No se pudo leer ${tipo} (estado ${respuesta.status})`);
  const cuerpo = await respuesta.json();
  if (!cuerpo.ok) throw new Error(cuerpo.error || "fallo_servidor");
  return cuerpo.datos;
}
```

- [ ] **Paso 4: Correr las pruebas y verificar que pasan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `30 pasaron, 0 fallaron, 1 solo navegador` (24 anteriores + 6 nuevos).

- [ ] **Paso 5: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026/js/util/datosVivos.js campamento-2026/pruebas/casos.js
git commit -m "feat: carga de datos en vivo con respaldo en localStorage"
```

---

## Tarea 2: `aSlug` para identificar canciones nuevas

**Archivos:**
- Modificar: `campamento-2026/js/util/texto.js`
- Modificar: `campamento-2026/pruebas/casos.js`

**Interfaces:**
- Produce: `aSlug(texto) -> string`. Minúsculas, sin acentos (reutiliza `normalizar`), espacios y símbolos convertidos a un solo guion, sin guiones al principio o al final.

- [ ] **Paso 1: Escribir los casos que fallan**

Añade a `pruebas/casos.js`:

```js
import { normalizar, aSlug } from "../js/util/texto.js";
```

(Reemplaza la línea `import { normalizar } from "../js/util/texto.js";` ya existente por esta.)

```js
  {
    nombre: "aSlug convierte un titulo en un identificador de una sola palabra",
    entorno: "ambos",
    ejecutar() {
      igual(aSlug("Derrama tu poder"), "derrama-tu-poder", "Deberia usar guiones y minusculas");
      igual(aSlug("¡Corazón Nuevo!"), "corazon-nuevo", "Deberia quitar acentos y signos");
      igual(aSlug("  Espacios   raros  "), "espacios-raros", "Deberia colapsar espacios y recortar bordes");
    },
  },
```

- [ ] **Paso 2: Correr las pruebas y verificar que fallan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: falla porque `aSlug` no existe todavía.

- [ ] **Paso 3: Añadir `aSlug` a `js/util/texto.js`**

Añade al final del archivo (después de `normalizar`):

```js

/** Identificador de una sola palabra a partir de un titulo: minusculas, sin acentos, con guiones. */
export function aSlug(texto) {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

- [ ] **Paso 4: Correr las pruebas y verificar que pasan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `31 pasaron, 0 fallaron, 1 solo navegador`.

- [ ] **Paso 5: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026/js/util/texto.js campamento-2026/pruebas/casos.js
git commit -m "feat: aSlug para generar el id de canciones nuevas"
```

---

## Tarea 3: Habitaciones lee en vivo con respaldo

**Archivos:**
- Modificar: `campamento-2026/js/habitaciones.js`
- Modificar: `campamento-2026/css/base.css`

**Interfaces:**
- Consume: `cargarConRespaldo`, `traerDatoVivo` de la Tarea 1; `cargarJSON`, `montarSeccion` de `js/util/datos.js`; `CONFIG` de `js/config.js`.
- `contarIntegrantes` no cambia de firma (sigue exportada, sigue pura).

- [ ] **Paso 1: Reemplazar el bloque de carga e inicio**

En `campamento-2026/js/habitaciones.js`, reemplaza:

```js
import { cargarJSON, montarSeccion } from "./util/datos.js";

/** Personas de una habitacion, contando al lider. Funcion pura. */
export function contarIntegrantes(habitacion) {
  const integrantes = Array.isArray(habitacion?.integrantes) ? habitacion.integrantes.length : 0;
  const lider = habitacion?.lider ? 1 : 0;
  return integrantes + lider;
}

export function iniciar(contenedor) {
  return montarSeccion(
    contenedor,
    () => cargarJSON("datos/habitaciones.json"),
    pintarHabitaciones
  );
}

function pintarHabitaciones(contenedor, habitaciones) {
```

por:

```js
import { cargarJSON, montarSeccion } from "./util/datos.js";
import { cargarConRespaldo, traerDatoVivo } from "./util/datosVivos.js";
import { CONFIG } from "./config.js";

/** Personas de una habitacion, contando al lider. Funcion pura. */
export function contarIntegrantes(habitacion) {
  const integrantes = Array.isArray(habitacion?.integrantes) ? habitacion.integrantes.length : 0;
  const lider = habitacion?.lider ? 1 : 0;
  return integrantes + lider;
}

export function iniciar(contenedor) {
  return montarSeccion(contenedor, cargarHabitaciones, pintarHabitaciones);
}

/**
 * Mientras no haya Apps Script configurado (desarrollo local), usa el JSON
 * de ejemplo. Una vez configurado, lee en vivo con respaldo en el dispositivo.
 */
async function cargarHabitaciones() {
  if (!CONFIG.urlAppsScript) {
    const lista = await cargarJSON("datos/habitaciones.json");
    return { lista, desdeCache: false };
  }
  const { datos: lista, desdeCache } = await cargarConRespaldo(
    "campamento2026:habitaciones",
    () => traerDatoVivo("habitaciones")
  );
  return { lista, desdeCache };
}

function pintarHabitaciones(contenedor, { lista: habitaciones, desdeCache }) {
```

- [ ] **Paso 2: Añadir el aviso de "mostrando la última versión guardada"**

Dentro de la misma función `pintarHabitaciones`, justo después de:

```js
  const titulo = document.createElement("h2");
  titulo.className = "seccion__titulo";
  titulo.id = "titulo-habitaciones";
  titulo.textContent = "Conoce tu habitación";
```

añade:

```js

  if (desdeCache) {
    const aviso = document.createElement("p");
    aviso.className = "aviso-cache";
    aviso.textContent = "Mostrando la última versión guardada en este dispositivo — puede no estar actualizada.";
    envoltorio.append(aviso);
  }
```

(El resto de la función sigue igual: `envoltorio.append(titulo, rejilla)` etc.)

- [ ] **Paso 3: Añadir la clase `.aviso-cache` a `css/base.css`**

Añade al final del archivo:

```css

/* Aviso discreto cuando una seccion muestra una copia local, no el dato en vivo. */
.aviso-cache {
  text-align: center;
  font-size: var(--txt-menor);
  opacity: 0.75;
  margin-bottom: var(--esp-3);
}
```

- [ ] **Paso 4: Correr las pruebas**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `31 pasaron, 0 fallaron, 1 solo navegador` (sin cambios: `contarIntegrantes` no se tocó).

- [ ] **Paso 5: Verificar en el navegador que el modo de desarrollo sigue igual**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && python -m http.server 8000
```

Con `js/config.js` todavía con `urlAppsScript: ""`, abre `http://localhost:8000/` y confirma que la sección Habitaciones se ve exactamente igual que antes (contenido de `datos/habitaciones.json`, sin el aviso de caché).

- [ ] **Paso 6: Verificar el aviso de caché con un Apps Script simulado**

Con el sitio servido, pega esto en la consola del navegador para simular que `CONFIG.urlAppsScript` está configurado pero la red falla, y que ya hay una copia guardada:

```js
localStorage.setItem("campamento2026:habitaciones", JSON.stringify([{ nombre: "Copia guardada", lider: "", integrantes: [] }]));
const modulo = await import("./js/habitaciones.js");
const contenedor = document.querySelector("#habitaciones");
const configModulo = await import("./js/config.js");
configModulo.CONFIG.urlAppsScript = "https://no-existe.invalido/exec";
await modulo.iniciar(contenedor);
```

Esperado: la sección muestra "Copia guardada" con el aviso discreto de caché encima. Recarga la página después para limpiar el estado de la prueba.

- [ ] **Paso 7: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026/js/habitaciones.js campamento-2026/css/base.css
git commit -m "feat: habitaciones lee en vivo con respaldo local"
```

---

## Tarea 4: Programación lee en vivo con respaldo

**Archivos:**
- Modificar: `campamento-2026/js/programacion.js`

**Interfaces:**
- `validarProgramacion` no cambia de firma.

- [ ] **Paso 1: Reemplazar el bloque de carga e inicio**

En `campamento-2026/js/programacion.js`, reemplaza:

```js
import { cargarJSON, montarSeccion } from "./util/datos.js";
```

por:

```js
import { cargarJSON, montarSeccion } from "./util/datos.js";
import { cargarConRespaldo, traerDatoVivo } from "./util/datosVivos.js";
import { CONFIG } from "./config.js";
```

Luego reemplaza:

```js
export function iniciar(contenedor) {
  return montarSeccion(
    contenedor,
    async () => {
      const datos = await cargarJSON("datos/programacion.json");
      const revision = validarProgramacion(datos);
      if (!revision.valida) throw new Error(revision.motivo);
      return datos;
    },
    pintarProgramacion
  );
}

function pintarProgramacion(contenedor, dias) {
```

por:

```js
export function iniciar(contenedor) {
  return montarSeccion(contenedor, cargarProgramacion, pintarProgramacion);
}

async function cargarProgramacion() {
  let lista;
  let desdeCache = false;
  if (!CONFIG.urlAppsScript) {
    lista = await cargarJSON("datos/programacion.json");
  } else {
    const resultado = await cargarConRespaldo(
      "campamento2026:programacion",
      () => traerDatoVivo("programacion")
    );
    lista = resultado.datos;
    desdeCache = resultado.desdeCache;
  }
  const revision = validarProgramacion(lista);
  if (!revision.valida) throw new Error(revision.motivo);
  return { lista, desdeCache };
}

function pintarProgramacion(contenedor, { lista: dias, desdeCache }) {
```

- [ ] **Paso 2: Añadir el aviso de caché**

Dentro de `pintarProgramacion`, justo después de:

```js
  titulo.textContent = "Programación";
  envoltorio.append(titulo);
```

añade:

```js

  if (desdeCache) {
    const aviso = document.createElement("p");
    aviso.className = "aviso-cache";
    aviso.textContent = "Mostrando la última versión guardada en este dispositivo — puede no estar actualizada.";
    envoltorio.append(aviso);
  }
```

- [ ] **Paso 3: Correr las pruebas**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `31 pasaron, 0 fallaron, 1 solo navegador`.

- [ ] **Paso 4: Verificar en el navegador**

Con `urlAppsScript: ""`, la Programación se ve exactamente igual que antes. Repite la simulación del Paso 6 de la Tarea 3 pero con `"campamento2026:programacion"` y un arreglo válido de programación, para confirmar el aviso de caché.

- [ ] **Paso 5: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026/js/programacion.js
git commit -m "feat: programacion lee en vivo con respaldo local"
```

---

## Tarea 5: Canciones lee en vivo con respaldo

**Archivos:**
- Modificar: `campamento-2026/js/canciones.js`

**Interfaces:**
- `textoDeCancion`, `filtrarCanciones` no cambian de firma.

- [ ] **Paso 1: Reemplazar el bloque de carga e inicio**

En `campamento-2026/js/canciones.js`, reemplaza:

```js
import { normalizar } from "./util/texto.js";
import { cargarJSON, montarSeccion } from "./util/datos.js";
```

por:

```js
import { normalizar } from "./util/texto.js";
import { cargarJSON, montarSeccion } from "./util/datos.js";
import { cargarConRespaldo, traerDatoVivo } from "./util/datosVivos.js";
import { CONFIG } from "./config.js";
```

Luego reemplaza:

```js
export function iniciar(contenedor) {
  return montarSeccion(
    contenedor,
    () => cargarJSON("datos/canciones.json"),
    pintarCanciones
  );
}

function pintarCanciones(contenedor, canciones) {
```

por:

```js
export function iniciar(contenedor) {
  return montarSeccion(contenedor, cargarCanciones, pintarCanciones);
}

async function cargarCanciones() {
  if (!CONFIG.urlAppsScript) {
    const lista = await cargarJSON("datos/canciones.json");
    return { lista, desdeCache: false };
  }
  const { datos: lista, desdeCache } = await cargarConRespaldo(
    "campamento2026:canciones",
    () => traerDatoVivo("canciones")
  );
  return { lista, desdeCache };
}

function pintarCanciones(contenedor, { lista: canciones, desdeCache }) {
```

- [ ] **Paso 2: Añadir el aviso de caché**

Dentro de `pintarCanciones`, justo después de:

```js
  titulo.textContent = "Canciones";
```

añade:

```js

  const avisoCache = desdeCache ? document.createElement("p") : null;
  if (avisoCache) {
    avisoCache.className = "aviso-cache";
    avisoCache.textContent = "Mostrando la última versión guardada en este dispositivo — puede no estar actualizada.";
  }
```

Y en la línea final de la función, reemplaza:

```js
  envoltorio.append(titulo, etiquetaBuscador, aviso, libro);
```

por:

```js
  envoltorio.append(titulo);
  if (avisoCache) envoltorio.append(avisoCache);
  envoltorio.append(etiquetaBuscador, aviso, libro);
```

- [ ] **Paso 3: Correr las pruebas**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `31 pasaron, 0 fallaron, 1 solo navegador`.

- [ ] **Paso 4: Verificar en el navegador**

Con `urlAppsScript: ""`, Canciones se ve exactamente igual que antes (buscador, insignias, modo pantalla completa). Repite la simulación del Paso 6 de la Tarea 3 con `"campamento2026:canciones"` para confirmar el aviso.

- [ ] **Paso 5: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026/js/canciones.js
git commit -m "feat: canciones lee en vivo con respaldo local"
```

---

## Tarea 6: Apps Script — lectura pública de datos y `accion` explícita en fotos

Extiende `Codigo.gs` para servir habitaciones/programación/canciones desde Sheets (lectura, sin contraseña) y ordena el `doPost` de fotos con un `accion` explícito, aprovechando que el Apps Script de fotos todavía no está publicado en producción (especificación original §11).

**Archivos:**
- Modificar: `campamento-2026/apps-script/Codigo.gs`
- Modificar: `campamento-2026/js/galeria.js`

**Interfaces:**
- Produce en `Codigo.gs`: `doGet(e)` que enruta por `e.parameter.recurso` (`"fotos"` por defecto, o `"datos"` con `e.parameter.tipo` en `habitaciones|programacion|canciones`).
- Produce en `Codigo.gs`: `doPost(e)` que exige `cuerpo.accion === "subirFoto"` para el flujo de fotos.

- [ ] **Paso 1: Actualizar el `POST` de subida en `js/galeria.js`**

En `campamento-2026/js/galeria.js`, dentro de `procesarUna`, reemplaza:

```js
    return subirFoto(
      { nombre: archivo.name, mime: "image/jpeg", datos, autor },
      (fraccion) => {
        relleno.style.width = `${Math.round(fraccion * 100)}%`;
      }
    );
```

por:

```js
    return subirFoto(
      { accion: "subirFoto", nombre: archivo.name, mime: "image/jpeg", datos, autor },
      (fraccion) => {
        relleno.style.width = `${Math.round(fraccion * 100)}%`;
      }
    );
```

- [ ] **Paso 2: Actualizar `listarFotos` para pedir el recurso explícito**

En `campamento-2026/js/galeria.js`, reemplaza:

```js
async function listarFotos() {
  const respuesta = await fetch(CONFIG.urlAppsScript, { redirect: "follow" });
```

por:

```js
async function listarFotos() {
  const respuesta = await fetch(`${CONFIG.urlAppsScript}?recurso=fotos`, { redirect: "follow" });
```

- [ ] **Paso 3: Extender `Codigo.gs` — `doPost` con `accion`**

En `campamento-2026/apps-script/Codigo.gs`, reemplaza la función `doPost` completa:

```js
/** Sube una foto. El cuerpo llega como text/plain para no disparar la verificacion CORS previa. */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responder({ ok: false, error: 'sin_cuerpo' });
    }

    var cuerpo = JSON.parse(e.postData.contents);

    if (cuerpo.accion === 'subirFoto') {
      return subirFoto(cuerpo);
    }
    if (cuerpo.accion === 'verificarClave') {
      return verificarClave(cuerpo);
    }
    if (cuerpo.accion === 'guardarHabitaciones') {
      return guardarHabitaciones(cuerpo);
    }
    if (cuerpo.accion === 'guardarProgramacion') {
      return guardarProgramacion(cuerpo);
    }
    if (cuerpo.accion === 'guardarCanciones') {
      return guardarCanciones(cuerpo);
    }
    return responder({ ok: false, error: 'accion_desconocida' });
  } catch (error) {
    return responder({ ok: false, error: 'fallo_servidor' });
  }
}

function subirFoto(cuerpo) {
  var mime = String(cuerpo.mime || '');

  // Revalidacion del lado del servidor. Lo que valida el navegador es comodidad, no seguridad.
  if (mime.indexOf('image/') !== 0) {
    return responder({ ok: false, error: 'tipo_no_permitido' });
  }

  var binarios = Utilities.base64Decode(cuerpo.datos || '');
  if (binarios.length === 0) {
    return responder({ ok: false, error: 'archivo_vacio' });
  }
  if (binarios.length > MAXIMO_BYTES) {
    return responder({ ok: false, error: 'demasiado_grande' });
  }

  var carpeta = DriveApp.getFolderById(CARPETA_ID);
  var blob = Utilities.newBlob(binarios, mime, nombreSeguro(cuerpo.nombre, cuerpo.autor));
  var archivo = carpeta.createFile(blob);
  archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  if (cuerpo.autor) {
    archivo.setDescription(String(cuerpo.autor).slice(0, 80));
  }

  // La foto recien subida debe aparecer ya en el carrusel.
  CacheService.getScriptCache().remove(CLAVE_CACHE_FOTOS);

  return responder({ ok: true, id: archivo.getId() });
}
```

- [ ] **Paso 4: Extender `Codigo.gs` — `doGet` con `recurso`**

Reemplaza la función `doGet` completa:

```js
/** Lista las fotos, mas reciente primero, con cache de 60 segundos. */
function doGet(e) {
  var recurso = (e && e.parameter && e.parameter.recurso) || 'fotos';
  if (recurso === 'datos') {
    return leerDatos((e.parameter && e.parameter.tipo) || '');
  }
  return listarFotos();
}

function listarFotos() {
  try {
    var cache = CacheService.getScriptCache();
    var guardado = cache.get(CLAVE_CACHE_FOTOS);
    if (guardado) {
      return ContentService.createTextOutput(guardado)
        .setMimeType(ContentService.MimeType.JSON);
    }

    var carpeta = DriveApp.getFolderById(CARPETA_ID);
    var archivos = carpeta.getFiles();
    var fotos = [];

    while (archivos.hasNext()) {
      var archivo = archivos.next();
      if (archivo.getMimeType().indexOf('image/') !== 0) continue;
      fotos.push({
        id: archivo.getId(),
        creado: archivo.getDateCreated().toISOString(),
        autor: archivo.getDescription() || ''
      });
    }

    fotos.sort(function (uno, otro) {
      return uno.creado < otro.creado ? 1 : uno.creado > otro.creado ? -1 : 0;
    });

    var salida = JSON.stringify({ ok: true, fotos: fotos });
    cache.put(CLAVE_CACHE_FOTOS, salida, SEGUNDOS_CACHE);

    return ContentService.createTextOutput(salida)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return responder({ ok: false, error: 'fallo_servidor' });
  }
}
```

(Nota: `CLAVE_CACHE` se renombra a `CLAVE_CACHE_FOTOS` para distinguirla de las claves de caché de datos que se agregan en el Paso 5. Ajusta esa constante en el Paso 5.)

- [ ] **Paso 5: Extender `Codigo.gs` — lectura de Sheets (`leerDatos`)**

Añade estas funciones nuevas al final del archivo, antes de `function responder(objeto) {`:

```js
var SEGUNDOS_CACHE_DATOS = 60;

// El ID real de la hoja de calculo vive en PropertiesService (clave 'HOJA_ID'),
// no en una variable del codigo: lo escribe configurarPanel() la primera vez
// que se corre, y asi el codigo fuente pegado en el editor no lo revela.
function obtenerHoja() {
  var propiedades = PropertiesService.getScriptProperties();
  var id = propiedades.getProperty('HOJA_ID');
  if (!id) throw new Error('El panel todavia no esta configurado. Corre configurarPanel() desde el editor.');
  return SpreadsheetApp.openById(id);
}

/** Lee un tipo de dato (habitaciones|programacion|canciones) en la forma que ya usa el sitio. */
function leerDatos(tipo) {
  try {
    var clave = 'datos_' + tipo;
    var cache = CacheService.getScriptCache();
    var guardado = cache.get(clave);
    if (guardado) {
      return ContentService.createTextOutput(guardado).setMimeType(ContentService.MimeType.JSON);
    }

    var libro = obtenerHoja();
    var datos;
    if (tipo === 'habitaciones') datos = leerHabitaciones(libro);
    else if (tipo === 'programacion') datos = leerProgramacion(libro);
    else if (tipo === 'canciones') datos = leerCanciones(libro);
    else return responder({ ok: false, error: 'tipo_desconocido' });

    var salida = JSON.stringify({ ok: true, datos: datos });
    cache.put(clave, salida, SEGUNDOS_CACHE_DATOS);
    return ContentService.createTextOutput(salida).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return responder({ ok: false, error: 'fallo_servidor' });
  }
}

/** Lee toda una pestaña como arreglo de objetos, usando la primera fila como encabezados. */
function leerFilas(libro, nombrePestana) {
  var hoja = libro.getSheetByName(nombrePestana);
  if (!hoja) return [];
  var valores = hoja.getDataRange().getValues();
  if (valores.length < 2) return [];
  var encabezados = valores[0];
  var filas = [];
  for (var i = 1; i < valores.length; i++) {
    var fila = {};
    for (var c = 0; c < encabezados.length; c++) {
      fila[encabezados[c]] = valores[i][c];
    }
    filas.push(fila);
  }
  return filas;
}

function leerHabitaciones(libro) {
  var habitaciones = leerFilas(libro, 'Habitaciones');
  var integrantes = leerFilas(libro, 'Integrantes');
  return habitaciones.map(function (h) {
    var propios = integrantes
      .filter(function (i) { return String(i.habitacion_id) === String(h.id); })
      .map(function (i) { return i.nombre; });
    return { nombre: h.nombre, lider: h.lider || '', integrantes: propios };
  });
}

function leerProgramacion(libro) {
  var filas = leerFilas(libro, 'Programacion');
  var porDia = {};
  var orden = [];
  filas.forEach(function (f) {
    if (!porDia[f.dia]) {
      porDia[f.dia] = { dia: f.dia, numero: f.numero, bloques: [] };
      orden.push(f.dia);
    }
    porDia[f.dia].bloques.push({ hora: f.hora, actividad: f.actividad });
  });
  return orden.map(function (dia) { return porDia[dia]; });
}

function leerCanciones(libro) {
  var canciones = leerFilas(libro, 'Canciones');
  var bloques = leerFilas(libro, 'CancionesBloques');
  return canciones.map(function (c) {
    var propios = bloques
      .filter(function (b) { return String(b.cancion_id) === String(c.id); })
      .sort(function (a, b) { return a.orden - b.orden; })
      .map(function (b) {
        return { tipo: b.tipo, lineas: String(b.lineas || '').split('\n').filter(Boolean) };
      });
    return { id: c.id, titulo: c.titulo, numero: c.numero, lema: c.lema === true || c.lema === 'true', bloques: propios };
  });
}
```

- [ ] **Paso 6: Renombrar `CLAVE_CACHE` a `CLAVE_CACHE_FOTOS`**

Reemplaza:

```js
var CLAVE_CACHE = 'listado_fotos';
```

por:

```js
var CLAVE_CACHE_FOTOS = 'listado_fotos';
```

- [ ] **Paso 7: Actualizar el encabezado de instrucciones del archivo**

En el comentario de encabezado de `Codigo.gs`, después del paso 4 existente (`Copia la URL...`), añade:

```
 *  5. Corre la funcion configurarPanel() una vez desde el editor (seleccionala
 *     en el desplegable de funciones y pulsa Ejecutar) para crear la hoja de
 *     calculo del panel de administracion.
 *  6. Corre establecerClave("tu-contraseña-aqui") una vez desde el editor
 *     para fijar la contraseña del panel. No la dejes escrita en el codigo.
```

(La numeración del resto de pasos existentes se corre en consecuencia; el paso de cuotas pasa a ser el 7.)

- [ ] **Paso 8: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026/apps-script/Codigo.gs campamento-2026/js/galeria.js
git commit -m "feat: apps script sirve datos de habitaciones, programacion y canciones"
```

(La verificación manual de este script, incluida `configurarPanel()`, se hace en la Tarea 7 junto con la escritura, porque `configurarPanel()` se agrega en esa tarea.)

---

## Tarea 7: Apps Script — escritura protegida y configuración inicial

**Archivos:**
- Modificar: `campamento-2026/apps-script/Codigo.gs`

**Interfaces:**
- Produce: `verificarClave(cuerpo)`, `guardarHabitaciones(cuerpo)`, `guardarProgramacion(cuerpo)`, `guardarCanciones(cuerpo)` — cada una responde `{ok:false, error:"clave_incorrecta"}` si `cuerpo.clave` no coincide con la guardada.
- Produce: `configurarPanel()`, `establecerClave(nuevaClave)` — funciones de un solo uso, para correr manualmente desde el editor.

- [ ] **Paso 1: Añadir la comprobación de contraseña y las funciones de guardado**

Añade estas funciones a `Codigo.gs`, junto a `subirFoto` (después de esa función, antes de `doGet`):

```js
function claveValida(clave) {
  var esperada = PropertiesService.getScriptProperties().getProperty('CLAVE_PANEL');
  return !!esperada && clave === esperada;
}

function verificarClave(cuerpo) {
  if (!claveValida(cuerpo.clave)) return responder({ ok: false, error: 'clave_incorrecta' });
  return responder({ ok: true });
}

function guardarHabitaciones(cuerpo) {
  if (!claveValida(cuerpo.clave)) return responder({ ok: false, error: 'clave_incorrecta' });
  try {
    var libro = obtenerHoja();
    var habitaciones = libro.getSheetByName('Habitaciones');
    var integrantes = libro.getSheetByName('Integrantes');
    limpiarPestana(habitaciones, ['id', 'nombre', 'lider']);
    limpiarPestana(integrantes, ['habitacion_id', 'nombre']);

    var filasHabitaciones = [];
    var filasIntegrantes = [];
    (cuerpo.datos || []).forEach(function (h, indice) {
      var id = indice + 1;
      filasHabitaciones.push([id, h.nombre || '', h.lider || '']);
      (h.integrantes || []).forEach(function (nombre) {
        filasIntegrantes.push([id, nombre]);
      });
    });
    escribirFilas(habitaciones, filasHabitaciones);
    escribirFilas(integrantes, filasIntegrantes);

    CacheService.getScriptCache().remove('datos_habitaciones');
    return responder({ ok: true });
  } catch (error) {
    return responder({ ok: false, error: 'fallo_servidor' });
  }
}

function guardarProgramacion(cuerpo) {
  if (!claveValida(cuerpo.clave)) return responder({ ok: false, error: 'clave_incorrecta' });
  try {
    var libro = obtenerHoja();
    var hoja = libro.getSheetByName('Programacion');
    limpiarPestana(hoja, ['dia', 'numero', 'hora', 'actividad']);

    var filas = [];
    (cuerpo.datos || []).forEach(function (dia) {
      (dia.bloques || []).forEach(function (bloque) {
        filas.push([dia.dia, dia.numero, bloque.hora, bloque.actividad]);
      });
    });
    escribirFilas(hoja, filas);

    CacheService.getScriptCache().remove('datos_programacion');
    return responder({ ok: true });
  } catch (error) {
    return responder({ ok: false, error: 'fallo_servidor' });
  }
}

function guardarCanciones(cuerpo) {
  if (!claveValida(cuerpo.clave)) return responder({ ok: false, error: 'clave_incorrecta' });
  try {
    var libro = obtenerHoja();
    var canciones = libro.getSheetByName('Canciones');
    var bloques = libro.getSheetByName('CancionesBloques');
    limpiarPestana(canciones, ['id', 'titulo', 'numero', 'lema']);
    limpiarPestana(bloques, ['cancion_id', 'orden', 'tipo', 'lineas']);

    var filasCanciones = [];
    var filasBloques = [];
    (cuerpo.datos || []).forEach(function (c) {
      filasCanciones.push([c.id, c.titulo || '', c.numero || '', !!c.lema]);
      (c.bloques || []).forEach(function (b, orden) {
        filasBloques.push([c.id, orden + 1, b.tipo, (b.lineas || []).join('\n')]);
      });
    });
    escribirFilas(canciones, filasCanciones);
    escribirFilas(bloques, filasBloques);

    CacheService.getScriptCache().remove('datos_canciones');
    return responder({ ok: true });
  } catch (error) {
    return responder({ ok: false, error: 'fallo_servidor' });
  }
}

/** Borra todas las filas de datos de una pestaña, dejando solo el encabezado. */
function limpiarPestana(hoja, encabezados) {
  hoja.clear();
  hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
}

function escribirFilas(hoja, filas) {
  if (filas.length === 0) return;
  hoja.getRange(2, 1, filas.length, filas[0].length).setValues(filas);
}
```

- [ ] **Paso 2: Añadir `configurarPanel()` y `establecerClave()`**

Añade al final del archivo:

```js
/**
 * Corre esto UNA SOLA VEZ desde el editor de Apps Script (selecciona
 * configurarPanel en el desplegable de funciones y pulsa Ejecutar).
 * Crea la hoja de calculo del panel con sus pestañas y la siembra con el
 * contenido de ejemplo que ya trae el sitio.
 */
function configurarPanel() {
  var libro = SpreadsheetApp.create('Campamento 2026 - Panel de administracion');
  PropertiesService.getScriptProperties().setProperty('HOJA_ID', libro.getId());

  crearPestana(libro, 'Habitaciones', ['id', 'nombre', 'lider'], [
    [1, 'Habitación 1', 'PENDIENTE — nombre del líder'],
  ]);
  crearPestana(libro, 'Integrantes', ['habitacion_id', 'nombre'], [
    [1, 'PENDIENTE — integrante 1'],
    [1, 'PENDIENTE — integrante 2'],
  ]);
  crearPestana(libro, 'Programacion', ['dia', 'numero', 'hora', 'actividad'], [
    ['Viernes', 1, '5:00 PM', 'Salida'],
    ['Viernes', 1, '7:00 PM', 'Llegada y acomodación'],
  ]);
  crearPestana(libro, 'Canciones', ['id', 'titulo', 'numero', 'lema'], [
    ['derrama', 'Derrama', 1, true],
  ]);
  crearPestana(libro, 'CancionesBloques', ['cancion_id', 'orden', 'tipo', 'lineas'], [
    ['derrama', 1, 'estrofa', 'Eres poderoso\nNo lo puedo explicar'],
    ['derrama', 2, 'coro', 'Soy una vasija esperando ser llena'],
  ]);

  // La pestaña por defecto de Sheets ("Hoja 1") no hace falta.
  var porDefecto = libro.getSheetByName('Hoja 1') || libro.getSheetByName('Sheet1');
  if (porDefecto) libro.deleteSheet(porDefecto);

  Logger.log('Hoja creada: ' + libro.getUrl());
}

function crearPestana(libro, nombre, encabezados, filasEjemplo) {
  var hoja = libro.insertSheet(nombre);
  hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  if (filasEjemplo.length > 0) {
    hoja.getRange(2, 1, filasEjemplo.length, encabezados.length).setValues(filasEjemplo);
  }
}

/**
 * Corre esto UNA SOLA VEZ desde el editor para fijar la contraseña del panel,
 * reemplazando "tu-contraseña-aqui" por la clave real antes de ejecutar.
 * No queda escrita en ningun archivo publico: vive en PropertiesService.
 */
function establecerClave() {
  var nuevaClave = 'tu-contraseña-aqui';
  PropertiesService.getScriptProperties().setProperty('CLAVE_PANEL', nuevaClave);
  Logger.log('Contraseña del panel actualizada.');
}
```

- [ ] **Paso 3: Verificación manual — publicar y configurar**

Sigue el encabezado actualizado de `Codigo.gs` (Tarea 6, Paso 7): pega el archivo completo en script.google.com con la cuenta dueña de la carpeta de fotos, publica como aplicación web, corre `configurarPanel()` y luego `establecerClave()` (con una contraseña real puesta en el código antes de ejecutar, y borrada del código después de ejecutar — no debe quedar la contraseña real pegada permanentemente en el editor).

Copia la URL `/exec` en `js/config.js` (`urlAppsScript`).

- [ ] **Paso 4: Verificación manual — lectura pública**

Abre en el navegador:
```
https://TU-URL/exec?recurso=datos&tipo=habitaciones
```
Esperado: `{"ok":true,"datos":[{"nombre":"Habitación 1","lider":"PENDIENTE — nombre del líder","integrantes":["PENDIENTE — integrante 1","PENDIENTE — integrante 2"]}]}`.

Repite con `tipo=programacion` y `tipo=canciones` y confirma que la forma coincide con la de los archivos `datos/*.json` correspondientes.

- [ ] **Paso 5: Verificación manual — escritura con contraseña incorrecta**

Desde la consola del navegador (con el sitio servido):

```js
const respuesta = await fetch("https://TU-URL/exec", {
  method: "POST",
  redirect: "follow",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify({ accion: "verificarClave", clave: "clave-incorrecta" }),
});
console.log(await respuesta.json());
```

Esperado: `{ok: false, error: "clave_incorrecta"}`.

- [ ] **Paso 6: Verificación manual — escritura con contraseña correcta**

Repite con la contraseña real puesta en `establecerClave()`. Esperado: `{ok: true}`.

Luego prueba un guardado real:

```js
const respuesta = await fetch("https://TU-URL/exec", {
  method: "POST",
  redirect: "follow",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify({
    accion: "guardarHabitaciones",
    clave: "la-contraseña-real",
    datos: [{ nombre: "Prueba", lider: "Alguien", integrantes: ["Uno", "Dos"] }],
  }),
});
console.log(await respuesta.json());
```

Esperado: `{ok: true}`. Confirma en la hoja de cálculo (ábrela con el enlace que imprimió `configurarPanel()` en los registros de ejecución) que la pestaña `Habitaciones` tiene esa fila y `Integrantes` tiene "Uno" y "Dos" enlazados a ella. Vuelve a leer `?recurso=datos&tipo=habitaciones` y confirma que refleja el cambio (puede tardar hasta 60 segundos por la caché).

Restaura el contenido de ejemplo original si hiciste esta prueba sobre la hoja real, o usa una hoja de prueba aparte.

- [ ] **Paso 7: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026/apps-script/Codigo.gs
git commit -m "feat: apps script guarda habitaciones, programacion y canciones con contraseña"
```

---

## Tarea 8: Sesión de contraseña del panel

**Archivos:**
- Crear: `campamento-2026/js/admin/clave.js`
- Modificar: `campamento-2026/pruebas/casos.js`

**Interfaces:**
- Produce: `obtenerClaveSesion() -> string|null`, `guardarClaveSesion(clave)`, `borrarClaveSesion()`.
- Produce: `llamarApi(accion, datos, clave, traer = fetch) -> Promise<any>`. Hace `POST` a `CONFIG.urlAppsScript` con `{accion, clave, datos}`; si `cuerpo.ok`, devuelve `cuerpo` completo; si no, lanza `Error(cuerpo.error || "fallo_servidor")`; si la petición de red falla, lanza `Error("sin_conexion")`.
- Produce: `mensajeDeErrorAdmin(error) -> string`.

- [ ] **Paso 1: Escribir los casos que fallan**

Añade a `pruebas/casos.js`:

```js
import { llamarApi, mensajeDeErrorAdmin } from "../js/admin/clave.js";
```

```js
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
```

- [ ] **Paso 2: Correr las pruebas y verificar que fallan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `Cannot find module` apuntando a `js/admin/clave.js`.

- [ ] **Paso 3: Escribir `js/admin/clave.js`**

```js
// clave.js — sesion de la contraseña del panel y llamadas protegidas al Apps Script.

import { CONFIG } from "../config.js";

const CLAVE_SESION = "campamento2026:clave-panel";

const MENSAJES = {
  clave_incorrecta: "Contraseña incorrecta.",
  sin_conexion: "No pudimos guardar los cambios. Verifica tu conexión e inténtalo de nuevo.",
  fallo_servidor: "No pudimos guardar los cambios. Verifica tu conexión e inténtalo de nuevo.",
};

export function obtenerClaveSesion() {
  try {
    return sessionStorage.getItem(CLAVE_SESION);
  } catch {
    return null;
  }
}

export function guardarClaveSesion(clave) {
  try {
    sessionStorage.setItem(CLAVE_SESION, clave);
  } catch {
    // Sesion privada o almacenamiento bloqueado: la clave simplemente no persiste entre recargas.
  }
}

export function borrarClaveSesion() {
  try {
    sessionStorage.removeItem(CLAVE_SESION);
  } catch {
    // No hay nada que limpiar si el almacenamiento no esta disponible.
  }
}

/**
 * Llama una accion protegida del Apps Script. Devuelve el cuerpo completo si
 * `ok` es verdadero; lanza un Error con el codigo del servidor si no.
 */
export async function llamarApi(accion, datos, clave, traer = fetch) {
  let respuesta;
  try {
    respuesta = await traer(CONFIG.urlAppsScript, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ accion, clave, datos }),
    });
  } catch {
    throw new Error("sin_conexion");
  }
  if (!respuesta.ok) throw new Error("fallo_servidor");
  const cuerpo = await respuesta.json();
  if (!cuerpo.ok) throw new Error(cuerpo.error || "fallo_servidor");
  return cuerpo;
}

/** Traduce el codigo de error de llamarApi a un mensaje en español para el panel. */
export function mensajeDeErrorAdmin(error) {
  return MENSAJES[error?.message] || MENSAJES.fallo_servidor;
}
```

- [ ] **Paso 4: Correr las pruebas y verificar que pasan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `35 pasaron, 0 fallaron, 1 solo navegador`.

- [ ] **Paso 5: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026/js/admin/clave.js campamento-2026/pruebas/casos.js
git commit -m "feat: sesion de contraseña y llamadas protegidas del panel"
```

---

## Tarea 9: Sección Habitaciones del panel

**Archivos:**
- Crear: `campamento-2026/js/admin/habitaciones-datos.js`
- Crear: `campamento-2026/js/admin/habitaciones-panel.js`
- Modificar: `campamento-2026/pruebas/casos.js`

**Interfaces:**
- Consume: `llamarApi`, `mensajeDeErrorAdmin`, `obtenerClaveSesion` de la Tarea 8; `traerDatoVivo` de la Tarea 1.
- Produce en `habitaciones-datos.js`: `agregarHabitacion(habitaciones) -> nuevas`, `quitarHabitacion(habitaciones, indice) -> nuevas`, `agregarIntegrante(habitacion) -> nueva`, `quitarIntegrante(habitacion, indice) -> nueva`.
- Produce en `habitaciones-panel.js`: `iniciar(contenedor, clave)`.

- [ ] **Paso 1: Escribir los casos que fallan**

Añade a `pruebas/casos.js`:

```js
import {
  agregarHabitacion,
  quitarHabitacion,
  agregarIntegrante,
  quitarIntegrante,
} from "../js/admin/habitaciones-datos.js";
```

```js
  {
    nombre: "agregarHabitacion añade una habitacion vacia al final",
    entorno: "ambos",
    ejecutar() {
      const resultado = agregarHabitacion([{ nombre: "Habitación 1", lider: "", integrantes: [] }]);
      igual(resultado.length, 2, "Deberia haber dos habitaciones");
      igual(resultado[1], { nombre: "", lider: "", integrantes: [] }, "La nueva deberia estar vacia");
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
    nombre: "agregarIntegrante añade un nombre vacio a una habitacion",
    entorno: "ambos",
    ejecutar() {
      const habitacion = { nombre: "H1", lider: "", integrantes: ["Ana"] };
      const resultado = agregarIntegrante(habitacion);
      igual(resultado.integrantes, ["Ana", ""], "Deberia agregar una entrada vacia al final");
      igual(habitacion.integrantes, ["Ana"], "La habitacion original no deberia mutarse");
    },
  },
  {
    nombre: "quitarIntegrante elimina por indice",
    entorno: "ambos",
    ejecutar() {
      const habitacion = { nombre: "H1", lider: "", integrantes: ["Ana", "Luis", "Sara"] };
      const resultado = quitarIntegrante(habitacion, 0);
      igual(resultado.integrantes, ["Luis", "Sara"], "Deberia quitar el primero");
    },
  },
```

- [ ] **Paso 2: Correr las pruebas y verificar que fallan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `Cannot find module` apuntando a `js/admin/habitaciones-datos.js`.

- [ ] **Paso 3: Escribir `js/admin/habitaciones-datos.js`**

```js
// habitaciones-datos.js — operaciones puras sobre el arreglo de habitaciones del panel.

/** Agrega una habitacion vacia al final. No muta el arreglo recibido. */
export function agregarHabitacion(habitaciones) {
  return [...habitaciones, { nombre: "", lider: "", integrantes: [] }];
}

/** Quita la habitacion en `indice`. No muta el arreglo recibido. */
export function quitarHabitacion(habitaciones, indice) {
  return habitaciones.filter((_, i) => i !== indice);
}

/** Agrega un integrante vacio al final de una habitacion. No muta la habitacion recibida. */
export function agregarIntegrante(habitacion) {
  return { ...habitacion, integrantes: [...habitacion.integrantes, ""] };
}

/** Quita el integrante en `indice`. No muta la habitacion recibida. */
export function quitarIntegrante(habitacion, indice) {
  return { ...habitacion, integrantes: habitacion.integrantes.filter((_, i) => i !== indice) };
}
```

- [ ] **Paso 4: Correr las pruebas y verificar que pasan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `39 pasaron, 0 fallaron, 1 solo navegador`.

- [ ] **Paso 5: Escribir `js/admin/habitaciones-panel.js`**

```js
// habitaciones-panel.js — DOM y cableado de la seccion Habitaciones del panel.

import { traerDatoVivo } from "../util/datosVivos.js";
import { llamarApi, mensajeDeErrorAdmin } from "./clave.js";
import { agregarHabitacion, quitarHabitacion, agregarIntegrante, quitarIntegrante } from "./habitaciones-datos.js";

export async function iniciar(contenedor, clave) {
  contenedor.innerHTML = "";

  const titulo = document.createElement("h2");
  titulo.textContent = "Habitaciones";
  contenedor.append(titulo);

  const lista = document.createElement("div");
  lista.className = "panel-lista";

  const agregarBoton = document.createElement("button");
  agregarBoton.type = "button";
  agregarBoton.className = "pill";
  agregarBoton.textContent = "+ Agregar habitación";

  const guardarBoton = document.createElement("button");
  guardarBoton.type = "button";
  guardarBoton.className = "pill panel-guardar";
  guardarBoton.textContent = "Guardar cambios";

  const estadoGuardado = document.createElement("p");
  estadoGuardado.className = "panel-estado";
  estadoGuardado.setAttribute("aria-live", "polite");

  let habitaciones = [];

  function repintar() {
    lista.innerHTML = "";
    habitaciones.forEach((habitacion, indice) => {
      lista.append(construirTarjeta(habitacion, indice));
    });
  }

  function construirTarjeta(habitacion, indice) {
    const tarjeta = document.createElement("div");
    tarjeta.className = "panel-tarjeta";

    const campoNombre = document.createElement("input");
    campoNombre.type = "text";
    campoNombre.placeholder = "Nombre de la habitación";
    campoNombre.value = habitacion.nombre;
    campoNombre.addEventListener("input", () => {
      habitaciones[indice] = { ...habitaciones[indice], nombre: campoNombre.value };
    });

    const campoLider = document.createElement("input");
    campoLider.type = "text";
    campoLider.placeholder = "Líder";
    campoLider.value = habitacion.lider;
    campoLider.addEventListener("input", () => {
      habitaciones[indice] = { ...habitaciones[indice], lider: campoLider.value };
    });

    const listaIntegrantes = document.createElement("div");
    listaIntegrantes.className = "panel-integrantes";

    function repintarIntegrantes() {
      listaIntegrantes.innerHTML = "";
      habitaciones[indice].integrantes.forEach((nombre, indiceIntegrante) => {
        const fila = document.createElement("div");
        fila.className = "panel-fila";

        const campo = document.createElement("input");
        campo.type = "text";
        campo.placeholder = "Nombre del integrante";
        campo.value = nombre;
        campo.addEventListener("input", () => {
          const integrantes = [...habitaciones[indice].integrantes];
          integrantes[indiceIntegrante] = campo.value;
          habitaciones[indice] = { ...habitaciones[indice], integrantes };
        });

        const quitar = document.createElement("button");
        quitar.type = "button";
        quitar.className = "panel-quitar";
        quitar.textContent = "×";
        quitar.setAttribute("aria-label", `Quitar a ${nombre || "este integrante"}`);
        quitar.addEventListener("click", () => {
          habitaciones[indice] = quitarIntegrante(habitaciones[indice], indiceIntegrante);
          repintarIntegrantes();
        });

        fila.append(campo, quitar);
        listaIntegrantes.append(fila);
      });
    }
    repintarIntegrantes();

    const agregarIntegranteBoton = document.createElement("button");
    agregarIntegranteBoton.type = "button";
    agregarIntegranteBoton.className = "boton-reintentar";
    agregarIntegranteBoton.textContent = "+ Agregar integrante";
    agregarIntegranteBoton.addEventListener("click", () => {
      habitaciones[indice] = agregarIntegrante(habitaciones[indice]);
      repintarIntegrantes();
    });

    const quitarHabitacionBoton = document.createElement("button");
    quitarHabitacionBoton.type = "button";
    quitarHabitacionBoton.className = "panel-quitar-habitacion";
    quitarHabitacionBoton.textContent = "Quitar esta habitación";
    quitarHabitacionBoton.addEventListener("click", () => {
      habitaciones = quitarHabitacion(habitaciones, indice);
      repintar();
    });

    tarjeta.append(campoNombre, campoLider, listaIntegrantes, agregarIntegranteBoton, quitarHabitacionBoton);
    return tarjeta;
  }

  agregarBoton.addEventListener("click", () => {
    habitaciones = agregarHabitacion(habitaciones);
    repintar();
  });

  guardarBoton.addEventListener("click", async () => {
    estadoGuardado.textContent = "Guardando…";
    try {
      await llamarApi("guardarHabitaciones", habitaciones, clave);
      estadoGuardado.textContent = "Guardado.";
    } catch (error) {
      estadoGuardado.textContent = mensajeDeErrorAdmin(error);
    }
  });

  try {
    habitaciones = await traerDatoVivo("habitaciones");
  } catch {
    habitaciones = [];
  }
  repintar();

  contenedor.append(lista, agregarBoton, guardarBoton, estadoGuardado);
}
```

- [ ] **Paso 6: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026/js/admin/habitaciones-datos.js campamento-2026/js/admin/habitaciones-panel.js campamento-2026/pruebas/casos.js
git commit -m "feat: seccion habitaciones del panel de administracion"
```

---

## Tarea 10: Sección Programación del panel

**Archivos:**
- Crear: `campamento-2026/js/admin/programacion-datos.js`
- Crear: `campamento-2026/js/admin/programacion-panel.js`
- Modificar: `campamento-2026/pruebas/casos.js`

**Interfaces:**
- Produce en `programacion-datos.js`: `agregarBloque(dia) -> diaNuevo`, `quitarBloque(dia, indice) -> diaNuevo`.
- Produce en `programacion-panel.js`: `iniciar(contenedor, clave)`.

- [ ] **Paso 1: Escribir los casos que fallan**

Añade a `pruebas/casos.js`:

```js
import { agregarBloque, quitarBloque } from "../js/admin/programacion-datos.js";
```

```js
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
```

- [ ] **Paso 2: Correr las pruebas y verificar que fallan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `Cannot find module` apuntando a `js/admin/programacion-datos.js`.

- [ ] **Paso 3: Escribir `js/admin/programacion-datos.js`**

```js
// programacion-datos.js — operaciones puras sobre los bloques de un dia del panel.

/** Agrega un bloque vacio al final de un dia. No muta el dia recibido. */
export function agregarBloque(dia) {
  return { ...dia, bloques: [...dia.bloques, { hora: "", actividad: "" }] };
}

/** Quita el bloque en `indice`. No muta el dia recibido. */
export function quitarBloque(dia, indice) {
  return { ...dia, bloques: dia.bloques.filter((_, i) => i !== indice) };
}
```

- [ ] **Paso 4: Correr las pruebas y verificar que pasan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `41 pasaron, 0 fallaron, 1 solo navegador`.

- [ ] **Paso 5: Escribir `js/admin/programacion-panel.js`**

```js
// programacion-panel.js — DOM y cableado de la seccion Programacion del panel.

import { traerDatoVivo } from "../util/datosVivos.js";
import { llamarApi, mensajeDeErrorAdmin } from "./clave.js";
import { agregarBloque, quitarBloque } from "./programacion-datos.js";

export async function iniciar(contenedor, clave) {
  contenedor.innerHTML = "";

  const titulo = document.createElement("h2");
  titulo.textContent = "Programación";
  contenedor.append(titulo);

  const lista = document.createElement("div");
  lista.className = "panel-lista";

  const guardarBoton = document.createElement("button");
  guardarBoton.type = "button";
  guardarBoton.className = "pill panel-guardar";
  guardarBoton.textContent = "Guardar cambios";

  const estadoGuardado = document.createElement("p");
  estadoGuardado.className = "panel-estado";
  estadoGuardado.setAttribute("aria-live", "polite");

  let dias = [];

  function repintar() {
    lista.innerHTML = "";
    dias.forEach((dia, indiceDia) => {
      lista.append(construirDia(dia, indiceDia));
    });
  }

  function construirDia(dia, indiceDia) {
    const bloqueDia = document.createElement("div");
    bloqueDia.className = "panel-tarjeta";

    const nombreDia = document.createElement("h3");
    nombreDia.textContent = dia.dia;
    bloqueDia.append(nombreDia);

    const listaBloques = document.createElement("div");

    function repintarBloques() {
      listaBloques.innerHTML = "";
      dias[indiceDia].bloques.forEach((bloque, indiceBloque) => {
        const fila = document.createElement("div");
        fila.className = "panel-fila";

        const campoHora = document.createElement("input");
        campoHora.type = "text";
        campoHora.placeholder = "Hora (ej. 5:00 PM)";
        campoHora.value = bloque.hora;
        campoHora.addEventListener("input", () => {
          const bloques = [...dias[indiceDia].bloques];
          bloques[indiceBloque] = { ...bloques[indiceBloque], hora: campoHora.value };
          dias[indiceDia] = { ...dias[indiceDia], bloques };
        });

        const campoActividad = document.createElement("input");
        campoActividad.type = "text";
        campoActividad.placeholder = "Actividad";
        campoActividad.value = bloque.actividad;
        campoActividad.addEventListener("input", () => {
          const bloques = [...dias[indiceDia].bloques];
          bloques[indiceBloque] = { ...bloques[indiceBloque], actividad: campoActividad.value };
          dias[indiceDia] = { ...dias[indiceDia], bloques };
        });

        const quitar = document.createElement("button");
        quitar.type = "button";
        quitar.className = "panel-quitar";
        quitar.textContent = "×";
        quitar.setAttribute("aria-label", "Quitar esta actividad");
        quitar.addEventListener("click", () => {
          dias[indiceDia] = quitarBloque(dias[indiceDia], indiceBloque);
          repintarBloques();
        });

        fila.append(campoHora, campoActividad, quitar);
        listaBloques.append(fila);
      });
    }
    repintarBloques();

    const agregarBoton = document.createElement("button");
    agregarBoton.type = "button";
    agregarBoton.className = "boton-reintentar";
    agregarBoton.textContent = "+ Agregar actividad";
    agregarBoton.addEventListener("click", () => {
      dias[indiceDia] = agregarBloque(dias[indiceDia]);
      repintarBloques();
    });

    bloqueDia.append(listaBloques, agregarBoton);
    return bloqueDia;
  }

  guardarBoton.addEventListener("click", async () => {
    estadoGuardado.textContent = "Guardando…";
    try {
      await llamarApi("guardarProgramacion", dias, clave);
      estadoGuardado.textContent = "Guardado.";
    } catch (error) {
      estadoGuardado.textContent = mensajeDeErrorAdmin(error);
    }
  });

  try {
    dias = await traerDatoVivo("programacion");
  } catch {
    dias = [];
  }
  repintar();

  contenedor.append(lista, guardarBoton, estadoGuardado);
}
```

Nota: la Programación no admite agregar/quitar un día completo desde el panel (los tres días — Viernes, Sábado, Domingo — son fijos), solo agregar/quitar actividades dentro de cada uno. Esto es intencional: coincide con el diseño (§6, "Programación — tres bloques... cada uno con su lista de horarios") y con cómo `validarProgramacion` en el sitio público exige que cada día tenga al menos un bloque.

- [ ] **Paso 6: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026/js/admin/programacion-datos.js campamento-2026/js/admin/programacion-panel.js campamento-2026/pruebas/casos.js
git commit -m "feat: seccion programacion del panel de administracion"
```

---

## Tarea 11: Sección Canciones del panel

**Archivos:**
- Crear: `campamento-2026/js/admin/canciones-datos.js`
- Crear: `campamento-2026/js/admin/canciones-panel.js`
- Modificar: `campamento-2026/pruebas/casos.js`

**Interfaces:**
- Consume: `aSlug` de `js/util/texto.js` (Tarea 2).
- Produce en `canciones-datos.js`: `generarSlugCancion(titulo, cancionesExistentes) -> string`, `agregarCancion(canciones, titulo, numero, lema) -> nuevas`, `quitarCancion(canciones, indice) -> nuevas`, `agregarBloqueLetra(cancion) -> nueva`, `quitarBloqueLetra(cancion, indice) -> nueva`, `textoALineas(texto) -> string[]`, `lineasATexto(lineas) -> string`.
- Produce en `canciones-panel.js`: `iniciar(contenedor, clave)`.

- [ ] **Paso 1: Escribir los casos que fallan**

Añade a `pruebas/casos.js`:

```js
import {
  generarSlugCancion,
  agregarCancion,
  quitarCancion,
  agregarBloqueLetra,
  quitarBloqueLetra,
  textoALineas,
  lineasATexto,
} from "../js/admin/canciones-datos.js";
```

```js
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
```

- [ ] **Paso 2: Correr las pruebas y verificar que fallan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `Cannot find module` apuntando a `js/admin/canciones-datos.js`.

- [ ] **Paso 3: Escribir `js/admin/canciones-datos.js`**

```js
// canciones-datos.js — operaciones puras sobre el arreglo de canciones del panel.

import { aSlug } from "../util/texto.js";

/** Slug del titulo; si ya existe entre `cancionesExistentes`, le agrega un sufijo numerico. */
export function generarSlugCancion(titulo, cancionesExistentes) {
  const base = aSlug(titulo);
  const idsExistentes = new Set(cancionesExistentes.map((c) => c.id));
  if (!idsExistentes.has(base)) return base;
  let sufijo = 2;
  while (idsExistentes.has(`${base}-${sufijo}`)) sufijo += 1;
  return `${base}-${sufijo}`;
}

/** Agrega una cancion nueva, con un bloque de estrofa vacio para empezar a escribir. */
export function agregarCancion(canciones, titulo, numero, lema) {
  const id = generarSlugCancion(titulo, canciones);
  const nueva = { id, titulo, numero, lema, bloques: [{ tipo: "estrofa", lineas: [] }] };
  return [...canciones, nueva];
}

/** Quita la cancion en `indice`. No muta el arreglo recibido. */
export function quitarCancion(canciones, indice) {
  return canciones.filter((_, i) => i !== indice);
}

/** Agrega un bloque de estrofa vacio al final de una cancion. No muta la cancion recibida. */
export function agregarBloqueLetra(cancion) {
  return { ...cancion, bloques: [...cancion.bloques, { tipo: "estrofa", lineas: [] }] };
}

/** Quita el bloque de letra en `indice`. No muta la cancion recibida. */
export function quitarBloqueLetra(cancion, indice) {
  return { ...cancion, bloques: cancion.bloques.filter((_, i) => i !== indice) };
}

/** El texto de un cuadro grande, una linea por verso, a un arreglo de lineas. Descarta lineas en blanco. */
export function textoALineas(texto) {
  return texto
    .split("\n")
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0);
}

/** El arreglo de lineas de un bloque, de vuelta a texto para precargar el cuadro grande. */
export function lineasATexto(lineas) {
  return lineas.join("\n");
}
```

- [ ] **Paso 4: Correr las pruebas y verificar que pasan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `49 pasaron, 0 fallaron, 1 solo navegador`.

- [ ] **Paso 5: Escribir `js/admin/canciones-panel.js`**

```js
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
```

- [ ] **Paso 6: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026/js/admin/canciones-datos.js campamento-2026/js/admin/canciones-panel.js campamento-2026/pruebas/casos.js
git commit -m "feat: seccion canciones del panel de administracion"
```

---

## Tarea 12: `admin.html` y montaje del panel

**Archivos:**
- Crear: `campamento-2026/admin.html`
- Crear: `campamento-2026/css/admin.css`
- Crear: `campamento-2026/js/admin/principal-admin.js`

**Interfaces:**
- Consume: `obtenerClaveSesion`, `guardarClaveSesion`, `borrarClaveSesion`, `llamarApi`, `mensajeDeErrorAdmin` de la Tarea 8; `iniciar(contenedor, clave)` de las Tareas 9, 10 y 11.

- [ ] **Paso 1: Escribir `css/admin.css`**

```css
/* admin.css — panel de administracion. Reutiliza los tokens del sitio publico. */

body.admin {
  background: var(--hueso);
  color: var(--vino);
  min-height: 100vh;
}

.admin-contenedor {
  max-width: 48rem;
  margin-inline: auto;
  padding: var(--esp-4) var(--esp-3);
}

.admin-titulo {
  text-align: center;
  margin-bottom: var(--esp-4);
}

.admin-clave {
  display: grid;
  gap: var(--esp-3);
  max-width: 24rem;
  margin-inline: auto;
  text-align: center;
}

.admin-clave input {
  font: inherit;
  padding: var(--esp-2) var(--esp-3);
  border: 0.125rem solid var(--vino);
  border-radius: var(--radio-pill);
  text-align: center;
}

.admin-seccion {
  border-top: 0.125rem solid rgba(85, 11, 24, 0.15);
  padding-block: var(--esp-4);
}

.panel-lista {
  display: grid;
  gap: var(--esp-3);
  margin-bottom: var(--esp-3);
}

.panel-tarjeta {
  background: var(--crema);
  border-radius: var(--radio-tarjeta);
  padding: var(--esp-3);
  display: grid;
  gap: var(--esp-2);
}

.panel-fila {
  display: flex;
  gap: var(--esp-2);
  align-items: center;
}

.panel-fila input {
  flex: 1;
  font: inherit;
  padding: var(--esp-2);
  border: 0.0625rem solid rgba(85, 11, 24, 0.3);
  border-radius: 0.5rem;
}

.panel-tarjeta > input {
  font: inherit;
  padding: var(--esp-2);
  border: 0.0625rem solid rgba(85, 11, 24, 0.3);
  border-radius: 0.5rem;
}

.panel-quitar {
  border: none;
  background: transparent;
  color: var(--vino);
  font-size: 1.25rem;
  line-height: 1;
  padding: var(--esp-1);
}

.panel-quitar-habitacion {
  border: 0.0625rem solid var(--vino);
  background: transparent;
  color: var(--vino);
  border-radius: var(--radio-pill);
  padding: var(--esp-1) var(--esp-3);
  justify-self: start;
}

.panel-bloque-letra {
  display: grid;
  gap: var(--esp-2);
  padding: var(--esp-2);
  border: 0.0625rem solid rgba(85, 11, 24, 0.2);
  border-radius: 0.5rem;
}

.panel-bloque-letra textarea {
  font: inherit;
  padding: var(--esp-2);
  border: 0.0625rem solid rgba(85, 11, 24, 0.3);
  border-radius: 0.5rem;
  resize: vertical;
}

.panel-guardar {
  background: var(--vino);
  color: var(--crema);
}

.panel-estado {
  text-align: center;
  font-weight: 600;
  min-height: 1.5em;
}
```

- [ ] **Paso 2: Escribir `js/admin/principal-admin.js`**

```js
// principal-admin.js — pide la contraseña y monta las tres secciones del panel.

import { obtenerClaveSesion, guardarClaveSesion, borrarClaveSesion, llamarApi, mensajeDeErrorAdmin } from "./clave.js";

async function iniciarPanel() {
  const contenedorClave = document.querySelector("#admin-clave");
  const contenedorSecciones = document.querySelector("#admin-secciones");

  async function intentarConClave(clave) {
    try {
      await llamarApi("verificarClave", null, clave);
      guardarClaveSesion(clave);
      await montarSecciones(clave);
      return true;
    } catch (error) {
      return false;
    }
  }

  async function montarSecciones(clave) {
    contenedorClave.hidden = true;
    contenedorSecciones.hidden = false;

    const [habitacionesPanel, programacionPanel, cancionesPanel] = await Promise.all([
      import("./habitaciones-panel.js"),
      import("./programacion-panel.js"),
      import("./canciones-panel.js"),
    ]);

    const seccionHabitaciones = document.createElement("section");
    seccionHabitaciones.className = "admin-seccion";
    const seccionProgramacion = document.createElement("section");
    seccionProgramacion.className = "admin-seccion";
    const seccionCanciones = document.createElement("section");
    seccionCanciones.className = "admin-seccion";

    contenedorSecciones.append(seccionHabitaciones, seccionProgramacion, seccionCanciones);

    await habitacionesPanel.iniciar(seccionHabitaciones, clave);
    await programacionPanel.iniciar(seccionProgramacion, clave);
    await cancionesPanel.iniciar(seccionCanciones, clave);
  }

  const formulario = document.querySelector("#admin-clave-formulario");
  const campoClave = document.querySelector("#admin-clave-campo");
  const errorClave = document.querySelector("#admin-clave-error");

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    errorClave.textContent = "Verificando…";
    const exito = await intentarConClave(campoClave.value);
    if (!exito) {
      errorClave.textContent = "Contraseña incorrecta.";
      borrarClaveSesion();
    }
  });

  const claveGuardada = obtenerClaveSesion();
  if (claveGuardada) {
    const exito = await intentarConClave(claveGuardada);
    if (!exito) borrarClaveSesion();
  }
}

iniciarPanel().catch((error) => {
  console.error("No se pudo iniciar el panel:", error);
});
```

- [ ] **Paso 3: Escribir `admin.html`**

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Panel de administración — Campamento 2026</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/admin.css">
</head>
<body class="admin">
  <div class="admin-contenedor">
    <h1 class="admin-titulo">Panel de administración</h1>

    <div id="admin-clave">
      <form id="admin-clave-formulario" class="admin-clave">
        <label for="admin-clave-campo">Contraseña del panel</label>
        <input id="admin-clave-campo" type="password" autocomplete="off" required>
        <button type="submit" class="pill">Entrar</button>
        <p id="admin-clave-error" role="alert"></p>
      </form>
    </div>

    <div id="admin-secciones" hidden></div>
  </div>

  <script type="module" src="js/admin/principal-admin.js"></script>
</body>
</html>
```

- [ ] **Paso 4: Verificar en el navegador**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && python -m http.server 8000
```

Con `CONFIG.urlAppsScript` todavía vacío, abre `http://localhost:8000/admin.html`. Esperado: aparece el formulario de contraseña; al escribir cualquier cosa y pulsar "Entrar", `llamarApi` falla (no hay URL configurada) y se muestra "Contraseña incorrecta." — es el comportamiento correcto mientras el Apps Script no está desplegado; se reverifica de punta a punta una vez esté publicado (Tarea 7, Paso 3 en adelante).

Una vez publicado el Apps Script y con la URL puesta en `CONFIG.urlAppsScript`, repite: contraseña incorrecta muestra el aviso sin mostrar las secciones; contraseña correcta muestra las tres secciones con el contenido real de la hoja de cálculo. Agrega una habitación, un integrante, una actividad y una canción, guarda cada sección, y confirma en la hoja de cálculo y en el sitio público (`http://localhost:8000/`, tras esperar el minuto de caché) que los cambios aparecen.

- [ ] **Paso 5: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026/admin.html campamento-2026/css/admin.css campamento-2026/js/admin/principal-admin.js
git commit -m "feat: pagina del panel de administracion con entrada por contraseña"
```

---

## Tarea 13: Documentación y verificación final

**Archivos:**
- Modificar: `campamento-2026/README.md`
- Modificar: `campamento-2026/VERIFICACION.md`

- [ ] **Paso 1: Correr toda la suite de pruebas**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `49 pasaron, 0 fallaron, 1 solo navegador`.

Luego en `http://localhost:8000/pruebas.html`, esperado: `50 pasaron, 0 fallaron`.

- [ ] **Paso 2: Añadir la sección del panel a `README.md`**

Añade al final de `campamento-2026/README.md`:

```markdown

## Panel de administración

`admin.html` permite editar habitaciones, programación y canciones sin tocar
archivos. Para que funcione:

1. El Apps Script (`apps-script/Codigo.gs`) debe estar publicado — ver la
   sección "Las fotos" arriba.
2. Corre `configurarPanel()` una vez desde el editor de Apps Script para
   crear la hoja de cálculo del panel.
3. Corre `establecerClave()` una vez (con la contraseña real puesta en el
   código antes de ejecutar, y borrada del código después) para fijar la
   contraseña.
4. Comparte el enlace a `admin.html` y la contraseña solo con la persona de
   confianza que va a editar el contenido.

La carta de bienvenida, la locación y los contactos **siguen editándose a
mano** en sus archivos JSON — no pasaron al panel porque cambian una sola
vez al año.
```

- [ ] **Paso 3: Añadir los pendientes del panel a `VERIFICACION.md`**

Añade una nueva sección en `campamento-2026/VERIFICACION.md`, después de la sección "## Antes de publicar":

```markdown

## Panel de administración

- [ ] Correr `configurarPanel()` una vez desde el editor de Apps Script
- [ ] Correr `establecerClave()` una vez con la contraseña real
- [ ] Compartir el enlace a `admin.html` y la contraseña solo con la persona
      de confianza
- [ ] Probar agregar una habitación, un integrante, una actividad y una
      canción desde el panel, y confirmar que aparecen en el sitio público
      (hasta 60 segundos de espera por la caché)
- [ ] Probar una contraseña incorrecta y confirmar que no se guarda nada
- [ ] Abrir la hoja de cálculo del panel y confirmar que "Ver historial de
      versiones" funciona, como red de seguridad ante un borrado accidental
```

- [ ] **Paso 4: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026/README.md campamento-2026/VERIFICACION.md
git commit -m "docs: documenta el panel de administracion"
```

---

## Cobertura de la especificación

| Requisito de la especificación | Dónde se cumple |
|---|---|
| §3 Arquitectura, flujo de datos | Tareas 1, 6, 7 |
| §4 Modelo de datos en Sheets | Tarea 7 (`configurarPanel`, `leerHabitaciones/Programacion/Canciones`) |
| §5 Lectura pública sin contraseña | Tarea 6 |
| §5 Escritura con contraseña, reemplazo completo de pestañas | Tarea 7 |
| §5 Nota de compatibilidad de `accion` en fotos | Tarea 6 |
| §6 Tres secciones del panel, agregar/quitar | Tareas 9, 10, 11 |
| §6 Bloques de letra por estrofa/coro | Tarea 11 |
| §7 Confiabilidad: vivo + respaldo local | Tareas 1, 3, 4, 5 |
| §8 Manejo de errores del panel | Tareas 8, 9, 10, 11 (mensajes vía `mensajeDeErrorAdmin`) |
| §9 Pruebas de lógica pura | Tareas 1, 2, 8, 9, 10, 11 |
| §11 Nota de implementación pendiente (publicar Apps Script) | Tarea 7, Paso 3; `VERIFICACION.md` |
