# Requerimientos del proyecto: App de Flashcards Local-First

## 1. Nombre provisional

**Flashcards Local-First para estudio teórico**

El nombre final queda pendiente. La app estará orientada a estudiar cursos teóricos mediante flashcards generadas dinámicamente desde archivos CSV cargados por el usuario.

---

## 2. Objetivo general

Construir una aplicación **mobile first**, usable también en web, para estudiar temas teóricos mediante flashcards organizadas por cursos y temas. Cada tema será creado o actualizado a partir de un archivo CSV cargado dentro de la app. El sistema debe permitir estudiar por pasadas: primero se responden todas las tarjetas, luego se repasan solo las incorrectas, y el ciclo continúa hasta que ya no queden tarjetas incorrectas.

La app será de uso personal, completamente local, sin internet, sin cuenta de usuario y sin dependencia de servicios externos.

---

## 3. Decisiones confirmadas

| Punto | Decisión |
|---|---|
| Tipo de usuario | Solo un usuario: uso personal |
| Conexión | Sin internet |
| Cuenta / login | No habrá inicio de sesión |
| Plataforma principal | Móvil |
| Plataforma secundaria | Web responsive |
| Enfoque visual | Académico |
| Paleta | Fija, pendiente de recibir |
| Modo oscuro | Sí |
| Animación de flashcard | Sí, efecto de voltear tarjeta |
| Evaluación de respuestas | Manual |
| Temporizador | No |
| Favoritos / difíciles | No por ahora |
| Estadísticas | Sí |
| Historial | Sí |
| Progreso persistente | Sí |
| Almacenamiento | Local en el celular / navegador |
| Backend | Backend local o capa local de datos, sin servidor remoto |
| Versión mínima | No se plantea como MVP limitado; se define una primera versión completa |
| Repositorio | Debe quedar listo para GitHub |

---

## 4. Estructura real detectada en los archivos cargados

### 4.1 Archivo `index.json`

El archivo `index.json` funciona como índice de CSV disponibles. La estructura actual es:

```json
{
  "files": [
    {
      "name": "IA_TEMA1_SBC.csv",
      "path": "csv/IA_TEMA1_SBC.csv"
    },
    {
      "name": "IA_TEMA2_FRC.csv",
      "path": "csv/IA_TEMA2_FRC.csv"
    },
    {
      "name": "TEMA2_EF_sociedades.csv",
      "path": "csv/TEMA2_EF_sociedades.csv"
    }
  ]
}
```

### 4.2 Archivo CSV de ejemplo

El CSV cargado `IA_TEMA1_SBC.csv` no es un CSV plano tradicional desde la primera fila. Tiene una estructura mixta:

```csv
curso,Inteligencia Artificial
unidad,Unidad 1
tema,Introducción a los Sistemas Basados en el Conocimiento (SBC)

categoria,pregunta,respuesta
Antecedentes históricos,¿Qué fue DENDRAL?,"Fue el primer sistema experto..."
...
```

### 4.3 Estructura lógica del CSV

Cada CSV representa un **tema** dentro de un curso.

Campos de metadatos:

| Campo | Uso |
|---|---|
| `curso` | Nombre del curso al que pertenece el tema |
| `unidad` | Unidad académica o bloque del curso |
| `tema` | Nombre completo del tema |
| línea vacía | Separador entre metadatos y preguntas |
| `categoria,pregunta,respuesta` | Encabezado de tarjetas |

Campos de cada tarjeta:

| Campo | Descripción |
|---|---|
| `categoria` | Subtema interno o grupo de preguntas |
| `pregunta` | Frente de la flashcard |
| `respuesta` | Reverso de la flashcard; puede ser larga |

### 4.4 Datos del CSV de ejemplo

Del archivo `IA_TEMA1_SBC.csv` se detectó:

| Elemento | Valor |
|---|---|
| Curso | Inteligencia Artificial |
| Unidad | Unidad 1 |
| Tema | Introducción a los Sistemas Basados en el Conocimiento (SBC) |
| Cantidad de tarjetas | 31 |
| Categorías internas | 8 |

Categorías detectadas:

```text
Antecedentes históricos
Comparación
Componentes
Desarrollo de sistemas expertos
El conocimiento
Experticia
Rasgos de los SBC
Sistemas expertos
```

---

## 5. Concepto principal de organización

La app debe manejar tres niveles principales:

```text
Curso
  └── Tema / CSV
        └── Flashcards
```

