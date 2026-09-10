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
