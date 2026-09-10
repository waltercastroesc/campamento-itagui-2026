# Panel de administración — Campamento Itagüí 2026

**Fecha del documento:** 2026-09-10
**Estado:** aprobado, pendiente de plan de implementación
**Depende de:** `docs/superpowers/specs/2026-09-09-sitio-campamento-2026-design.md` (sitio ya construido)

---

## 1. Objetivo

Dar al liderazgo una forma de editar habitaciones, programación y canciones **sin tocar código ni redesplegar el sitio**, entregable a una persona sin conocimientos técnicos.

Esto contradice deliberadamente una decisión de la especificación original del sitio (§2, excluido: "Panel de administración web. Moderar consiste en borrar el archivo de la carpeta de Drive"). Se revisa esa decisión a pedido explícito del liderazgo: el sitio ya está construido y en uso, y la necesidad real resultó ser mayor de lo previsto.

---

## 2. Alcance

### Incluido
- Edición de **habitaciones**: agregar/quitar habitaciones, editar nombre y líder, agregar/quitar integrantes.
- Edición de **programación**: agregar/quitar bloques de horario dentro de cada día.
- Edición de **canciones**: agregar/quitar canciones, editar título/número/lema, agregar/quitar bloques de letra (estrofa o coro).
- Página `admin.html` protegida con contraseña compartida, dentro del mismo sitio.

### Excluido (se sigue editando el JSON a mano, como hasta ahora)
- Carta de bienvenida.
- Locación (mapa, puntos clave).
- Contactos (WhatsApp, emergencias).

Motivo: cambian una sola vez al año; no justifican un formulario.

---

## 3. Arquitectura

```
Panel (admin.html) ──POST con contraseña──▶ Apps Script ──escribe──▶ Google Sheets
                                                  │
Sitio público (habitaciones.js, etc.) ──GET──▶ Apps Script ──lee──▶ Google Sheets
                                                  │
                                          (con cache de 60s,
                                           igual que las fotos)
```

Se reutiliza **el mismo Apps Script y la misma cuenta de Google** que ya administra la carpeta de fotos (`apps-script/Codigo.gs`, de la Tarea 10 del plan original). No se agrega ningún servicio ni cuenta nueva.

`habitaciones.js`, `programacion.js` y `canciones.js` dejan de leer `datos/*.json` de forma fija y pasan a pedir los datos al Apps Script en cada visita, con una copia de respaldo guardada en el propio dispositivo (`localStorage`) para cuando falla la señal. El resto del sitio (carta, locación, contactos, fotos) no cambia.

Los archivos estáticos `datos/habitaciones.json`, `datos/programacion.json` y `datos/canciones.json` **se conservan** como contenido de ejemplo para desarrollo local y para `pruebas.html`. Mientras `CONFIG.urlAppsScript` esté vacío (como en desarrollo, antes de publicar el Apps Script extendido), estas tres secciones siguen leyendo esos archivos directamente, exactamente como hoy. En cuanto se configura la URL, pasan a leer en vivo de Sheets con el respaldo de `localStorage` descrito en §7 — el archivo estático deja de usarse en producción, pero sigue sirviendo como dato de ejemplo para quien abra el proyecto en su computador sin haber configurado nada todavía.

### Por qué Google Sheets y no una base de datos propia

Se evaluó una base de datos propia del panel (por ejemplo, la función de base de datos de Artifacts) y se descartó: introduciría un sistema nuevo y separado de Drive/Sheets que el liderazgo ya conoce, cuando Sheets ya resuelve lo mismo con historial de versiones nativo — si algo se borra o se daña por error, se recupera abriendo el Sheet y usando "Ver historial de versiones", sin depender de nada que construyamos nosotros.