Ejemplo:

```text
Inteligencia Artificial
  ├── Tema 1: Introducción a los Sistemas Basados en el Conocimiento
  ├── Tema 2: Factor de certeza / razonamiento con incertidumbre
  └── Tema 3: Otro tema futuro
```

Cada tema será agregado mediante un CSV. El usuario podrá ordenar los temas dentro de un curso y mover temas entre cursos si fuese necesario.

---

## 6. Flujo principal de estudio

### 6.1 Modo principal: repaso por pasadas

El modo principal será **repasar**.

Flujo:

```text
1. El usuario elige un curso.
2. El usuario elige un tema.
3. La app carga las tarjetas del tema.
4. Se muestran todas las tarjetas en una primera pasada.
5. En cada tarjeta:
   - El usuario lee la pregunta.
   - Toca para ver la respuesta.
   - Se autoevalúa como Correcta o Incorrecta.
6. Al terminar la pasada:
   - Las correctas quedan registradas.
   - Las incorrectas pasan a la siguiente pasada.
7. La segunda pasada contiene solo las incorrectas.
8. El proceso continúa hasta que ya no queden incorrectas.
9. Se muestra un resumen final.
10. El avance queda guardado.
```

### 6.2 Sobre “desaparecer” una tarjeta

Una tarjeta correcta **no debe desaparecer del curso ni del tema**.

Lo que debe ocurrir es:

```text
Si una tarjeta se marca como correcta en una pasada,
ya no aparece en las siguientes pasadas de esa sesión.
```

Pero la tarjeta seguirá existiendo en el tema y podrá volver a estudiarse en una nueva sesión.

### 6.3 Criterio de dominio

Una tarjeta se considera dominada dentro de una sesión cuando fue marcada como correcta.

A nivel histórico, la app debe guardar:

```text
- Cuántas veces fue estudiada.
- Cuántas veces fue marcada correcta.
- Cuántas veces fue marcada incorrecta.
- En qué pasada fue respondida correctamente.
- Fecha de última práctica.
- Evolución por sesión.
```

---

## 7. Modo examen

Además del modo repaso, debe existir un **modo examen** como opción secundaria.

Características:

```text
- El usuario selecciona curso y tema.
- La app muestra las preguntas.
- El usuario no ve retroalimentación completa hasta terminar.
- Al final se muestra el resumen.
- La evaluación sigue siendo manual.
```

Pendiente de definir:

```text
- Si en modo examen se permite ver la respuesta antes de marcar.
- Si el modo examen contará como progreso normal o como estadística separada.
```

---

## 8. Requerimientos funcionales

### RF-01. Gestión de cursos

La app debe permitir:

```text
- Crear cursos.
- Ver lista de cursos.
- Entrar a un curso.
- Editar el nombre de un curso.
- Mantener los cursos guardados localmente.
```

Cada curso puede contener varios temas.

---

### RF-02. Gestión de temas mediante CSV

La app debe permitir:

```text
- Agregar un nuevo tema cargando un CSV.
- Asociar el tema a un curso.
- Leer los metadatos del CSV: curso, unidad y tema.
- Generar tarjetas automáticamente desde el CSV.
- Ver la lista de temas dentro de un curso.
- Ordenar los temas manualmente.
- Mover un tema entre cursos.
```

---

### RF-03. Actualización de un CSV existente

La app debe permitir actualizar un tema cargando otro CSV con el mismo nombre o con el mismo identificador interno.

Regla propuesta:

```text
Si se carga un CSV con el mismo nombre de archivo:
  - La app debe preguntar si se desea actualizar el tema existente.
  - Si se confirma, reemplaza el contenido de preguntas.
  - Mantiene el historial y estadísticas cuando las preguntas coinciden.
  - Crea estadísticas nuevas para preguntas nuevas.
  - Marca como inactivas o removidas las preguntas que ya no estén en el nuevo CSV.
```

Pendiente de definir:

```text
- Si una pregunta se considera “la misma” por texto exacto de pregunta.
- Si se usará un ID explícito en el CSV para cada tarjeta.
```

Recomendación:

```text
Agregar opcionalmente una columna id_card en el futuro.
```

---

### RF-04. Parser de CSV

La app debe interpretar CSV con esta estructura:

```csv
curso,Nombre del curso
unidad,Nombre de la unidad
tema,Nombre del tema

categoria,pregunta,respuesta
Categoria 1,Pregunta 1,Respuesta 1
Categoria 2,Pregunta 2,Respuesta 2
```

