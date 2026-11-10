# Producers Direct · Reporte de entrega al equipo

**Estado:** versión consolidada, probada localmente, pendiente de integración y aceptación por ROTA.

**Referencias:** ZIP inicial del equipo (MVP de analítica v2), `main` de valirus/MVP-1-Producers-DIrect en `9c94c96`, verificado contra GitHub y el ZIP adjunto.

## 1. Qué se entrega

Un tablero estático para consultar una base del Fondo Rotatorio, preparar una visita y revisar la carga. El Excel, los cálculos y el estado de la sesión se mantienen en el navegador. No hay IA, cuentas ni integración con la base central. El conjunto de cifras visibles cambia con la hoja y los filtros.

Si recibiste este informe por separado, los enlaces relativos corresponden a la copia en `sitio/docs`. Dentro del ZIP, abre primero el [README](../README.md). La [guía de uso](manual.html) explica los recorridos, el [informe técnico](INFORME_TECNICO.md) documenta los visuales, y [preparación y calidad](PREPARACION_Y_CALIDAD.md) explica cómo rehacer el Excel operativo. El [cierre de requisitos](CIERRE_FINAL.md) indica dónde quedó cada pedido del proyecto.

## 2. Cambios sustentados frente al MVP inicial

| Área | En la base del equipo | En la entrega final | Por qué |
|---|---|---|---|
| Navegación | Vistas, roles y módulos analíticos repartidos; varias entradas para cargar o revisar. | Consulta del fondo para coordinación y campo; Base cargada para revisión de datos. | Cada modo empieza en una tarea reconocible y comparte el mismo Excel activo. |
| Carga y revisión | Asistente con mapeo y confirmaciones; cobertura y cuarentena en pantalla aparte. | Carga directa con contrato, elección de hoja si hay varias compatibles, tabla normalizada y búsqueda por código o cooperativa. Cobertura por campo y filtro de filas sin dato; CSV de toda la carga. Se retira el panel de incidencias. | El flujo frecuente exige menos pasos y permite revisar la fila que alimenta los gráficos. Un cambio de formulario se resuelve en la preparación. |
| Análisis | PCA, Pearson/Spearman, radar, burbujas, alertas por zona y comentarios de lectura, según la versión. | Visuales descriptivos de panorama, café, inclusión y crédito. Se retira esa capa de la web; la exploración y el PCA quedan en notebooks cuando corresponde. | El dato disponible describe solicitudes y acopio. No permite calificar riesgo, estimar mora ni inferir causas. |
| Crédito | Comparaciones de actividad y montos con visuales cambiantes según la iteración. | Distribución de montos exactos o por intervalos, frecuencia y mediana por cooperativa, y destino de solicitudes por separado. | Permite leer concentración y separar «para qué solicitaron» de «cuánto solicitaron». |
| Inclusión | Mezcla de indicadores en radar, rankings y tablas. | Celular, lectoescritura, capacitación, canales, educación y servicios del hogar; brechas financieras en tabla. | Los gráficos comparan directamente; las cifras muestran el denominador y la opción múltiple no se fuerza a sumar 100 %. |
| Uso en campo | Ficha inicial; en versiones intermedias se agregó verificación. | Ficha de visita, Mi finca, distinción entre beneficiaria y titular, verificación por etapa y CSV con trazabilidad. | La productora puede recibir una hoja propia. El equipo puede llevar la visita al registro oficial sin convertir la encuesta en historial financiero. |
| Calidad y entrega | Contrato y pruebas iniciales; varias versiones de documentos. | Manual con capturas ficticias, diccionario, catálogo, conciliación por campo, cuatro notebooks y compilación local/publicación con la misma lista de archivos. | Un tercero puede operar, repetir y mantener el trabajo sin depender del equipo original. |

## 3. Auditoría de la última iteración

- La versión integra el `main` real. Se conservan Seguimiento del crédito, su contrato y sus pruebas. Cambiar de base reinicia el seguimiento para no mezclar ciclos.
- El tablero no intenta decidir si una respuesta es verdadera o contradictoria. Cobertura cuenta datos presentes y ausentes tras aplicar las reglas de lectura; las reglas técnicas de importación siguen operativas.

