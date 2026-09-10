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
