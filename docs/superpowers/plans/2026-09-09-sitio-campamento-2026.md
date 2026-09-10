# Sitio Campamento Itagüí 2026 — Plan de implementación

> **Para agentes ejecutores:** SUB-SKILL REQUERIDA: usa `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para implementar este plan tarea por tarea. Los pasos usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** construir el sitio estático de una sola pantalla larga del Campamento Itagüí 2026, con carta animada, programación, habitaciones, libro de canciones, locación y subida pública de fotos a Google Drive.

**Arquitectura:** HTML + CSS + módulos ES nativos, sin paso de compilación. Cada sección es un módulo de `js/` que expone `iniciar(contenedor)` y solo conoce su propio bloque del DOM y su archivo de `datos/`. `js/principal.js` monta cada módulo dentro de su propio `try/catch`, de modo que la falla de una sección nunca tumba las demás. Las fotos viajan a Drive a través de un Google Apps Script publicado como aplicación web.

**Pila técnica:** HTML5, CSS3 (custom properties, grid, `clamp()`), JavaScript ES2022 con módulos nativos, Google Apps Script. Sin dependencias en tiempo de ejecución. Node 22 y Python 3.12 se usan **solo en desarrollo** (correr pruebas y convertir fuentes); el sitio publicado no los necesita.

**Especificación de origen:** `docs/superpowers/specs/2026-09-09-sitio-campamento-2026-design.md`

---

## Restricciones globales

Todo lo de esta sección aplica a **todas** las tareas. No se repite en cada una.

- **Idioma:** todo el contenido visible, los nombres de archivo, las variables, las funciones y los comentarios van en **español**. Los mensajes de error dicen qué pasó y qué hacer; nunca se muestra un error técnico crudo.
- **Paleta, exclusiva.** `--vino: #550b18`, `--crema: #fef9dd`, `--hueso: #fbf8f3`. Fuera de esos tres, solo grises neutros con alfa para sombras. Ningún otro color.
- **Tipografías:** `TAN Meringue` solo para títulos de sección y portada. `Poppins` para absolutamente todo lo demás. Servidas desde `fuentes/` en `.woff2`, con `font-display: swap`. **Prohibido Google Fonts y cualquier CDN externo.**
- **Sin paso de compilación.** Nada de bundlers ni transpiladores. Publicar es copiar la carpeta `campamento-2026/`.
- **Sin dependencias externas en tiempo de ejecución.** Ninguna librería de terceros.
- **Aislamiento.** Un módulo de sección no importa a otro módulo de sección. Solo puede importar de `js/util/` y de `js/config.js`. Si necesitas algo de otra sección, es señal de que va en `js/util/`.
- **Punto de entrada único.** Cada módulo de sección exporta `export function iniciar(contenedor)`. Lo único que además puede exportar son funciones puras que las pruebas necesiten.
- **Mobile-first.** Se escribe primero el CSS de celular y se sube con `@media (min-width: 48rem)`. Nunca al revés.
- **Movimiento reducido.** Toda animación se desactiva bajo `@media (prefers-reduced-motion: reduce)`.
- **Accesibilidad:** foco visible en todo elemento interactivo, `alt` en toda imagen, jerarquía correcta de encabezados, y ningún control que solo funcione con ratón.
- **Nada de `innerHTML` con datos.** El contenido de `datos/*.json` y los nombres de quienes suben fotos se insertan siempre con `textContent` o `createElement`. `innerHTML` solo se admite con la cadena vacía `""` para limpiar un contenedor.
- **Carpeta de Drive:** `1p-ykfs2etU-lzjuuQkesMDApvR9PC0Tb`. Va **únicamente** dentro de `apps-script/Codigo.gs`, nunca en `js/config.js`.
- **Commits:** en español, formato `tipo: descripción` (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- **Pruebas:** un solo archivo de casos, `pruebas/casos.js`, consumido por dos ejecutores: `pruebas.html` (navegador, lo que pide la especificación §10) y `node pruebas/ejecutar-en-node.js` (terminal, para el ciclo TDD). Cada caso declara `entorno: "ambos"` o `entorno: "navegador"`.

### Decisiones tomadas al planificar, con su motivo

Tres puntos donde este plan refina la especificación. Están anotados para que quien ejecute no los tome por error:

1. **`contenido.js` se divide en tres módulos.** La especificación §4 lista un `contenido.js` que carga programación, locación y contactos, pero también manda que cada archivo de `js/` sea responsable de una sola sección. Gana el principio de aislamiento: se crean `programacion.js`, `locacion.js` y `pie.js` por separado, y el cargador de JSON compartido vive en `js/util/datos.js`.
2. **Módulos ES nativos, servidos por HTTP.** Los `import` no funcionan al abrir un archivo con `file://`. Para ver el sitio en local se corre `python -m http.server 8000` dentro de `campamento-2026/` (Python ya está instalado en la máquina). Editar `datos/*.json` y publicar en Netlify no requiere nada de esto. El «no requiere instalar nada» de la especificación §10 se conserva: no hay que instalar npm, ni jest, ni un entorno de desarrollo.
3. **La subida usa `XMLHttpRequest`, no `fetch`.** La especificación §7.6 pide barra de progreso individual por foto, y `fetch` no expone el progreso de subida. `XMLHttpRequest` sí, mediante `upload.onprogress`, y con `Content-Type: text/plain;charset=utf-8` sigue siendo una «petición simple» que no dispara la verificación CORS previa, que es lo que la especificación §6 exige preservar.

### Contenido pendiente del liderazgo

El sitio se construye con datos de ejemplo funcionales. Estos valores llevan la marca `PENDIENTE` y hay que reemplazarlos antes del campamento: enlace del grupo de WhatsApp, contactos de emergencia, texto de la carta, habitaciones con integrantes, logos en `img/`, punto exacto de la finca en Maps, URL del Apps Script publicado.

**Duda a confirmar con el liderazgo:** en el boceto, el sábado tiene «Cena» y «Noche de alabanza» ambas a las 8:00 PM. Se transcribe tal cual aparece en el boceto y se deja anotado; no se inventa una hora.

---

## Estructura de archivos

Todo el sitio vive en `campamento-2026/`, dentro del directorio del proyecto.

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Esqueleto: un `<section>` vacío por bloque, con su `id`. No contiene contenido de datos. |
| `README.md` | Cómo editar los datos, ver el sitio en local, publicar y moderar fotos. |
| `package.json` | Solo `{"private": true, "type": "module"}`, para que Node trate los `.js` como módulos ES al correr las pruebas. Sin dependencias ni scripts de compilación. |
| `netlify.toml` | Declara que no hay comando de compilación y que se publica la carpeta tal cual. |
| `css/tokens.css` | `@font-face`, colores, escala tipográfica, espaciado, radios, sombras. |
| `css/base.css` | Reset, tipografía base, utilidades, foco, avisos de fallo, movimiento reducido. |
| `css/secciones.css` | Estilos propios de cada bloque, ordenados por sección. |
| `js/config.js` | URL del Apps Script y constantes de la galería. |
| `js/util/datos.js` | `cargarJSON` y `mostrarFallo`. |
| `js/util/texto.js` | `normalizar`: minúsculas sin acentos, para el buscador. |
| `js/util/red.js` | `conReintento`: reintento con espera. |
| `js/principal.js` | Monta cada módulo en su `try/catch`. Único archivo que conoce a todos los demás. |
| `js/carta.js` | Portada y sobre animado. |
| `js/habitaciones.js` | Tarjetas de habitación, plegables en celular. |
| `js/programacion.js` | Tres días; columnas en escritorio, pestañas en celular. |
| `js/canciones.js` | Filtro, listado, letra y modo pantalla completa. |
| `js/locacion.js` | Mapa diferido, botones de navegación, copiar dirección. |
| `js/imagen.js` | Validación, cálculo de medidas, compresión y base64. |
| `js/galeria.js` | Subida con progreso, carrusel, visor ampliado, paginación. |
| `js/navegacion.js` | Barra fija de navegación entre secciones. |
| `js/pie.js` | Logos, WhatsApp y contactos de emergencia. |
| `datos/*.json` | Seis archivos. Lo único que se edita cada año. |
| `fuentes/` | `TAN MERINGUE.woff2` y cuatro pesos de Poppins en `.woff2`. |
| `img/` | Logos y sello. |
| `pruebas.html` | Ejecutor de pruebas en navegador. |
| `pruebas/afirmar.js` | `igual`, `cierto`, `lanza`. |
| `pruebas/casos.js` | Todos los casos. Fuente única para los dos ejecutores. |
| `pruebas/ejecutar-en-node.js` | Ejecutor de terminal. Salta los casos de solo navegador. |
| `apps-script/Codigo.gs` | `doPost` y `doGet`. Se pega en script.google.com; **no se publica con el sitio**. |

---

## Tarea 1: Andamiaje, fuentes, tokens y arnés de pruebas

Deja el proyecto en pie: carpetas, las cinco fuentes en `.woff2`, la paleta como custom properties, y un arnés de pruebas que corre en verde con un caso trivial. Sin esto ninguna tarea posterior puede probarse.

**Archivos:**
- Crear: `campamento-2026/package.json`
- Crear: `campamento-2026/netlify.toml`
- Crear: `campamento-2026/css/tokens.css`
- Crear: `campamento-2026/css/base.css`
- Crear: `campamento-2026/css/secciones.css`
- Crear: `campamento-2026/index.html`
- Crear: `campamento-2026/README.md`
- Crear: `campamento-2026/pruebas/afirmar.js`
- Crear: `campamento-2026/pruebas/casos.js`
- Crear: `campamento-2026/pruebas/ejecutar-en-node.js`
- Crear: `campamento-2026/pruebas.html`
- Crear: `campamento-2026/fuentes/` (5 archivos `.woff2`)

**Interfaces:**
- Produce: `pruebas/afirmar.js` exporta `igual(real, esperado, mensaje)`, `cierto(condicion, mensaje)`, `lanza(fn, mensaje)`. `pruebas/casos.js` exporta `casos`, un array de `{ nombre, entorno, ejecutar }` donde `entorno` es `"ambos"` o `"navegador"` y `ejecutar` es una función `async` que lanza si el caso falla.
- Produce: los tokens CSS que consume todo el resto: `--vino`, `--crema`, `--hueso`, `--fuente-titulo`, `--fuente-texto`, `--radio-tarjeta`, `--radio-pill`, `--sombra-tarjeta`, `--esp-1` … `--esp-6`.

- [ ] **Paso 1: Crear el árbol de carpetas**

```bash
cd "D:/Página Campamento Itagüí"
mkdir -p campamento-2026/{css,js/util,datos,fuentes,img,pruebas,apps-script}
```

- [ ] **Paso 2: Extraer las fuentes de origen**

```bash
cd "D:/Página Campamento Itagüí"
mkdir -p .fuentes-origen
unzip -o -j "TAN-Meringue-Font.zip" "TAN-Meringue-Font/TAN MERINGUE.woff2" -d .fuentes-origen
unzip -o -j "poppins.zip" "Poppins-Regular.ttf" "Poppins-Medium.ttf" "Poppins-SemiBold.ttf" "Poppins-Bold.ttf" "OFL.txt" -d .fuentes-origen
cp ".fuentes-origen/TAN MERINGUE.woff2" campamento-2026/fuentes/
cp ".fuentes-origen/OFL.txt" campamento-2026/fuentes/POPPINS-OFL.txt
ls -la campamento-2026/fuentes/
```

Esperado: `TAN MERINGUE.woff2` (≈21 KB) y `POPPINS-OFL.txt` en `campamento-2026/fuentes/`.

- [ ] **Paso 3: Convertir los cuatro pesos de Poppins a `.woff2`**

`fonttools` y `brotli` se instalan solo en la máquina de desarrollo. No son dependencias del sitio.

```bash
cd "D:/Página Campamento Itagüí"
python -m pip install --quiet fonttools brotli
python - <<'PY'
from fontTools.ttLib import TTFont
for peso in ["Regular", "Medium", "SemiBold", "Bold"]:
    fuente = TTFont(f".fuentes-origen/Poppins-{peso}.ttf")
    fuente.flavor = "woff2"
    fuente.save(f"campamento-2026/fuentes/Poppins-{peso}.woff2")
    print(f"Poppins-{peso}.woff2 listo")
PY
ls -la campamento-2026/fuentes/
```

Esperado: cinco `.woff2` en total. Cada Poppins ronda los 40–60 KB; si alguno supera los 100 KB, la conversión falló y hay que revisarla.

- [ ] **Paso 4: Escribir `package.json` y `netlify.toml`**

`campamento-2026/package.json`:

```json
{
  "private": true,
  "type": "module",
  "name": "campamento-itagui-2026",
  "description": "Sitio del Campamento Itagui 2026. El campo type:module solo sirve para correr las pruebas con Node; el sitio no necesita compilarse."
}
```

`campamento-2026/netlify.toml`:

```toml
# El sitio es estatico puro: no hay nada que compilar.
[build]
  publish = "."
  command = ""
```

- [ ] **Paso 5: Escribir `css/tokens.css`**

```css
/* tokens.css — origen unico de fuentes, color, escala y espaciado. */

@font-face {
  font-family: "TAN Meringue";
  src: url("../fuentes/TAN MERINGUE.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Poppins";
  src: url("../fuentes/Poppins-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Poppins";
  src: url("../fuentes/Poppins-Medium.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Poppins";
  src: url("../fuentes/Poppins-SemiBold.woff2") format("woff2");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Poppins";
  src: url("../fuentes/Poppins-Bold.woff2") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

:root {
  /* Color — paleta de marca, cerrada. */
  --vino: #550b18;
  --crema: #fef9dd;
  --hueso: #fbf8f3;

  /* Grises neutros, unicamente para sombras y veladuras. */
  --sombra-tarjeta: 0 0.25rem 1rem rgba(0, 0, 0, 0.14);
  --sombra-flotante: 0 -0.125rem 0.75rem rgba(0, 0, 0, 0.18);
  --velo-oscuro: rgba(0, 0, 0, 0.72);

  /* Tipografia */
  --fuente-titulo: "TAN Meringue", Georgia, "Times New Roman", serif;
  --fuente-texto: "Poppins", system-ui, -apple-system, "Segoe UI", sans-serif;

  /* Escala fluida: crece con la pantalla sin saltos. */
  --txt-portada: clamp(2.75rem, 13vw, 7rem);
  --txt-seccion: clamp(2rem, 8vw, 3.5rem);
  --txt-titular: clamp(1.25rem, 4.5vw, 1.75rem);
  --txt-cuerpo: clamp(1rem, 3.6vw, 1.0625rem);
  --txt-menor: 0.875rem;

  /* Espaciado */
  --esp-1: 0.25rem;
  --esp-2: 0.5rem;
  --esp-3: 1rem;
  --esp-4: 1.5rem;
  --esp-5: 2.5rem;
  --esp-6: 4rem;

  /* Formas */
  --radio-tarjeta: 1.75rem;
  --radio-pill: 999rem;
  --ancho-maximo: 72rem;

  /* Alto de la barra de navegacion, para reservar espacio al final del body. */
  --alto-navegacion: 4rem;
}
```

- [ ] **Paso 6: Escribir `css/base.css`**

```css
/* base.css — reset, tipografia base, utilidades y estados compartidos. */

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--vino);
  color: var(--crema);
  font-family: var(--fuente-texto);
  font-size: var(--txt-cuerpo);
  font-weight: 400;
  line-height: 1.6;
  /* Deja sitio a la barra fija inferior en celular. */
  padding-bottom: var(--alto-navegacion);
}

h1,
h2,
h3 {
  font-family: var(--fuente-titulo);
  font-weight: 400;
  line-height: 1.05;
  margin: 0;
}

p {
  margin: 0 0 var(--esp-3);
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

button {
  font: inherit;
  color: inherit;
  cursor: pointer;
}

a {
  color: inherit;
}

/* Foco visible y consistente en todo elemento interactivo. */
:focus-visible {
  outline: 0.1875rem solid currentColor;
  outline-offset: 0.1875rem;
  border-radius: 0.25rem;
}

.contenedor {
  width: 100%;
  max-width: var(--ancho-maximo);
  margin-inline: auto;
  padding-inline: var(--esp-3);
}

.seccion {
  padding-block: var(--esp-5);
}

.seccion__titulo {
  font-size: var(--txt-seccion);
  text-align: center;
  margin-bottom: var(--esp-4);
}

/* Fondo hueso para las secciones claras. */
.seccion--clara {
  background: var(--hueso);
  color: var(--vino);
}

.pill {
  display: inline-block;
  border: none;
  border-radius: var(--radio-pill);
  background: var(--crema);
  color: var(--vino);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  padding: var(--esp-3) var(--esp-5);
  text-align: center;
}

/* Visible solo para lectores de pantalla. */
.solo-lectores {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* Aviso de fallo — lo pinta mostrarFallo() en cualquier seccion. */
.aviso-fallo {
  text-align: center;
  padding: var(--esp-4);
}

.aviso-fallo p {
  margin-bottom: var(--esp-3);
}

.boton-reintentar {
  border: 0.125rem solid currentColor;
  background: transparent;
  border-radius: var(--radio-pill);
  padding: var(--esp-2) var(--esp-4);
  font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}

@media (min-width: 48rem) {
  body {
    /* En escritorio la barra va arriba. */
    padding-bottom: 0;
    padding-top: var(--alto-navegacion);
  }

  .seccion {
    padding-block: var(--esp-6);
  }
}
```

- [ ] **Paso 7: Crear `css/secciones.css` vacío**

Cada tarea posterior le añade su bloque. Se crea ahora para que `index.html` pueda enlazarlo.

```css
/* secciones.css — estilos propios de cada bloque, en el orden de la pagina. */
```

- [ ] **Paso 8: Escribir `index.html`**

Solo el esqueleto. Cada `<section>` va vacía; su módulo la llena.

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Campamento Itagüí 2026 — Derramaré de mi Espíritu</title>
  <meta name="description" content="Guía del Campamento Itagüí 2026: programación, habitaciones, canciones, cómo llegar y las fotos de todos.">
  <meta name="theme-color" content="#550b18">
  <link rel="preload" href="fuentes/TAN MERINGUE.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="fuentes/Poppins-Regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/secciones.css">
</head>
<body>
  <a class="solo-lectores" href="#programacion">Saltar al contenido</a>

  <nav id="navegacion" aria-label="Secciones del sitio"></nav>

  <main>
    <section id="portada" aria-label="Portada"></section>
    <section id="habitaciones" class="seccion" aria-labelledby="titulo-habitaciones"></section>
    <section id="programacion" class="seccion seccion--clara" aria-labelledby="titulo-programacion"></section>
    <section id="canciones" class="seccion" aria-labelledby="titulo-canciones"></section>
    <section id="locacion" class="seccion seccion--clara" aria-labelledby="titulo-locacion"></section>
    <section id="fotos" class="seccion" aria-labelledby="titulo-fotos"></section>
  </main>

  <footer id="pie" class="seccion--clara"></footer>

  <script type="module" src="js/principal.js"></script>
</body>
</html>
```

- [ ] **Paso 9: Escribir `pruebas/afirmar.js`**

```js
// afirmar.js — tres comprobaciones. Fallar es lanzar un Error con un mensaje util.

export function igual(real, esperado, mensaje) {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a !== b) {
    throw new Error(
      `${mensaje || "Los valores no coinciden"}\n    esperado: ${b}\n    recibido: ${a}`
    );
  }
}