- El botón **Guardar visita** quedó dentro del formulario. El CSV queda accesible después de guardar. Dos cargas con el mismo código, etapa y fecha ya no sobrescriben la visita entre sí. El CSV registra archivo, hoja y periodo; guardar de nuevo en la misma carga actualiza esa visita.
- Los gráficos por grupo y las sumas aplican el umbral documentado. Cuando un total se calcula con datos parciales, la tarjeta indica cuántos registros aportaron. La dispersión ya no muestra el código de la productora en el tooltip. Estas medidas reducen exposición; no reemplazan permisos ni garantizan anonimato.
- La asignación de colores se mantiene al filtrar. Se conservaron cinco tonos sólidos: contraste blanco de 6.22:1 a 8.47:1, sin pares en conflicto en la prueba de los tres modos de simulación de Adobe Color. Se usan también formas, etiquetas y tablas. No es una auditoría completa de accesibilidad.
- El lector Excel se actualizó a SheetJS CE 0.20.3 y sigue local. Las hojas ocultas no entran en la selección; se acota el rango que puede procesar el navegador. Un cambio de archivo con error conserva la carga anterior.
- El flujo local produce un Excel operativo desde el original conocido, aun si no se proporciona referencia limpia. Con la referencia se genera además el antes/después. El original se conserva aparte y la carpeta pública no recibe ningún Excel.

## 4. Evidencia y límites de la validación

| Comprobación ejecutada | Resultado |
|---|---|
| Reglas en Node.js | 10 archivos de pruebas: importación, ausencias, periodo, filtros, indicadores, gráficos y fichas. |
| Cuatro notebooks | Ejecutados en orden con Python 3.12.14 y Node.js 24.22.1. Se generaron el Excel operativo, CSV, resumen por variable y auditorías locales. |
| Conciliación del original y la referencia limpia | 138 filas y 25 campos; 3,450 comparaciones sin discrepancias, 138 ubicaciones de origen coincidentes, 0 imputaciones. Una incidencia contradictoria de servicios se mantuvo. |
| Navegador Chromium | Carga real y reconstruida, filtros, montos exactos y por intervalos, periodos futuros o ausentes, rechazo de periodos mezclados, elección de hoja, búsqueda, cobertura con un cero y un faltante, navegación desde cobertura y CSV. Se cargó y reinició un seguimiento ficticio. Vista de escritorio y móvil de 390 px. No hubo solicitudes externas durante la prueba. |
| Campo e impresión | Dos visitas de cargas distintas se exportaron juntas y separadas por origen; «Ficha para la visita» y «Mi finca» generaron una página A4 cada una con datos ficticios. |
| Carpeta pública | Generada desde lista explícita; contiene sitio y guías. Sin Excel, registros, auditorías ni notebooks. |

No se verificaron el despliegue en GitHub Pages, Safari/iOS real, archivos de producción no compartidos, ni la aceptación por las personas que usarán el tablero. No hay historial de desembolsos, pagos, cartera ni egresos suficiente para recomendaciones financieras. La confirmación del área en ha y del peso del quintal de Nor-BG sigue pendiente.

## 5. Qué sigue para los tres

| Responsable propuesto | Prueba o decisión | Criterio para darla por cerrada |
|---|---|---|
| Integrante 1 · datos y negocio | Ejecutar notebooks en su equipo; pedir a ROTA confirmación escrita de ha y quintal; revisar un Excel autorizado de otro ciclo. | Cuadran filas, totales y periodo con el Excel. Unidad y significado quedan acordados por escrito. Si cambió IDENTI, se valida un mapeo de ejemplo. |
| Integrante 2 · campo y UX | Recorrer Consulta con una persona de ROTA: filtrar, leer distribución, encontrar código, imprimir y descargar visita. Probar teléfono real. | La persona puede completar el flujo sin ayuda; fichas legibles y CSV aceptable para el canal oficial. Cualquier problema queda registrado con pasos. |
| Integrante 3 · integración y entrega | Revisar cambios recientes del repositorio, integrar en una rama, ejecutar validación y revisar los archivos públicos. Después de publicar, repetir la demo en el enlace institucional. | No se pierden cambios del equipo; workflow pasa; el sitio carga y no hay archivos operativos expuestos. ROTA confirma titularidad y canal de soporte. |

Orden recomendado: cerrar **unidades y prueba de campo**, integrar después de revisar el diff, y publicar cuando el equipo apruebe la versión. Para la demo, usar `node scripts/crear_demo.cjs` y no capturar datos operativos.
