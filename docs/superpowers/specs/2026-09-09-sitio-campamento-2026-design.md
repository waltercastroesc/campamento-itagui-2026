# Sitio web — Campamento Itagüí 2026

**Lema:** «Derramaré de mi Espíritu»
**Organiza:** TRASCIENDE — Jóvenes Itagüí Central
**Fecha del documento:** 2026-09-09
**Estado:** aprobado, pendiente de plan de implementación

---

## 1. Objetivo

Una página web de una sola pantalla larga que sirva de guía y recuerdo del campamento:
que cada joven sepa qué va a pasar, dónde duerme, cómo llegar, qué se canta, y pueda
compartir sus fotos con todos.

Se usará casi siempre **desde un celular, en el campo y con señal irregular**. Esa es la
restricción que manda sobre todas las decisiones técnicas.

---

## 2. Alcance

### Incluido
- Portada con el lema y una carta de bienvenida que se abre.
- Listado de habitaciones con sus integrantes.
- Programación de los tres días.
- Libro de canciones ampliable, con buscador y modo para cantar.
- Locación con mapa real y enlaces de navegación.
- Subida de fotos por parte de los asistentes y carrusel público.
- Pie de página con logos, grupo de WhatsApp y contactos de emergencia.
- Menú de navegación fijo.

### Excluido deliberadamente
- Registro, inscripciones o pagos.
- Cuentas de usuario o inicio de sesión.
- Panel de administración web. Moderar consiste en borrar el archivo de la carpeta de Drive.
- Resaltado automático de la actividad en curso. Evaluado y descartado por el liderazgo.
- Plano ilustrado interactivo de la finca. Se reemplaza por mapa real.
- Carta personalizada por persona. El mensaje de bienvenida es el mismo para todos.

---

## 3. Identidad visual

Tomada de la guía de marca (`Red and Beige Elegant Sophisticated Company Letter.pdf`).

### Color

| Token | Valor | Uso |
|---|---|---|
| `--vino` | `#550b18` | Fondo dominante, títulos sobre claro, círculos de hora |
| `--crema` | `#fef9dd` | Títulos y texto sobre vino, acentos |
| `--hueso` | `#fbf8f3` | Fondo de tarjetas y del pie de página |

Contraste verificado: crema sobre vino y vino sobre hueso superan holgadamente WCAG AA.
No se introducen colores fuera de esta paleta salvo los grises neutros de sombras.

### Tipografía

| Familia | Uso | Origen |
|---|---|---|
| **TAN Meringue** | Títulos de sección y portada | `TAN-Meringue-Font.zip` → `TAN MERINGUE.woff2` |
| **Poppins** | Todo el texto corriente, botones, horarios | `poppins.zip`, licencia OFL |

Ambas se sirven desde el propio sitio en formato `.woff2`. Los `.ttf` de Poppins se
convierten a `.woff2` y se limitan a los cuatro pesos realmente usados (Regular, Medium,
SemiBold, Bold). **El sitio no depende de Google Fonts ni de ningún CDN externo.**

TAN Meringue es una fuente comercial. El archivo lo aporta la iglesia y su uso queda
bajo su responsabilidad y licencia.

---

## 4. Arquitectura

Sitio **estático puro**: HTML, CSS y JavaScript sin paso de compilación. Se publica
copiando la carpeta a Netlify, Vercel o GitHub Pages.

La razón: el sitio se usa intensamente un fin de semana y luego se archiva o se recicla
al año siguiente. Que cualquiera pueda editarlo sin instalar Node ni saber usar `npm`
vale más aquí que la elegancia interna del código.

```
campamento-2026/
├── index.html
├── css/
│   ├── tokens.css        colores, tipografías, escalas, espaciado
│   ├── base.css          reset, tipografía base, utilidades
│   └── secciones.css     estilos de cada bloque
├── js/
│   ├── config.js         URL del Apps Script y constantes
│   ├── contenido.js      carga los JSON → programación, locación, contactos
│   ├── carta.js          animación del sobre
│   ├── canciones.js      buscador + letra a pantalla completa
│   ├── habitaciones.js   listado por habitación
│   ├── galeria.js        subida a Drive + carrusel
│   └── navegacion.js     menú fijo
├── datos/                ← lo único que se edita cada año
│   ├── carta.json
│   ├── programacion.json
│   ├── canciones.json
│   ├── habitaciones.json
│   ├── locacion.json
│   └── contactos.json
├── fuentes/              TAN MERINGUE + Poppins (.woff2)
├── img/
├── pruebas.html          verificación de las funciones con lógica
└── apps-script/
    └── Codigo.gs         se pega en script.google.com; no se publica con el sitio
```