export function cierto(condicion, mensaje) {
  if (!condicion) {
    throw new Error(mensaje || "Se esperaba una condicion verdadera");
  }
}

export async function lanza(accion, mensaje) {
  try {
    await accion();
  } catch (error) {
    return error;
  }
  throw new Error(mensaje || "Se esperaba un error y no ocurrio");
}
```

- [ ] **Paso 10: Escribir el caso trivial en `pruebas/casos.js`**

Este caso solo demuestra que el arnés funciona. Las tareas siguientes añaden casos reales a este mismo array.

```js
// casos.js — fuente unica de casos de prueba.
// entorno "ambos": corre en Node y en el navegador.
// entorno "navegador": necesita DOM, canvas o APIs del navegador; Node lo salta.

import { igual } from "./afirmar.js";

export const casos = [
  {
    nombre: "El arnes de pruebas funciona",
    entorno: "ambos",
    ejecutar() {
      igual(1 + 1, 2, "La suma basica deberia funcionar");
    },
  },
];
```

- [ ] **Paso 11: Escribir `pruebas/ejecutar-en-node.js`**

```js
// ejecutar-en-node.js — ejecutor de terminal, para el ciclo de desarrollo.
// Uso: node pruebas/ejecutar-en-node.js   (desde campamento-2026/)

import { casos } from "./casos.js";

let pasaron = 0;
let fallaron = 0;
let saltados = 0;

for (const caso of casos) {
  if (caso.entorno === "navegador") {
    saltados += 1;
    console.log(`  ~ ${caso.nombre}  (solo navegador)`);
    continue;
  }
  try {
    await caso.ejecutar();
    pasaron += 1;
    console.log(`  \u2713 ${caso.nombre}`);
  } catch (error) {
    fallaron += 1;
    console.log(`  \u2717 ${caso.nombre}\n    ${error.message}`);
  }
}

console.log(`\n${pasaron} pasaron, ${fallaron} fallaron, ${saltados} solo navegador`);
process.exit(fallaron > 0 ? 1 : 0);
```

- [ ] **Paso 12: Escribir `pruebas.html`**

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pruebas — Campamento 2026</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem auto; max-width: 50rem; padding-inline: 1rem; }
    h1 { font-size: 1.5rem; }
    ol { list-style: none; padding: 0; }
    li { padding: 0.5rem 0.75rem; border-radius: 0.375rem; margin-bottom: 0.25rem; }
    li.pasa { background: #e6f4ea; color: #14532d; }
    li.falla { background: #fdeaea; color: #7f1d1d; }
    pre { margin: 0.5rem 0 0; white-space: pre-wrap; font-size: 0.8125rem; }
    #resumen { font-weight: 700; font-size: 1.125rem; margin-top: 1.5rem; }
  </style>
</head>
<body>
  <h1>Pruebas del sitio del Campamento 2026</h1>
  <p>Ábrela con el sitio servido por HTTP: <code>python -m http.server 8000</code> y entra a
    <code>http://localhost:8000/pruebas.html</code>.</p>
  <ol id="resultados"></ol>
  <p id="resumen">Ejecutando…</p>

  <script type="module">
    import { casos } from "./pruebas/casos.js";

    const lista = document.querySelector("#resultados");
    const resumen = document.querySelector("#resumen");
    let pasaron = 0;
    let fallaron = 0;

    for (const caso of casos) {
      const fila = document.createElement("li");
      try {
        await caso.ejecutar();
        pasaron += 1;
        fila.className = "pasa";
        fila.textContent = `\u2713 ${caso.nombre}`;
      } catch (error) {
        fallaron += 1;
        fila.className = "falla";
        fila.textContent = `\u2717 ${caso.nombre}`;
        const detalle = document.createElement("pre");
        detalle.textContent = error.message;
        fila.append(detalle);
      }
      lista.append(fila);
    }

    resumen.textContent = `${pasaron} pasaron, ${fallaron} fallaron`;
    resumen.style.color = fallaron > 0 ? "#7f1d1d" : "#14532d";
  </script>
</body>
</html>
```

- [ ] **Paso 13: Correr las pruebas y verificar que pasan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado:
```
  ✓ El arnes de pruebas funciona

1 pasaron, 0 fallaron, 0 solo navegador
```

- [ ] **Paso 14: Verificar que el sitio se sirve y las fuentes cargan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && python -m http.server 8000
```

Abre `http://localhost:8000/`. Esperado: fondo vino, sin errores en la consola, y las cinco peticiones de `.woff2` con estado 200 en la pestaña Red.

- [ ] **Paso 15: Escribir `README.md`**

```markdown
# Sitio del Campamento Itagüí 2026

Sitio estático. No hay nada que compilar: publicar es copiar esta carpeta.

## Editar el contenido

Todo lo que cambia cada año está en `datos/`. Son archivos JSON; se abren con el
Bloc de notas. **Guárdalos siempre en codificación UTF-8**, o los acentos se romperán.

| Archivo | Qué contiene |
|---|---|
| `carta.json` | El mensaje de bienvenida del sobre. |
| `programacion.json` | Los bloques de los tres días. |
| `canciones.json` | El libro de canciones. |
| `habitaciones.json` | Las habitaciones y quién duerme en cada una. |
| `locacion.json` | La finca, el mapa y los enlaces de navegación. |
| `contactos.json` | El grupo de WhatsApp y los contactos de emergencia. |

## Ver el sitio en el computador

El sitio usa módulos de JavaScript, que el navegador no carga al abrir el archivo
directamente. Hay que servirlo. Con Python instalado:

```
cd campamento-2026
python -m http.server 8000
```

Y abre `http://localhost:8000`.

## Publicar