Validaciones mínimas:

```text
- Debe existir el campo curso.
- Debe existir el campo tema.
- Debe existir el encabezado categoria,pregunta,respuesta.
- No debe aceptar tarjetas sin pregunta.
- No debe aceptar tarjetas sin respuesta.
- Debe mostrar errores claros si el CSV está mal formado.
```

---

### RF-05. Generación automática de flashcards

Al cargar un CSV válido, la app debe generar automáticamente:

```text
- Un tema.
- Sus categorías internas.
- Sus tarjetas.
```

Cada tarjeta tendrá:

```text
- Pregunta.
- Respuesta.
- Categoría.
- Curso asociado.
- Tema asociado.
- Estado estadístico.
```

---

### RF-06. Estudio por tema

El usuario debe poder estudiar por tema dentro de cada curso.

Opciones esperadas:

```text
- Estudiar todas las tarjetas del tema.
- Estudiar tarjetas en orden original.
- Estudiar tarjetas en orden aleatorio.
- Ver cantidad de tarjetas antes de empezar.
- Ver progreso durante la sesión.
```

---

### RF-07. Orden aleatorio

La app debe permitir activar o desactivar el orden aleatorio.

Comportamiento:

```text
Si el modo aleatorio está activado:
  - Las tarjetas se mezclan al iniciar la sesión.
  - La mezcla se mantiene durante esa sesión.
```

---

### RF-08. Tarjeta interactiva

Cada flashcard debe tener:

```text
- Cara frontal: pregunta.
- Cara posterior: respuesta.
- Animación de volteo.
- Botón para mostrar respuesta.
- Botón Correcta.
- Botón Incorrecta.
- Indicador de pasada actual.
- Indicador de avance dentro de la pasada.
```

Ejemplo:

```text
Pregunta 7 de 31
Pasada 1

¿Qué fue DENDRAL?

[Ver respuesta]

Luego:

Fue el primer sistema experto...

[Correcta] [Incorrecta]
```

---

### RF-09. Separación en correctas e incorrectas

Durante cada pasada, la app debe dividir las tarjetas en dos grupos:

```text
- Correctas
- Incorrectas
```

Al finalizar la pasada:

```text
- Las correctas quedan fuera de la siguiente pasada de esa sesión.
- Las incorrectas pasan a la siguiente pasada.
```

---

### RF-10. Finalización de sesión

La sesión termina cuando:

```text
- Todas las tarjetas fueron marcadas como correctas.
```

Al finalizar, la app debe mostrar:

```text
- Total de tarjetas.
- Correctas en primera pasada.
- Incorrectas en primera pasada.
- Número total de pasadas.
- Tarjetas que requirieron más intentos.
- Tiempo total de sesión, si se registra.
- Fecha de la sesión.
```

Aunque no se usará temporizador por pregunta, puede registrarse duración total de sesión de forma automática.

---

### RF-11. Guardado de progreso

La app debe guardar automáticamente:

```text
- Cursos.
- Temas.
- Tarjetas.
- Historial de sesiones.
- Resultados por pasada.
- Estadísticas acumuladas.
- Orden manual de temas.
- Configuración de la app.
```

El guardado debe ser local.

---

### RF-12. Estadísticas por curso

La app debe mostrar estadísticas por curso:

```text
- Total de temas.
- Total de tarjetas.
- Sesiones realizadas.
- Porcentaje histórico de aciertos.
- Promedio de pasadas necesarias.
- Última fecha de estudio.
```

---

### RF-13. Estadísticas por tema

La app debe mostrar estadísticas por tema:

```text
- Total de tarjetas.
- Categorías internas.
- Progreso histórico.
- Aciertos acumulados.
- Errores acumulados.
- Promedio de pasadas para completar.
- Mejor sesión.
- Última sesión.
```

---

### RF-14. Estadísticas por tarjeta

La app debe guardar internamente estadísticas por tarjeta:

```text
- Veces vista.
- Veces correcta.
- Veces incorrecta.
- Tasa de acierto.
- Última vez estudiada.
- Mejor pasada en la que fue respondida correctamente.
```

No es obligatorio mostrar todo en la interfaz principal, pero debe quedar disponible para análisis futuro.

---

### RF-15. Historial de sesiones

La app debe permitir revisar sesiones anteriores.