### Principio de aislamiento

Cada archivo de `js/` es responsable de **una sola sección** y no conoce a las demás.
Se comunican únicamente a través de los archivos de `datos/` y del DOM de su propio
bloque. Consecuencia práctica: se puede modificar el libro de canciones sin
riesgo de romper la galería de fotos.

Cada módulo expone una única función de entrada, `iniciar(contenedor)`, que recibe el
elemento del DOM donde debe montarse. Si un módulo falla, los demás siguen funcionando.

---

## 5. Modelo de datos

Todos los archivos en `datos/` son JSON plano, editables con el Bloc de notas.

```jsonc
// carta.json
{
  "titulo": "Carta para ti",
  "parrafos": ["Primer párrafo…", "Segundo párrafo…"],
  "firma": "Liderazgo TRASCIENDE"
}

// programacion.json
[
  {
    "dia": "Viernes",
    "numero": 1,
    "bloques": [
      { "hora": "5:00 PM", "actividad": "Salida" },
      { "hora": "7:00 PM", "actividad": "Llegada y acomodación" }
    ]
  }
]

// canciones.json
[
  {
    "id": "derrama",
    "titulo": "Derrama",
    "numero": 1,
    "lema": true,
    "bloques": [
      { "tipo": "estrofa", "lineas": ["Eres poderoso", "No lo puedo explicar"] },
      { "tipo": "coro",    "lineas": ["Soy una vasija esperando ser llena"] }
    ]
  }
]

// habitaciones.json
[
  {
    "nombre": "Habitación 1",
    "lider": "Nombre del líder",
    "integrantes": ["Nombre 1", "Nombre 2"]
  }
]

// locacion.json
{
  "nombre": "Finca San Sebastián",
  "direccion": "Girardota, Antioquia",
  "mapaEmbebido": "https://www.google.com/maps/embed?…",
  "enlaceMaps": "https://maps.app.goo.gl/…",
  "enlaceWaze": "https://waze.com/ul?…",
  "puntos": ["Auditorio", "Comedor", "Cabañas", "Zona de recreación", "Enfermería"]
}

// contactos.json
{
  "whatsapp": "https://chat.whatsapp.com/…",
  "emergencia": [
    { "nombre": "Nombre", "rol": "Coordinador general", "telefono": "+57 300 000 0000" }
  ]
}
```

El contenido de las dos canciones lema («Derrama» y «Derrama tu poder») ya está
disponible completo en el PDF de la guía de marca y se transcribe en la implementación.

---

## 6. Integración con Google Drive

Las fotos se guardan en una carpeta de **Google Drive de una cuenta de Gmail dedicada
al campamento** (no el Drive personal de ninguna persona). El correo institucional
`@ipuc.org.co` no es Google Workspace, así que aplican las cuotas de cuenta personal.

**Carpeta de destino ya creada:**

```
ID:      1p-ykfs2etU-lzjuuQkesMDApvR9PC0Tb
Enlace:  https://drive.google.com/drive/folders/1p-ykfs2etU-lzjuuQkesMDApvR9PC0Tb
```

El ID se configura **dentro de `Codigo.gs`**, que vive en los servidores de Google, y
no en `config.js`. Es decir: la carpeta no queda expuesta en el código público del sitio.

Dos condiciones que hay que cumplir al montarlo:

1. El Apps Script debe crearse **desde la cuenta de Google dueña de esta carpeta**, o
   desde una cuenta con permiso de edición sobre ella. El script actúa con los permisos
   de quien lo publica.
2. Las cuotas de almacenamiento se descuentan de la cuenta **propietaria** de la carpeta.
   Conviene confirmar que esa cuenta tiene espacio libre suficiente y que no es el Drive
   personal de nadie.

### Por qué Drive y no Firebase

Se evaluó Firebase Storage y se descartó por tres razones: los proyectos nuevos exigen
plan Blaze con tarjeta de crédito registrada; las fotos quedarían en una consola que el
liderazgo no usa; y borrar una foto indebida requeriría entrar a esa consola. Con Drive,
las fotos quedan en una carpeta que ya saben manejar, moderar es eliminar un archivo, y
descargar todo al final del campamento es un clic derecho.