Arrastra la carpeta `campamento-2026` a [app.netlify.com/drop](https://app.netlify.com/drop).
No configures ningún comando de compilación.

## Las fotos

Las fotos que suben los asistentes van a una carpeta de Google Drive.
**Para borrar una foto del sitio, bórrala de la carpeta de Drive.** Desaparece del
carrusel en menos de un minuto.

El puente con Drive es el archivo `apps-script/Codigo.gs`, que **no se publica con el
sitio**: se pega en script.google.com. Las instrucciones están dentro del propio archivo.

## Pruebas

- En el navegador: `http://localhost:8000/pruebas.html`
- En la terminal: `node pruebas/ejecutar-en-node.js`
```

- [ ] **Paso 16: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git init 2>/dev/null || true
printf '.fuentes-origen/\n' >> .gitignore
git add campamento-2026 .gitignore docs
git commit -m "feat: andamiaje del sitio, fuentes locales, tokens y arnes de pruebas"
```

---

## Tarea 2: Cargador de datos y arranque aislado

El cargador de JSON con su manejo de fallo, y el arranque que garantiza que una sección rota no tumba las demás. Es el contrato que cumplen las seis secciones siguientes.

**Archivos:**
- Crear: `campamento-2026/js/util/datos.js`
- Crear: `campamento-2026/js/principal.js`
- Modificar: `campamento-2026/pruebas/casos.js`

**Interfaces:**
- Consume: `pruebas/afirmar.js` de la Tarea 1.
- Produce: `cargarJSON(ruta, traer = fetch) -> Promise<any>`; lanza `Error` si la respuesta no es `ok`.
- Produce: `mostrarFallo(contenedor, alReintentar) -> void`; vacía el contenedor y pinta el aviso con botón.
- Produce: `montarSeccion(contenedor, cargar, pintar)`; encapsula el ciclo cargar → pintar → si falla, aviso con reintento. Lo usan todas las secciones que leen JSON.

- [ ] **Paso 1: Escribir los casos que fallan**

Añade estos tres casos al array `casos` de `pruebas/casos.js`, y el import correspondiente arriba del archivo:

```js
import { cargarJSON } from "../js/util/datos.js";
```

```js
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
```

Actualiza también el import de `afirmar.js` para traer las tres funciones:

```js
import { igual, cierto, lanza } from "./afirmar.js";
```

- [ ] **Paso 2: Correr las pruebas y verificar que fallan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: falla al importar, con `Cannot find module` apuntando a `js/util/datos.js`.

- [ ] **Paso 3: Escribir `js/util/datos.js`**

```js
// datos.js — lectura de los archivos de datos/ y el aviso de fallo compartido.

/**
 * Lee un JSON de datos/. El segundo parametro existe para poder probar
 * la funcion sin servidor: las pruebas le pasan un fetch falso.
 */
export async function cargarJSON(ruta, traer = fetch) {
  const respuesta = await traer(ruta, { cache: "no-cache" });
  if (!respuesta.ok) {
    throw new Error(`No se pudo leer ${ruta} (estado ${respuesta.status})`);
  }
  return await respuesta.json();
}

/**
 * Vacia el contenedor y deja un aviso con boton de reintentar.
 * El resto de la pagina no se toca.
 */
export function mostrarFallo(contenedor, alReintentar) {
  contenedor.innerHTML = "";

  const aviso = document.createElement("div");
  aviso.className = "aviso-fallo";
  aviso.setAttribute("role", "alert");

  const texto = document.createElement("p");
  texto.textContent = "No pudimos cargar esta información.";

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "boton-reintentar";
  boton.textContent = "Reintentar";
  boton.addEventListener("click", alReintentar);

  aviso.append(texto, boton);
  contenedor.append(aviso);
}

/**
 * Ciclo completo de una seccion que lee datos: carga, pinta y, si algo falla,
 * deja el aviso con reintento en su propio contenedor.
 */
export async function montarSeccion(contenedor, cargar, pintar) {
  try {
    const datos = await cargar();
    contenedor.innerHTML = "";
    pintar(contenedor, datos);
  } catch (error) {
    console.error("Fallo al montar una seccion:", error);
    mostrarFallo(contenedor, () => montarSeccion(contenedor, cargar, pintar));
  }
}
```

- [ ] **Paso 4: Correr las pruebas y verificar que pasan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `4 pasaron, 0 fallaron, 0 solo navegador`.

- [ ] **Paso 5: Escribir `js/principal.js`**

Los `import` de secciones que aún no existen se van descomentando en su tarea. Arranca solo con lo que ya está.

```js
// principal.js — monta cada seccion por separado.
// Si un modulo revienta, se registra en consola y los demas siguen su curso.
// Es el unico archivo del proyecto que conoce a todos los modulos.

const secciones = [
  // ["#portada", () => import("./carta.js")],
  // ["#habitaciones", () => import("./habitaciones.js")],
  // ["#programacion", () => import("./programacion.js")],
  // ["#canciones", () => import("./canciones.js")],
  // ["#locacion", () => import("./locacion.js")],
  // ["#fotos", () => import("./galeria.js")],
  // ["#pie", () => import("./pie.js")],
  // ["#navegacion", () => import("./navegacion.js")],
];

for (const [selector, traerModulo] of secciones) {
  const contenedor = document.querySelector(selector);
  if (!contenedor) {
    console.error(`No existe el contenedor ${selector} en index.html`);
    continue;
  }
  traerModulo()
    .then((modulo) => modulo.iniciar(contenedor))
    .catch((error) => console.error(`Fallo la seccion ${selector}:`, error));
}
```

- [ ] **Paso 6: Verificar en el navegador**

Sirve el sitio y abre la consola. Esperado: ningún error. La página sigue mostrando el fondo vino y las secciones vacías.

- [ ] **Paso 7: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026/js campamento-2026/pruebas
git commit -m "feat: cargador de datos con reintento y arranque aislado por seccion"
```

---

## Tarea 3: Portada y carta

Fondo vino, el lema en TAN Meringue, «CAMP 2026» entre dos líneas finas, y el sobre que se abre.

**Archivos:**
- Crear: `campamento-2026/datos/carta.json`
- Crear: `campamento-2026/js/carta.js`
- Modificar: `campamento-2026/css/secciones.css` (añadir bloque de portada)
- Modificar: `campamento-2026/js/principal.js:5` (descomentar la línea de `carta.js`)

**Interfaces:**
- Consume: `montarSeccion`, `cargarJSON` de `js/util/datos.js`.
- Produce: `iniciar(contenedor)`. Deja en el DOM un `#sobre` con `aria-expanded`.

- [ ] **Paso 1: Escribir `datos/carta.json`**

Texto de ejemplo funcional. El liderazgo lo reemplaza.

```json
{
  "titulo": "Carta para ti",
  "parrafos": [
    "Este fin de semana no es un paseo más. Es una cita que Dios preparó contigo antes de que supieras que ibas a venir.",
    "Vas a cantar hasta quedarte sin voz, vas a reírte con gente que apenas conoces y vas a dormir poco. Pero sobre todo, vas a tener tiempo para estar quieto delante de Él.",
    "Trae tu Biblia, trae tu cobija y trae el corazón abierto. Lo demás lo pone Él.",
    "«Derramaré de mi Espíritu sobre toda carne.» Que sea sobre ti."
  ],
  "firma": "Liderazgo TRASCIENDE"
}
```

- [ ] **Paso 2: Escribir `js/carta.js`**

```js
// carta.js — portada y sobre animado. No conoce ninguna otra seccion.

import { cargarJSON, montarSeccion } from "./util/datos.js";

export function iniciar(contenedor) {
  return montarSeccion(
    contenedor,
    () => cargarJSON("datos/carta.json"),
    pintarPortada
  );
}

function pintarPortada(contenedor, carta) {
  const envoltorio = document.createElement("div");
  envoltorio.className = "portada contenedor";

  const lema = document.createElement("h1");
  lema.className = "portada__lema";
  // Dos lineas, como en el boceto.
  const primera = document.createElement("span");
  primera.textContent = "Derramaré de mi";
  const segunda = document.createElement("span");
  segunda.textContent = "Espíritu";
  lema.append(primera, segunda);

  const marca = document.createElement("p");
  marca.className = "portada__marca";
  marca.textContent = "CAMP 2026";

  // El boton pill del boceto: lleva directo a la seccion de habitaciones.
  const aHabitacion = document.createElement("a");
  aHabitacion.className = "pill portada__pill";
  aHabitacion.href = "#habitaciones";
  aHabitacion.textContent = "Conoce tu habitación";

  envoltorio.append(lema, marca, construirSobre(carta), aHabitacion);
  contenedor.append(envoltorio);
}

function construirSobre(carta) {
  const bloque = document.createElement("div");
  bloque.className = "sobre";

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "sobre__tapa";
  boton.id = "sobre";
  boton.setAttribute("aria-expanded", "false");
  boton.setAttribute("aria-controls", "sobre-contenido");

  const sello = document.createElement("span");
  sello.className = "sobre__sello";
  sello.textContent = "TRASCIENDE";

  const rotulo = document.createElement("span");
  rotulo.className = "sobre__rotulo";
  rotulo.textContent = carta.titulo || "Carta para ti";

  boton.append(sello, rotulo);

  const hoja = document.createElement("div");
  hoja.className = "sobre__hoja";
  hoja.id = "sobre-contenido";
  hoja.hidden = true;

  const titulo = document.createElement("h2");
  titulo.className = "sobre__titulo";
  titulo.textContent = carta.titulo || "Carta para ti";
  hoja.append(titulo);

  for (const parrafo of carta.parrafos || []) {
    const p = document.createElement("p");
    p.textContent = parrafo;
    hoja.append(p);
  }

  if (carta.firma) {
    const firma = document.createElement("p");
    firma.className = "sobre__firma";
    firma.textContent = carta.firma;
    hoja.append(firma);
  }

  boton.addEventListener("click", () => {
    const abierto = boton.getAttribute("aria-expanded") === "true";
    boton.setAttribute("aria-expanded", String(!abierto));
    bloque.classList.toggle("sobre--abierto", !abierto);
    hoja.hidden = abierto;
    rotulo.textContent = abierto ? (carta.titulo || "Carta para ti") : "Cerrar la carta";
  });

  bloque.append(boton, hoja);
  return bloque;
}
```

- [ ] **Paso 3: Añadir el bloque de portada a `css/secciones.css`**

```css
/* ---------- Portada y carta ---------- */

.portada {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding-block: var(--esp-5);
}

.portada__lema {
  font-size: var(--txt-portada);
  color: var(--crema);
  text-transform: uppercase;
  display: grid;
  gap: 0.1em;
}

.portada__marca {
  font-family: var(--fuente-texto);
  font-weight: 500;
  letter-spacing: 0.5em;
  /* Compensa el espaciado de la ultima letra para que quede centrado. */
  text-indent: 0.5em;
  font-size: var(--txt-titular);
  margin-block: var(--esp-4);
  display: flex;
  align-items: center;
  gap: var(--esp-3);
  width: min(100%, 26rem);
}

.portada__marca::before,
.portada__marca::after {
  content: "";
  flex: 1;
  height: 0.0625rem;
  background: var(--crema);
}

.portada__pill {
  margin-top: var(--esp-4);
}

.sobre {
  width: min(100%, 32rem);
  margin-top: var(--esp-4);
}

.sobre__tapa {
  width: 100%;
  border: 0.125rem solid var(--crema);
  background: transparent;
  color: var(--crema);
  border-radius: var(--radio-tarjeta);
  padding: var(--esp-4);
  display: grid;
  gap: var(--esp-2);
  justify-items: center;
  transition: transform 0.4s ease, background-color 0.4s ease;
}

.sobre__sello {
  display: grid;
  place-items: center;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 50%;
  background: var(--crema);
  color: var(--vino);
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.sobre__rotulo {
  font-family: var(--fuente-titulo);
  font-size: var(--txt-titular);
}

.sobre--abierto .sobre__tapa {
  transform: translateY(-0.5rem);
  background: rgba(254, 249, 221, 0.08);
}

.sobre__hoja {
  background: var(--hueso);
  color: var(--vino);
  border-radius: var(--radio-tarjeta);
  padding: var(--esp-4);
  margin-top: var(--esp-3);
  text-align: left;
}

.sobre__titulo {
  font-size: var(--txt-titular);
  margin-bottom: var(--esp-3);
}

.sobre__firma {
  font-weight: 600;
  text-align: right;
  margin-bottom: 0;
}

@media (prefers-reduced-motion: no-preference) {
  .sobre--abierto .sobre__hoja {
    animation: salir-carta 0.5s ease both;
  }

  @keyframes salir-carta {
    from {
      opacity: 0;
      transform: translateY(-1.5rem) scaleY(0.9);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
}
```

- [ ] **Paso 4: Activar el módulo en `js/principal.js`**

Descomenta la primera línea del array:

```js
  ["#portada", () => import("./carta.js")],
```

- [ ] **Paso 5: Verificar en el navegador**

Sirve el sitio. Comprueba, uno por uno:
- El lema se lee en TAN Meringue crema sobre vino, en dos líneas.
- «CAMP 2026» aparece con las dos líneas finas a los lados.
- Al pulsar el sobre, la carta se despliega y el rótulo cambia a «Cerrar la carta».
- Al pulsarlo otra vez, se cierra.
- El botón «Conoce tu habitación» baja hasta la sección de habitaciones.
- Con el teclado: `Tab` lleva el foco al sobre con contorno visible, y `Enter` lo abre.
- En DevTools → Rendering → «Emulate prefers-reduced-motion: reduce», la carta aparece sin animación.

- [ ] **Paso 6: Verificar el fallo controlado**

Renombra `datos/carta.json` a `datos/carta.json.bak`, recarga, y confirma que la portada muestra «No pudimos cargar esta información» con el botón Reintentar, y que la consola no reporta nada más. Restaura el nombre y pulsa Reintentar: la carta debe aparecer sin recargar.

- [ ] **Paso 7: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026
git commit -m "feat: portada con lema y sobre de la carta de bienvenida"
```

---

## Tarea 4: Programación

Tres días. En escritorio, tres columnas colgantes. En celular, pestañas, porque apilar los tres días son casi tres pantallas de scroll.

**Archivos:**
- Crear: `campamento-2026/datos/programacion.json`
- Crear: `campamento-2026/js/programacion.js`
- Modificar: `campamento-2026/css/secciones.css`
- Modificar: `campamento-2026/js/principal.js`
- Modificar: `campamento-2026/pruebas/casos.js`

**Interfaces:**
- Produce: `iniciar(contenedor)` y la función pura `validarProgramacion(datos) -> {valida: boolean, motivo?: string}`, que las pruebas ejercitan.

- [ ] **Paso 1: Escribir `datos/programacion.json`**

Transcrito del boceto, sin inventar nada. Las dos actividades del sábado a las 8:00 PM aparecen tal cual están en el boceto; hay que confirmarlas con el liderazgo.

```json
[
  {
    "dia": "Viernes",
    "numero": 1,
    "bloques": [
      { "hora": "5:00 PM", "actividad": "Salida" },
      { "hora": "7:00 PM", "actividad": "Llegada y acomodación" },
      { "hora": "8:00 PM", "actividad": "Cena" },
      { "hora": "9:30 PM", "actividad": "Primer servicio" }
    ]
  },
  {
    "dia": "Sábado",
    "numero": 2,
    "bloques": [
      { "hora": "6:00 AM", "actividad": "Alborada y Devocional" },
      { "hora": "8:00 AM", "actividad": "Desayuno" },
      { "hora": "10:00 AM", "actividad": "Segundo servicio" },
      { "hora": "1:00 PM", "actividad": "Almuerzo" },
      { "hora": "2:30 PM", "actividad": "Actividad campamento" },
      { "hora": "4:30 PM", "actividad": "Refrigerio" },
      { "hora": "5:00 PM", "actividad": "Tercer servicio" },
      { "hora": "8:00 PM", "actividad": "Cena" },
      { "hora": "8:00 PM", "actividad": "Noche de alabanza" }
    ]
  },
  {
    "dia": "Domingo",
    "numero": 3,
    "bloques": [
      { "hora": "6:00 AM", "actividad": "Alborada y Devocional" },
      { "hora": "8:00 AM", "actividad": "Desayuno" },
      { "hora": "9:30 AM", "actividad": "Servicio de clausura" },
      { "hora": "1:00 PM", "actividad": "Almuerzo y recreación" },
      { "hora": "5:00 PM", "actividad": "Refrigerio y regreso" }
    ]
  }
]
```

- [ ] **Paso 2: Escribir los casos que fallan**

Añade a `pruebas/casos.js` el import y los cuatro casos:

```js
import { validarProgramacion } from "../js/programacion.js";
```

```js
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
```

- [ ] **Paso 3: Correr las pruebas y verificar que fallan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: falla al importar, `Cannot find module` apuntando a `js/programacion.js`.

- [ ] **Paso 4: Escribir `js/programacion.js`**

```js
// programacion.js — los tres dias del campamento.
// Escritorio: tres columnas. Celular: pestañas, porque apilarlos son tres pantallas de scroll.

import { cargarJSON, montarSeccion } from "./util/datos.js";

/**
 * Comprueba la forma de programacion.json antes de pintarlo.
 * Funcion pura: no toca el DOM, para poder probarla en la terminal.
 */
export function validarProgramacion(datos) {
  if (!Array.isArray(datos)) {
    return { valida: false, motivo: "programacion.json debe ser una lista de dias" };
  }
  for (const dia of datos) {
    if (!dia || typeof dia.dia !== "string") {
      return { valida: false, motivo: "Hay un dia sin nombre" };
    }
    if (!Array.isArray(dia.bloques) || dia.bloques.length === 0) {
      return { valida: false, motivo: `El dia ${dia.dia} no tiene bloques` };
    }
    for (const bloque of dia.bloques) {
      if (!bloque || typeof bloque.hora !== "string" || typeof bloque.actividad !== "string") {
        return { valida: false, motivo: `Hay un bloque incompleto en ${dia.dia}` };
      }
    }
  }
  return { valida: true };
}

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
  const envoltorio = document.createElement("div");
  envoltorio.className = "contenedor";

  const titulo = document.createElement("h2");
  titulo.className = "seccion__titulo";
  titulo.id = "titulo-programacion";
  titulo.textContent = "Programación";
  envoltorio.append(titulo);

  const pestanas = document.createElement("div");
  pestanas.className = "pestanas";
  pestanas.setAttribute("role", "tablist");
  pestanas.setAttribute("aria-label", "Días del campamento");

  const panelesEnvoltorio = document.createElement("div");
  panelesEnvoltorio.className = "dias";

  const botones = [];
  const paneles = [];

  dias.forEach((dia, indice) => {
    const idPestana = `pestana-dia-${dia.numero}`;
    const idPanel = `panel-dia-${dia.numero}`;

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "pestanas__boton";
    boton.id = idPestana;
    boton.setAttribute("role", "tab");
    boton.setAttribute("aria-controls", idPanel);
    boton.setAttribute("aria-selected", String(indice === 0));
    boton.tabIndex = indice === 0 ? 0 : -1;
    boton.textContent = dia.dia;
    botones.push(boton);
    pestanas.append(boton);

    const panel = construirDia(dia, idPanel, idPestana);
    panel.hidden = indice !== 0;
    paneles.push(panel);
    panelesEnvoltorio.append(panel);
  });

  function seleccionar(indice) {
    botones.forEach((boton, i) => {
      boton.setAttribute("aria-selected", String(i === indice));
      boton.tabIndex = i === indice ? 0 : -1;
    });
    paneles.forEach((panel, i) => {
      panel.hidden = i !== indice;
    });
  }

  botones.forEach((boton, indice) => {
    boton.addEventListener("click", () => seleccionar(indice));
    boton.addEventListener("keydown", (evento) => {
      if (evento.key !== "ArrowRight" && evento.key !== "ArrowLeft") return;
      evento.preventDefault();
      const paso = evento.key === "ArrowRight" ? 1 : -1;
      const siguiente = (indice + paso + botones.length) % botones.length;
      seleccionar(siguiente);
      botones[siguiente].focus();
    });
  });

  envoltorio.append(pestanas, panelesEnvoltorio);
  contenedor.append(envoltorio);
}

function construirDia(dia, idPanel, idPestana) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "dia";
  tarjeta.id = idPanel;
  tarjeta.setAttribute("role", "tabpanel");
  tarjeta.setAttribute("aria-labelledby", idPestana);

  const numero = document.createElement("span");
  numero.className = "dia__numero";
  numero.setAttribute("aria-hidden", "true");
  numero.textContent = String(dia.numero);

  const nombre = document.createElement("h3");
  nombre.className = "dia__nombre";
  nombre.textContent = dia.dia;

  const lista = document.createElement("ol");
  lista.className = "dia__bloques";

  for (const bloque of dia.bloques) {
    const fila = document.createElement("li");
    fila.className = "bloque";

    const hora = document.createElement("span");
    hora.className = "bloque__hora";
    hora.textContent = bloque.hora;

    const actividad = document.createElement("span");
    actividad.className = "bloque__actividad";
    actividad.textContent = bloque.actividad;

    fila.append(hora, actividad);
    lista.append(fila);
  }

  tarjeta.append(numero, nombre, lista);
  return tarjeta;
}
```

- [ ] **Paso 5: Correr las pruebas y verificar que pasan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `8 pasaron, 0 fallaron, 0 solo navegador`.

- [ ] **Paso 6: Añadir el bloque de programación a `css/secciones.css`**

```css
/* ---------- Programacion ---------- */

.pestanas {
  display: flex;
  gap: var(--esp-2);
  justify-content: center;
  margin-bottom: var(--esp-4);
  flex-wrap: wrap;
}

.pestanas__boton {
  border: 0.125rem solid var(--vino);
  background: transparent;
  color: var(--vino);
  border-radius: var(--radio-pill);
  padding: var(--esp-2) var(--esp-4);
  font-weight: 600;
}

.pestanas__boton[aria-selected="true"] {
  background: var(--vino);
  color: var(--crema);
}