Cada sesión debe guardar:

```text
- ID de sesión.
- Curso.
- Tema.
- Fecha.
- Modo: repaso o examen.
- Total de tarjetas.
- Número de pasadas.
- Resultado por pasada.
- Tarjetas correctas e incorrectas por pasada.
```

---

### RF-16. Reordenamiento drag and drop

La app debe permitir reordenar temas dentro de un curso mediante drag and drop.

También debe permitir mover temas entre cursos si el usuario lo decide.

Comportamiento esperado:

```text
- Mantener pulsado un tema.
- Arrastrarlo a otra posición.
- Soltarlo.
- Guardar automáticamente el nuevo orden.
```

En web se puede usar drag and drop con mouse. En móvil debe funcionar con gesto táctil.

---

### RF-17. Importación desde la app

Debe existir una pantalla o sección para importar CSV.

Flujo:

```text
1. El usuario entra a Importar.
2. Selecciona un archivo CSV desde el dispositivo.
3. La app valida el formato.
4. La app muestra una vista previa:
   - Curso detectado.
   - Unidad detectada.
   - Tema detectado.
   - Cantidad de tarjetas.
   - Categorías detectadas.
5. El usuario confirma.
6. La app guarda el tema.
```

---

### RF-18. Actualización de tema existente

Si se importa un CSV que ya existe:

```text
- La app debe detectar coincidencia por nombre de archivo o por curso + unidad + tema.
- Debe mostrar una confirmación.
- Debe actualizar el tema sin borrar el historial general.
```

---

### RF-19. Barra inferior de navegación

La app debe tener una barra inferior.

Propuesta inicial:

```text
Inicio | Cursos | Importar | Estadísticas | Ajustes
```

---

### RF-20. Configuración

La pantalla de ajustes debe permitir:

```text
- Activar o desactivar modo oscuro.
- Ver información de la app.
- Exportar datos locales.
- Importar respaldo local.
- Reiniciar progreso, con confirmación.
```

---

## 9. Requerimientos no funcionales

### RNF-01. Mobile first

La interfaz debe diseñarse primero para pantallas móviles.

Criterios:

```text
- Botones grandes.
- Textos legibles.
- Navegación simple.
- Tarjetas centradas.
- Sin tablas complejas en pantallas pequeñas.
```

---

### RNF-02. Responsive web

Aunque la prioridad sea móvil, la app debe funcionar bien en navegador web.

Criterios:

```text
- Layout adaptable.
- Ancho máximo para lectura cómoda.
- Barra inferior o navegación adaptada.
- Uso correcto en desktop con mouse.
```

---

### RNF-03. Offline total

La app no debe depender de internet.

Implicaciones:

```text
- No login.
- No servidor remoto.
- No APIs externas.
- No carga de archivos desde URL.
- Todo se procesa en el dispositivo.
```

---

### RNF-04. Privacidad

Los CSV y el progreso deben quedarse en el dispositivo del usuario.

La app no debe enviar datos a ningún servicio externo.

---

### RNF-05. Escalabilidad local

La app debe poder manejar muchos cursos y muchos CSV sin romper la estructura.

Objetivo inicial recomendado:

```text
- 20 cursos.
- 200 temas.
- 20 000 tarjetas.
```

---

### RNF-06. Mantenibilidad

El proyecto debe organizarse con una arquitectura clara:

```text
src/
  app/
  components/
  features/
  services/
  db/
  types/
  utils/
  styles/
```

---

### RNF-07. Validación clara de errores

Cuando un CSV esté mal formado, la app debe explicar el problema.

Ejemplos:

```text
- Falta el campo tema.
- No se encontró el encabezado categoria,pregunta,respuesta.
- Hay preguntas vacías.
- Hay respuestas vacías.
```

---

## 10. Modelo de datos propuesto

### 10.1 Course

```ts
type Course = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  order: number;
};
```

### 10.2 Topic

```ts
type Topic = {
  id: string;
  courseId: string;
  fileName: string;
  unit: string;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  sourceHash: string;
};
```

### 10.3 Flashcard

