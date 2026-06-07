# FlashStudy: vistas y flujo de navegación

## Vistas diseñadas

1. **Inicio**
2. **Cursos**
3. **Crear nuevo curso**: bottom sheet dentro de Cursos.
4. **Detalle de curso**
5. **Importar CSV**
6. **Categorías del tema / Detalle del tema**
7. **Estudio - Pregunta**
8. **Estudio - Respuesta**
9. **Resultado de la pasada**
10. **Tema completado / Resumen de sesión**
11. **Modo examen**
12. **Estadísticas**
13. **Configuración**

## Navegación principal

La barra inferior permanece fija en las vistas principales y contiene cuatro secciones:

- Inicio
- Cursos
- Estadísticas
- Configuración

Las sesiones de estudio y examen ocultan esta barra para ofrecer una experiencia más concentrada.

```text
Inicio
  ├── Continuar estudio
  │   └── Estudio - Pregunta
  │       └── Ver respuesta
  │           └── Estudio - Respuesta
  │               ├── La sabía -> Siguiente pregunta
  │               └── No la sabía -> Siguiente pregunta
  │
  ├── Tema reciente
  │   └── Categorías del tema
  │
  └── Navegación inferior
      ├── Inicio
      ├── Cursos
      ├── Estadísticas
      └── Configuración
```

## Gestión de cursos

```text
Cursos
  ├── Botón "+"
  │   └── Crear nuevo curso
  │       └── Crear curso
  │           └── Detalle de curso
  │
  └── Seleccionar curso
      └── Detalle de curso
          ├── Seleccionar tema
          │   └── Categorías del tema
          ├── Agregar tema CSV
          │   └── Importar CSV
          ├── Reordenar temas
          └── Mover tema a otro curso
```

### Crear un curso

1. El usuario pulsa el botón `+` en Cursos.
2. Aparece el bottom sheet **Crear nuevo curso**.
3. Introduce el nombre y pulsa **Crear curso**.
4. La aplicación abre el **Detalle de curso** recién creado.
5. Desde allí puede importar su primer tema.

## Importación de CSV

```text
Detalle de curso
  └── Agregar tema CSV
      └── Importar CSV
          ├── Seleccionar archivo
          ├── Validar CSV
          ├── Mostrar vista previa
          ├── Resolver actualización si ya existe
          └── Confirmar importación
              └── Categorías del tema
```

### Comportamiento

1. El usuario selecciona o arrastra un archivo CSV.
2. La aplicación valida su estructura.
3. Se muestran el curso, la unidad, el tema, las tarjetas y las categorías detectadas.
4. Si el tema ya existe, el usuario elige entre actualizarlo o crear uno nuevo.
5. Al confirmar, se generan las flashcards y se abre el detalle del tema.
6. Al cancelar, se regresa al **Detalle de curso**.

## Selección del estudio

```text
Categorías del tema
  ├── Elegir orden normal o aleatorio
  ├── Estudiar todo el tema
  │   └── Estudio - Pregunta
  ├── Seleccionar una categoría
  │   └── Estudio - Pregunta
  └── Modo examen
      └── Modo examen
```

## Ciclo de estudio por pasadas

```text
Estudio - Pregunta
  └── Ver respuesta
      └── Estudio - Respuesta
          ├── La sabía
          └── No la sabía
              ↓
        Siguiente pregunta
              ↓
        Fin de la pasada
              ↓
      Resultado de la pasada
          ├── Hay incorrectas
          │   └── Repasar incorrectas
          │       └── Estudio - Pregunta
          │           Pasada 2, 3...
          │
          └── No hay incorrectas
              └── Tema completado
```

### Reglas de las pasadas

- La primera pasada incluye todas las tarjetas seleccionadas.
- Una tarjeta marcada como **La sabía** queda fuera de las siguientes pasadas de esa sesión.
- Una tarjeta marcada como **No la sabía** pasa a la siguiente pasada.
- El proceso continúa hasta que no queden tarjetas incorrectas.
- Las tarjetas correctas no se eliminan del tema y pueden reaparecer en una nueva sesión.

### Acciones al completar el tema

```text
Tema completado
  ├── Volver al tema
  │   └── Categorías del tema
  └── Estudiar de nuevo
      └── Estudio - Pregunta, Pasada 1
```

## Modo examen

```text
Categorías del tema
  └── Modo examen
      ├── Mostrar respuesta para autoevaluar
      ├── Marcar respuesta
      ├── Guardar y siguiente
      └── Finalizar examen
          └── Resumen de examen
```

El modo examen no muestra retroalimentación inmediata. Los resultados se presentan al finalizar y se mantienen separados visualmente del ciclo principal de repaso.

## Estadísticas

La vista **Estadísticas** se abre desde la barra inferior y permite consultar:

- Tarjetas estudiadas.
- Porcentaje de dominio.
- Aciertos en la primera pasada.
- Tarjetas que necesitaron varias pasadas.
- Temas con más errores.
- Evolución del rendimiento.
- Resultados generales y por curso.

Desde una estadística de curso o tema se puede navegar al elemento correspondiente.

## Configuración

La vista **Configuración** se abre desde la barra inferior y permite:

- Cambiar entre modo claro y oscuro.
- Definir el orden de estudio predeterminado.
- Activar el giro de tarjeta al tocar.
- Exportar el progreso local.
- Restaurar un respaldo.
- Gestionar el almacenamiento.
- Consultar el formato CSV esperado.
- Reiniciar el progreso con confirmación.

## Transiciones visuales

| Origen | Destino o acción | Transición |
|---|---|---|
| Barra inferior | Sección principal | Fundido breve o cambio directo |
| Cursos | Detalle de curso | Desplazamiento horizontal |
| Detalle de curso | Categorías del tema | Desplazamiento horizontal |
| Botón volver | Vista anterior | Desplazamiento horizontal inverso |
| Cursos | Crear nuevo curso | Bottom sheet desde abajo |
| Detalle de curso | Importar CSV | Desplazamiento horizontal |
| Importar CSV | Pasos de importación | Cambio progresivo del indicador |
| Pregunta | Respuesta | Giro 3D tipo flip card |
| Respuesta | Siguiente pregunta | Desplazamiento lateral corto |
| Última pregunta | Resultado de pasada | Fundido con elevación del resumen |
| Resultado | Repasar incorrectas | Entrada a una nueva pasada |
| Última pasada | Tema completado | Fundido hacia el resumen final |
| Configuración | Cambio de tema | Transición suave de colores |

## Flujo completo resumido

```text
Inicio
  └── Cursos
      ├── Crear curso
      └── Detalle de curso
          └── Importar CSV
              └── Categorías del tema
                  ├── Estudiar tema o categoría
                  │   └── Pregunta
                  │       └── Respuesta
                  │           └── Resultado de pasada
                  │               ├── Repasar incorrectas
                  │               └── Tema completado
                  └── Modo examen
                      └── Resumen de examen

Estadísticas y Configuración son accesibles desde la navegación inferior.
```