.dia {
  position: relative;
  background: var(--hueso);
  color: var(--vino);
  border: 0.125rem solid var(--vino);
  border-radius: var(--radio-tarjeta);
  padding: var(--esp-5) var(--esp-3) var(--esp-4);
  margin-top: var(--esp-4);
}

/* El numero cuelga por encima del borde superior, como en el boceto. */
.dia__numero {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--fuente-titulo);
  font-size: 3rem;
  line-height: 1;
  color: var(--vino);
  background: var(--hueso);
  padding-inline: var(--esp-3);
}

.dia__nombre {
  font-size: var(--txt-titular);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: var(--esp-4);
}

.dia__bloques {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--esp-3);
}

.bloque {
  display: grid;
  grid-template-columns: 4.5rem 1fr;
  align-items: center;
  gap: var(--esp-3);
}

.bloque__hora {
  display: grid;
  place-items: center;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 50%;
  background: var(--vino);
  color: var(--crema);
  font-size: 0.8125rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
}

.bloque__actividad {
  font-weight: 600;
}

@media (min-width: 48rem) {
  /* En escritorio los tres dias van lado a lado y las pestañas sobran. */
  .pestanas {
    display: none;
  }

  .dias {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--esp-4);
    align-items: start;
  }

  .dia[hidden] {
    display: block;
  }
}
```

Nota sobre `.dia[hidden] { display: block; }`: en escritorio los tres días se ven a la vez, así que hay que anular el `hidden` que puso el JavaScript para las pestañas de celular. El atributo se conserva en el DOM porque al reducir la ventana las pestañas vuelven a mandar.

- [ ] **Paso 7: Activar el módulo en `js/principal.js`**

```js
  ["#programacion", () => import("./programacion.js")],
```

- [ ] **Paso 8: Verificar en el navegador**

- Ventana estrecha (≤ 48rem): se ven las tres pestañas y solo el día seleccionado.
- Las flechas ← → cambian de pestaña con el teclado.
- Ventana ancha: las pestañas desaparecen y se ven los tres días en columnas.
- Cada hora está dentro de un círculo vino con el texto en crema.
- El número del día cuelga sobre el borde superior de la tarjeta.

- [ ] **Paso 9: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026
git commit -m "feat: programacion de los tres dias con pestañas en celular"
```

---

## Tarea 5: Conoce tu habitación

Una tarjeta por habitación. En celular van plegadas: quince habitaciones desplegadas serían un scroll interminable.

**Archivos:**
- Crear: `campamento-2026/datos/habitaciones.json`
- Crear: `campamento-2026/js/habitaciones.js`
- Modificar: `campamento-2026/css/secciones.css`
- Modificar: `campamento-2026/js/principal.js`
- Modificar: `campamento-2026/pruebas/casos.js`

**Interfaces:**
- Produce: `iniciar(contenedor)` y la función pura `contarIntegrantes(habitacion) -> number`.

- [ ] **Paso 1: Escribir `datos/habitaciones.json`**

Tres habitaciones de ejemplo. El liderazgo añade las que falten con el mismo formato.

```json
[
  {
    "nombre": "Habitación 1",
    "lider": "PENDIENTE — nombre del líder",
    "integrantes": [
      "PENDIENTE — integrante 1",
      "PENDIENTE — integrante 2",
      "PENDIENTE — integrante 3"
    ]
  },
  {
    "nombre": "Habitación 2",
    "lider": "PENDIENTE — nombre del líder",
    "integrantes": [
      "PENDIENTE — integrante 1",
      "PENDIENTE — integrante 2"
    ]
  },
  {
    "nombre": "Habitación 3",
    "lider": "PENDIENTE — nombre del líder",
    "integrantes": [
      "PENDIENTE — integrante 1",
      "PENDIENTE — integrante 2",
      "PENDIENTE — integrante 3",
      "PENDIENTE — integrante 4"
    ]
  }
]
```

- [ ] **Paso 2: Escribir los casos que fallan**

Import y dos casos en `pruebas/casos.js`:

```js
import { contarIntegrantes } from "../js/habitaciones.js";
```

```js
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
```

- [ ] **Paso 3: Correr las pruebas y verificar que fallan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `Cannot find module` apuntando a `js/habitaciones.js`.

- [ ] **Paso 4: Escribir `js/habitaciones.js`**

```js
// habitaciones.js — quien duerme donde.
// Celular: tarjetas plegadas, porque quince habitaciones abiertas son un scroll interminable.

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
  const envoltorio = document.createElement("div");
  envoltorio.className = "contenedor";

  const titulo = document.createElement("h2");
  titulo.className = "seccion__titulo";
  titulo.id = "titulo-habitaciones";
  titulo.textContent = "Conoce tu habitación";

  const rejilla = document.createElement("div");
  rejilla.className = "habitaciones";

  for (const habitacion of habitaciones) {
    rejilla.append(construirHabitacion(habitacion));
  }

  envoltorio.append(titulo, rejilla);
  contenedor.append(envoltorio);
}

function construirHabitacion(habitacion) {
  // <details> da el plegado nativo: funciona con teclado y sin JavaScript extra.
  const tarjeta = document.createElement("details");
  tarjeta.className = "habitacion";

  const cabecera = document.createElement("summary");
  cabecera.className = "habitacion__cabecera";

  const nombre = document.createElement("span");
  nombre.className = "habitacion__nombre";
  nombre.textContent = habitacion.nombre;

  const cuantos = document.createElement("span");
  cuantos.className = "habitacion__cuantos";
  const total = contarIntegrantes(habitacion);
  cuantos.textContent = total === 1 ? "1 persona" : `${total} personas`;

  cabecera.append(nombre, cuantos);

  const cuerpo = document.createElement("div");
  cuerpo.className = "habitacion__cuerpo";

  if (habitacion.lider) {
    const lider = document.createElement("p");
    lider.className = "habitacion__lider";
    const etiqueta = document.createElement("span");
    etiqueta.textContent = "Líder: ";
    const quien = document.createElement("strong");
    quien.textContent = habitacion.lider;
    lider.append(etiqueta, quien);
    cuerpo.append(lider);
  }

  const lista = document.createElement("ul");
  lista.className = "habitacion__integrantes";
  for (const persona of habitacion.integrantes || []) {
    const fila = document.createElement("li");
    fila.textContent = persona;
    lista.append(fila);
  }
  cuerpo.append(lista);

  tarjeta.append(cabecera, cuerpo);
  return tarjeta;
}
```

- [ ] **Paso 5: Correr las pruebas y verificar que pasan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `10 pasaron, 0 fallaron, 0 solo navegador`.

- [ ] **Paso 6: Añadir el bloque de habitaciones a `css/secciones.css`**

```css
/* ---------- Habitaciones ---------- */

.habitaciones {
  display: grid;
  gap: var(--esp-3);
}

.habitacion {
  background: var(--hueso);
  color: var(--vino);
  border-radius: var(--radio-tarjeta);
  padding: var(--esp-3) var(--esp-4);
  box-shadow: var(--sombra-tarjeta);
}

.habitacion__cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--esp-3);
  cursor: pointer;
  list-style: none;
  font-weight: 600;
}

/* Quita el triangulo por defecto de <summary> en Safari y Chrome. */
.habitacion__cabecera::-webkit-details-marker {
  display: none;
}

.habitacion__nombre {
  font-family: var(--fuente-titulo);
  font-size: var(--txt-titular);
  font-weight: 400;
}

.habitacion__cuantos {
  font-size: var(--txt-menor);
  opacity: 0.75;
  white-space: nowrap;
}

.habitacion__cuerpo {
  padding-top: var(--esp-3);
}

.habitacion__lider {
  margin-bottom: var(--esp-2);
}

.habitacion__integrantes {
  margin: 0;
  padding-left: var(--esp-4);
  display: grid;
  gap: var(--esp-1);
}

@media (min-width: 48rem) {
  .habitaciones {
    grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  }
}
```

- [ ] **Paso 7: Abrir todas las tarjetas en escritorio**

En escritorio la especificación pide que estén todas visibles. Añade al final de `pintarHabitaciones`, justo antes de `contenedor.append(envoltorio)`:

```js
  // En escritorio se ven todas abiertas; en celular, plegadas.
  const esEscritorio = window.matchMedia("(min-width: 48rem)");
  const aplicarAnchura = () => {
    for (const tarjeta of rejilla.querySelectorAll(".habitacion")) {
      tarjeta.open = esEscritorio.matches;
    }
  };
  aplicarAnchura();
  esEscritorio.addEventListener("change", aplicarAnchura);
```

- [ ] **Paso 8: Activar el módulo en `js/principal.js`**

```js
  ["#habitaciones", () => import("./habitaciones.js")],
```

- [ ] **Paso 9: Verificar en el navegador**

- Celular: las tres tarjetas aparecen plegadas, con el nombre y el número de personas.
- Al tocar una, se despliega con el líder en negrita y la lista.
- `Tab` + `Enter` despliega una tarjeta.
- Escritorio: rejilla de varias columnas con todas las tarjetas abiertas.

- [ ] **Paso 10: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026
git commit -m "feat: listado de habitaciones plegable en celular"
```

---

## Tarea 6: Buscador de canciones

La lógica del buscador, aislada y probada, antes de pintar nada. Filtra por título y por el texto de la letra, y sin acentos, porque nadie escribe «espíritu» con tilde en el buscador de un celular.

**Archivos:**
- Crear: `campamento-2026/js/util/texto.js`
- Crear: `campamento-2026/js/canciones.js` (solo la parte pura en esta tarea)
- Modificar: `campamento-2026/pruebas/casos.js`

**Interfaces:**
- Produce: `normalizar(texto) -> string` en `js/util/texto.js`.
- Produce en `js/canciones.js`: `textoDeCancion(cancion) -> string` y `filtrarCanciones(canciones, consulta) -> Array`.

- [ ] **Paso 1: Escribir los casos que fallan**

Imports y seis casos en `pruebas/casos.js`:

```js
import { normalizar } from "../js/util/texto.js";
import { filtrarCanciones, textoDeCancion } from "../js/canciones.js";
```

```js
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
```

Y define el juego de datos justo encima del array `casos`, para no repetirlo en cada caso:

```js
const CANCIONES_DE_PRUEBA = [
  {
    id: "derrama",
    titulo: "Derrama",
    numero: 1,
    bloques: [
      { tipo: "estrofa", lineas: ["Eres poderoso", "Anhelo tu espíritu"] },
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
```

- [ ] **Paso 2: Correr las pruebas y verificar que fallan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `Cannot find module` apuntando a `js/util/texto.js`.

- [ ] **Paso 3: Escribir `js/util/texto.js`**

```js
// texto.js — normalizacion para buscar.

/**
 * Minusculas, sin acentos y sin espacios en los bordes.
 * Descompone en NFD y borra los diacriticos: asi "espíritu" y "espiritu"
 * son la misma cadena, que es lo que la gente espera al buscar en un celular.
 */
export function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
```

- [ ] **Paso 4: Escribir la parte pura de `js/canciones.js`**

El resto del módulo llega en la Tarea 7.

```js
// canciones.js — libro de canciones: buscador, letra y modo pantalla completa.

import { normalizar } from "./util/texto.js";

/** Titulo y todas las lineas en una sola cadena, para poder buscar dentro. */
export function textoDeCancion(cancion) {
  const lineas = (cancion?.bloques || []).flatMap((bloque) => bloque?.lineas || []);
  return [cancion?.titulo || "", ...lineas].join(" ");
}

/**
 * Filtra por titulo y por el texto de la letra, ignorando acentos.
 * Buscar por un verso suelto sirve cuando alguien recuerda la linea
 * pero no el nombre de la cancion.
 */
export function filtrarCanciones(canciones, consulta) {
  const buscado = normalizar(consulta);
  if (!buscado) return canciones;
  return canciones.filter((cancion) => normalizar(textoDeCancion(cancion)).includes(buscado));
}
```

- [ ] **Paso 5: Correr las pruebas y verificar que pasan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `16 pasaron, 0 fallaron, 0 solo navegador`.

- [ ] **Paso 6: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026
git commit -m "test: buscador de canciones por titulo y letra, sin acentos"
```

---

## Tarea 7: Libro de canciones

El listado, la letra y el modo pantalla completa. Las dos canciones lema van transcritas de la guía de marca.

**Archivos:**
- Crear: `campamento-2026/datos/canciones.json`
- Modificar: `campamento-2026/js/canciones.js` (añadir `iniciar` y el pintado)
- Modificar: `campamento-2026/css/secciones.css`
- Modificar: `campamento-2026/js/principal.js`

**Interfaces:**
- Consume: `filtrarCanciones` y `textoDeCancion` de la Tarea 6; `cargarJSON`, `montarSeccion` de la Tarea 2.
- Produce: `iniciar(contenedor)`.

- [ ] **Paso 1: Escribir `datos/canciones.json`**

Las dos canciones lema, transcritas de `Red and Beige Elegant Sophisticated Company Letter.pdf`. En el original, `/…/` marca lo que se repite; aquí ese matiz se expresa con el tipo de bloque `coro`.

```json
[
  {
    "id": "derrama",
    "titulo": "Derrama",
    "numero": 1,
    "lema": true,
    "bloques": [
      {
        "tipo": "estrofa",
        "lineas": [
          "Eres poderoso",
          "No lo puedo explicar",
          "Si invoco tu nombre",
          "Lo extraordinario pasará",
          "Tu ser me estremece",
          "Y tengo que adorar",
          "Anhelo tu espíritu"
        ]
      },
      {
        "tipo": "estrofa",
        "lineas": [
          "Tú eres mi todo",
          "No lo puedo negar",
          "No busco emociones",
          "Quiero algo real",
          "Tan solo un toque",
          "Me puede transformar",
          "Necesito tu aceite Dios"
        ]
      },
      {
        "tipo": "coro",
        "lineas": [
          "Soy una vasija esperando ser llena",
          "Un alma sedienta de tu presencia",
          "Derrama tu gloria oh Dios",
          "Rindo mi corazón"
        ]
      },
      {
        "tipo": "estrofa",
        "lineas": ["Yo te quiero sentir"]
      }
    ]
  },
  {
    "id": "derrama-tu-poder",
    "titulo": "Derrama tu poder",
    "numero": 2,
    "lema": true,
    "bloques": [
      {
        "tipo": "estrofa",
        "lineas": [
          "Muéveme como nunca me has movido",
          "Para que no me olvide de ti,",
          "Guíame por este momento lindo",
          "Que no me quiero desviar,",
          "No te quiero perder."
        ]
      },
      {
        "tipo": "coro",
        "lineas": [
          "Derrama tu poder, derrama tu amor,",
          "Jesucristo sólo quiero más de ti."
        ]
      },
      {
        "tipo": "estrofa",
        "lineas": [
          "Tómame de la mano este día",
          "Para que sepa yo que soy de ti;",
          "Hoy te doy lo que queda de mi vida,",
          "Porque eres mi galardón y mi inspiración."
        ]
      },
      {
        "tipo": "coro",
        "lineas": [
          "Es mi oración, mi única súplica:",
          "Estar junto a ti, estar junto a ti."
        ]
      }
    ]
  }
]
```

- [ ] **Paso 2: Añadir `iniciar` y el pintado a `js/canciones.js`**

Va debajo de las funciones puras que ya están. Añade también el import de `datos.js` arriba del archivo:

```js
import { cargarJSON, montarSeccion } from "./util/datos.js";
```

```js
const PASO_TAMANO = 0.125;
const TAMANO_MINIMO = 1;
const TAMANO_MAXIMO = 2.5;

export function iniciar(contenedor) {
  return montarSeccion(
    contenedor,
    () => cargarJSON("datos/canciones.json"),
    pintarCanciones
  );
}

function pintarCanciones(contenedor, canciones) {
  const envoltorio = document.createElement("div");
  envoltorio.className = "contenedor";

  const titulo = document.createElement("h2");
  titulo.className = "seccion__titulo";
  titulo.id = "titulo-canciones";
  titulo.textContent = "Canciones";

  const etiquetaBuscador = document.createElement("label");
  etiquetaBuscador.className = "buscador";
  const textoEtiqueta = document.createElement("span");
  textoEtiqueta.className = "solo-lectores";
  textoEtiqueta.textContent = "Buscar una canción por título o por su letra";
  const campo = document.createElement("input");
  campo.type = "search";
  campo.className = "buscador__campo";
  campo.placeholder = "Busca por título o por un verso…";
  campo.autocomplete = "off";
  etiquetaBuscador.append(textoEtiqueta, campo);

  const aviso = document.createElement("p");
  aviso.className = "canciones__vacio";
  aviso.hidden = true;
  aviso.textContent = "No encontramos ninguna canción con eso. Prueba con otra palabra.";

  const libro = document.createElement("div");
  libro.className = "libro";

  function repintar() {
    libro.innerHTML = "";
    const encontradas = filtrarCanciones(canciones, campo.value);
    aviso.hidden = encontradas.length > 0;
    for (const cancion of encontradas) {
      libro.append(construirCancion(cancion));
    }
  }

  campo.addEventListener("input", repintar);
  repintar();

  envoltorio.append(titulo, etiquetaBuscador, aviso, libro);
  contenedor.append(envoltorio);
}

function construirCancion(cancion) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "cancion";

  const cabecera = document.createElement("header");
  cabecera.className = "cancion__cabecera";

  const nombre = document.createElement("h3");
  nombre.className = "cancion__titulo";
  nombre.textContent = cancion.titulo;
  cabecera.append(nombre);

  if (cancion.lema) {
    const insignia = document.createElement("span");
    insignia.className = "cancion__insignia";
    insignia.textContent = `#${cancion.numero}`;
    const aclaracion = document.createElement("span");
    aclaracion.className = "solo-lectores";
    aclaracion.textContent = " Canción lema";
    insignia.append(aclaracion);
    cabecera.append(insignia);
  }

  const letra = document.createElement("div");
  letra.className = "cancion__letra";
  letra.append(construirLetra(cancion));

  const cantar = document.createElement("button");
  cantar.type = "button";
  cantar.className = "pill cancion__cantar";
  cantar.textContent = "Cantar";
  cantar.addEventListener("click", () => abrirPantallaCompleta(cancion));

  tarjeta.append(cabecera, letra, cantar);
  return tarjeta;
}

/** Devuelve un fragmento con un bloque por estrofa o coro. */
function construirLetra(cancion) {
  const fragmento = document.createDocumentFragment();
  for (const bloque of cancion.bloques || []) {
    const parrafo = document.createElement("p");
    parrafo.className = bloque.tipo === "coro" ? "letra-bloque letra-bloque--coro" : "letra-bloque";
    (bloque.lineas || []).forEach((linea, indice) => {
      if (indice > 0) parrafo.append(document.createElement("br"));
      parrafo.append(document.createTextNode(linea));
    });
    fragmento.append(parrafo);
  }
  return fragmento;
}

function abrirPantallaCompleta(cancion) {
  let tamano = 1.25;
  let bloqueoPantalla = null;

  const capa = document.createElement("div");
  capa.className = "cantar";
  capa.setAttribute("role", "dialog");
  capa.setAttribute("aria-modal", "true");
  capa.setAttribute("aria-label", `Letra de ${cancion.titulo}`);

  const barra = document.createElement("div");
  barra.className = "cantar__barra";

  const menos = botonDeBarra("A−", "Reducir el tamaño de la letra", () => cambiarTamano(-PASO_TAMANO));
  const mas = botonDeBarra("A+", "Aumentar el tamaño de la letra", () => cambiarTamano(PASO_TAMANO));
  const cerrar = botonDeBarra("✕", "Cerrar la letra", cerrarTodo);
  cerrar.classList.add("cantar__cerrar");

  barra.append(menos, mas, cerrar);

  const cuerpo = document.createElement("div");
  cuerpo.className = "cantar__cuerpo";

  const nombre = document.createElement("h2");
  nombre.className = "cantar__titulo";
  nombre.textContent = cancion.titulo;

  const letra = document.createElement("div");
  letra.className = "cantar__letra";
  letra.append(construirLetra(cancion));

  cuerpo.append(nombre, letra);
  capa.append(barra, cuerpo);
  document.body.append(capa);
  document.body.style.overflow = "hidden";
  cerrar.focus();

  function cambiarTamano(delta) {
    tamano = Math.min(TAMANO_MAXIMO, Math.max(TAMANO_MINIMO, tamano + delta));
    letra.style.fontSize = `${tamano}rem`;
  }
  cambiarTamano(0);

  function alPulsarTecla(evento) {
    if (evento.key === "Escape") cerrarTodo();
  }
  document.addEventListener("keydown", alPulsarTecla);

  function cerrarTodo() {
    document.removeEventListener("keydown", alPulsarTecla);
    document.body.style.overflow = "";
    capa.remove();
    bloqueoPantalla?.release?.().catch(() => {});
  }

  // Que la pantalla no se apague a mitad de la cancion.
  // Si el navegador no lo soporta, se ignora en silencio.
  if ("wakeLock" in navigator) {
    navigator.wakeLock
      .request("screen")
      .then((bloqueo) => {
        bloqueoPantalla = bloqueo;
      })
      .catch(() => {});
  }
}

function botonDeBarra(texto, etiqueta, alPulsar) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "cantar__boton";
  boton.textContent = texto;
  boton.setAttribute("aria-label", etiqueta);
  boton.addEventListener("click", alPulsar);
  return boton;
}
```

- [ ] **Paso 3: Añadir el bloque de canciones a `css/secciones.css`**

```css
/* ---------- Canciones ---------- */

