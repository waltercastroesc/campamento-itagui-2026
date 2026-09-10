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
 *  5. Corre la funcion configurarPanel() una vez desde el editor (seleccionala
 *     en el desplegable de funciones y pulsa Ejecutar) para crear la hoja de
 *     calculo del panel de administracion.
 *  6. Corre establecerClave("tu-contraseña-aqui") una vez desde el editor
 *     para fijar la contraseña del panel. No la dejes escrita en el codigo.
 *  7. Comprueba las cuotas vigentes de Apps Script para cuentas personales en
 *     developers.google.com/apps-script/guides/services/quotas antes del campamento.
 *
 * SI ALGUIEN ABUSA DEL ENDPOINT: crea una implementacion nueva (URL distinta)
 * y actualiza js/config.js. La URL anterior queda muerta.
 */

var CARPETA_ID = '1p-ykfs2etU-lzjuuQkesMDApvR9PC0Tb';
var MAXIMO_BYTES = 10 * 1024 * 1024;
var CLAVE_CACHE_FOTOS = 'listado_fotos';
var SEGUNDOS_CACHE = 60;
var ZONA_HORARIA = 'America/Bogota';

/** Enruta las escrituras. El cuerpo llega como text/plain para no disparar la verificacion CORS previa. */
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

/** Enruta las lecturas: fotos (por defecto) o datos del panel. */
function doGet(e) {
  var recurso = (e && e.parameter && e.parameter.recurso) || 'fotos';
  if (recurso === 'datos') {
    return leerDatos((e.parameter && e.parameter.tipo) || '');
  }
  return listarFotos();
}

/** Lista las fotos, mas reciente primero, con cache de 60 segundos. */
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

/** Fecha, autor y nombre original saneado, para que la carpeta quede ordenada. */
function nombreSeguro(nombre, autor) {
  var original = String(nombre || 'foto.jpg').replace(/[^\w.\- ]+/g, '_').slice(-60);
  var marca = Utilities.formatDate(new Date(), ZONA_HORARIA, 'yyyyMMdd-HHmmss');
  var quien = autor ? '-' + String(autor).replace(/[^\w\- ]+/g, '_').slice(0, 30) : '';
  return marca + quien + '-' + original;
}

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

function responder(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

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