```ts
type Flashcard = {
  id: string;
  topicId: string;
  category: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### 10.4 StudySession

```ts
type StudySession = {
  id: string;
  topicId: string;
  mode: "review" | "exam";
  startedAt: string;
  finishedAt?: string;
  totalCards: number;
  totalPasses: number;
  shuffle: boolean;
};
```

### 10.5 StudyPass

```ts
type StudyPass = {
  id: string;
  sessionId: string;
  passNumber: number;
  totalCards: number;
  correctCount: number;
  incorrectCount: number;
};
```

### 10.6 CardAttempt

```ts
type CardAttempt = {
  id: string;
  sessionId: string;
  passId: string;
  cardId: string;
  result: "correct" | "incorrect";
  answeredAt: string;
};
```

### 10.7 CardStats

```ts
type CardStats = {
  cardId: string;
  seenCount: number;
  correctCount: number;
  incorrectCount: number;
  lastStudiedAt?: string;
  bestPassNumber?: number;
};
```

---

## 11. Pantallas propuestas

### 11.1 Inicio

Debe mostrar:

```text
- Saludo o título de la app.
- Cursos recientes.
- Últimos temas estudiados.
- Botón rápido para continuar.
- Resumen general.
```

---

### 11.2 Cursos

Debe mostrar:

```text
- Lista de cursos.
- Cantidad de temas por curso.
- Progreso general del curso.
- Botón para crear curso.
```

---

### 11.3 Detalle de curso

Debe mostrar:

```text
- Nombre del curso.
- Lista de temas.
- Botón para importar CSV a ese curso.
- Opción para reordenar temas.
- Estadísticas del curso.
```

---

### 11.4 Detalle de tema

Debe mostrar:

```text
- Nombre del tema.
- Unidad.
- Cantidad de tarjetas.
- Categorías internas.
- Última práctica.
- Botón iniciar repaso.
- Botón iniciar examen.
- Opción de orden aleatorio.
```

---

### 11.5 Sesión de repaso

Debe mostrar:

```text
- Pregunta.
- Respuesta al voltear.
- Botón Correcta.
- Botón Incorrecta.
- Pasada actual.
- Progreso de la pasada.
```

---

### 11.6 Resumen de sesión

Debe mostrar:

```text
- Total de tarjetas.
- Total de pasadas.
- Correctas por pasada.
- Incorrectas por pasada.
- Tarjetas que más costaron.
- Botón volver al tema.
- Botón repasar de nuevo.
```

---

### 11.7 Estadísticas

Debe mostrar:

```text
- Estadísticas globales.
- Estadísticas por curso.
- Estadísticas por tema.
- Historial de sesiones.
```

---

### 11.8 Importar CSV

Debe mostrar:

```text
- Selector de archivo.
- Vista previa del CSV.
- Validaciones.
- Confirmación para crear o actualizar tema.
```

---

### 11.9 Ajustes

Debe mostrar:

```text
- Modo oscuro.
- Exportar respaldo.
- Importar respaldo.
- Reiniciar progreso.
- Información de la app.
```

---

## 12. Stack tecnológico recomendado

### 12.1 Frontend

```text
React + Vite + TypeScript
```

Motivo:

```text
- Permite construir una app web rápida.
- Facilita enfoque mobile first.
- Funciona bien con Capacitor para empaquetar en Android.
- Permite mantener una sola base de código para web y móvil.
```

---

### 12.2 Mobile wrapper

```text
Capacitor
```

Motivo:

```text
- Permite convertir la app web en app móvil.
- Permite acceder a funcionalidades del dispositivo.
- Mantiene compatibilidad con web.
```

---

### 12.3 UI mobile first

Opciones recomendadas:

```text
Ionic React
```

o

```text
React + Tailwind CSS + componentes propios
```

Recomendación principal:

```text
Ionic React + Tailwind CSS
```

Motivo:

```text
- Ionic ya ofrece componentes móviles como tabs, cards, modals, sheets y botones táctiles.
- Tailwind permite personalizar la línea gráfica y la paleta fija.
```

---

### 12.4 Drag and drop

Para React web/mobile con Capacitor:

```text
dnd-kit
```

Motivo:

```text
- Está pensado para React.
- Permite ordenar listas.
- Puede funcionar con mouse y táctil.
```

Nota importante:

```text
Si el proyecto fuera React Native real, se usaría otra librería como react-native-draggable-flatlist.
Pero como la opción elegida es React + Capacitor, la librería coherente es dnd-kit.
```

---

### 12.5 Parseo CSV

```text
Papa Parse
```

Motivo:

```text
- Permite leer archivos CSV en el navegador.
- No requiere servidor.
- Puede procesar archivos locales.
```

La app necesitará un parser personalizado encima de Papa Parse porque el CSV tiene metadatos antes del encabezado real.

---

### 12.6 Estado global

```text
Zustand
```

Motivo:

```text
- Ligero.
- Sencillo.
- Adecuado para manejar estado de sesión, curso actual, tema actual y preferencias.
```

---

### 12.7 Base de datos local

Opción recomendada para primera arquitectura:

```text
IndexedDB + Dexie.js
```

Motivo:

```text
- Funciona en navegador.
- Funciona en WebView móvil.
- Permite almacenamiento local estructurado.
- No requiere backend externo.
```

Opción futura si se requiere más integración nativa:

```text
SQLite local mediante plugin de Capacitor
```

Estrategia recomendada:

```text
Crear una capa Repository para que la app no dependa directamente de Dexie.
Así, si luego se cambia a SQLite, no se reescribe toda la app.
```

---

### 12.8 Testing

Recomendado:

```text
Vitest
React Testing Library
```

Pruebas importantes:

```text
- Parser de CSV.
- Separación de correctas e incorrectas.
- Cálculo de estadísticas.
- Actualización de tema existente.
```

---

## 13. Arquitectura propuesta

```text
src/
  app/
    router.tsx
    App.tsx

  components/
    Flashcard.tsx
    BottomTabs.tsx
    CourseCard.tsx
    TopicCard.tsx
    StatCard.tsx

  features/
    courses/
      CoursesPage.tsx
      CourseDetailPage.tsx
      courseStore.ts

    topics/
      TopicDetailPage.tsx
      ImportCsvPage.tsx
      topicStore.ts

    study/
      StudySessionPage.tsx
      StudySummaryPage.tsx
      studyEngine.ts
      studyStore.ts

    stats/
      StatsPage.tsx
      statsService.ts

    settings/
      SettingsPage.tsx

  services/
    csv/
      csvParser.ts
      csvValidator.ts

    study/
      passEngine.ts
      sessionCalculator.ts

  db/
    db.ts
    repositories/
      courseRepository.ts
      topicRepository.ts
      cardRepository.ts
      statsRepository.ts
      sessionRepository.ts

  types/
    course.ts
    topic.ts
    flashcard.ts
    study.ts
    stats.ts

  utils/
    ids.ts
    dates.ts
    hash.ts

  styles/
    theme.css
