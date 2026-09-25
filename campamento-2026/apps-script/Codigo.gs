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
    if (cuerpo.accion === 'enviarExperiencia') {
      return enviarExperiencia(cuerpo);
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
    escribirHabitacionesEnHoja(obtenerHoja(), cuerpo.datos || []);
    CacheService.getScriptCache().remove('datos_habitaciones');
    return responder({ ok: true });
  } catch (error) {
    return responder({ ok: false, error: 'fallo_servidor' });
  }
}

/**
 * Reemplaza por completo las pestañas Habitaciones e Integrantes con la
 * lista dada (cada habitacion: {nombre, lider: {nombre, cedula, kit},
 * integrantes: [{nombre, cedula, kit}, ...]}). La usan tanto
 * guardarHabitaciones (desde el panel, con contraseña) como
 * importarAsistentes (desde el editor, para la carga inicial).
 */
function escribirHabitacionesEnHoja(libro, datos) {
  var habitaciones = libro.getSheetByName('Habitaciones');
  var integrantes = libro.getSheetByName('Integrantes');
  limpiarPestana(habitaciones, ['id', 'nombre', 'lider_nombre', 'lider_cedula', 'lider_kit']);
  limpiarPestana(integrantes, ['habitacion_id', 'nombre', 'cedula', 'kit']);

  var filasHabitaciones = [];
  var filasIntegrantes = [];
  (datos || []).forEach(function (h, indice) {
    var id = indice + 1;
    var lider = h.lider || {};
    filasHabitaciones.push([id, h.nombre || '', lider.nombre || '', lider.cedula || '', lider.kit || '']);
    (h.integrantes || []).forEach(function (persona) {
      filasIntegrantes.push([id, persona.nombre || '', persona.cedula || '', persona.kit || '']);
    });
  });
  escribirFilas(habitaciones, filasHabitaciones, [2, 3, 4, 5]);
  escribirFilas(integrantes, filasIntegrantes, [2, 3, 4]);
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
    escribirFilas(hoja, filas, [1, 3, 4]);

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
    escribirFilas(canciones, filasCanciones, [1, 2]);
    escribirFilas(bloques, filasBloques, [1, 3, 4]);

    CacheService.getScriptCache().remove('datos_canciones');
    return responder({ ok: true });
  } catch (error) {
    return responder({ ok: false, error: 'fallo_servidor' });
  }
}

var MAXIMO_CARACTERES_EXPERIENCIA = 600;

/**
 * Guarda una experiencia contada por un asistente. A diferencia de
 * guardarHabitaciones/guardarProgramacion/guardarCanciones, esto NO pide
 * contraseña: cualquiera puede contar su experiencia, igual que cualquiera
 * puede subir una foto.
 */
function enviarExperiencia(cuerpo) {
  var texto = String(cuerpo.texto || '').trim();
  if (!texto) return responder({ ok: false, error: 'texto_vacio' });
  if (texto.length > MAXIMO_CARACTERES_EXPERIENCIA) {
    return responder({ ok: false, error: 'demasiado_largo' });
  }
  var nombre = String(cuerpo.nombre || '').trim().slice(0, 40);

  try {
    var libro = obtenerHoja();
    var hoja = libro.getSheetByName('Experiencias');
    if (!hoja) return responder({ ok: false, error: 'fallo_servidor' });

    var fila = hoja.getLastRow() + 1;
    // La fecha se guarda como texto ISO, no como fecha real de Sheets: asi se
    // lee de vuelta tal cual, sin el mismo problema de autoconversion que ya
    // resolvimos para las horas de Programacion (ver forzarColumnasComoTexto).
    forzarColumnasComoTexto(hoja, fila, 1, [1, 2, 3]);
    hoja.getRange(fila, 1, 1, 3).setValues([[new Date().toISOString(), nombre, texto]]);

    CacheService.getScriptCache().remove('datos_experiencias');
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

function escribirFilas(hoja, filas, columnasTexto) {
  if (filas.length === 0) return;
  forzarColumnasComoTexto(hoja, 2, filas.length, columnasTexto);
  hoja.getRange(2, 1, filas.length, filas[0].length).setValues(filas);
}

/**
 * Antes de escribir, fuerza a texto plano las columnas indicadas (numero de
 * columna, 1 = A) para que Sheets no las autoconvierta en fecha/hora o numero
 * — por ejemplo, "5:00 PM" se guardaria como una hora real, no como el texto
 * tal cual, y se leeria despues como una fecha rara en vez de "5:00 PM".
 */
function forzarColumnasComoTexto(hoja, filaInicio, numFilas, columnas) {
  (columnas || []).forEach(function (col) {
    hoja.getRange(filaInicio, col, numFilas, 1).setNumberFormat('@');
  });
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
    else if (tipo === 'experiencias') datos = leerExperiencias(libro);
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
      fila[encabezados[c]] = normalizarValorCelda(valores[i][c]);
    }
    filas.push(fila);
  }
  return filas;
}