.buscador {
  display: block;
  width: min(100%, 32rem);
  margin: 0 auto var(--esp-4);
}

.buscador__campo {
  width: 100%;
  font: inherit;
  color: var(--vino);
  background: var(--hueso);
  border: 0.125rem solid var(--crema);
  border-radius: var(--radio-pill);
  padding: var(--esp-3) var(--esp-4);
}

.canciones__vacio {
  text-align: center;
  opacity: 0.85;
}

.libro {
  display: grid;
  gap: var(--esp-4);
}

.cancion {
  background: var(--hueso);
  color: var(--vino);
  border-radius: var(--radio-tarjeta);
  padding: var(--esp-4);
  box-shadow: var(--sombra-tarjeta);
}

.cancion__cabecera {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--esp-3);
  margin-bottom: var(--esp-3);
}

.cancion__titulo {
  font-size: var(--txt-titular);
}

.cancion__insignia {
  font-weight: 700;
  font-size: var(--txt-menor);
  background: var(--vino);
  color: var(--crema);
  border-radius: var(--radio-pill);
  padding: 0.125rem var(--esp-2);
}

.letra-bloque {
  margin-bottom: var(--esp-3);
  line-height: 1.7;
}

/* El coro se distingue de las estrofas con una barra y cursiva. */
.letra-bloque--coro {
  font-style: italic;
  font-weight: 500;
  border-left: 0.1875rem solid var(--vino);
  padding-left: var(--esp-3);
}

.cancion__cantar {
  padding: var(--esp-2) var(--esp-4);
  background: var(--vino);
  color: var(--crema);
}

/* Modo pantalla completa */
.cantar {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: var(--vino);
  color: var(--crema);
  display: flex;
  flex-direction: column;
}

.cantar__barra {
  display: flex;
  gap: var(--esp-2);
  padding: var(--esp-3);
  justify-content: flex-end;
  border-bottom: 0.0625rem solid rgba(254, 249, 221, 0.25);
}

.cantar__boton {
  min-width: 3rem;
  min-height: 3rem;
  border: 0.125rem solid var(--crema);
  background: transparent;
  color: var(--crema);
  border-radius: var(--radio-pill);
  font-weight: 600;
}

.cantar__cerrar {
  margin-left: auto;
}

.cantar__cuerpo {
  flex: 1;
  overflow-y: auto;
  padding: var(--esp-4);
  -webkit-overflow-scrolling: touch;
}

.cantar__titulo {
  font-size: var(--txt-seccion);
  margin-bottom: var(--esp-4);
  text-align: center;
}

.cantar__letra {
  max-width: 40rem;
  margin-inline: auto;
  line-height: 1.8;
}

.cantar__letra .letra-bloque--coro {
  border-left-color: var(--crema);
}

@media (min-width: 48rem) {
  /* Marco de libreta abierta: dos paginas y las anillas al centro.
     En celular no aplica: alli es una sola pagina, como pide el diseño. */
  .libro {
    grid-template-columns: repeat(2, 1fr);
    column-gap: var(--esp-6);
    position: relative;
    background: var(--hueso);
    border-radius: var(--radio-tarjeta);
    padding: var(--esp-5) var(--esp-4);
  }

  .libro::before {
    content: "";
    position: absolute;
    top: var(--esp-4);
    bottom: var(--esp-4);
    left: 50%;
    transform: translateX(-50%);
    width: 1.25rem;
    /* Las anillas: un circulo vino repetido a lo largo del lomo. */
    background-image: radial-gradient(
      circle at 50% 0.625rem,
      var(--vino) 0 0.375rem,
      transparent 0.375rem
    );
    background-size: 100% 2.25rem;
    background-repeat: repeat-y;
    border-left: 0.0625rem solid rgba(85, 11, 24, 0.25);
    border-right: 0.0625rem solid rgba(85, 11, 24, 0.25);
  }

  /* Dentro de la libreta las canciones son paginas, no tarjetas sueltas. */
  .cancion {
    background: transparent;
    box-shadow: none;
    padding-inline: 0;
  }
}
```

- [ ] **Paso 4: Activar el módulo en `js/principal.js`**

```js
  ["#canciones", () => import("./canciones.js")],
```

- [ ] **Paso 5: Correr las pruebas**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `16 pasaron, 0 fallaron, 0 solo navegador`. Los casos de la Tarea 6 siguen pasando con el módulo ya completo.

- [ ] **Paso 6: Verificar en el navegador**

- Las dos canciones aparecen con sus insignias `#1` y `#2`.
- El coro se ve en cursiva con la barra a la izquierda.
- En escritorio, las canciones se ven como dos páginas de una libreta con las anillas al centro. En celular, una sola columna sin anillas.
- Escribir «vasija» deja solo «Derrama». Escribir «espiritu» sin tilde también la encuentra. Escribir «zamba» muestra el aviso de que no hay resultados.
- «Cantar» abre la capa vino a pantalla completa; A− y A+ cambian el tamaño; `Escape` y ✕ la cierran; al cerrarse, la página vuelve a hacer scroll.
- Con el móvil conectado por USB y la pantalla en reposo automático, la pantalla no se apaga con la letra abierta (Chrome Android; en navegadores sin `wakeLock` simplemente no pasa nada).

- [ ] **Paso 7: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026
git commit -m "feat: libro de canciones con buscador y modo pantalla completa"
```

---

## Tarea 8: Locación

Mapa real, diferido, y dos botones grandes de navegación. En el campo lo que se necesita es llegar, no admirar un plano.

**Archivos:**
- Crear: `campamento-2026/datos/locacion.json`
- Crear: `campamento-2026/js/locacion.js`
- Modificar: `campamento-2026/css/secciones.css`
- Modificar: `campamento-2026/js/principal.js`

**Interfaces:**
- Produce: `iniciar(contenedor)`.

- [ ] **Paso 1: Escribir `datos/locacion.json`**

El punto exacto lo confirma el liderazgo; entre tanto, el mapa apunta a Girardota por búsqueda de texto, que ya es útil.

```json
{
  "nombre": "Finca San Sebastián",
  "direccion": "Girardota, Antioquia",
  "mapaEmbebido": "https://www.google.com/maps?q=Girardota,+Antioquia&output=embed",
  "enlaceMaps": "https://www.google.com/maps/search/?api=1&query=Girardota%2C+Antioquia",
  "enlaceWaze": "https://waze.com/ul?q=Girardota%2C%20Antioquia&navigate=yes",
  "puntos": [
    "Auditorio",
    "Comedor",
    "Cabañas",
    "Zona de recreación",
    "Enfermería"
  ]
}
```

- [ ] **Paso 2: Escribir `js/locacion.js`**

```js
// locacion.js — donde es y como llegar.

import { cargarJSON, montarSeccion } from "./util/datos.js";

export function iniciar(contenedor) {
  return montarSeccion(
    contenedor,
    () => cargarJSON("datos/locacion.json"),
    pintarLocacion
  );
}

function pintarLocacion(contenedor, locacion) {
  const envoltorio = document.createElement("div");
  envoltorio.className = "contenedor";

  const titulo = document.createElement("h2");
  titulo.className = "seccion__titulo";
  titulo.id = "titulo-locacion";
  titulo.textContent = "Locación";

  const nombre = document.createElement("p");
  nombre.className = "locacion__nombre";
  nombre.textContent = locacion.nombre || "";

  envoltorio.append(titulo, nombre);

  if (locacion.mapaEmbebido) {
    const marco = document.createElement("div");
    marco.className = "locacion__mapa";
    const mapa = document.createElement("iframe");
    mapa.src = locacion.mapaEmbebido;
    mapa.loading = "lazy";
    mapa.referrerPolicy = "no-referrer-when-downgrade";
    mapa.title = `Mapa de ${locacion.nombre || "la finca"}`;
    mapa.setAttribute("allowfullscreen", "");
    marco.append(mapa);
    envoltorio.append(marco);
  }

  const botones = document.createElement("div");
  botones.className = "locacion__botones";
  if (locacion.enlaceMaps) botones.append(enlaceNavegacion(locacion.enlaceMaps, "Abrir en Google Maps"));
  if (locacion.enlaceWaze) botones.append(enlaceNavegacion(locacion.enlaceWaze, "Abrir en Waze"));
  envoltorio.append(botones);

  if (locacion.direccion) {
    envoltorio.append(construirDireccion(locacion.direccion));
  }

  if (Array.isArray(locacion.puntos) && locacion.puntos.length > 0) {
    const subtitulo = document.createElement("h3");
    subtitulo.className = "locacion__subtitulo";
    subtitulo.textContent = "Puntos clave de la finca";

    const lista = document.createElement("ol");
    lista.className = "locacion__puntos";
    for (const punto of locacion.puntos) {
      const fila = document.createElement("li");
      fila.textContent = punto;
      lista.append(fila);
    }
    envoltorio.append(subtitulo, lista);
  }

  contenedor.append(envoltorio);
}

function enlaceNavegacion(url, texto) {
  const enlace = document.createElement("a");
  enlace.className = "pill locacion__boton";
  enlace.href = url;
  enlace.target = "_blank";
  enlace.rel = "noopener noreferrer";
  enlace.textContent = texto;
  return enlace;
}

function construirDireccion(direccion) {
  const fila = document.createElement("p");
  fila.className = "locacion__direccion";

  const texto = document.createElement("span");
  texto.textContent = direccion;

  const copiar = document.createElement("button");
  copiar.type = "button";
  copiar.className = "boton-reintentar locacion__copiar";
  copiar.textContent = "Copiar";
  copiar.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(direccion);
      copiar.textContent = "¡Copiada!";
    } catch {
      copiar.textContent = "Selecciónala y cópiala a mano";
    }
    setTimeout(() => {
      copiar.textContent = "Copiar";
    }, 2500);
  });

  fila.append(texto, copiar);
  return fila;
}
```

- [ ] **Paso 3: Añadir el bloque de locación a `css/secciones.css`**

```css
/* ---------- Locacion ---------- */