También se evaluó dejar de lado el panel a medida y solo compartir el Sheet en modo edición directa. Se descartó porque exigiría que la persona inicie sesión con una cuenta de Google (contradice la decisión de "nadie inicia sesión para nada" que ya rige el resto del sitio) y porque un formulario a medida, con botones de "+ Agregar habitación" y "+ Agregar integrante", es más aprobable para alguien sin conocimientos técnicos que editar filas y columnas de una hoja de cálculo directamente.

---

## 4. Modelo de datos en Google Sheets

Una sola hoja de cálculo, con una pestaña por tipo de contenido. Estructura plana (una fila = un dato simple), para que Apps Script las lea y escriba con sencillez, y para que sigan siendo legibles si alguna vez hay que corregir algo a mano directamente en Sheets.

**Pestaña `Habitaciones`**

| id | nombre | lider |
|---|---|---|
| 1 | Habitación 1 | Ana Pérez |

**Pestaña `Integrantes`**

| habitacion_id | nombre |
|---|---|
| 1 | Luis Gómez |
| 1 | Sara Ruiz |

**Pestaña `Programacion`**

| dia | numero | hora | actividad |
|---|---|---|---|
| Viernes | 1 | 5:00 PM | Salida |

**Pestaña `Canciones`**

| id | titulo | numero | lema |
|---|---|---|---|
| derrama | Derrama | 1 | true |

**Pestaña `CancionesBloques`**

| cancion_id | orden | tipo | lineas |
|---|---|---|---|
| derrama | 1 | estrofa | Eres poderoso\nNo lo puedo explicar... |

Cada línea de una estrofa o coro va separada por saltos de línea dentro de la misma celda (Sheets lo permite).

El Apps Script traduce esta forma plana al mismo formato JSON que el sitio ya usa y ya tiene probado (`habitaciones.json`, `programacion.json`, `canciones.json` — ver especificación original §5). **El código que pinta las habitaciones, la programación y las canciones no cambia**, solo cambia de dónde vienen los datos.

---

## 5. Extensión del Apps Script

Se extiende `apps-script/Codigo.gs` (no se crea un script nuevo ni una implementación nueva) con un parámetro `recurso` que distingue entre fotos y datos.

### Lectura pública, sin contraseña

```
GET ?recurso=datos&tipo=habitaciones   → { ok, datos: [...] }  (forma de habitaciones.json)
GET ?recurso=datos&tipo=programacion   → { ok, datos: [...] }  (forma de programacion.json)
GET ?recurso=datos&tipo=canciones      → { ok, datos: [...] }  (forma de canciones.json)
GET ?recurso=fotos                     → comportamiento actual, sin cambios
```

No requiere contraseña: es la misma información que el sitio ya muestra públicamente a cualquiera.

### Escritura, con contraseña

```
POST { accion: "guardarHabitaciones", clave, datos: [...] }
POST { accion: "guardarProgramacion", clave, datos: [...] }
POST { accion: "guardarCanciones", clave, datos: [...] }
POST { accion: "subirFoto", ... }        → comportamiento actual de doPost, sin cambios de fondo
```

**Nota de compatibilidad:** el `doPost` de fotos, tal como quedó en la Tarea 10 del plan original, no llevaba un campo `accion` — se identificaba únicamente por traer `mime` y `datos`. Como el Apps Script de fotos **todavía no se ha publicado en producción** (pendiente, ver especificación original §11), no hay ningún cliente real en uso que romper: se aprovecha para agregar `accion: "subirFoto"` explícito en el cuerpo que envía `js/galeria.js`, y `Codigo.gs` se actualiza para exigirlo. Si el Apps Script ya estuviera publicado y en uso, este cambio habría requerido mantener compatibilidad hacia atrás (aceptar tanto la forma vieja como la nueva).

`clave` se compara contra un valor guardado en `PropertiesService.getScriptProperties()` — **no queda escrita en el código fuente pegado en Apps Script**, así que inspeccionar el script no revela la contraseña. Se establece una sola vez con una función `establecerClave(nuevaClave)` que se corre manualmente desde el editor.