```

---

## 14. Lógica de pasadas

### 14.1 Entrada

```ts
cards: Flashcard[]
```

### 14.2 Estado de sesión

```ts
currentPass: number
pendingCards: Flashcard[]
correctCards: Flashcard[]
incorrectCards: Flashcard[]
```

### 14.3 Algoritmo

```text
Iniciar sesión:
  pendingCards = todas las tarjetas del tema
  currentPass = 1

Mientras pendingCards no esté vacío:
  mostrar tarjetas de pendingCards

  por cada tarjeta:
    si usuario marca Correcta:
      guardar intento correcto
    si usuario marca Incorrecta:
      guardar intento incorrecto
      agregar a incorrectCards

  al terminar la pasada:
    guardar resumen de pasada

    si incorrectCards está vacío:
      finalizar sesión
    si no:
      pendingCards = incorrectCards
      incorrectCards = []
      currentPass += 1
```

---

## 15. Reglas de actualización de estadísticas

Por cada respuesta:

```text
- Incrementar seenCount.
- Si fue correcta, incrementar correctCount.
- Si fue incorrecta, incrementar incorrectCount.
- Actualizar lastStudiedAt.
- Si fue correcta, actualizar bestPassNumber si corresponde.
```

Por cada sesión:

```text
- Guardar fecha.
- Guardar número total de pasadas.
- Guardar resultados por pasada.
- Actualizar estadísticas del tema.
- Actualizar estadísticas del curso.
```

---

## 16. Reglas de importación y actualización CSV

### 16.1 Nuevo CSV

```text
Si no existe tema equivalente:
  - Crear tema.
  - Crear tarjetas.
  - Guardar archivo lógico como fuente.
```

### 16.2 CSV con mismo nombre

```text
Si existe un tema con el mismo fileName:
  - Mostrar confirmación.
  - Actualizar metadatos.
  - Comparar tarjetas.
  - Actualizar preguntas/respuestas existentes.
  - Agregar tarjetas nuevas.
  - Mantener estadísticas históricas cuando sea posible.