La contrapartida asumida: Drive no es un servidor de imágenes y limita las peticiones a
imágenes muy solicitadas. Se mitiga en el diseño de la galería (ver §7.6).

### El puente: Google Apps Script

Un script alojado en la propia cuenta de Google, publicado como aplicación web con
**«Ejecutar como: yo»** y **«Quién tiene acceso: cualquier persona»**. Corre con los
permisos del dueño de la cuenta, de modo que **quien sube una foto no necesita tener
cuenta de Google ni iniciar sesión**.

Dos operaciones:

| Operación | Entrada | Salida |
|---|---|---|
| `doPost` | JSON con `nombre`, `mime`, `datos` (base64), `autor` opcional | `{ ok, id }` |
| `doGet`  | — | `{ ok, fotos: [{ id, creado, autor }] }`, más reciente primero |

`doPost` decodifica el base64, crea el archivo en la carpeta configurada, lo marca como
visible para cualquiera con el enlace y devuelve su ID.
`doGet` lista la carpeta ordenada por fecha descendente, con la respuesta **en caché de
60 segundos** mediante `CacheService`, para no consultar Drive en cada visita.

### Detalle crítico: evitar la verificación CORS previa

El navegador envía el cuerpo como `Content-Type: text/plain` con un JSON dentro, y el
script lo lee de `e.postData.contents`. Es deliberado: `text/plain` es uno de los tipos
que el navegador considera «petición simple», así que **no dispara la verificación CORS
previa**, que es exactamente donde suelen fallar estas integraciones.

Este comportamiento **debe comprobarse con una prueba real desde el navegador antes de
dar por bueno el flujo completo**, no darse por supuesto.

### Compresión antes de subir

El navegador redimensiona la foto a **máximo 1600 px en su lado mayor** y la recomprime
a JPEG con calidad 0.8 usando `canvas`. Una foto típica de celular pasa de unos 4 MB a
unos 300 KB. Beneficio doble: sube rápido con datos móviles y el carrusel no se arrastra.

Validación previa a la subida, para no gastar datos en vano:
- Solo tipos `image/*`. Cualquier otro archivo se rechaza con aviso.
- Máximo 10 MB por archivo **antes** de comprimir.

### El endpoint es público, y eso es intencional

La URL del Apps Script vive en `config.js`, dentro de un sitio público: cualquiera que
mire el código fuente puede encontrarla y enviarle imágenes directamente, sin pasar por
la página. Es la consecuencia inevitable de haber elegido subida abierta sin código ni
inicio de sesión, y se asume conscientemente.

Lo que sí se hace al respecto:
- El script **revalida tipo y tamaño del lado del servidor**, no solo en el navegador.
  Las validaciones del navegador son comodidad para el usuario, no seguridad.
- El script solo sabe crear archivos en una carpeta concreta. No puede leer ni borrar
  nada más de la cuenta de Drive.
- Si alguien abusa del endpoint, se genera una implementación nueva del script (URL
  distinta) y se actualiza `config.js`. La URL anterior queda muerta.

### Cuotas

Con fotos de unos 300 KB, los 15 GB gratuitos de una cuenta personal dan para el orden
de 50.000 fotos. No es la restricción activa. La restricción real es el tiempo diario de
ejecución de Apps Script en cuentas personales, del orden de 90 minutos; a un par de
segundos por subida, permite del orden de miles de subidas al día.

> Las cifras de cuota anteriores son aproximadas y **deben verificarse contra la
> documentación vigente de Google al montar el proyecto**, no asumirse.

---

## 7. Secciones

### 7.1 Portada y carta

Fondo vino. Título «DERRAMARÉ DE MI / ESPÍRITU» en TAN Meringue crema, a tamaño fluido
con `clamp()`. Debajo, «CAMP 2026» en Poppins con espaciado amplio entre letras,
flanqueado por dos líneas horizontales finas, como en el boceto.

El sobre «Carta para ti» empieza cerrado, con el sello TRASCIENDE. Al tocarlo:
la solapa gira hacia atrás, la carta sale deslizándose y se despliega el mensaje de
`carta.json`. Se puede volver a cerrar.