Cada guardado exitoso limpia la caché de 60 segundos de ese recurso, igual que ya hace la subida de fotos.

**Cada guardado reemplaza el contenido completo de sus pestañas correspondientes**, no hace parches fila por fila: el panel envía el arreglo completo (todas las habitaciones, o toda la programación, o todas las canciones) y Apps Script borra y vuelve a escribir esas pestañas enteras. Esto evita tener que manejar altas/bajas de filas individuales de Sheets desde el panel — agregar o quitar una habitación es simplemente enviar un arreglo con un elemento más o uno menos.

**Asignación de identificadores nuevos:**
- El `id` de la pestaña `Habitaciones` es puramente interno de Sheets — solo sirve para enlazar filas de `Integrantes` a su habitación. La forma pública de `habitaciones.json` nunca tuvo `id` (solo `nombre`, `lider`, `integrantes`) y eso no cambia: el panel envía y recibe habitaciones sin `id`; es `Codigo.gs` quien le asigna un número de fila al reescribir la pestaña en cada guardado. No hay lógica de cliente que probar aquí.
- Canción nueva: `id` sí es parte de la forma pública de `canciones.json` (ya lo era desde el sitio original). Se genera del título en el panel: minúsculas, sin acentos, espacios por guiones — igual que ya se hizo a mano para `"derrama"` y `"derrama-tu-poder"`. Si el slug ya existe entre las canciones actuales, se le agrega un sufijo numérico (`-2`, `-3`, ...). Esta función sí es pura y se prueba (ver §9).

### Configuración inicial

Una función `configurarPanel()`, para correr una sola vez desde el editor de Apps Script, que:
1. Crea la hoja de cálculo (o usa una ya existente, si se le da el ID).
2. Crea las cinco pestañas con sus encabezados.
3. Siembra el contenido de ejemplo que ya existe en `datos/*.json`, para que el panel no arranque completamente vacío.

---

## 6. Panel de administración (`admin.html`)

Página nueva, publicada junto con el resto del sitio (`campamento-2026/admin.html`), protegida con contraseña — no aparece enlazada desde ninguna página pública.

**Entrada:** formulario que pide la contraseña. Se guarda en la sesión del navegador (no en ningún archivo). Si es incorrecta, Apps Script la rechaza y se muestra el aviso sin guardar nada.

**Tres secciones, una debajo de otra:**

1. **Habitaciones** — lista de habitaciones existentes con nombre, líder e integrantes editables. "+ Agregar habitación" al final. Dentro de cada una: campos de nombre/líder, lista de integrantes con "×" para quitar y "+ Agregar integrante". Botón "Guardar cambios".

2. **Programación** — tres bloques (Viernes/Sábado/Domingo), cada uno con su lista de horarios (hora + actividad), "+ Agregar actividad" y "×" para quitar. Mismo botón de guardar.

3. **Canciones** — lista de canciones existentes. "+ Agregar canción" (pide título, número opcional, si es lema). Dentro de cada canción: sus bloques de letra, cada uno con selector "Estrofa / Coro" y un cuadro de texto grande (una línea de la canción por línea de texto), con botones para agregar/quitar bloques y canciones completas.

No hay confirmación adicional antes de borrar una habitación o canción completa — el historial de versiones de Sheets es la red de seguridad.

**Después de guardar:** aviso "Guardado". El sitio público ve el cambio en su próxima visita, con hasta 60 segundos de retraso por la caché.

---

## 7. Confiabilidad en el sitio público

| Situación | Comportamiento |
|---|---|
| Primera visita de ese dispositivo, sin señal | Aviso "No pudimos cargar esta información" + Reintentar (igual que hoy) |
| Visita repetida, sin señal, con copia ya guardada en ese dispositivo | Se muestra esa copia con un aviso discreto: "Mostrando la última versión guardada — puede no estar actualizada" |
| Con señal | Datos frescos de Sheets; se actualiza la copia guardada en el dispositivo |

