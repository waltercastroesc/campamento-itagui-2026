# Lista de verificación antes del campamento

## Contenido que falta poner

- [ ] `datos/carta.json` — texto real de la carta de bienvenida
- [x] Habitaciones reales con sus integrantes, cédula y kit — se cargan
      corriendo `importarAsistentes()` desde el Apps Script (ver más abajo),
      no editando `datos/habitaciones.json` (ese archivo solo es un
      respaldo de ejemplo para cuando el Apps Script no está configurado)
- [x] `datos/contactos.json` — enlace del grupo de WhatsApp
- [ ] `datos/canciones.json` — canciones adicionales del libro
      (o cargarlas desde el panel de administración)
- [x] `datos/locacion.json` — punto exacto de la finca en Google Maps y en Waze
- [x] `img/logo-pie.png` — logo de la iglesia + TRASCIENDE, recoloreado a vino
- [x] `js/config.js` — URL `/exec` del Apps Script publicado
- [ ] Confirmar con el liderazgo las dos actividades del sábado a las 8:00 PM
      («Cena» y «Noche de alabanza» aparecen a la misma hora en el boceto)

## Antes de publicar

- [ ] **Publicar `apps-script/Codigo.gs`** desde script.google.com, con la
      cuenta de Gmail dueña de la carpeta de Drive (instrucciones dentro del
      propio archivo). Esto no se pudo hacer en desarrollo: requiere iniciar
      sesión en esa cuenta específica.
- [ ] Con la URL ya publicada, comprobar `doPost` y `doGet` con una petición
      real desde el navegador (pasos detallados en el encabezado de
      `Codigo.gs` y en el plan de implementación, Tarea 10, pasos 4-6):
      confirmar que no aparece ninguna petición `OPTIONS` en la pestaña Red
      (verificaría que no se disparó la comprobación CORS previa) y que el
      servidor rechaza un archivo que no sea imagen.
- [ ] La cuenta de Gmail dueña de la carpeta de Drive tiene espacio libre
- [ ] Esa cuenta no es el Drive personal de nadie
- [ ] Las cuotas vigentes de Apps Script para cuentas personales están revisadas
      en developers.google.com/apps-script/guides/services/quotas

## Panel de administración

- [ ] Correr `configurarPanel()` una vez desde el editor de Apps Script
- [ ] Correr `establecerClave()` una vez con la contraseña real
- [ ] Pegar el `Codigo.gs` actualizado (agrega "Cuéntanos tu experiencia") y
      publicar una **Nueva versión** de la implementación existente
- [ ] Correr `configurarExperiencias()` una vez desde el editor, para crear
      la pestaña "Experiencias" en la hoja que ya existe
- [ ] Probar contar una experiencia desde el sitio público y confirmar que
      aparece (hasta 60 segundos de espera por la caché)
- [ ] Correr `importarAsistentes()` una vez desde el editor (con una cuenta
      que tenga acceso al Excel de inscripciones — el ID está en
      `ID_EXCEL_ASISTENTES`, arriba de esa función en `Codigo.gs`) para
      cargar las habitaciones reales. Revisar el "Registro de ejecución"
      del editor: dice cuántas habitaciones y personas quedaron, y avisa si
      no encontró a algún líder entre los integrantes de su propia
      habitación (para revisar esos casos a mano en la Google Sheet).
      Volver a correrla reemplaza por completo lo que haya en Habitaciones
      e Integrantes — sirve para cuando el Excel cambie.
- [ ] Probar el buscador de habitaciones con una cédula real del Excel y
      confirmar que trae la habitación correcta
- [ ] Compartir el enlace a `admin.html` y la contraseña solo con la persona
      de confianza
- [ ] Probar agregar una habitación, un integrante, una actividad y una
      canción desde el panel, y confirmar que aparecen en el sitio público
      (hasta 60 segundos de espera por la caché)