Si el dispositivo tiene activado «reducir movimiento» (`prefers-reduced-motion`), la
carta aparece directamente sin animación.

### 7.2 Conoce tu habitación

El botón pill del boceto lleva a la sección. Una tarjeta por habitación con nombre,
líder destacado e integrantes; tarjetas color hueso sobre fondo vino, con las esquinas
muy redondeadas del diseño.

- **Escritorio:** rejilla de varias columnas, todas visibles.
- **Celular:** una columna, con las tarjetas **plegadas**. Quince habitaciones
  desplegadas serían un scroll interminable.

### 7.3 Programación

Las tres tarjetas colgantes del boceto: número grande en vino sobresaliendo del borde
superior, día en vertical, y cada bloque con su círculo vino con la hora en crema y la
actividad en Poppins SemiBold.

- **Escritorio:** tres columnas lado a lado.
- **Celular:** pestañas Viernes / Sábado / Domingo. Apilar los tres días serían casi
  tres pantallas de scroll, y durante el campamento uno solo quiere ver el día de hoy.

### 7.4 Libro de canciones

Marco de libreta abierta con anillas al centro en escritorio; una sola página en celular.

- **Buscador** que filtra mientras se escribe, por título **y por el texto de la letra**
  — sirve cuando alguien recuerda un verso pero no el nombre.
- Las dos canciones lema van marcadas con `#1` y `#2`.
- El coro se distingue visualmente de las estrofas.
- **Modo pantalla completa:** fondo vino, letra grande en crema, sin nada más, con
  controles A− / A+ de tamaño. En este modo se solicita `navigator.wakeLock` para que la
  pantalla no se apague a mitad de la canción. Si el navegador no lo soporta, se ignora
  en silencio.

Agregar canciones consiste en añadir objetos a `canciones.json`. No hay límite.

### 7.5 Locación

Franja vino con el título en TAN Meringue. Debajo:

- Mapa de Google embebido centrado en Finca San Sebastián, Girardota, con
  `loading="lazy"` para que no pese en la apertura de la página.
- Dos botones grandes: **Abrir en Google Maps** y **Abrir en Waze**.
- Dirección en texto con botón de copiar.
- Lista de puntos clave de la finca desde `locacion.json`.

### 7.6 Fotos

El botón pill «SUBE TUS FOTOS AQUÍ» abre el selector de archivos y **permite elegir
varias de una vez**, con un campo opcional para el nombre de quien sube. Cada foto
muestra su barra de progreso individual y, al terminar, entra al carrusel sin recargar.

El carrusel es la fila deslizable horizontal del boceto, con la flecha a la derecha. Al
tocar una foto se abre en grande con flechas para navegar.

Mitigaciones frente a los límites de Drive como servidor de imágenes:
- Se piden **miniaturas** (`drive.google.com/thumbnail?id=…&sz=w800`), no las fotos
  completas.
- Carga diferida: solo se descargan las imágenes visibles al hacer scroll.
- Paginación de 30 en 30, con más al llegar al final.
- La lista de archivos se cachea en el propio Apps Script durante 60 segundos.

### 7.7 Pie de página

Fondo hueso. Logo de la iglesia, separador vertical, logo TRASCIENDE con «Jóvenes Itagüí
Central». A la derecha, **Grupo de WhatsApp** enlazado y **Contactos de emergencia**, que
despliega la lista con enlaces `tel:` para llamar de un toque: en una emergencia nadie
debería tener que copiar un número a mano.

### 7.8 Menú de navegación fijo

Barra discreta fija en la parte inferior en celular, con accesos directos a Programación,
Canciones, Habitaciones y Fotos. La página mide unos 6000 píxeles; sin esto hay que
hacer mucho scroll para llegar a lo que se busca. En escritorio se muestra como barra
superior discreta.

---

## 8. Manejo de errores

**Ninguna falla puede tumbar la página entera.** Cada sección carga su JSON por separado;
si uno falla, esa sección muestra un aviso breve y el resto sigue funcionando.