/**
 * Si una celda quedo guardada como fecha/hora en vez de texto plano (de antes
 * de que escribirFilas/crearPestana forzaran el formato de texto), esto la
 * devuelve a algo legible en vez del objeto de fecha crudo. Las escrituras
 * nuevas ya no deberian producir esto; es una red de seguridad para datos
 * que hayan quedado mal guardados antes de esa proteccion.
 */
function normalizarValorCelda(valor) {
  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'h:mm a');
  }
  return valor;
}

function leerHabitaciones(libro) {
  var habitaciones = leerFilas(libro, 'Habitaciones');
  var integrantes = leerFilas(libro, 'Integrantes');
  return habitaciones.map(function (h) {
    var propios = integrantes
      .filter(function (i) { return String(i.habitacion_id) === String(h.id); })
      .map(function (i) { return { nombre: i.nombre, cedula: i.cedula || '', kit: i.kit || '' }; });
    return {
      nombre: h.nombre,
      lider: { nombre: h.lider_nombre || '', cedula: h.lider_cedula || '', kit: h.lider_kit || '' },
      integrantes: propios
    };
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

/** Las mas recientes primero: las fechas ISO se comparan bien como texto. */
function leerExperiencias(libro) {
  var filas = leerFilas(libro, 'Experiencias');
  filas.sort(function (a, b) {
    return String(b.fecha).localeCompare(String(a.fecha));
  });
  return filas.map(function (f) {
    return { nombre: f.nombre || '', texto: f.texto };
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

  crearPestana(libro, 'Habitaciones', ['id', 'nombre', 'lider_nombre', 'lider_cedula', 'lider_kit'], [
    [1, 'Habitación 1', 'PENDIENTE — nombre del líder', '', ''],
  ], [2, 3, 4, 5]);
  crearPestana(libro, 'Integrantes', ['habitacion_id', 'nombre', 'cedula', 'kit'], [
    [1, 'PENDIENTE — integrante 1', '', ''],
    [1, 'PENDIENTE — integrante 2', '', ''],
  ], [2, 3, 4]);
  crearPestana(libro, 'Programacion', ['dia', 'numero', 'hora', 'actividad'], [
    ['Viernes', 1, '5:00 PM', 'Salida'],
    ['Viernes', 1, '7:00 PM', 'Llegada y acomodación'],
    ['Sábado', 2, '6:00 AM', 'Alborada y Devocional'],
    ['Domingo', 3, '9:30 AM', 'Servicio de clausura'],
  ], [1, 3, 4]);
  crearPestana(libro, 'Canciones', ['id', 'titulo', 'numero', 'lema'], [
    ['derrama', 'Derrama', 1, true],
  ], [1, 2]);
  crearPestana(libro, 'CancionesBloques', ['cancion_id', 'orden', 'tipo', 'lineas'], [
    ['derrama', 1, 'estrofa', 'Eres poderoso\nNo lo puedo explicar'],
    ['derrama', 2, 'coro', 'Soy una vasija esperando ser llena'],
  ], [1, 3, 4]);
  crearPestana(libro, 'Experiencias', ['fecha', 'nombre', 'texto'], [], [1, 2, 3]);

  // La pestaña por defecto de Sheets ("Hoja 1") no hace falta.
  var porDefecto = libro.getSheetByName('Hoja 1') || libro.getSheetByName('Sheet1');
  if (porDefecto) libro.deleteSheet(porDefecto);

  Logger.log('Hoja creada: ' + libro.getUrl());
}

function crearPestana(libro, nombre, encabezados, filasEjemplo, columnasTexto) {
  var hoja = libro.insertSheet(nombre);
  hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  if (filasEjemplo.length > 0) {
    forzarColumnasComoTexto(hoja, 2, filasEjemplo.length, columnasTexto);
    hoja.getRange(2, 1, filasEjemplo.length, encabezados.length).setValues(filasEjemplo);
  }
}

/**
 * Corre esto UNA SOLA VEZ desde el editor si el panel ya estaba creado antes
 * de que existiera la seccion "Cuéntanos tu experiencia" (configurarPanel()
 * ya no hace falta correrlo de nuevo: crearia una hoja de calculo nueva y
 * separada). Agrega solo la pestaña que falta; no toca las demas.
 */
function configurarExperiencias() {
  var libro = obtenerHoja();
  if (libro.getSheetByName('Experiencias')) {
    Logger.log('La pestaña "Experiencias" ya existe. No se cambio nada.');
    return;
  }
  crearPestana(libro, 'Experiencias', ['fecha', 'nombre', 'texto'], [], [1, 2, 3]);
  Logger.log('Pestaña "Experiencias" creada.');
}

// El Excel de inscripciones (cedula, nombre, habitacion y lider de cada
// asistente) vive en el Drive de quien corre importarAsistentes() — tiene
// que ser una cuenta con acceso a ese archivo. El ID es el que aparece en
// su URL: https://docs.google.com/spreadsheets/d/ESTE_ID/edit...
var ID_EXCEL_ASISTENTES = '1W-erfXP50wSr5fGYT95kUiGwQyLTp8a4';

/**
 * Corre esto UNA SOLA VEZ (o cada vez que el Excel de inscripciones cambie)
 * desde el editor de Apps Script, con una cuenta que tenga acceso a ese
 * Excel. Lee la primera pestaña del Excel — debe tener las columnas "#"
 * (se guarda como numero de kit), "CEDULA", "NOMBRE COMPLETO", "HABITACION"
 * y "LIDER HABITACION" — agrupa a la gente por habitacion y REEMPLAZA POR
 * COMPLETO las pestañas Habitaciones e Integrantes del panel con eso.
 *
 * A quien no tiene una habitacion real asignada (la celda esta vacia, dice
 * "NO VA" o "1 DIA") se le deja por fuera: no apareceria en ninguna
 * habitacion de todas formas. Si dos filas repiten la misma cedula, gana la
 * que si tiene una habitacion real.
 */
function importarAsistentes() {
  var origen = SpreadsheetApp.openById(ID_EXCEL_ASISTENTES).getSheets()[0];
  var valores = origen.getDataRange().getValues();
  if (valores.length < 2) throw new Error('El Excel de asistentes esta vacio.');

  var encabezados = valores[0].map(function (e) { return String(e).trim().toUpperCase(); });
  var colKit = encabezados.indexOf('#');
  var colCedula = encabezados.indexOf('CEDULA');
  var colNombre = encabezados.indexOf('NOMBRE COMPLETO');
  var colHabitacion = encabezados.indexOf('HABITACION');
  var colLider = encabezados.indexOf('LIDER HABITACION');
  if (colCedula === -1 || colNombre === -1 || colHabitacion === -1) {
    throw new Error('No se encontraron las columnas esperadas (CEDULA, NOMBRE COMPLETO, HABITACION) en la primera fila del Excel.');
  }

  // Estos valores en la columna HABITACION no son una habitacion real.
  var SIN_HABITACION = ['', 'NO VA', '1 DIA'];

  // Primera pasada: una fila por cedula. Si la misma cedula aparece varias
  // veces (paso en el Excel real), gana la fila que si tiene habitacion.
  var porCedula = {};
  for (var f = 1; f < valores.length; f++) {
    var fila = valores[f];
    var cedula = String(fila[colCedula] || '').trim();
    var nombre = String(fila[colNombre] || '').trim();
    if (!cedula || !nombre) continue;
    var habitacionCruda = String(fila[colHabitacion] || '').trim();
    var esValida = SIN_HABITACION.indexOf(habitacionCruda.toUpperCase()) === -1;
    if (porCedula[cedula] && !esValida) continue;
    porCedula[cedula] = {
      cedula: cedula,
      nombre: nombre,
      kit: colKit === -1 ? '' : String(fila[colKit] || '').trim(),
      habitacion: esValida ? habitacionCruda : '',
      lider: esValida && colLider !== -1 ? String(fila[colLider] || '').trim() : ''
    };
  }

  // Segunda pasada: agrupar por habitacion.
  var porHabitacion = {};
  var ordenHabitaciones = [];
  Object.keys(porCedula).forEach(function (cedula) {
    var persona = porCedula[cedula];
    if (!persona.habitacion) return;
    if (!porHabitacion[persona.habitacion]) {
      porHabitacion[persona.habitacion] = { liderNombre: '', personas: [] };
      ordenHabitaciones.push(persona.habitacion);
    }
    porHabitacion[persona.habitacion].personas.push(persona);
    if (!porHabitacion[persona.habitacion].liderNombre && persona.lider) {
      porHabitacion[persona.habitacion].liderNombre = persona.lider;
    }
  });

  // El lider de cada habitacion tambien esta en la lista de sus personas
  // (el Excel lo incluye como un asistente mas): se separa del resto para
  // no mostrarlo dos veces.
  var avisos = [];
  var datos = ordenHabitaciones.sort().map(function (nombreHabitacion) {
    var grupo = porHabitacion[nombreHabitacion];
    var liderNormalizado = grupo.liderNombre.trim().toLowerCase();
    var indiceLider = -1;
    grupo.personas.forEach(function (p, i) {
      if (indiceLider === -1 && p.nombre.trim().toLowerCase() === liderNormalizado) indiceLider = i;
    });

    var lider, integrantes;
    if (indiceLider === -1) {
      avisos.push('"' + nombreHabitacion + '": no se encontro a "' + grupo.liderNombre + '" entre sus propios integrantes.');
      lider = { nombre: grupo.liderNombre, cedula: '', kit: '' };
      integrantes = grupo.personas;
    } else {
      lider = grupo.personas[indiceLider];
      integrantes = grupo.personas.filter(function (_, i) { return i !== indiceLider; });
    }

    return {
      nombre: nombreHabitacion,
      lider: { nombre: lider.nombre, cedula: lider.cedula, kit: lider.kit },
      integrantes: integrantes.map(function (p) { return { nombre: p.nombre, cedula: p.cedula, kit: p.kit }; })
    };
  });

  escribirHabitacionesEnHoja(obtenerHoja(), datos);
  CacheService.getScriptCache().remove('datos_habitaciones');

  var totalPersonas = datos.reduce(function (total, h) { return total + 1 + h.integrantes.length; }, 0);
  Logger.log(datos.length + ' habitaciones creadas, ' + totalPersonas + ' personas asignadas.');
  if (avisos.length > 0) {
    Logger.log('Avisos (revisar a mano):\n' + avisos.join('\n'));
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