Cada carga exitosa de habitaciones/programación/canciones guarda su resultado en `localStorage` bajo una clave propia (p. ej. `campamento2026:habitaciones`). Si la petición en vivo falla, se intenta esa copia antes de mostrar el aviso de fallo total.

---

## 8. Manejo de errores del panel

| Situación | Comportamiento |
|---|---|
| Contraseña incorrecta | "Contraseña incorrecta" — no se envía ni se borra nada |
| Falla el guardado (sin señal, Google caído) | "No pudimos guardar los cambios. Verifica tu conexión e inténtalo de nuevo" — el formulario conserva lo escrito |
| Falla la lectura de datos existentes al abrir el panel | Aviso con reintentar, igual que en el sitio público |

---

## 9. Pruebas

**Lo que ya está probado y no cambia** (el formato JSON resuelto es idéntico): `contarIntegrantes`, `validarProgramacion`, `filtrarCanciones`, `textoDeCancion`.

**Lo nuevo que se cubre con pruebas de lógica pura**, en el mismo `pruebas/casos.js`:
- La función que decide si usar el dato fresco o el guardado localmente, según si la petición tuvo éxito.
- Las funciones del panel que agregan/quitan una fila de integrante, un bloque de canción, una actividad de programación — sin backend real de por medio.
- La función que convierte el texto de un cuadro grande (una línea por verso) al arreglo de líneas que espera el JSON, y viceversa (para precargar el formulario al editar).

**Lo que no se puede probar en la terminal ni en el navegador de pruebas** (mismo límite que ya existe para `Codigo.gs`): la lectura/escritura real contra Google Sheets, porque `SpreadsheetApp` solo existe dentro de Apps Script. Se verifica a mano una vez montado, con una lista de verificación equivalente a la que ya existe para las fotos.

---

## 10. Registro de decisiones

| Decisión | Alternativas evaluadas | Motivo |
|---|---|---|
| Google Sheets como almacenamiento | Base de datos propia del panel, JSON planos en Drive | Reutiliza cuentas y hábitos ya existentes; historial de versiones nativo como red de seguridad sin código propio. |
| Contraseña compartida vía `PropertiesService` | Cuenta de Google autorizada, enlace secreto sin contraseña | Coherente con "nadie inicia sesión para nada" del resto del sitio; más seguro que un enlace sin ninguna barrera para una operación de escritura (más riesgosa que solo subir fotos). |
| Formulario a medida en vez de compartir el Sheet directamente | Compartir el Sheet en modo edición | Evita exigir cuenta de Google a quien edita; más aprobable para alguien sin conocimientos técnicos. |
| Cuadro de texto por bloque de letra (estrofa/coro) | Un solo cuadro con convención de marcado para el coro | Refleja la estructura real de la canción sin inventar una sintaxis que alguien deba aprender. |
| Vivo + copia de respaldo en el dispositivo | Solo vivo, sin respaldo | El sitio se usa en el campo con señal irregular; sin esto, una mala conexión dejaría sin ver la programación a alguien que ya la había visto antes. |
| Alcance limitado a habitaciones/programación/canciones | Incluir también carta, locación y contactos | Esos tres cambian una sola vez al año; no justifican un formulario. |
| Página aparte dentro del mismo sitio (`admin.html`) | Enlace en un dominio completamente separado | No requiere otro hosting; se publica junto con el resto sin pasos adicionales. |

---

## 11. Nota de implementación pendiente

Igual que con `Codigo.gs` en el sitio original: **la publicación real del Apps Script extendido y la corrida de `configurarPanel()`/`establecerClave()` requieren iniciar sesión con la cuenta de Gmail dueña de la hoja de cálculo y de la carpeta de fotos.** Esto no se puede hacer de forma automática desde este entorno de desarrollo — el código se entrega completo y lista para pegar, con instrucciones paso a paso, pero el paso de "pegar y correr" lo debe ejecutar quien tenga esas credenciales.