| Situación | Comportamiento |
|---|---|
| Un `datos/*.json` no carga | La sección muestra «No pudimos cargar esta información» y un botón de reintentar. El resto de la página, intacto. |
| Archivo que no es imagen | Se rechaza antes de subir, con aviso claro. |
| Imagen de más de 10 MB | Se rechaza antes de subir, con aviso claro. |
| Sin conexión al subir | «Parece que no hay conexión» + botón de reintentar. La foto seleccionada no se pierde. |
| Apps Script no responde al subir | Un reintento automático con espera; si falla de nuevo, mensaje y botón manual. |
| Drive no responde al listar fotos | El carrusel ofrece reintentar; el resto de la página, intacto. |

Todos los mensajes son en español, dicen **qué pasó** y **qué hacer**. Nunca se muestra
un error técnico crudo al usuario.

---

## 9. Accesibilidad y rendimiento

- **Mobile-first.** Se diseña primero para pantalla pequeña y se escala a escritorio.
- Contraste conforme a WCAG AA con la paleta de marca.
- Navegable con teclado, con foco visible en todos los elementos interactivos.
- `prefers-reduced-motion` respetado en la carta, el carrusel y las transiciones.
- Texto alternativo en imágenes; las fotos de la galería reciben un alternativo con el
  nombre de quien la subió cuando esté disponible.
- Fuentes servidas localmente con `font-display: swap`.
- Mapa e imágenes con carga diferida.

---

## 10. Verificación

### Automática

`pruebas.html` ejercita las funciones que contienen lógica real y muestra el resultado
en verde o rojo al abrirla en el navegador. No requiere instalar nada.

Cubre como mínimo:
- Redimensionado y compresión de imagen: dimensiones y peso resultantes.
- Filtro del buscador de canciones: por título, por letra, sin acentos, sin resultados.
- Validación de archivos: tipo incorrecto, tamaño excedido, caso válido.
- Formato de los datos de programación y habitaciones a partir de JSON de ejemplo.

### Manual, antes del campamento

- [ ] Subir una foto desde Android con datos móviles.
- [ ] Subir una foto desde iPhone con datos móviles.
- [ ] Subir varias fotos a la vez.
- [ ] Revisar la página completa en la pantalla más pequeña disponible.
- [ ] Cortar la conexión a mitad de una subida y comprobar el mensaje.
- [ ] Verificar que la foto subida aparece en la carpeta de Drive.
- [ ] Borrar una foto desde Drive y confirmar que desaparece del carrusel.
- [ ] Comprobar los enlaces de WhatsApp, Maps, Waze y los `tel:`.
- [ ] Probar el modo pantalla completa de una canción con la pantalla en reposo.

---

## 11. Contenido pendiente

El sitio se construye con datos de ejemplo funcionales desde el primer día. Queda por
reemplazar:

| Elemento | Responsable |
|---|---|
| Enlace del grupo de WhatsApp | Liderazgo |
| Contactos de emergencia (nombres, roles, teléfonos) | Liderazgo |
| Texto de la carta de bienvenida | Liderazgo |
| Habitaciones con sus integrantes | Liderazgo |
| Logos de la iglesia y de TRASCIENDE (PNG o SVG) | Liderazgo |
| Punto exacto de la finca en Google Maps | Liderazgo |
| Canciones adicionales del libro | Liderazgo |
| Cuenta de Gmail dedicada + carpeta de Drive | Liderazgo |

---

## 12. Registro de decisiones

| Decisión | Alternativas evaluadas | Motivo |
|---|---|---|
| HTML/CSS/JS sin compilación | Vite, Astro, React | El sitio debe poder editarse y publicarse sin entorno de desarrollo, un año después. |
| Google Drive vía Apps Script | Firebase Storage, API de Drive con cuenta de servicio, Formulario de Google | Sin tarjeta de crédito; las fotos en un lugar que el liderazgo ya usa; moderar es borrar un archivo. La cuenta de servicio exigiría incrustar una credencial privada en un sitio público. El formulario obligaría a iniciar sesión con Google. |
| Publicación directa de fotos, sin aprobación | Cola de moderación, código de acceso | Decisión del liderazgo. El riesgo se mitiga con el borrado inmediato desde Drive. |
| Listado de habitaciones, sin buscador | Buscador por nombre | Decisión del liderazgo. |
| Mapa real en vez del plano ilustrado | Plano interactivo del boceto | El plano del boceto es una ilustración genérica de ejemplo; no existe un plano real de la finca. |
| Fuentes servidas localmente | Google Fonts CDN | TAN Meringue no está en ningún CDN, y la señal en el campo es irregular. |