- [ ] Probar una contraseña incorrecta y confirmar que no se guarda nada
- [ ] Abrir la hoja de cálculo del panel y confirmar que "Ver historial de
      versiones" funciona, como red de seguridad ante un borrado accidental

## Pruebas en dispositivos reales

- [ ] Subir una foto desde Android con datos móviles
- [ ] Subir una foto desde iPhone con datos móviles
- [ ] Subir varias fotos a la vez
- [ ] Revisar la página completa en la pantalla más pequeña disponible
- [ ] Cortar la conexión a mitad de una subida y comprobar el mensaje
- [ ] Verificar que la foto subida aparece en la carpeta de Drive
- [ ] Borrar una foto desde Drive y confirmar que desaparece del carrusel
- [ ] Comprobar los enlaces de WhatsApp, Maps y Waze
- [ ] Probar el modo pantalla completa de una canción con la pantalla en reposo

## Ya verificado en desarrollo

- Suite de pruebas: 49/49 en Node (`node pruebas/ejecutar-en-node.js`),
  50/50 en el navegador (`pruebas.html`, incluida la compresión de imagen real).
- Panel de administración: verificado con un Apps Script simulado (fetch
  falso, sin depender de una publicación real). Contraseña incorrecta
  rechaza sin mostrar las secciones; contraseña correcta carga las tres
  secciones con su contenido; agregar habitación, integrante, actividad y
  canción, y guardar cada sección, confirma «Guardado.». Sin desbordamiento
  horizontal a 390px de ancho (se corrigió un defecto real encontrado aquí:
  los campos de texto del panel no se encogían y desbordaban su fila).
  La lectura/escritura real contra Google Sheets queda pendiente de que se
  publique el Apps Script extendido (ver «Panel de administración» arriba).
- Aislamiento: se probó renombrando cada uno de los seis `datos/*.json` por
  turnos — la sección afectada muestra su aviso con «Reintentar» y las demás
  cinco secciones siguen funcionando. El botón «Reintentar» recupera la
  sección sin recargar la página.
- Teclado y foco: el primer `Tab` en una carga limpia llega a «Saltar al
  contenido»; los controles interactivos reciben foco visible
  (`outline` sólido).
- Pantalla de 320px de ancho: sin desbordamiento horizontal
  (`scrollWidth` ≤ `innerWidth`). Se corrigió un defecto real encontrado
  aquí: las etiquetas de una sola palabra de la barra fija («HABITACIÓN»)
  se desbordaban de su celda y se pintaban sobre la vecina.
- `prefers-reduced-motion: reduce`: las transiciones y el `scroll-behavior`
  quedan anulados globalmente; el sitio sigue siendo usable.
- Sin peticiones a terceros fuera de lo esperado: solo `google.com` /
  `googleapis.com` (mapa embebido y miniaturas de Drive) y, cuando el Apps
  Script esté configurado, `script.google.com`. Ninguna petición a
  `fonts.googleapis.com` ni a ningún CDN.
- Portada, programación (pestañas en celular / columnas en escritorio),
  habitaciones (buscador por cédula, una habitación a la vez con flechas),
  buscador de canciones (por título, por letra, sin acentos), modo
  pantalla completa de canciones (A−/A+, wakeLock, Escape), locación (mapa
  real diferido, Maps, Waze, copiar dirección), "Cuéntanos tu experiencia"
  (una a la vez con flechas) y pie con el enlace al grupo de WhatsApp:
  verificados visualmente e interactivamente en navegador real.
- Galería: aislamiento cuando la URL del Apps Script no está configurada,
  rechazo de archivos que no son imagen sin gastar red, y compresión real
  antes de subir. La subida contra Drive de verdad queda pendiente de que
  se publique el Apps Script (ver arriba).

## Durante el campamento

- Para borrar una foto: elimínala de la carpeta de Drive. Desaparece del
  carrusel en menos de un minuto.
- Si alguien abusa del endpoint de subida: crea una implementación nueva del
  Apps Script (URL distinta) y actualiza `js/config.js`. La URL anterior muere.
