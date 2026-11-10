# Informe técnico | Tablero del Fondo Rotatorio

**Alcance:** entrega de visualización de la encuesta 2025. Base de trabajo: `Base_Nor_BG_limpia(4).xlsx`, hoja **Productoras**. Punto de partida del código: `9c94c96fb2c489c99b6290b68992111df64e3e14` (main posterior al ZIP adjunto). La matriz [CIERRE_UX_Y_PD](CIERRE_UX_Y_PD.md) ubica cada observación y sus límites.

## 1. Contexto y objetivo

Producers Direct necesita consultar la caracterización del fondo sin rehacer cruces en Excel. El tablero separa la consulta de Eunice, el trabajo de campo y las tareas del responsable de datos. La ficha y «Mi finca» devuelven información en lenguaje sencillo. El histórico de IDENTI y los procesos de desembolso, seguimiento y pagos permanecen en los sistemas de Producers Direct.

## 2. Datos, metadatos y exactitud

- Fuentes de conciliación: original anónimo, hojas `Productoras Norandino` y `Productoras Bagua Grande` (títulos en fila 3), y Excel limpio con 77 columnas. El [diccionario](diccionario.html) documenta los 25 campos operativos, unidades, población y origen. Las hojas auxiliares de la base limpia no se cuentan como productoras.
- Una observación por código y cooperativa; 113 Norandino, 25 Bagua Grande. Se confirmó identidad y fila de origen para las 138 filas. No hay altas, bajas ni duplicados en estos archivos de referencia.
- Totales: **S/ 190,175 solicitados; 5,444 quintales entregados; 310.36 de área de café**. El tablero muestra “ha” por convención de la entrega. La unidad en Nor-BG no está confirmada por escrito; no se convierte el dato ni se adopta un peso del quintal en kg.
- No se conoce una fecha única de levantamiento. Se usa la etiqueta encuesta 2025 para los campos del corte y la edad al 31/12/2025. El seguimiento se abre aparte y no altera los indicadores de encuesta.
- La coincidencia con el original verifica fidelidad de la transformación, no veracidad de cada respuesta. Las fechas y parentescos en revisión de la base limpia requieren verificación de fuente; no se intercambiaron fechas ni se recalculó antigüedad.

## 3. Preparación reproducible

| Fase | Acción | Evidencia |
|---|---|---|
| Comprensión del objetivo | Se distinguen consulta, devolución y revisión técnica; se fijan preguntas de negocio. | Guía y catálogo de visuales. |
| Comprensión de los datos | Identificar dos formularios, comparar esquema, periodo, unidad y significado. | Contrato y diccionario. |
| Preparación | Mapear encabezados; leer celdas; ajustar texto, categorías, tipos, edad y origen; apartar llaves inválidas. | `01_limpieza.ipynb`, `scripts/preparar.cjs`, mapeo y auditorías. |
| Análisis | Comparar cobertura, extremos, totales, asociaciones y PCA. | `02_exploracion.ipynb` y `03_indicadores.ipynb`. |
| Evaluación | Conciliar desde el original y comprobar reglas, navegación y salidas. | Tabla antes/después y pruebas; `04_dashboard.ipynb`. |
| Entrega | Servir HTML/CSS/JS y guías; mantener originales y resultados locales. | README y workflow Pages. |

Esta organización sigue el enfoque de documentación por fases solicitado en clase (CRISP-DM), metadatos y calidad (DAMA-DMBOK), lectura de negocio (Kimball), y comprueba aspectos de completitud, exactitud de transformación y trazabilidad (ISO/IEC 25012). Es una aplicación de esos criterios, no una certificación.

### Resultado de la conciliación

[Tabla antes/después por campo](limpieza_por_variable.csv): columnas disponibles en origen, celdas vacías, números vs texto, nulos normalizados, diferencias y extremos. El script guarda valores exactos y referencias afectadas solo en `data/processed/`. Se compararon **3,450 celdas normalizadas** (25 campos × 138 filas) sin diferencias. Los cuatro campos sin columna directa son cooperativa (hoja), provincia (texto territorial), edad (nacimiento al corte) y Yape (opción de servicio).

