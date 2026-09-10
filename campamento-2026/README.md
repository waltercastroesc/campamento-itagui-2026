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

**Una vez configurado el panel de administración** (ver más abajo),
`habitaciones.json`, `programacion.json` y `canciones.json` dejan de ser la
fuente que usa el sitio publicado: el sitio pasa a leer esos tres en vivo
desde Google Sheets. Los archivos siguen ahí como contenido de ejemplo para
quien abra el proyecto en su computador sin haber configurado nada todavía.
`carta.json`, `locacion.json` y `contactos.json` **siempre se editan a mano**,
con o sin panel — cambian una sola vez al año.

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

## Pruebas

- En el navegador: `http://localhost:8000/pruebas.html`
- En la terminal: `node pruebas/ejecutar-en-node.js`