.locacion__nombre {
  text-align: center;
  font-weight: 600;
  font-size: var(--txt-titular);
  font-family: var(--fuente-titulo);
}

.locacion__mapa {
  position: relative;
  /* La proporcion evita que el mapa desplace el contenido al cargar. */
  aspect-ratio: 4 / 3;
  max-width: 100%;
  border-radius: var(--radio-tarjeta);
  overflow: hidden;
  border: 0.125rem solid var(--vino);
  margin-bottom: var(--esp-4);
}

.locacion__mapa iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.locacion__botones {
  display: grid;
  gap: var(--esp-3);
  margin-bottom: var(--esp-4);
}

.locacion__boton {
  background: var(--vino);
  color: var(--crema);
}

.locacion__direccion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--esp-3);
  flex-wrap: wrap;
  text-align: center;
}

.locacion__subtitulo {
  font-size: var(--txt-titular);
  margin-block: var(--esp-4) var(--esp-3);
  text-align: center;
}

.locacion__puntos {
  margin: 0 auto;
  max-width: 24rem;
  display: grid;
  gap: var(--esp-2);
}

@media (min-width: 48rem) {
  .locacion__mapa {
    aspect-ratio: 16 / 9;
  }

  .locacion__botones {
    grid-template-columns: repeat(2, 1fr);
    max-width: 40rem;
    margin-inline: auto;
  }
}
```

- [ ] **Paso 4: Activar el módulo en `js/principal.js`**

```js
  ["#locacion", () => import("./locacion.js")],
```

- [ ] **Paso 5: Verificar en el navegador**

- El mapa carga y se ve dentro de su marco redondeado, sin desplazar el contenido de abajo al aparecer.
- En la pestaña Red, la petición del mapa se dispara solo cuando la sección se acerca a la vista (`loading="lazy"`).
- Los dos botones abren Maps y Waze en una pestaña nueva.
- «Copiar» copia la dirección y el botón cambia a «¡Copiada!» durante unos segundos.

- [ ] **Paso 6: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026
git commit -m "feat: locacion con mapa diferido y enlaces de navegacion"
```

---

## Tarea 9: Validación y compresión de imágenes

La lógica que decide si una foto se sube y a qué tamaño. Va aparte de la galería y se prueba sola, porque es donde está el riesgo real: gastar los datos de alguien subiendo 4 MB que no hacían falta.

**Archivos:**
- Crear: `campamento-2026/js/imagen.js`
- Crear: `campamento-2026/js/util/red.js`
- Modificar: `campamento-2026/pruebas/casos.js`

**Interfaces:**
- Produce en `js/imagen.js`: `MAXIMO_BYTES`, `LADO_MAXIMO`, `CALIDAD`, `validarArchivo(archivo) -> {valido, motivo?}`, `calcularMedidas(ancho, alto, ladoMaximo?) -> {ancho, alto}`, `comprimir(archivo) -> Promise<Blob>`, `aBase64(blob) -> Promise<string>`.
- Produce en `js/util/red.js`: `conReintento(accion, intentos = 2, espera = 1500) -> Promise<any>`.

- [ ] **Paso 1: Escribir los casos que fallan**

Imports y siete casos en `pruebas/casos.js`:

```js
import { calcularMedidas, comprimir, validarArchivo, LADO_MAXIMO } from "../js/imagen.js";
import { conReintento } from "../js/util/red.js";
```

```js
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
```

- [ ] **Paso 2: Correr las pruebas y verificar que fallan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `Cannot find module` apuntando a `js/imagen.js`.

- [ ] **Paso 3: Escribir `js/util/red.js`**

```js
// red.js — reintento con espera, para peticiones que pueden fallar por señal irregular.

/**
 * Ejecuta `accion` hasta `intentos` veces, esperando `espera` ms entre una y otra.
 * Si todas fallan, propaga el ultimo error.
 */
export async function conReintento(accion, intentos = 2, espera = 1500) {
  let ultimoError;
  for (let numero = 1; numero <= intentos; numero += 1) {
    try {
      return await accion();
    } catch (error) {
      ultimoError = error;
      if (numero < intentos) {
        await new Promise((seguir) => setTimeout(seguir, espera));
      }
    }
  }
  throw ultimoError;
}
```

- [ ] **Paso 4: Escribir `js/imagen.js`**

```js
// imagen.js — validar y encoger una foto antes de gastarle datos moviles a nadie.

export const MAXIMO_BYTES = 10 * 1024 * 1024;
export const LADO_MAXIMO = 1600;
export const CALIDAD = 0.8;

/**
 * Comprueba tipo y peso antes de tocar la red. Funcion pura.
 * Ojo: esto es comodidad para quien sube, no seguridad. El Apps Script
 * revalida lo mismo en el servidor.
 */
export function validarArchivo(archivo) {
  if (!archivo || typeof archivo.type !== "string" || !archivo.type.startsWith("image/")) {
    return { valido: false, motivo: "Ese archivo no es una imagen. Elige una foto." };
  }
  if (archivo.size > MAXIMO_BYTES) {
    return { valido: false, motivo: "La foto pesa más de 10 MB. Elige una más liviana." };
  }
  return { valido: true };
}

/** Medidas finales conservando la proporcion. Nunca agranda. Funcion pura. */
export function calcularMedidas(ancho, alto, ladoMaximo = LADO_MAXIMO) {
  const mayor = Math.max(ancho, alto);
  if (mayor <= ladoMaximo) return { ancho, alto };
  const factor = ladoMaximo / mayor;
  return { ancho: Math.round(ancho * factor), alto: Math.round(alto * factor) };
}

/**
 * Redimensiona a LADO_MAXIMO y recomprime a JPEG.
 * Una foto de celular pasa de unos 4 MB a unos 300 KB.
 */
export async function comprimir(archivo, ladoMaximo = LADO_MAXIMO, calidad = CALIDAD) {
  const mapa = await createImageBitmap(archivo);
  const medidas = calcularMedidas(mapa.width, mapa.height, ladoMaximo);

  const lienzo = document.createElement("canvas");
  lienzo.width = medidas.ancho;
  lienzo.height = medidas.alto;
  lienzo.getContext("2d").drawImage(mapa, 0, 0, medidas.ancho, medidas.alto);
  mapa.close?.();

  const comprimida = await new Promise((entregar) =>
    lienzo.toBlob(entregar, "image/jpeg", calidad)
  );
  if (!comprimida) {
    throw new Error("No pudimos procesar esta foto. Intenta con otra.");
  }
  return comprimida;
}

/** Devuelve solo la parte base64, sin el prefijo "data:...;base64,". */
export function aBase64(blob) {
  return new Promise((entregar, rechazar) => {
    const lector = new FileReader();
    lector.addEventListener("load", () => {
      entregar(String(lector.result).split(",")[1] || "");
    });
    lector.addEventListener("error", () => {
      rechazar(new Error("No pudimos leer esta foto. Intenta con otra."));
    });
    lector.readAsDataURL(blob);
  });
}
```

- [ ] **Paso 5: Correr las pruebas en la terminal**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `23 pasaron, 0 fallaron, 1 solo navegador`.

- [ ] **Paso 6: Correr las pruebas en el navegador**

Sirve el sitio y abre `http://localhost:8000/pruebas.html`.
Esperado: `24 pasaron, 0 fallaron`, incluido el caso de compresión, que en la terminal se saltaba.

- [ ] **Paso 7: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026
git commit -m "feat: validacion, compresion de imagen y reintento con espera"
```

---

## Tarea 10: El puente con Drive (Google Apps Script)

El script que recibe las fotos. Vive en los servidores de Google, no se publica con el sitio, y es lo único que conoce el ID de la carpeta.

**Archivos:**
- Crear: `campamento-2026/apps-script/Codigo.gs`
- Crear: `campamento-2026/js/config.js`

**Interfaces:**
- Produce: aplicación web con `doPost` (recibe `{nombre, mime, datos, autor}`, devuelve `{ok, id}`) y `doGet` (devuelve `{ok, fotos: [{id, creado, autor}]}`, más reciente primero).
- Produce en `js/config.js`: `CONFIG` con `urlAppsScript`, `fotosPorPagina`, `anchoMiniatura`.

- [ ] **Paso 1: Escribir `apps-script/Codigo.gs`**

```javascript
/**
 * Codigo.gs — puente entre el sitio del Campamento 2026 y la carpeta de Drive.
 *
 * ESTE ARCHIVO NO SE PUBLICA CON EL SITIO. Se pega en script.google.com.
 *
 * COMO MONTARLO
 *  1. Entra a script.google.com CON LA CUENTA DE GMAIL DUEÑA DE LA CARPETA.
 *     El script actua con los permisos de quien lo publica; si lo publicas con
 *     otra cuenta, no podra escribir en la carpeta.
 *  2. Proyecto nuevo. Borra el contenido y pega este archivo completo.
 *  3. Implementar > Nueva implementacion > Aplicacion web.
 *       Ejecutar como:      Yo
 *       Quien tiene acceso: Cualquier persona
 *  4. Copia la URL que termina en /exec y pegala en js/config.js.
 *  5. Comprueba las cuotas vigentes de Apps Script para cuentas personales en
 *     developers.google.com/apps-script/guides/services/quotas antes del campamento.
 *
 * SI ALGUIEN ABUSA DEL ENDPOINT: crea una implementacion nueva (URL distinta)
 * y actualiza js/config.js. La URL anterior queda muerta.
 */

var CARPETA_ID = '1p-ykfs2etU-lzjuuQkesMDApvR9PC0Tb';
var MAXIMO_BYTES = 10 * 1024 * 1024;
var CLAVE_CACHE = 'listado_fotos';
var SEGUNDOS_CACHE = 60;
var ZONA_HORARIA = 'America/Bogota';

/** Sube una foto. El cuerpo llega como text/plain para no disparar la verificacion CORS previa. */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responder({ ok: false, error: 'sin_cuerpo' });
    }

    var cuerpo = JSON.parse(e.postData.contents);
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
    CacheService.getScriptCache().remove(CLAVE_CACHE);

    return responder({ ok: true, id: archivo.getId() });
  } catch (error) {
    return responder({ ok: false, error: 'fallo_servidor' });
  }
}

/** Lista las fotos, mas reciente primero, con cache de 60 segundos. */
function doGet() {
  try {
    var cache = CacheService.getScriptCache();
    var guardado = cache.get(CLAVE_CACHE);
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
    cache.put(CLAVE_CACHE, salida, SEGUNDOS_CACHE);

    return ContentService.createTextOutput(salida)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return responder({ ok: false, error: 'fallo_servidor' });
  }
}

/** Fecha, autor y nombre original saneado, para que la carpeta quede ordenada. */
function nombreSeguro(nombre, autor) {
  var original = String(nombre || 'foto.jpg').replace(/[^\w.\- ]+/g, '_').slice(-60);
  var marca = Utilities.formatDate(new Date(), ZONA_HORARIA, 'yyyyMMdd-HHmmss');
  var quien = autor ? '-' + String(autor).replace(/[^\w\- ]+/g, '_').slice(0, 30) : '';
  return marca + quien + '-' + original;
}

function responder(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}
```

- [ ] **Paso 2: Escribir `js/config.js`**

```js
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
```

- [ ] **Paso 3: Publicar el script y anotar la URL**

Sigue las instrucciones del encabezado de `Codigo.gs`. Pega la URL `/exec` resultante en `urlAppsScript` dentro de `js/config.js`.

- [ ] **Paso 4: Comprobar `doGet` desde el navegador**

Abre la URL `/exec` directamente en una pestaña.
Esperado: `{"ok":true,"fotos":[]}` (o con las fotos que ya haya en la carpeta).
Si sale una pantalla de inicio de sesión de Google, la implementación quedó con «Quién tiene acceso» mal configurado. Corrígelo antes de seguir.

- [ ] **Paso 5: Comprobar `doPost` de verdad, desde el navegador**

La especificación §6 exige que el paso por CORS se compruebe con una petición real, no que se dé por supuesto. Sirve el sitio, abre `http://localhost:8000`, y pega esto en la consola sustituyendo la URL:

```js
const pixelRojo =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const respuesta = await fetch("PEGA_AQUI_LA_URL_EXEC", {
  method: "POST",
  redirect: "follow",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify({
    nombre: "prueba.png",
    mime: "image/png",
    datos: pixelRojo,
    autor: "Prueba técnica",
  }),
});
console.log(await respuesta.json());
```

Esperado: `{ok: true, id: "..."}` y **ningún error de CORS en la consola**. En la pestaña Red no debe aparecer ninguna petición `OPTIONS` a esa URL: si aparece, se disparó la verificación previa y hay que revisar la cabecera `Content-Type`.

Comprueba también que el archivo apareció en la carpeta de Drive con el nombre `AAAAMMDD-HHMMSS-Prueba_tecnica-prueba.png`. Bórralo después.

- [ ] **Paso 6: Comprobar que el servidor rechaza lo que no es imagen**

Repite la petición anterior cambiando `mime` a `"application/pdf"`.
Esperado: `{ok: false, error: "tipo_no_permitido"}` y **ningún archivo nuevo** en Drive. Esto verifica que la validación del servidor no depende de la del navegador.

- [ ] **Paso 7: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026
git commit -m "feat: apps script para subir y listar fotos en Drive"
```

---

## Tarea 11: Galería de fotos

Subida múltiple con progreso por foto, carrusel deslizable, visor ampliado y paginación. Es la sección más frágil del sitio, porque depende de la red del campo y de un servicio ajeno.

**Archivos:**
- Crear: `campamento-2026/js/galeria.js`
- Modificar: `campamento-2026/css/secciones.css`
- Modificar: `campamento-2026/js/principal.js`

**Interfaces:**
- Consume: `CONFIG` de `js/config.js`; `validarArchivo`, `comprimir`, `aBase64` de `js/imagen.js`; `conReintento` de `js/util/red.js`; `mostrarFallo` de `js/util/datos.js`.
- Produce: `iniciar(contenedor)`.

- [ ] **Paso 1: Escribir `js/galeria.js`**

```js
// galeria.js — subida de fotos a Drive y carrusel publico.

import { CONFIG } from "./config.js";
import { aBase64, comprimir, validarArchivo } from "./imagen.js";
import { conReintento } from "./util/red.js";
import { mostrarFallo } from "./util/datos.js";

const MENSAJES = {
  sin_conexion: "Parece que no hay conexión. Revisa tus datos e inténtalo otra vez.",
  tipo_no_permitido: "Ese archivo no es una imagen. Elige una foto.",
  demasiado_grande: "La foto pesa más de 10 MB. Elige una más liviana.",
  archivo_vacio: "Esa foto llegó vacía. Intenta con otra.",
  respuesta_invalida: "El servidor respondió algo que no entendimos. Inténtalo otra vez.",
  fallo_servidor: "No pudimos guardar la foto en este momento. Inténtalo otra vez.",
  sin_configurar: "La subida de fotos todavía no está configurada. Avisa al liderazgo.",
};

function mensajeDe(error) {
  return MENSAJES[error?.message] || MENSAJES.fallo_servidor;
}

function urlMiniatura(id) {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${CONFIG.anchoMiniatura}`;
}

function urlGrande(id) {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`;
}

/**
 * Sube una foto con XMLHttpRequest y no con fetch, porque fetch no informa
 * del progreso de subida y la especificacion pide una barra por foto.
 * El Content-Type text/plain mantiene la peticion "simple" y evita CORS previo.
 */
