> Registro de una entrega anterior. Para los nombres, pantallas y reglas vigentes consulta el [manual](manual.html) y el [informe técnico](INFORME_TECNICO.md).

# Cierre de observaciones | UX y Producers Direct

**Vigencia:** la matriz de abajo registra decisiones de la iteración evaluada. En la versión actual, «Base cargada» reemplaza carga guiada, mapa PCA, correlaciones y valores atípicos. El análisis técnico reproducible sigue disponible en los notebooks locales. Los títulos, cifras y categorías del sitio responden al archivo y sus filtros; no hay interpretación generada.

Matriz contrastada con el Excel adjunto **Anotaciones IBA - Prioridades** (contenido contrastado con la versión en Google Sheets; 52 observaciones: 21 altas, 20 medias, 8 bajas y 3 sin marca). «Atendido» significa que hay un cambio en el tablero o la guía; no sustituye la validación de usuarios de Producers Direct. «Pendiente de fuente» significa que el producto muestra el límite y no calcula con supuestos.

| ID | Prioridad | Observación | Estado | Evidencia |
|---|---|---|---|---|
| R1 | Alta | Personalizar dashboard a perfiles de usuario | Atendido | Dos modos. Consulta del fondo abre por defecto e incluye Ficha de productora; Equipo de datos conserva carga guiada y análisis. |
| R2 | Alta | Agregar una frase breve que describa cada sección | Ajustado tras la prueba | Al abrir, el tablero indica cómo cargar el Excel; la guía explica el propósito de cada vista. |
| C1 | Alta | Filtro de Regiones | Atendido | Datos: selector de hojas, una o ambas cooperativas reconocidas; alcance antes de confirmar. |
| C2 | Alta | Formateo numérico | Atendido | Explicación de separadores, vista previa numérica y rechazo del texto ambiguo en automático. |
| C3 | Alta | Habilitación de filtros | Atendido | Sugerencias por tipo y nombre, bloqueo de doble asignación y encabezados personales reconocidos. |
| C4 | Alta | Previsualización de carga | Atendido | Vista previa abierta por defecto en la carga avanzada. |
| C5 | Alta | Dificultad para localizar y revisar las correspondencias | Atendido | Búsqueda por campo, sugerencias primero y columnas compatibles agrupadas. |
| C6 | Alta | Relevancia de las columnas mostradas en la vista previa | Atendido | Vista previa reducida a seis datos principales; hoja/fila en auditoría. |
| N1 | Alta | Unificar los nombres de las pantallas entre el menú y la página | Atendido | Menú y encabezado coinciden. |
| N2 | Media | Diferenciar o unificar ‘Cruces de datos’ y ‘Qué se relaciona con qué’” | Atendido | Se elimina la pantalla Cruces. Comparaciones descriptivas en Participación y una sola matriz en Datos. |
| N3 | Alta | Evitar el scroll dentro de las tablas | Atendido | Cifras desplegables, sin altura máxima, separadas por cooperativa en barras de categorías. |
| N4 | Alta | Eliminar el control duplicado de cooperativa | Atendido | Un filtro Cooperativa; el selector lateral cambia el modo de trabajo. |
| B1 | Alta | Retirar el campo manual de cooperativa en la carga del Excel | Atendido | Se retira cooperativa manual; solo columna real o hoja original reconocida. |
| B2 | Sin marca | Aclarar la función del campo ‘Fila con los títulos' | Atendido | Etiqueta «Fila de encabezados en Excel» con explicación y sugerencia. |
| B3 | Media | Aclarar qué cuenta el mensaje ‘27 preguntas reconocidas | Atendido | Distingue columnas tituladas, usadas y reconocidas al abrir. |
| B4 | Alta | Precisar el alcance de los filtros ‘Distrito / provincia’ y ‘Base / sector | Atendido | Distrito y provincia, luego Grupo local (base o sector del formulario). Las listas dependen de filtros previos. |
| B5 | Alta | Uniformar la presentación de los nombres en el filtro ‘Base / sector | Atendido | Normalización de espacios, guiones y variantes de capitalización, con original disponible. |
| B6 | Alta | Facilitar la búsqueda en los filtros ‘Base / sector’ y ‘Productora de la selección | Atendido | Búsqueda de grupos largos; la ficha ofrece una lista con búsqueda por código, sin un segundo selector. |
| B7 | Alta | Aclarar el comportamiento de ‘Productora de la selección’ y preservar el contexto de navegación | Atendido | Cambiar productora dentro de Ficha no navega ni cambia filtros; otros modos conservan la selección. |
| B8 | Media | Mostrar un estado claro en el selector de productora al cambiar los filtros | Atendido | Al excluir la productora, se limpia la ficha, se deshabilita imprimir y aparece aviso. |
| B9 | Baja | Hacer evidente que las leyendas de los gráficos son interactivas | Atendido | Leyenda informa cómo ocultar series; la última permanece visible. Tablas no dependen de hover. |
| B10 | Baja | Alinear verticalmente los controles de ‘Territorio y alertas | Atendido | Controles eliminados junto al semáforo territorial. |
| B11 | Media | Aclarar el efecto de los umbrales de alerta en ‘Territorio y alertas’ | Atendido | Se retiran umbrales sin validación de campo; no se presentan alertas de rendimiento. |
| B12 | Media | Aclarar que ‘Forma de medir’ cambia la valoración de la relación | Atendido | Método explícito junto a la tabla; modifica el coeficiente, no la dispersión. |
| CO1 | Alta | Unificar la unidad del área de café entre el Excel y el dashboard | Atendido; pendiente de fuente | Tarjeta, tabla, eje y fichas muestran ha. Es la convención de la entrega, pendiente de confirmación escrita para Nor-BG; Excel intacto. |
| CO2 | Media | Simplificar los títulos y descripciones de las tarjetas de indicadores | Atendido | KPIs cortos, unidades verificadas en el título y métricas que se ocultan cuando falta toda la columna. |
| CO3 | Alta | Aclarar a qué periodo corresponden los datos mostrados | Atendido | El periodo se muestra en Carga y calidad cuando lo indica el archivo. |
| CO4 | Media | Usar la etiqueta original ‘Celular de teclas’ en lugar de ‘Celular básico | Atendido | Celular de teclas en barras y ficha. |
| CO5 | Media | Aclarar la base de cada porcentaje en el gráfico de capacitación | Atendido | Cada barra de capacitación muestra sí / respuestas válidas de esa cooperativa. |
| CO6 | Media | Mostrar el número de productoras junto al porcentaje en ‘Destino de las solicitudes | Atendido | Tabla por cooperativa con recuentos y porcentaje; también tooltip. |
| CO7 | Baja | Nombrar el indicador de ‘Acopio por cooperativa’ como mediana | Atendido | Mediana por productora con explicación breve. |
| CO8 | Baja | Aclarar las descripciones de las tarjetas de zonas en ‘Territorio y alertas' | Atendido | Se retiran tarjetas de zonas y sus alertas sin criterio validado. |
| CO9 | Alta | Revisar el uso del monto solicitado como tamaño de burbuja en ‘Área, acopio y tamaño del crédito | Atendido | Sin burbujas. Mediana y monto más repetido con recuento por cooperativa en Solicitudes. |
| CO10 | Alta | Desagregar por cooperativa y completar el ranking de ‘Principales brechas’ | Atendido | Brechas desglosadas y ordenadas por cooperativa; «ningún servicio» excluye la respuesta contradictoria. |
| MP1 | Media | Alinear los ejes del Mapa de perfiles con los criterios de éxito que identificó Eunice | Atendido; pendiente de fuente | PCA exploratorio en Datos. Se documentan variables faltantes para éxito, sin usar proxies como repago. |
| MP2 | Media | Explicar los ejes 4, 5 y 6 o limitar el gráfico a los ejes descritos | Atendido | Curva y tabla limitadas a los tres ejes descritos. |
| MP3 | Media | Revisar la agrupación por distrito y los criterios de alerta en ‘Territorio y alertas’ | Atendido | Retirado el semáforo territorial; territorio queda como filtro descriptivo. |
| RV1 | Baja | Aclarar que la ausencia de relación entre ejes del mapa es esperada | Atendido | Se explica que los ejes son no correlacionados en el ajuste, sin afirmar independencia. |
| RV2 | Media | Etiquetar los valores del tooltip del mapa y mostrar los datos reales de la productora | Atendido | Tooltip etiqueta coordenadas e incluye las seis variables en unidades originales. |
| RV3 | Baja | Aclarar por qué productoras con la misma área tienen acopios tan distintos | Atendido | Entrega y área no identifican causas ni producción total; nota breve y límite en guía. |
| RV4 | Media | Diferenciar la fuerza de relación entre grupos y señalar la base de cada uno | Atendido | Coeficientes y número de pares por grupo. Aviso de grupos pequeños. |
| RV5 | Sin marca | Indicar el método de correlación y unificarlo entre las dos tablas de relaciones | Atendido | Matriz única, Spearman por defecto, Pearson opcional y método identificado. |
| CC1 | Media | Reemplazar el radar de ‘Perfil de inclusión y acceso’ por un gráfico comparable | Atendido | Radar retirado; barras agrupadas para comparar internet, canales, brechas y educación. |
| CC2 | Media | Jerarquizar visualmente la tabla de ‘Comparación por grupo’ | Atendido | Tabla agrupada por temas con base válida, cero distinguido de ausencia y nota de opción múltiple. |
| FA1 | Media | Mostrar las instrucciones de visita una sola vez y no dentro de cada ficha | Atendido | Guía de visita una sola vez, fuera de la impresión y del contenido de cada ficha. |
| IE1 | Baja | Reorganizar la distribución de la ficha impresa para aprovechar el espacio | Atendido | Estilos de impresión compactos; cada formato se verificó en una página A4 con la base de referencia. |
| AC1 | Media | Mejorar el contraste y las etiquetas del gráfico ‘Nivel educativo por grupo' | Atendido | Tabla de nivel educativo por cooperativa con porcentaje, recuento y denominador. |
| AC2 | Sin marca | Incorporar recomendaciones sobre el uso de paletas de colores accesibles | Atendido | Contraste medido con WCAG y simulación de Adobe Color documentados en el informe técnico; barras sólidas con etiquetas, formas en los puntos y tablas con las cifras. |
| LC1 | Baja | Unificar la abreviatura ‘qq’ y ‘quintales’ en las pantallas | Atendido | Quintales en las vistas y fichas; sin conversión a kg. |
| L2 | Media | Aclarar la etiqueta ‘Ahorro / Crédito en la cooperativa | Atendido | Ahorro de la beneficiaria y crédito vigente del titular, por separado, con Sí / No / Sin dato. |
| D1 | Media | Limpieza de valores extremos | Atendido | IQR uniforme para siete variables, edad incluida. Se listan filas y se conservan extremos válidos. |
| CP1 | Alta | Alcance y respaldo de la verificación del crédito | Atendido | Registro de sesión por etapa, responsable, fecha y evidencia al marcar un paso. CSV separado para incorporar al registro oficial de ROTA. |