| Verificación | Resultado |
|---|---|
| Integridad de las llaves | 138 coincidencias; 0 filas apartadas en estas dos cargas. |
| Completitud de los 25 campos operativos | 0 nulos tras normalizar en los dos archivos de referencia. No implica completitud en las otras columnas. |
| Antigüedad | 138 coincidencias. Columna J en ambos originales, sin deducirla de edad o parentesco. |
| Datos ausentes | 0 imputaciones en este proceso. `0` o «No» explícitos se conservan. |
| Contradicción | Una respuesta simultánea «Ninguno» y «Yape». Se conserva como incidencia; se excluye del indicador «ningún servicio». |
| Extremos (análisis local) | IQR por variable en los archivos de referencia. Una edad de 89 años queda señalada; no se elimina. Otras variables pueden tener muchas banderas por concentrarse en pocos valores. |
| Archivo histórico de 77 columnas | Permanece como base de consulta; la reproducción cubre el esquema operativo del tablero. La hoja Revisión del Excel conserva observaciones históricas que no son incidencias del importador. |

## 4. Catálogo de visuales y métricas

Fuente común de todos los visuales: hoja Productoras o la hoja compatible elegida del Excel autorizado. **Actualización manual por carga**, sin sincronización en tiempo real. Los visuales usan la selección en cascada (cooperativa → territorio → base), salvo la vista de la base y las fichas cuando se indica.

| Pantalla / visual | Pregunta que responde | Medida, filtros y límites |
|---|---|---|
| Panorama: productoras | ¿Cuántos registros incluye la selección? | Conteo de llaves válidas. No es conteo de créditos desembolsados. |
| Panorama: monto | ¿Cuánto se solicitó? | Suma de montos no nulos en soles (al menos 5); si es parcial, se indica el número con dato. No es saldo ni presupuesto. |
| Panorama: área y café | ¿Cuánto se reportó de superficie y entrega? | Sumas sobre valores válidos (al menos 5). Área rotulada en ha y café en quintales. El dato faltante no es cero. |
| Panorama: tabla por cooperativa | ¿Cómo se distribuyen los registros, montos y entregas? | Conteos y sumas por cooperativa en la selección. |
| Área y café: mediana | ¿Cuál es la entrega central por productora? | Mediana de quintales válidos por cooperativa (al menos 5). El total de quintales queda en Panorama. |
| Área y café: dispersión | ¿Cómo varía la entrega frente al área? | Puntos con ambos datos, al menos 5 pares por cooperativa. No mide productividad ni demuestra una causa. |
| Participación: celular / lectoescritura | ¿Qué respuestas aparecen en cada cooperativa? | Conteo / respuestas válidas del grupo, con al menos cinco respuestas. El eje indica respuestas válidas sobre el total del grupo. |
| Participación: capacitación | ¿Qué fracción declaró participación? | Sí / respuestas válidas de cada grupo, con al menos 5 respuestas. No hay asistencia por sesión ni comprobación de quién asistió. |
| Participación: canales, acceso financiero, educación y hogar | ¿En qué se diferencian las cooperativas? | Sí o categoría / respuestas válidas por indicador (mínimo 5). Canales son de selección múltiple. La comparación por tema distingue cero y ausencia. No hay índice compuesto ni recomendación automática. |
| Crédito: destino | ¿Para qué se solicitó? | Productoras por categoría / respuestas válidas de la cooperativa; tabla con cantidades exactas. No es participación en soles ni gasto verificado. |
| Crédito: monto | ¿Qué montos se solicitaron más? | Barras con número de solicitudes por monto exacto (hasta diez montos distintos) o por intervalos iguales. Los intervalos se definen con la carga y se mantienen al filtrar. Las cifras incluyen mediana y monto más repetido. Un monto concentrado no demuestra su motivo. |
| Ficha de visita / Mi finca | ¿Qué se registró sobre esta productora? | Fila elegida por código de la selección; comparativos de Mi finca sobre la cooperativa cargada si hay al menos 5 valores. La ficha no verifica uso ni acredita solvencia. El registro de visitas separado captura etapa, responsable, fecha y evidencia de pasos y exporta CSV de sesión con archivo, hoja y periodo; no se sincroniza. |
| Datos: base cargada | ¿Qué filas y campos se usan en el tablero? | Vista paginada de todos los registros aceptados y los campos operativos presentes. La búsqueda usa código o cooperativa. El CSV incluye la carga completa y su trazabilidad. |
| Datos: cobertura | ¿Qué campos llegaron completos? | Con dato = filas aceptadas cuyo valor normalizado no es nulo; sin dato = total menos con dato; cobertura = con dato / filas aceptadas. El cero y el No explícito cuentan como datos. El número de faltantes abre su selección en Base cargada. |
| Seguimiento del crédito | ¿Cómo avanzan las ventas, los gastos y el uso del crédito? | Excel mensual independiente, vinculado a la base activa. Los porcentajes usan respuestas válidas y los montos se agregan con un mínimo de cinco. No se calculan mora ni utilidades. Ver [contrato de seguimiento](../data/contrato_seguimiento.md). |

