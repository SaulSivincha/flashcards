# FlashStudy

Aplicación mobile first para estudiar contenido teórico mediante flashcards
locales. Las **Fases 1 a 7 están completadas**.

## Ejecutar

```bash
npm install
npm run dev
```

Build y pruebas:

```bash
npm run build
npm test
```

## Capacitor Android

El proyecto nativo está incluido en `android/`.

```bash
npm run android:sync
npm run android:build
```

`android:sync` construye la web y copia los recursos a Capacitor.
`android:build` genera un APK debug cuando un JDK 17 completo, incluido
`javac`, y el Android SDK están configurados mediante `ANDROID_HOME` o
`ANDROID_SDK_ROOT`.

## Implementado en Fase 1

- React, Vite y TypeScript.
- Ionic React e Ionic Router.
- Tailwind CSS con tokens Academic Precision.
- Configuración base de Capacitor.
- Framer Motion para flip de tarjeta, resúmenes y bottom sheet.
- Navegación principal y rutas de estudio concentradas.
- 13 pantallas con datos mock.
- Componentes reutilizables de layout, UI, cursos y estudio.
- Modo visual claro y oscuro de referencia.
- Prueba de humo con Vitest y React Testing Library.

## Implementado en Fase 2

- Modelos TypeScript del dominio completo.
- Dexie e IndexedDB con ocho tablas.
- Capa repository independiente de las páginas.
- Seed controlado para instalaciones nuevas.
- Stores Zustand para cursos, temas y preferencias.
- Cursos y temas conectados a persistencia local.
- Creación real de cursos.
- Preferencias básicas persistentes.
- Pruebas de persistencia con `fake-indexeddb`.

## Implementado en Fase 3

- Parser CSV con Papa Parse y metadatos antes del encabezado.
- Validaciones con errores asociados a sus filas.
- Vista previa del archivo antes de importar.
- Importación transaccional a IndexedDB.
- Detección de conflictos por archivo o metadatos del tema.
- Actualización que conserva tarjetas y estadísticas coincidentes.
- Desactivación de tarjetas retiradas e incorporación de tarjetas nuevas.
- Opción para importar un tema existente como copia.
- Pruebas del parser y del flujo de actualización.

## Implementado en Fase 4

- Motor de repaso por pasadas.
- Sesiones reanudables después de recargar o cerrar una vista.
- Estudio de tema completo o categoría, en orden normal o aleatorio.
- Pregunta, respuesta y autoevaluación conectadas a datos reales.
- Correctas fuera de las siguientes pasadas de la misma sesión.
- Incorrectas transferidas a una nueva pasada.
- Intentos, pasadas y estadísticas de tarjeta persistidos en IndexedDB.
- Resultado de pasada y resumen final calculados.
- Evolución por pasada y tarjetas que necesitaron más repaso.
- Modo examen real sin retroalimentación inmediata.
- Recuperación de la sesión activa desde Inicio.

## Implementado en Fase 5

- Estadísticas globales calculadas desde IndexedDB.
- Filtros de últimos 30 días, 90 días y todo el historial.
- Tarjetas estudiadas, dominio y acierto en primera pasada.
- Promedio de pasadas y evolución por sesión.
- Resultado por dificultad y temas con más errores.
- Estadísticas de examen separadas visualmente.
- Resumen detallado por curso.
- Detalle por tema con mejor sesión y última práctica.
- Métricas internas por tarjeta y listado de tarjetas difíciles.
- Inicio conectado a estadísticas reales.
- Pruebas del calculador y repositorio estadístico.

## Implementado en Fase 6

- Reordenamiento de temas con dnd-kit.
- Arrastre desde un asa específica.
- Sensores para mouse, touch prolongado y teclado.
- Scroll móvil conservado fuera del asa.
- Guardado automático del nuevo orden en IndexedDB.
- Actualización optimista y restauración si falla el guardado.
- Validación contra temas omitidos o repetidos.
- Pruebas de persistencia después de reabrir la base.

## Implementado en Fase 7

- Tema claro, oscuro o automático persistente.
- Orden de estudio y giro de tarjeta persistentes.
- Exportación completa de las ocho tablas a un respaldo JSON versionado.
- Validación estructural y referencial antes de restaurar.
- Restauración transaccional que reemplaza el conjunto local completo.
- Reinicio de sesiones, pasadas, intentos y estadísticas sin borrar cursos,
  temas, tarjetas, preferencias ni orden.
- Resumen real de almacenamiento y contenido local.
- Ejemplo desplegable del formato CSV esperado.
- Proyecto Android de Capacitor generado y sincronizado.
- Pruebas repository para respaldo, restauración y reinicio.

## Formato CSV

```csv
curso,Inteligencia Artificial
unidad,Unidad 1
tema,Sistemas expertos

categoria,pregunta,respuesta
Antecedentes históricos,¿Qué fue DENDRAL?,"Fue uno de los primeros sistemas expertos..."
```

Los metadatos deben aparecer antes del encabezado
`categoria,pregunta,respuesta`. Las respuestas con comas deben ir entre
comillas.

## Respaldo local

Desde Configuración se puede:

- exportar cursos, temas, tarjetas, sesiones, pasadas, intentos, estadísticas
  y preferencias a JSON;
- validar y restaurar un archivo antes de reemplazar los datos actuales;
- reiniciar únicamente el progreso de estudio;
- consultar cantidades y tamaño estimado del respaldo.

El respaldo no se envía a ningún servicio remoto.

## Rutas

```text
/inicio
/cursos
/cursos/:courseId
/cursos/:courseId/importar
/temas/:topicId
/estudio/:topicId
/estudio/:topicId/respuesta
/estudio/:topicId/resultado-pasada
/estudio/:topicId/resumen
/examen/:topicId
/estadisticas
/configuracion
```

## Referencias locales

La implementación se construyó desde:

```text
requerimientos_flashcards_local_first.md
FLUJO_DE_VISTAS_FLASHSTUDY.md
stitch_flashstudy_app_de_estudio_local_first/academic_precision/DESIGN.md
stitch_flashstudy_app_de_estudio_local_first/*/screen.png
stitch_flashstudy_app_de_estudio_local_first/*/*.html
```

No se usan fuentes, imágenes, APIs ni servicios remotos en tiempo de ejecución.
Inter se empaqueta localmente con `@fontsource/inter`.

## Alcance

El reordenamiento dentro de cada curso está completo. El movimiento de temas
entre cursos permanece deshabilitado porque no forma parte del flujo visual
validado; el modelo permite incorporarlo posteriormente con un selector de
destino. El estado detallado está en `PROJECT_STATUS.md`.