## Comentarios de Producers Direct

| Comentario | Qué se entrega | Qué debe confirmar Producers Direct |
|---|---|---|
| Sam: devolución a productoras y cooperativas | Hoja «Mi finca» en lenguaje sencillo; ficha para visitas; guía de entrega individual y copias autorizadas por cooperativa. | Canal interno, autorización y custodia. |
| Sam: valor para entidades financieras | Se distingue encuesta de historial. La guía describe una futura constancia respaldada por desembolsos y pagos validados. | Registro oficial, consentimiento y permisos de acceso. |
| Daniela 1: limpieza previa | Un único contrato JavaScript en navegador y script. Cuatro notebooks, diccionario y antes/después por campo. | Validar casos de origen señalados y el criterio de actualización. |
| Daniela 2: cambios del formulario IDENTI | Importación guiada, mapeo reutilizable por encabezado y ejemplo en `COMO_ACTUALIZAR_MAPEO.md`. | Que la coordinación de datos confirme equivalencias de contenido, corte y unidades. |
| Daniela 3: continuidad e integración | README, guía, pruebas, despliegue por lista explícita de archivos y arquitectura sin datos persistidos. | Titularidad del repositorio, responsable de mantenimiento e integración con la base central. |
| Daniela 4: columnas para visita y datos personales | Ficha por código, origen y cooperativa; datos disponibles de solicitud y finca; detección preventiva de encabezados personales. | Distribuir copias minimizadas por canal autorizado. Los modos no son permisos. |
| Eunice: organizar la hoja imprimible | «Mi finca», solicitud y explicación de los datos, una página A4 con la base de prueba. | Validar lenguaje y legibilidad en campo. |
| Eunice: recomendaciones financieras | Se muestra ingreso principal declarado; no se calcula excedente ni recomendación sin egresos, obligaciones y periodos comparables. | Recoger y validar la información necesaria. |
| Seguimiento y capacitación | Participación declarada con denominador; en Datos se listan los datos faltantes para asistencia, cuadernos y repago. | Disponibilidad y definición de los registros de seguimiento. |

## Decisiones de alcance

- No se incluyen la matriz duplicada, la burbuja de montos, el radar, las alertas de rendimiento ni el checklist antiguo sin respaldo. Se conserva el registro de visitas por etapa y su CSV, separados de la ficha impresa.
- Se conserva el PCA como análisis técnico exploratorio, fuera de Consulta del fondo.
- No se publica el Excel limpio ni el original. No se prometen pagos, asistencia, cifras 2026, seguridad por rol ni verificación de créditos.
- La base limpia de 77 columnas se conserva intacta. La preparación reproducida cubre los 25 campos operativos y su trazabilidad.