function subirFoto(cuerpo, alProgreso) {
  return new Promise((entregar, rechazar) => {
    const peticion = new XMLHttpRequest();
    peticion.open("POST", CONFIG.urlAppsScript, true);
    peticion.setRequestHeader("Content-Type", "text/plain;charset=utf-8");

    peticion.upload.addEventListener("progress", (evento) => {
      if (evento.lengthComputable) alProgreso(evento.loaded / evento.total);
    });

    peticion.addEventListener("load", () => {
      let datos;
      try {
        datos = JSON.parse(peticion.responseText);
      } catch {
        rechazar(new Error("respuesta_invalida"));
        return;
      }
      if (datos.ok) entregar(datos);
      else rechazar(new Error(datos.error || "fallo_servidor"));
    });

    peticion.addEventListener("error", () => rechazar(new Error("sin_conexion")));
    peticion.addEventListener("timeout", () => rechazar(new Error("sin_conexion")));

    peticion.send(JSON.stringify(cuerpo));
  });
}

async function listarFotos() {
  const respuesta = await fetch(CONFIG.urlAppsScript, { redirect: "follow" });
  if (!respuesta.ok) throw new Error("fallo_servidor");
  const datos = await respuesta.json();
  if (!datos.ok) throw new Error(datos.error || "fallo_servidor");
  return datos.fotos || [];
}

export function iniciar(contenedor) {
  contenedor.innerHTML = "";

  const envoltorio = document.createElement("div");
  envoltorio.className = "contenedor";

  const titulo = document.createElement("h2");
  titulo.className = "seccion__titulo";
  titulo.id = "titulo-fotos";
  titulo.textContent = "Fotos";

  envoltorio.append(titulo, construirSubida(), construirCarrusel());
  contenedor.append(envoltorio);
}

// ---------- Subida ----------

let listaDeProgreso;
let alTerminarUnaSubida = () => {};

function construirSubida() {
  const bloque = document.createElement("div");
  bloque.className = "subida";

  const etiquetaAutor = document.createElement("label");
  etiquetaAutor.className = "subida__autor";
  const textoAutor = document.createElement("span");
  textoAutor.textContent = "Tu nombre (opcional)";
  const campoAutor = document.createElement("input");
  campoAutor.type = "text";
  campoAutor.className = "subida__campo";
  campoAutor.maxLength = 40;
  campoAutor.placeholder = "Para saber de quién es la foto";
  etiquetaAutor.append(textoAutor, campoAutor);

  const selector = document.createElement("input");
  selector.type = "file";
  selector.accept = "image/*";
  selector.multiple = true;
  selector.className = "solo-lectores";
  selector.id = "selector-fotos";

  const boton = document.createElement("label");
  boton.className = "pill subida__boton";
  boton.setAttribute("for", "selector-fotos");
  boton.textContent = "Sube tus fotos aquí";

  listaDeProgreso = document.createElement("ul");
  listaDeProgreso.className = "subida__progreso";
  listaDeProgreso.setAttribute("aria-live", "polite");

  selector.addEventListener("change", async () => {
    const elegidas = Array.from(selector.files || []);
    // Se vacia el selector para poder volver a elegir el mismo archivo si hace falta.
    selector.value = "";
    for (const archivo of elegidas) {
      await procesarUna(archivo, campoAutor.value.trim());
    }
  });

  bloque.append(etiquetaAutor, selector, boton, listaDeProgreso);
  return bloque;
}

async function procesarUna(archivo, autor) {
  const fila = document.createElement("li");
  fila.className = "progreso";

  const nombre = document.createElement("span");
  nombre.className = "progreso__nombre";
  nombre.textContent = archivo.name;

  const barra = document.createElement("div");
  barra.className = "progreso__barra";
  const relleno = document.createElement("div");
  relleno.className = "progreso__relleno";
  barra.append(relleno);

  const estado = document.createElement("span");
  estado.className = "progreso__estado";
  estado.textContent = "Preparando…";

  fila.append(nombre, barra, estado);
  listaDeProgreso.append(fila);

  const revision = validarArchivo(archivo);
  if (!revision.valido) {
    fila.classList.add("progreso--error");
    estado.textContent = revision.motivo;
    return;
  }

  const intentar = async () => {
    estado.textContent = "Comprimiendo…";
    const comprimida = await comprimir(archivo);
    const datos = await aBase64(comprimida);
    estado.textContent = "Subiendo…";
    return subirFoto(
      { nombre: archivo.name, mime: "image/jpeg", datos, autor },
      (fraccion) => {
        relleno.style.width = `${Math.round(fraccion * 100)}%`;
      }
    );
  };

  try {
    if (!CONFIG.urlAppsScript) throw new Error("sin_configurar");
    // Un reintento automatico con espera, como pide el manejo de errores.
    await conReintento(intentar, 2, 2000);
    relleno.style.width = "100%";
    fila.classList.add("progreso--listo");
    estado.textContent = "¡Lista!";
    alTerminarUnaSubida();
  } catch (error) {
    fila.classList.add("progreso--error");
    estado.textContent = mensajeDe(error);

    const reintentar = document.createElement("button");
    reintentar.type = "button";
    reintentar.className = "boton-reintentar";
    reintentar.textContent = "Reintentar";
    reintentar.addEventListener("click", () => {
      // La foto elegida no se pierde: se vuelve a procesar el mismo archivo.
      fila.remove();
      procesarUna(archivo, autor);
    });
    fila.append(reintentar);
  }
}

// ---------- Carrusel ----------

function construirCarrusel() {
  const bloque = document.createElement("div");
  bloque.className = "carrusel";

  const marco = document.createElement("div");
  marco.className = "carrusel__marco";

  const pista = document.createElement("ul");
  pista.className = "carrusel__pista";

  // La flecha del boceto. La fila tambien se desliza con el dedo;
  // la flecha existe para quien usa raton o teclado.
  const flecha = document.createElement("button");
  flecha.type = "button";
  flecha.className = "carrusel__flecha";
  flecha.textContent = "›";
  flecha.setAttribute("aria-label", "Ver las fotos siguientes");
  flecha.hidden = true;
  flecha.addEventListener("click", () => {
    const celda = pista.querySelector(".carrusel__celda");
    const paso = celda ? celda.getBoundingClientRect().width + 16 : 240;
    pista.scrollBy({ left: paso, behavior: "smooth" });
  });

  marco.append(pista, flecha);

  const masBoton = document.createElement("button");
  masBoton.type = "button";
  masBoton.className = "boton-reintentar carrusel__mas";
  masBoton.textContent = "Ver más fotos";
  masBoton.hidden = true;

  let todas = [];
  let mostradas = 0;

  function pintarTanda() {
    const siguiente = todas.slice(mostradas, mostradas + CONFIG.fotosPorPagina);
    for (const foto of siguiente) {
      pista.append(construirMiniatura(foto, () => abrirVisor(todas, todas.indexOf(foto))));
    }
    mostradas += siguiente.length;
    masBoton.hidden = mostradas >= todas.length;
  }

  async function cargar() {
    bloque.querySelector(".aviso-fallo")?.remove();
    try {
      if (!CONFIG.urlAppsScript) throw new Error("sin_configurar");
      todas = await listarFotos();
      pista.innerHTML = "";
      mostradas = 0;

      if (todas.length === 0) {
        const vacio = document.createElement("p");
        vacio.className = "carrusel__vacio";
        vacio.textContent = "Todavía no hay fotos. Sé el primero en subir una.";
        pista.append(vacio);
        masBoton.hidden = true;
        flecha.hidden = true;
        return;
      }
      flecha.hidden = false;
      pintarTanda();
    } catch (error) {
      pista.innerHTML = "";
      masBoton.hidden = true;
      flecha.hidden = true;
      const aviso = document.createElement("div");
      bloque.append(aviso);
      mostrarFallo(aviso, cargar);
      console.error("No se pudo listar las fotos:", error);
    }
  }

  masBoton.addEventListener("click", pintarTanda);
  // Cuando termina una subida, el carrusel se refresca sin recargar la pagina.
  alTerminarUnaSubida = cargar;

  bloque.append(marco, masBoton);
  cargar();
  return bloque;
}

function construirMiniatura(foto, alAbrir) {
  const celda = document.createElement("li");
  celda.className = "carrusel__celda";

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "carrusel__abrir";

  const imagen = document.createElement("img");
  imagen.src = urlMiniatura(foto.id);
  imagen.loading = "lazy";
  imagen.decoding = "async";
  imagen.alt = foto.autor ? `Foto del campamento subida por ${foto.autor}` : "Foto del campamento";

  boton.append(imagen);
  boton.addEventListener("click", alAbrir);
  celda.append(boton);
  return celda;
}

function abrirVisor(fotos, indiceInicial) {
  let indice = indiceInicial;

  const capa = document.createElement("div");
  capa.className = "visor";
  capa.setAttribute("role", "dialog");
  capa.setAttribute("aria-modal", "true");
  capa.setAttribute("aria-label", "Foto ampliada");

  const imagen = document.createElement("img");
  imagen.className = "visor__imagen";

  const anterior = botonVisor("‹", "Foto anterior", () => mover(-1));
  const siguiente = botonVisor("›", "Foto siguiente", () => mover(1));
  const cerrar = botonVisor("✕", "Cerrar la foto", cerrarTodo);
  cerrar.classList.add("visor__cerrar");

  function mostrar() {
    const foto = fotos[indice];
    imagen.src = urlGrande(foto.id);
    imagen.alt = foto.autor ? `Foto del campamento subida por ${foto.autor}` : "Foto del campamento";
  }

  function mover(paso) {
    indice = (indice + paso + fotos.length) % fotos.length;
    mostrar();
  }

  function alPulsarTecla(evento) {
    if (evento.key === "Escape") cerrarTodo();
    if (evento.key === "ArrowRight") mover(1);
    if (evento.key === "ArrowLeft") mover(-1);
  }

  function cerrarTodo() {
    document.removeEventListener("keydown", alPulsarTecla);
    document.body.style.overflow = "";
    capa.remove();
  }

  document.addEventListener("keydown", alPulsarTecla);
  document.body.style.overflow = "hidden";

  capa.append(cerrar, anterior, imagen, siguiente);
  document.body.append(capa);
  mostrar();
  cerrar.focus();
}

function botonVisor(texto, etiqueta, alPulsar) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "visor__boton";
  boton.textContent = texto;
  boton.setAttribute("aria-label", etiqueta);
  boton.addEventListener("click", alPulsar);
  return boton;
}
```

- [ ] **Paso 2: Añadir el bloque de fotos a `css/secciones.css`**

```css
/* ---------- Fotos ---------- */

.subida {
  display: grid;
  gap: var(--esp-3);
  justify-items: center;
  margin-bottom: var(--esp-5);
}

.subida__autor {
  display: grid;
  gap: var(--esp-1);
  width: min(100%, 24rem);
  font-size: var(--txt-menor);
}

.subida__campo {
  font: inherit;
  color: var(--vino);
  background: var(--hueso);
  border: none;
  border-radius: var(--radio-pill);
  padding: var(--esp-2) var(--esp-3);
}

.subida__boton {
  cursor: pointer;
}

.subida__progreso {
  list-style: none;
  margin: 0;
  padding: 0;
  width: min(100%, 32rem);
  display: grid;
  gap: var(--esp-2);
}

.progreso {
  display: grid;
  gap: var(--esp-1);
  background: rgba(254, 249, 221, 0.08);
  border-radius: 0.75rem;
  padding: var(--esp-2) var(--esp-3);
  font-size: var(--txt-menor);
}