```

### 16.3 CSV con mismo curso, unidad y tema

```text
Si el nombre de archivo cambió, pero coincide curso + unidad + tema:
  - Preguntar si se trata de una actualización del mismo tema.
```

---

## 17. Criterios de aceptación

### CA-01

Dado un CSV válido con metadatos y preguntas, cuando el usuario lo importe, entonces la app debe crear un tema con sus flashcards.

### CA-02

Dado un tema con 31 tarjetas, cuando el usuario inicia una sesión de repaso, entonces la primera pasada debe contener las 31 tarjetas.

### CA-03

Dado que el usuario marca 20 correctas y 11 incorrectas en la primera pasada, cuando inicia la segunda pasada, entonces solo deben mostrarse las 11 incorrectas.

### CA-04

Dado que ya no quedan tarjetas incorrectas, cuando finaliza la última pasada, entonces la app debe mostrar el resumen final y guardar la sesión.

### CA-05

Dado que el usuario cierra la app, cuando vuelve a abrirla, entonces los cursos, temas, tarjetas y estadísticas deben mantenerse.

### CA-06

Dado que el usuario importa un CSV con el mismo nombre que uno existente, cuando confirma la actualización, entonces la app debe actualizar el tema sin eliminar el historial.

### CA-07

Dado que el usuario reordena temas con drag and drop, cuando cierra y vuelve a abrir la app, entonces el nuevo orden debe mantenerse.

### CA-08

Dado que la app no tiene conexión a internet, cuando el usuario estudia, importa CSV o consulta estadísticas, entonces todo debe funcionar normalmente.

---

## 18. Información pendiente para construir la app de la mejor manera

### 18.1 Diseño

Pendiente:

```text
- Paleta de colores.
- Tipografía preferida.
- Nombre final de la app.
- Logo o isotipo.
- Estilo exacto de tarjetas.
```

---

### 18.2 CSV

Pendiente:

```text
- Confirmar si todos los CSV mantendrán exactamente la misma estructura.
- Confirmar si las respuestas pueden contener saltos de línea.
- Confirmar si habrá comas dentro de respuestas largas.
- Confirmar si se aceptarán tildes y caracteres especiales siempre en UTF-8.
```

Recomendación:

```text
Mantener UTF-8 y envolver respuestas largas entre comillas si contienen comas.
```

---

### 18.3 Identificación de tarjetas

Pendiente:

```text
- Decidir si se agregará una columna id_card.
```

Recomendación fuerte:

```csv
id_card,categoria,pregunta,respuesta
IA_SBC_001,Antecedentes históricos,¿Qué fue DENDRAL?,...
```

Esto facilitaría actualizar CSV sin perder estadísticas si se edita ligeramente el texto de una pregunta.

---

### 18.4 Estadísticas

Pendiente:

```text
- Definir si las estadísticas del modo examen se mezclan con las de repaso.
- Definir qué gráficos se desean.
```

Propuesta inicial:

```text
- Aciertos por sesión.
- Pasadas necesarias por tema.
- Tarjetas más falladas.
- Progreso por curso.
```

---

### 18.5 Respaldo

Pendiente:

```text
- Confirmar si se desea exportar todo el progreso como JSON.
- Confirmar si se desea importar respaldo desde JSON.
```

Recomendación:

```text
Sí incluir exportar/importar respaldo local, porque no habrá nube.
```

---

### 18.6 Instalación móvil

Pendiente:

```text
- Confirmar si se empaquetará primero para Android.
- Confirmar si se requiere APK instalable.
- Confirmar si también se publicará como PWA.
```

---

## 19. Decisión técnica recomendada final

La arquitectura más coherente con los requisitos es:

```text
React + Vite + TypeScript
Ionic React
Tailwind CSS
Capacitor
dnd-kit
Papa Parse
Dexie.js / IndexedDB
Zustand
Vitest
```

Esta combinación permite:

```text
- App mobile first.
- Uso web responsive.
- Funcionamiento offline.
- Carga local de CSV.
- Almacenamiento local.
- Drag and drop.
- Empaquetado móvil.
- Proyecto escalable y mantenible.
```

---

## 20. Próximo entregable recomendado

El siguiente paso debería ser construir el documento técnico de implementación con:

```text
- Flujo de pantallas.
- Wireframes textuales.
- Estructura final de carpetas.
- Modelo de base de datos Dexie.
- Contrato exacto del parser CSV.
- Primer backlog de desarrollo.
- Prompt maestro para vibecodear el proyecto.
```
