# Estado de FlashStudy

## Fase actual

**Fase 7: Configuración, respaldo y cierre — completada**

**Estado general: Fases 1 a 7 completadas**

## Completado

- Fase 1: base visual, navegación y pantallas mock.
- Fase 2: base de datos local y repositories.
- Dependencias y configuración de Dexie.
- Modelos de dominio.
- Esquema IndexedDB con ocho tablas.
- Repositories para cursos, temas, tarjetas, estudio, estadísticas y ajustes.
- Seed controlado e idempotente para instalaciones nuevas.
- Stores Zustand para cursos, temas y configuración.
- Cursos, Inicio, Detalle de curso y Detalle de tema conectados a IndexedDB.
- Creación real de cursos desde el bottom sheet.
- Preferencias básicas persistentes.
- Pruebas de reapertura y persistencia con Vitest y `fake-indexeddb`.
- Parser CSV con Papa Parse y soporte para metadatos previos al encabezado.
- Validaciones de curso, tema, encabezado, preguntas, respuestas y duplicados.
- Vista previa de curso, unidad, tema, tarjetas y categorías.
- Importación transaccional de cursos, temas, flashcards y estadísticas iniciales.
- Detección de conflictos por nombre de archivo o curso, unidad y tema.
- Actualización de temas conservando IDs y estadísticas cuando coinciden las
  preguntas.
- Alta de tarjetas nuevas y desactivación de tarjetas retiradas del CSV.
- Importación alternativa como copia.
- Pantalla de importación conectada a datos reales.
- Motor puro de estudio para crear pasadas y separar correctas e incorrectas.
- Sesiones reanudables con tarjeta, índice, categoría y pasada actual.
- Registro transaccional de sesiones, pasadas, intentos y estadísticas.
- Actualización de `seenCount`, aciertos, errores, última práctica y mejor
  pasada.
- Repaso completo con pregunta, respuesta, autoevaluación y navegación real.
- Resultado de pasada calculado desde los intentos persistidos.
- Siguiente pasada limitada exclusivamente a las tarjetas incorrectas.
- Resumen final con duración, evolución por pasada y tarjetas difíciles.
- Sesión activa recuperada en Inicio y después de recargar la aplicación.
- Selección de estudio completo, por categoría, orden normal o aleatorio.
- Modo examen real, de una sola pasada y sin retroalimentación inmediata.
- Calculador estadístico puro con filtros de 30 días, 90 días e historial.
- Estadísticas globales de tarjetas, dominio, primera pasada y promedio de
  pasadas.
- Evolución del rendimiento basada en sesiones de repaso completadas.
- Separación visual de sesiones y precisión del modo examen.
- Resultado por dificultad y temas con mayor cantidad de errores.
- Estadísticas por curso: temas, tarjetas, sesiones, precisión histórica,
  dominio, promedio de pasadas y última práctica.
- Estadísticas por tema: progreso, aciertos, errores, sesiones, mejor sesión y
  última práctica.
- Estadísticas internas y visualización resumida por tarjeta.
- Pantalla Estadísticas conectada a IndexedDB mediante repository y Zustand.
- Detalle estadístico navegable para cada tema.
- Inicio conectado a tarjetas estudiadas y dominio calculados.
- Reordenamiento vertical de temas con dnd-kit.
- Asa de arrastre independiente para no interferir con la apertura del tema.
- Sensores separados para mouse, gesto táctil prolongado y teclado.
- Restricción táctil aplicada solo al asa para conservar el scroll móvil.
- Actualización optimista de la lista y restauración automática ante errores.
- Persistencia transaccional del nuevo orden en IndexedDB.
- Validación repository para impedir órdenes incompletos o duplicados.
- Confirmación accesible de guardado y estado visual durante el arrastre.
- Tema claro, oscuro y automático persistente.
- Orden de estudio predeterminado y giro de tarjeta persistentes.
- Exportación JSON versionada de las ocho tablas locales.
- Validador de respaldos con comprobación de tipos, IDs y referencias.
- Restauración transaccional de cursos, temas, tarjetas, estudio, estadísticas
  y configuración.
- Reinicio de progreso que conserva contenido, preferencias y orden.
- Regeneración de estadísticas de tarjeta en cero después del reinicio.
- Gestión de almacenamiento con cantidades y tamaño estimado.
- Formato CSV completo disponible desde Configuración.
- Estado Zustand coordinado después de restaurar o reiniciar.
- Plataforma Android de Capacitor añadida y sincronizada.
- Documentación final de desarrollo, pruebas, CSV, backup y Android.

## Verificación final

- `npm run build`: correcto.
- `npm test`: 36 pruebas aprobadas en 11 archivos.
- `npm run android:sync`: correcto.
- Arrastre con mouse validado en navegador.
- Gesto táctil prolongado validado en navegador.
- El nuevo orden se mantuvo después de recargar.
- Solo el asa usa `touch-action: none`; el cuerpo conserva el scroll.
- Las páginas no acceden directamente a Dexie.
- Configuración validada en navegador a 390 × 844.
- Cambio claro/oscuro validado.
- Exportación JSON validada con descarga local.
- Reinicio validado: `seenCount` pasó a cero sin borrar contenido.
- Restauración validada: `seenCount` volvió al valor respaldado.
- `npm audit`: cero vulnerabilidades conocidas.

Movimiento entre cursos:

- El modelo y el repository permiten cambiar `courseId`.
- La acción visual permanece desactivada en esta fase.
- Requiere diseñar y validar un selector de destino antes de habilitarla.

Empaquetado nativo:

- Android está preparado en `android/`.
- La sincronización de recursos funciona.
- La generación local del APK requiere un JDK 17 completo con `javac` y un
  Android SDK configurado. Esta máquina solo expone el runtime de Java.
- iOS requiere ejecutar Capacitor en macOS.
