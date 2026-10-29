# Añadir preguntas y gráficos con utilidad

Primero escribir **qué decisión permitirá tomar el resultado**. Evitar añadir un gráfico solo porque dos columnas son numéricas o porque Pearson da alto.

## Preguntas iniciales propuestas

| Pregunta | Visual actual | Acción posible | Qué confirmar |
|---|---|---|---|
| ¿Qué destinos solicitan las productoras de cada cooperativa? | Barras 100% + n | Preparar contenidos de acompañamiento diferentes. | Que la actividad describa la misma etapa de solicitud. |
| ¿Cómo se relacionan acopio e ingreso? | Dispersión + coeficientes por grupo | Revisar perfiles y casos inusuales con el técnico. | Mismo periodo, alcance del ingreso y peso del quintal. No usar como score de aprobación. |
| ¿Qué mezcla de canales requiere el acompañamiento? | Celular propio y lectoescritura | Combinar materiales escritos, llamadas y visitas. | Internet, canal preferido y disponibilidad efectiva; smartphone no garantiza conexión. |
| ¿Qué resume cada eje de diversidad? | PCA y tabla de pesos | Describir perfiles en una conversación con campo. | No interpretar como pobreza, mérito, causalidad o riesgo. |

## Cómo modificar el código

La página existente usa Chart.js, sin framework ni compilación. Se conserva esa arquitectura para poder copiar el parche a tu repo.

1. **Entrada:** `js/data_core.js` contiene `fields`, tipos, adaptadores, normalización y métricas. Un campo nuevo requiere nombre canónico, unidad, periodo, referente y regla de ausentes. No asignar valores por defecto que parezcan observados.
2. **Contrato:** documenta el campo en `data/data_contract.md` y qué visual puede usarlo. Si cambia el significado de una pregunta, usa otro campo; no lo unas por similitud de palabras.
3. **Vista:** añade su panel/canvas en `index.html`. Usa el mismo `chart-box` y una nota con cobertura.
4. **Cálculo/gráfico:** en `js/charts.js`, `render(rows, allRows, model)` recibe la selección y la base completa. Usa `rows` para estadísticas filtradas. El único ajuste del PCA vive en `js/pca_engine.js` y se ejecuta al confirmar una carga en app.js.
5. **Comentario:** debe describir los datos seleccionados y actualizarse con ellos. No escribir “a mayor edad, más ingreso” como texto fijo. Publica n, periodo y si la medida es solicitud o realización.
6. **Verificación:** revisa con ambas cooperativas, una sola, una selección vacía, datos incompletos y móvil. Si un campo falta, deja disponible lo que sí puede calcularse.

Las categorías en una barra 100% deben ser mutuamente excluyentes y sumar el denominador. Si una pregunta admite múltiples respuestas, no sumar porcentajes como si fueran partes de un todo. Usar un porcentaje independiente por opción y declarar el denominador.

## Elegir el gráfico

- Dos medidas del mismo registro: dispersión; añadir Pearson para relación lineal o Spearman para orden. Mirar grupos y extremos antes de interpretar el coeficiente.
- Mezcla de categorías por cooperativa: barras 100%, con recuentos; no comparar solo el número bruto cuando n=113 frente a n=25.
- Distribución de montos: intervalos sin solapamiento y eje de conteos desde cero.
- Totales operativos: barras de total con n; para comparar la observación típica, mediana por productora.
- Evolución de ingreso o recuperación: requiere fechas y mediciones posteriores; no se inventa una serie temporal desde esta encuesta.
- No calcular “eficiencia” correlacionando un cociente con su propio denominador sin revisar la relación matemática inducida.

## Cuando llegue un formulario nuevo

Selecciona su hoja/fila y mapea solo equivalencias comprobadas. Guarda la auditoría JSON para conservar el mapeo efectivo. Si el formato va a repetirse, añade un adaptador **explícito** a `inferMap` con pruebas, conservando el valor original y su versión. No unir automáticamente todas las hojas de un archivo: puede contener diccionarios, totales o copias del mismo registro.

Un archivo por carga. Para acumular años/cooperativas y versionar correcciones haría falta una capa de almacenamiento, periodo explícito y reconciliación de identidad; eso no lo resuelve una página estática por sí sola.

## Gráficos por cooperativa

Cada cooperativa declara en `COOP_CONFIG` (`js/coops.js`) su nivel territorial y la lista de gráficos de la página Análisis cruzado. Para un gráfico nuevo: agrega su entrada en `CROSS` (`js/cross.js`) con `build` (el panel) y `draw` (el cálculo), y su id en la lista de las cooperativas que lo necesiten. Una pregunta nueva del formulario se añade a `fields` y `extraKinds` en `data_core.js` como texto, opción múltiple o 0/1.