## 5. Límites, devolución y continuidad

- **Para productoras:** entregar «Mi finca» de forma individual, con explicación y canal de corrección. Sus valores son declarados. Sin gastos, compromisos y estacionalidad no se ofrecen recomendaciones financieras personalizadas.
- **Para cooperativas:** preparar copias autorizadas con los códigos que corresponden, o compartir agregados. El filtro visual no es segregación de permisos. No enviar un Excel con nombres, DNI o teléfono cuando el uso no lo requiere.
- **Para entidades financieras:** preparar con ROTA un historial verificable de desembolsos y pagos, con autorización y control de acceso. El PCA y la encuesta no son historial financiero ni calificación.
- **Para seguimiento:** campos mínimos sugeridos: identificación de cooperativa/productora y ciclo, referencia de desembolso, fecha programada, fecha y monto pagado, visita, responsable, tipo y referencia de evidencia. Para asistencia: registro por sesión e identificación de quién asistió. Definir con Eunice qué decisiones corresponden a cada pantalla y validar en campo.
- **Para soporte:** coordinación de ROTA y responsable de datos. Definir el canal y repositorio institucional antes de transferir la operación. Probar con Eunice y el equipo de campo antes de declarar adopción definitiva.
- **Accesibilidad:** arena de la referencia de [Coolors](https://coolors.co/palette/797d62-9b9b7a-baa587-d9ae94-f1dca7-ffcb69-e8ac65-d08c60-b58463-997b66) como acento. El oliva de esa paleta sobre arena dio 3.16:1, insuficiente para texto normal. Con el cálculo de [WCAG 2.2](https://www.w3.org/TR/WCAG22/#contrast-minimum), los pares del tablero medidos dieron 6.22:1 a 8.47:1 para etiquetas blancas sobre los cinco tonos de categorías. El contorno de los filtros supera 3:1 frente a su superficie clara.
- **Simulación del color:** se ejecutó el mismo simulador de [Adobe Color](https://color.adobe.com/create/color-accessibility) sobre los cinco tonos de categorías, con intensidad máxima y su umbral predeterminado ΔE₀₀ ≤ 5. No detectó pares en conflicto para deuteranopia, protanopia ni tritanopia. Las barras usan colores sólidos, cifras y una tabla. Si las categorías visibles exceden las combinaciones de color disponibles, se abre su tabla. Los puntos distinguen cooperativas por forma además de color. Esta prueba cubre la paleta y los pares indicados.
- **Navegación:** la [guía de interfaces de Vercel](https://vercel.com/design/guidelines) se aplicó al estado inicial, los errores de carga, el foco al abrir la ficha y la búsqueda por código. El arranque deja visible una acción para abrir el Excel y tras la carga se muestran las vistas y métricas disponibles.