.progreso__nombre {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progreso__barra {
  height: 0.375rem;
  border-radius: var(--radio-pill);
  background: rgba(254, 249, 221, 0.25);
  overflow: hidden;
}

.progreso__relleno {
  height: 100%;
  width: 0;
  background: var(--crema);
  transition: width 0.2s ease;
}

.progreso--listo .progreso__relleno {
  background: var(--crema);
}

.progreso--error .progreso__barra {
  display: none;
}

/* Carrusel: fila deslizable con ajuste al soltar. */
.carrusel__marco {
  position: relative;
}

.carrusel__flecha {
  position: absolute;
  top: 50%;
  right: var(--esp-2);
  transform: translateY(-50%);
  min-width: 3rem;
  min-height: 3rem;
  border: none;
  border-radius: var(--radio-pill);
  background: var(--crema);
  color: var(--vino);
  font-size: 1.75rem;
  line-height: 1;
  box-shadow: var(--sombra-tarjeta);
}

.carrusel__pista {
  list-style: none;
  margin: 0 0 var(--esp-3);
  padding: 0 0 var(--esp-2);
  display: flex;
  gap: var(--esp-3);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.carrusel__celda {
  flex: 0 0 auto;
  scroll-snap-align: start;
  width: min(70vw, 16rem);
}

.carrusel__abrir {
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: var(--radio-tarjeta);
  overflow: hidden;
}

.carrusel__abrir img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.carrusel__vacio,
.carrusel__mas {
  margin-inline: auto;
}

.carrusel__mas {
  display: block;
}

/* Visor ampliado */
.visor {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: var(--velo-oscuro);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--esp-2);
  padding: var(--esp-3);
}

.visor__imagen {
  max-width: 100%;
  max-height: 85vh;
  margin-inline: auto;
  border-radius: 0.75rem;
}

.visor__boton {
  min-width: 3rem;
  min-height: 3rem;
  border: none;
  border-radius: var(--radio-pill);
  background: var(--crema);
  color: var(--vino);
  font-size: 1.5rem;
  line-height: 1;
}

.visor__cerrar {
  position: absolute;
  top: var(--esp-3);
  right: var(--esp-3);
}
```

- [ ] **Paso 3: Activar el módulo en `js/principal.js`**

```js
  ["#fotos", () => import("./galeria.js")],
```

- [ ] **Paso 4: Verificar con la URL sin configurar**

Deja `urlAppsScript` vacío temporalmente, recarga y comprueba que la sección Fotos muestra el aviso con «Reintentar» y que **el resto de la página sigue funcionando**. Esto verifica el aislamiento de la especificación §8.

- [ ] **Paso 5: Verificar la subida completa**

Con la URL configurada:
- Elige tres fotos a la vez. Cada una muestra su propia barra y pasa por «Comprimiendo…» → «Subiendo…» → «¡Lista!».
- Las tres aparecen en el carrusel sin recargar la página.
- En la pestaña Red, cada petición POST pesa unos cientos de KB, no varios MB: la compresión está trabajando.
- Elige un PDF: se rechaza con «Ese archivo no es una imagen» **sin gastar red**.
- Con DevTools → Red → Offline, elige una foto: aparece «Parece que no hay conexión» y el botón Reintentar. Vuelve a estar en línea, pulsa Reintentar y la foto sube.
- La flecha de la derecha desplaza la fila una foto, y es alcanzable con `Tab`.
- Toca una miniatura: se abre el visor. Las flechas ← → cambian de foto, `Escape` cierra.
- Borra una foto desde la carpeta de Drive, espera un minuto (la caché del script) y recarga: desaparece del carrusel.

- [ ] **Paso 6: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026
git commit -m "feat: galeria con subida multiple, progreso, carrusel y visor"
```

---

## Tarea 12: Navegación fija y pie de página

Lo último que falta para que la página de 6000 píxeles sea navegable, y el pie con lo que hace falta en una emergencia.

**Archivos:**
- Crear: `campamento-2026/datos/contactos.json`
- Crear: `campamento-2026/js/navegacion.js`
- Crear: `campamento-2026/js/pie.js`
- Crear: `campamento-2026/img/LEEME.md`
- Modificar: `campamento-2026/css/secciones.css`
- Modificar: `campamento-2026/js/principal.js`
- Modificar: `campamento-2026/pruebas/casos.js`

**Interfaces:**
- Produce: `iniciar(contenedor)` en ambos módulos, y la función pura `enlaceTelefono(telefono) -> string` en `js/pie.js`.

- [ ] **Paso 1: Escribir `datos/contactos.json`**

```json
{
  "whatsapp": "PENDIENTE — enlace del grupo de WhatsApp",
  "emergencia": [
    {
      "nombre": "PENDIENTE — nombre",
      "rol": "Coordinador general",
      "telefono": "+57 300 000 0000"
    },
    {
      "nombre": "PENDIENTE — nombre",
      "rol": "Enfermería",
      "telefono": "+57 300 000 0000"
    }
  ]
}
```

- [ ] **Paso 2: Escribir el caso que falla**

Import y un caso en `pruebas/casos.js`:

```js
import { enlaceTelefono } from "../js/pie.js";
```

```js
  {
    nombre: "enlaceTelefono deja el numero listo para marcar",
    entorno: "ambos",
    ejecutar() {
      igual(enlaceTelefono("+57 300 000 0000"), "tel:+573000000000", "Deberia quitar los espacios");
      igual(enlaceTelefono("(604) 123-4567"), "tel:6041234567", "Deberia quitar parentesis y guiones");
      igual(enlaceTelefono(""), "", "Sin numero no deberia haber enlace");
    },
  },
```

- [ ] **Paso 3: Correr las pruebas y verificar que fallan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `Cannot find module` apuntando a `js/pie.js`.

- [ ] **Paso 4: Escribir `js/pie.js`**

```js
// pie.js — logos, grupo de WhatsApp y contactos de emergencia.

import { cargarJSON, montarSeccion } from "./util/datos.js";

/**
 * Convierte un telefono escrito para humanos en un enlace marcable.
 * Conserva el + inicial, que es lo que distingue un numero internacional.
 */
export function enlaceTelefono(telefono) {
  const limpio = String(telefono ?? "").replace(/[^\d+]/g, "");
  return limpio ? `tel:${limpio}` : "";
}

export function iniciar(contenedor) {
  return montarSeccion(
    contenedor,
    () => cargarJSON("datos/contactos.json"),
    pintarPie
  );
}

function pintarPie(contenedor, contactos) {
  const envoltorio = document.createElement("div");
  envoltorio.className = "contenedor pie";

  envoltorio.append(construirMarcas(), construirEnlaces(contactos));
  contenedor.append(envoltorio);
}

function construirMarcas() {
  const bloque = document.createElement("div");
  bloque.className = "pie__marcas";

  const iglesia = document.createElement("img");
  iglesia.className = "pie__logo";
  iglesia.src = "img/logo-iglesia.svg";
  iglesia.alt = "Logo de la iglesia";
  // Si el logo definitivo aun no esta, no se deja un icono roto en pantalla.
  iglesia.addEventListener("error", () => iglesia.remove());

  const separador = document.createElement("span");
  separador.className = "pie__separador";
  separador.setAttribute("aria-hidden", "true");

  const trasciende = document.createElement("div");
  trasciende.className = "pie__trasciende";

  const logo = document.createElement("img");
  logo.className = "pie__logo";
  logo.src = "img/logo-trasciende.svg";
  logo.alt = "Logo de TRASCIENDE";
  logo.addEventListener("error", () => logo.remove());

  const leyenda = document.createElement("p");
  leyenda.className = "pie__leyenda";
  leyenda.textContent = "Jóvenes Itagüí Central";

  trasciende.append(logo, leyenda);
  bloque.append(iglesia, separador, trasciende);
  return bloque;
}

function construirEnlaces(contactos) {
  const bloque = document.createElement("div");
  bloque.className = "pie__enlaces";

  if (contactos.whatsapp && !contactos.whatsapp.startsWith("PENDIENTE")) {
    const whatsapp = document.createElement("a");
    whatsapp.className = "pill pie__whatsapp";
    whatsapp.href = contactos.whatsapp;
    whatsapp.target = "_blank";
    whatsapp.rel = "noopener noreferrer";
    whatsapp.textContent = "Grupo de WhatsApp";
    bloque.append(whatsapp);
  }

  const emergencia = document.createElement("details");
  emergencia.className = "pie__emergencia";

  const cabecera = document.createElement("summary");
  cabecera.className = "pie__emergencia-titulo";
  cabecera.textContent = "Contactos de emergencia";

  const lista = document.createElement("ul");
  lista.className = "pie__contactos";

  for (const contacto of contactos.emergencia || []) {
    const fila = document.createElement("li");

    const quien = document.createElement("span");
    quien.className = "pie__contacto-quien";
    quien.textContent = `${contacto.nombre} · ${contacto.rol}`;

    const marcar = document.createElement("a");
    marcar.className = "pie__contacto-tel";
    marcar.href = enlaceTelefono(contacto.telefono);
    marcar.textContent = contacto.telefono;

    fila.append(quien, marcar);
    lista.append(fila);
  }

  emergencia.append(cabecera, lista);
  bloque.append(emergencia);
  return bloque;
}
```

- [ ] **Paso 5: Correr las pruebas y verificar que pasan**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `24 pasaron, 0 fallaron, 1 solo navegador`.

- [ ] **Paso 6: Escribir `js/navegacion.js`**

```js
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
```

- [ ] **Paso 7: Añadir los bloques de navegación y pie a `css/secciones.css`**

```css
/* ---------- Navegacion fija ---------- */

.navegacion {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  background: var(--vino);
  border-top: 0.0625rem solid rgba(254, 249, 221, 0.25);
  box-shadow: var(--sombra-flotante);
  /* Respeta la barra de gestos de los iPhone. */
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.navegacion__lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  height: var(--alto-navegacion);
}

.navegacion__enlace {
  display: grid;
  place-items: center;
  height: 100%;
  text-decoration: none;
  color: var(--crema);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.navegacion__lista li {
  flex: 1;
}

/* ---------- Pie ---------- */

.pie {
  display: grid;
  gap: var(--esp-4);
  padding-block: var(--esp-5);
  color: var(--vino);
}

.pie__marcas {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--esp-3);
}

.pie__logo {
  max-height: 3.5rem;
  width: auto;
}

.pie__separador {
  width: 0.0625rem;
  align-self: stretch;
  background: currentColor;
  opacity: 0.35;
}

.pie__leyenda {
  margin: 0;
  font-size: var(--txt-menor);
  font-weight: 600;
}

.pie__enlaces {
  display: grid;
  gap: var(--esp-3);
  justify-items: center;
}

.pie__whatsapp {
  background: var(--vino);
  color: var(--crema);
}

.pie__emergencia {
  width: min(100%, 26rem);
}

.pie__emergencia-titulo {
  cursor: pointer;
  font-weight: 600;
  text-align: center;
}

.pie__contactos {
  list-style: none;
  margin: var(--esp-3) 0 0;
  padding: 0;
  display: grid;
  gap: var(--esp-3);
}

.pie__contactos li {
  display: grid;
  gap: var(--esp-1);
}

.pie__contacto-quien {
  font-size: var(--txt-menor);
}

.pie__contacto-tel {
  font-weight: 700;
  /* Area de toque comoda: en una emergencia nadie deberia fallar el dedo. */
  padding: var(--esp-2) 0;
}

@media (min-width: 48rem) {
  .navegacion {
    top: 0;
    bottom: auto;
    border-top: none;
    border-bottom: 0.0625rem solid rgba(254, 249, 221, 0.25);
  }

  .navegacion__lista {
    justify-content: center;
    gap: var(--esp-5);
  }

  .navegacion__lista li {
    flex: 0 0 auto;
  }

  .pie {
    grid-template-columns: 1fr 1fr;
    align-items: center;
  }
}
```

- [ ] **Paso 8: Crear `img/LEEME.md`**

```markdown
# Imágenes

Faltan los archivos definitivos. Ponlos aquí con estos nombres exactos:

- `logo-iglesia.svg` — logo de la iglesia
- `logo-trasciende.svg` — logo de TRASCIENDE

Si un logo no está, el pie de página simplemente no lo muestra: no aparece
un icono roto. Se aceptan `.png`, pero hay que cambiar la extensión en `js/pie.js`.
```

- [ ] **Paso 9: Activar los dos módulos en `js/principal.js`**

El array queda con las ocho líneas descomentadas:

```js
const secciones = [
  ["#portada", () => import("./carta.js")],
  ["#habitaciones", () => import("./habitaciones.js")],
  ["#programacion", () => import("./programacion.js")],
  ["#canciones", () => import("./canciones.js")],
  ["#locacion", () => import("./locacion.js")],
  ["#fotos", () => import("./galeria.js")],
  ["#pie", () => import("./pie.js")],
  ["#navegacion", () => import("./navegacion.js")],
];
```

- [ ] **Paso 10: Verificar en el navegador**

- Celular: la barra queda fija abajo, con los cuatro accesos, y no tapa el final del pie de página.
- Cada acceso salta a su sección.
- Escritorio: la barra pasa arriba y el contenido no queda oculto debajo.
- El pie muestra «Jóvenes Itagüí Central» y, al desplegar «Contactos de emergencia», los números.
- En un celular real, tocar un número abre el marcador con el número puesto.
- Sin los logos en `img/`, el pie se ve limpio, sin iconos rotos.

- [ ] **Paso 11: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026
git commit -m "feat: navegacion fija y pie con contactos de emergencia"
```

---

## Tarea 13: Repaso final y lista de verificación previa al campamento

Cierre: comprobar que todo lo que la especificación exige está y funciona junto, no por separado.

**Archivos:**
- Crear: `campamento-2026/VERIFICACION.md`
- Modificar: los que haga falta corregir

- [ ] **Paso 1: Correr la suite completa en los dos ejecutores**

```bash
cd "D:/Página Campamento Itagüí/campamento-2026" && node pruebas/ejecutar-en-node.js
```

Esperado: `24 pasaron, 0 fallaron, 1 solo navegador`.

Luego, en `http://localhost:8000/pruebas.html`, esperado: `25 pasaron, 0 fallaron`.

- [ ] **Paso 2: Repasar el aislamiento sección por sección**

Renombra cada uno de los seis archivos de `datos/` a `.bak`, uno a la vez, recarga y confirma dos cosas: la sección afectada muestra su aviso con «Reintentar», y **todas las demás siguen funcionando**. Restaura el nombre y pulsa Reintentar antes de pasar a la siguiente. Son seis rondas.

- [ ] **Paso 3: Repasar teclado y foco**

Recorre toda la página con `Tab` sin tocar el ratón. Comprueba que:
- Todo control interactivo recibe foco con contorno visible.
- El sobre, las pestañas, las habitaciones, «Cantar», los botones de mapa, el selector de fotos y los contactos son alcanzables y accionables.
- Dentro de la letra a pantalla completa y del visor de fotos, `Escape` cierra.

- [ ] **Paso 4: Repasar en la pantalla más pequeña disponible**

En DevTools, ancho de 320 px. Confirma que nada se desborda horizontalmente, que el texto se lee, y que ningún botón queda por debajo de 44 px de alto.

- [ ] **Paso 5: Repasar con movimiento reducido**

DevTools → Rendering → «Emulate prefers-reduced-motion: reduce». La carta, el carrusel y las transiciones no deben animarse. El sitio debe seguir siendo completamente usable.

- [ ] **Paso 6: Comprobar que no hay peticiones a terceros**

Recarga con la pestaña Red abierta y filtra por dominio. Los únicos dominios externos admitidos son `google.com` (mapa embebido y miniaturas de Drive) y `script.google.com` (la subida). **Ninguna petición a `fonts.googleapis.com`, `fonts.gstatic.com` ni a ningún CDN.** Si aparece alguna, es un error que hay que corregir antes de cerrar.

- [ ] **Paso 7: Escribir `VERIFICACION.md`**

```markdown
# Lista de verificación antes del campamento

## Contenido que falta poner

- [ ] `datos/carta.json` — texto real de la carta de bienvenida
- [ ] `datos/habitaciones.json` — habitaciones reales con sus integrantes
- [ ] `datos/contactos.json` — enlace del grupo de WhatsApp
- [ ] `datos/contactos.json` — nombres, roles y teléfonos de emergencia
- [ ] `datos/locacion.json` — punto exacto de la finca en Google Maps y en Waze
- [ ] `datos/canciones.json` — canciones adicionales del libro
- [ ] `img/logo-iglesia.svg` y `img/logo-trasciende.svg`
- [ ] `js/config.js` — URL `/exec` del Apps Script publicado
- [ ] Confirmar con el liderazgo las dos actividades del sábado a las 8:00 PM
      («Cena» y «Noche de alabanza» aparecen a la misma hora en el boceto)

## Antes de publicar

- [ ] La cuenta de Gmail dueña de la carpeta de Drive tiene espacio libre
- [ ] Esa cuenta no es el Drive personal de nadie
- [ ] Las cuotas vigentes de Apps Script para cuentas personales están revisadas
      en developers.google.com/apps-script/guides/services/quotas

## Pruebas en dispositivos reales

- [ ] Subir una foto desde Android con datos móviles
- [ ] Subir una foto desde iPhone con datos móviles
- [ ] Subir varias fotos a la vez
- [ ] Revisar la página completa en la pantalla más pequeña disponible
- [ ] Cortar la conexión a mitad de una subida y comprobar el mensaje
- [ ] Verificar que la foto subida aparece en la carpeta de Drive
- [ ] Borrar una foto desde Drive y confirmar que desaparece del carrusel
- [ ] Comprobar los enlaces de WhatsApp, Maps, Waze y los `tel:`
- [ ] Probar el modo pantalla completa de una canción con la pantalla en reposo

## Durante el campamento

- Para borrar una foto: elimínala de la carpeta de Drive. Desaparece del
  carrusel en menos de un minuto.
- Si alguien abusa del endpoint de subida: crea una implementación nueva del
  Apps Script (URL distinta) y actualiza `js/config.js`. La URL anterior muere.
```

- [ ] **Paso 8: Commit**

```bash
cd "D:/Página Campamento Itagüí"
git add campamento-2026
git commit -m "docs: lista de verificacion previa al campamento"
```

---

## Cobertura de la especificación

| Requisito de la especificación | Dónde se cumple |
|---|---|
| §3 Color, tipografía servida localmente | Tarea 1, pasos 2–6 |
| §4 Sitio estático sin compilación | Tarea 1, pasos 4 y 8 |
| §4 Aislamiento y `iniciar(contenedor)` | Tarea 2, paso 5 |
| §5 Los seis archivos de `datos/` | Tareas 3, 4, 5, 7, 8, 12 |
| §6 Apps Script, `doPost`, `doGet`, caché de 60 s | Tarea 10, paso 1 |
| §6 Revalidación en el servidor | Tarea 10, pasos 1 y 6 |
| §6 Comprobación real de CORS desde el navegador | Tarea 10, paso 5 |
| §6 Compresión antes de subir | Tarea 9, paso 4 |
| §7.1 Portada y carta que se abre | Tarea 3 |
| §7.2 Habitaciones, plegadas en celular | Tarea 5 |
| §7.3 Programación, pestañas en celular | Tarea 4 |
| §7.4 Buscador por título y letra, pantalla completa, wakeLock | Tareas 6 y 7 |
| §7.5 Mapa diferido, Maps, Waze, copiar dirección | Tarea 8 |
| §7.6 Subida múltiple, progreso, carrusel, visor, paginación, miniaturas | Tarea 11 |
| §7.7 Pie con logos, WhatsApp y `tel:` | Tarea 12 |
| §7.8 Navegación fija | Tarea 12 |
| §8 Ninguna falla tumba la página | Tarea 2, paso 3; Tarea 13, paso 2 |
| §9 Accesibilidad y rendimiento | Restricciones globales; Tarea 13, pasos 3–6 |
| §10 `pruebas.html` y las cuatro áreas cubiertas | Tarea 1, paso 12; Tareas 4, 6, 9 |
| §10 Lista manual previa al campamento | Tarea 13, paso 7 |
| §11 Contenido pendiente | `VERIFICACION.md`, Tarea 13 |
