# Preparación, calidad y reproducción

## Entradas y salidas

| Elemento | Ubicación o formato | Uso |
|---|---|---|
| Exportación anónima original | `data/raw/` o `PD_RAW`; hojas `Productoras Norandino` y `Productoras Bagua Grande` | Entrada de la reconstrucción. Se conserva intacta. |
| Base limpia de referencia | `data/processed/` o `PD_CLEAN`; hoja `Productoras` | Referencia para conciliar los 25 campos operativos. |
| Base operativa reconstruida | `data/processed/base_operativa_desde_raw.xlsx` y CSV equivalente | Excel compatible con el sitio, generado desde el original. |
| Auditoría local | `comparacion.json`, `antes_despues.csv`, `auditoria_raw.json`, `auditoria_limpia.json`, `base_operativa_limpia.csv` | Salidas de conciliación; el JSON detallado puede contener códigos. |
| Evidencia compartible | [limpieza_por_variable.csv](limpieza_por_variable.csv) | Resumen agregado de los 25 campos, sin registros individuales. |

El Excel web puede tener otro nombre y otras cooperativas. Requiere encabezados compatibles, una columna de código y una de cooperativa. El script local de reconstrucción conoce los dos formularios de la entrega; una nueva estructura requiere revisar el mapeo con ROTA. La web y el script comparten `js/data_core.js`.

## Reglas por grupo de variables

| Variables | Tratamiento y motivo |
|---|---|
| Código y cooperativa | Se exige identidad. Se normaliza la cooperativa y se compara el código sin distinguir tildes ni mayúsculas. Si una llave se repite, se apartan todas las filas con esa llave. Un código igual en cooperativas distintas puede ser válido. El formulario original reconocido aporta la cooperativa desde la hoja en el proceso local. |
| Distrito, provincia, grupo local | Se uniforman espacios y guiones; se agrupan variantes por tildes y mayúsculas. En los formularios de origen se separan distrito y provincia cuando aparecen juntos. Se conserva el Excel de origen. |
| Edad, convivientes y antigüedad | Edad declarada de 0 a 120 años o calculada desde nacimiento al 31 de diciembre si falta la edad y se conoce el año. Convivientes debe ser un entero no negativo. Antigüedad se toma de la respuesta del titular; no se deriva de la edad. |
| Área, café, ingreso y monto | Se respetan los valores numéricos no negativos; un separador ambiguo en texto genera incidencia y el valor queda ausente. No se convierte ha ni quintales ni se deduce productividad. Área y peso del quintal de Nor-BG están pendientes de confirmación documental. |
| Actividad, celular y lectoescritura | Se aplica un diccionario explícito. Las respuestas de celular y lectoescritura fuera del catálogo se conservan como «Otra respuesta», con incidencia. La actividad no agrupada conserva su categoría. |
| Educación, internet y agua/desagüe | Se usan categorías normalizadas. «Secundaria o superior» incluye secundaria cursada, completa o no, y educación técnica o superior. Se calcula sobre niveles reconocidos. Internet en casa y desagüe se calculan sobre respuestas del campo. |
| Servicios financieros y canales | Se separan opciones, se quitan repeticiones y se conservan varias respuestas. «Ninguno» junto a otro servicio se marca; se excluye del indicador «sin servicios financieros». |
| Uso de Yape; ahorros o aportes de capital; créditos vigentes; capacitación | Se admite Sí/No o 1/0; un valor incompatible queda ausente con incidencia. Yape se puede derivar de la lista de servicios si falta la columna. La capacitación es declarada, sin asistencia por sesión. |

**Imputación:** ninguna. Un cero o «No» explícito se conserva. Derivar edad o la mención de Yape usa datos observados; no equivale a imputar. Una ausencia no se convierte en «No». Las reglas de tipos pueden dejar una celda sin valor sin apartar la fila. Una llave inválida sí excluye la fila.

**Atípicos:** solo en los notebooks y la auditoría local. Para campos numéricos con al menos cinco valores se marcan observaciones fuera de `[Q1 − 1.5×IQR, Q3 + 1.5×IQR]`, con cuantiles por interpolación lineal. No se borran, ajustan ni usan como prueba de error. Si IQR es cero, la regla puede marcar muchas observaciones legítimas.

## Leer el antes/después

El CSV tiene una fila por campo. `raw_column_rows` cuenta filas conciliadas con una columna directa en el original; cuando es cero, puede existir una derivación (cooperativa, edad, provincia, Yape). `raw_cell_blanks`, `raw_numbers` y `raw_text_or_other` describen esas celdas de origen. `raw_normalized_missing` y `clean_missing` cuentan ausencias después de normalizar las dos entradas. `clean_number`, `clean_text` y `clean_list` muestran el tipo de los valores normalizados de la referencia. `raw_issues` y `clean_issues` cuentan incidencias por campo, no necesariamente filas únicas. `rawOutliers` y `cleanOutliers` son banderas locales. `changes` compara valores de ambas entradas **ya normalizadas**; no cuenta cuántas tildes o etiquetas cambiaron al limpiar.

En la referencia: 138 filas por lado, 138 llaves y ubicaciones de origen conciliadas, 25 campos y **3,450 comparaciones sin discrepancias**. No hubo filas apartadas ni imputaciones. Una respuesta contradictoria de servicios se conserva como incidencia. Que coincidan las dos bases bajo el mismo contrato no valida por sí solo lo declarado en campo. Los hashes SHA-256 quedan en `comparacion.json` local.

## Ejecución y mantenimiento

Usa Python 3.12.14 y Node.js 24.22.1 para reproducir la ejecución validada. SheetJS CE 0.20.3 está vendorizado. Corre los cuatro notebooks en el [orden del README](../README.md). No hay celdas que pidan datos durante la ejecución; prepara rutas y archivos una vez. Las etapas 02 y 03 leen salidas de 01. Si cambió IDENTI, sigue [la guía de mapeo](COMO_ACTUALIZAR_MAPEO.md). Los libros y auditorías detalladas permanecen fuera de la publicación y del ZIP.
