# Contrato de datos — Seguimiento del crédito v1.0

Archivos de seguimiento de ingresos y egresos de las productoras del Fondo Rotatorio. Se cargan desde la página **Seguimiento del crédito** con el botón **Cargar seguimiento**, aparte de la base de productoras (`data_contract.md`), que no cambia.

## Entrada

| Archivo de referencia | Cooperativa | Meses | Productoras |
|---|---|---|---|
| Norandino (Enero - junio) Ingresos_Egresos .xlsx | Norandino | enero–junio | 79 de 113 |
| Norandino (Julio Agosto) Ingresos_egresos .xlsx | Norandino | julio–agosto | 38 de 113 (todas están entre las 79 anteriores) |
| Bagua Grande (Enero-Junio) ingresos_egresos.xlsx | Bagua Grande | enero–junio | 25 de 25 |
| Bagua Grande (Julio-Agosto) Ingresos_egresos.xlsx | Bagua Grande | julio–agosto | 25 de 25 |

- Hoja `Registros` (o la única hoja del archivo). Encabezados en la primera fila con la columna `Código`; formato ancho, una fila por productora.
- **Llave:** `Código`, igual a `codigo_productora` de la base. Se recortan espacios y se comparan sin tildes ni mayúsculas. Primero debe estar cargada la base: la cooperativa, el distrito y la base o sector salen de ella.
- **Tipo de formulario:** se reconoce por sus preguntas, no por el nombre del archivo. «¿Vendió café en …?» es venta de café (quintales). «¿Vendió productos de su emprendimiento en …?» es emprendimiento (kg o unidades).
- Los cuatro archivos se pueden elegir a la vez. Antes de confirmar se muestra, por archivo: tipo, cooperativa, meses, filas, códigos que cruzan con la base y los que no, preguntas que se usan, preguntas que no se usan y observaciones. Si se cancela, se mantiene el seguimiento anterior.

## Cómo se leen los encabezados

Cada pregunta se reconoce por el **texto de su encabezado**, nunca por la posición de la columna:

- Los formularios repiten encabezados en cada mes (por ejemplo «¿Cuánto gastó en total en la familia?» seis veces). Cada uno se asigna al mes de su bloque: el de la última pregunta «¿Vendió … en <mes>?» (ventas) o «¿Generó gastos en <mes>?» (gastos).
- Si el encabezado nombra el mes («Cantidad total vendida kg/unidades agosto»), manda ese mes, aunque la columna esté fuera de su bloque. En el archivo de Bagua Grande julio–agosto esa columna está al final.
- Enero no lleva el mes en los encabezados de cantidades y gastos: lo toma de su pregunta de bloque.
- El orden dentro del bloque puede cambiar: en Bagua Grande mayo, «vendida» aparece antes que «perdida».
- Si dos columnas corresponden al mismo dato y mes, el archivo no se carga y se avisa.

## Campos

| Campo | Pregunta de origen | Tipo | Uso en la página |
|---|---|---|---|
| fertUsed | ¿Ya utilizó el fertilizante que le fue entregado en forma de crédito? | Sí/No | % que ya aplicó el insumo (Norandino) |
| fertWhyNot | En caso de no ¿por qué no aplicó? | texto | Motivos, en conteos, tal como se respondieron |
| coopDelivered | ¿Ha llevado su café a la cooperativa? | Sí/No | Venta de café |
| coopWhyNot | ¿Cuál es el motivo de no haber llevado el café a la cooperativa? | texto | Motivos: precio, transporte, otro comprador… |
| coopSoon | ¿Llevará pronto su café a la cooperativa? | Sí/No | Entre las que no llevaron |
| bookUse / bookUseful | ¿Usa su cuaderno de registros…? / ¿Cree que es útil? | Sí/No / texto | Cuaderno de registros |
| activity | Seleccione la actividad que fue financiada con el crédito | texto | Emprendimiento financiado (Bagua Grande) |
| sold | ¿Vendió … en <mes>? | Sí/No | % que vendió cada mes; base de la cobertura de ventas |
| harvest, consumed, lost, qtySold | Cantidad cosechada, consumida o regalada, perdida, vendida | número ≥ 0 | Quintales vendidos (solo café) |
| sales | «Ganancia total de la venta (en soles)» | número ≥ 0 | **Ventas (S/)** |
| spent | ¿Generó gastos en <mes>? | Sí/No | Base de la cobertura de gastos |
| workExp | Gasto total en la finca / en el emprendimiento (S/) | número ≥ 0 | Gasto de la finca o del emprendimiento |
| famExp | ¿Cuánto gastó en total en la familia? (S/) | número ≥ 0 | Gasto de la familia (dato sensible) |

**Ventas (S/):** la columna se llama «ganancia», pero es lo que recibió por la venta: precio por cantidad, sin restar costos. Por eso se muestra como «Ventas (S/)». No se calcula «ingresos menos gastos»: las productoras que respondieron ventas y gastos no son siempre las mismas cada mes.

**No se usan en esta versión** (se reconocen y se listan en la revisión): detalle de aplicación del fertilizante (parcelas, meses, veces, dosis), fechas y veces de entrega a la cooperativa, tipos de gasto (finca, emprendimiento, familia) y clima, plagas y enfermedades. Un encabezado no reconocido se lista como «No reconocida» y no se usa.

## Ausentes, números y cobertura

- Celda vacía es sin dato. No se imputa, no se completa con ceros ni con promedios.
- Sí/No acepta «Sí», «No», 1 y 0. Otra respuesta queda sin dato y se marca como observación.
- Números: se aceptan enteros y decimales («69.9», «0.502»). «1,500» o «1.500» es ambiguo (¿miles o decimal?): queda sin dato con observación. Negativos y texto no numérico, igual.
- **Cobertura:** cada cifra lleva «X de Y productoras respondieron». Y es el número de productoras de esa cooperativa en la selección de los filtros (113 y 25 sin filtros). X es quien respondió esa pregunta o ese mes. Nunca se presenta un total como si fuera de todas las productoras.
- Un mes cuenta como respondido si la productora contestó «¿Vendió…?» o «¿Generó gastos…?». Si contestó «No», sus ventas o gastos de ese mes suman cero, porque es una respuesta explícita.
- Con menos de 5 respuestas no se muestran porcentajes ni montos, para no sacar conclusiones débiles ni identificar a alguien. Una cooperativa con menos de 5 productoras con seguimiento en la selección no muestra resultados.
- Los gastos de la familia solo se muestran sumados por mes y cooperativa.

## Calidad: reglas y decisiones

| Regla | Qué se hace | Caso en los archivos actuales |
|---|---|---|
| Quintales vendidos en un mes por encima de 200 qq (café) | Se **apartan los quintales** de ese mes. Las **ventas en soles se mantienen**. Se muestra como observación. | PD-FR-044-FF-NOR, junio: 6,510 qq vendidos y S/ 6,510. Cosechó 7 qq, y 7 qq a unos S/ 930 por quintal dan S/ 6,510: los soles son coherentes y se anotaron soles en la casilla de quintales. |
| Ventas en soles mayores que 0 con cantidad vendida igual a 0 | Se **mantienen los soles** y se marca como observación para revisar la cantidad con la productora. | PD-FR-075-FF-NOR, julio: S/ 3,150 con 0 qq vendidos y 3 qq cosechados. El monto es coherente; lo mal llenado es la casilla de vendidos. |
| Respondió «No» a «¿Vendió…?» y anotó ventas | Se mantienen los soles y se marca como observación. | Ninguno |
| Vendió más de lo que cosechó en el mes | **No se marca.** Es razonable vender café guardado de meses anteriores. | 8 casos en Norandino (por ejemplo, 0 qq cosechados y 15 vendidos en junio) |
| Código que no está en la base | No se incluye. Se lista en la revisión antes de confirmar. | Ninguno: los cuatro archivos cruzan al 100 % |
| Código repetido en el mismo archivo | No se incluye ninguna de las filas repetidas. Se marca como observación. | Ninguno |
| El mismo mes o la misma pregunta en dos archivos, con respuestas distintas | No se elige: queda sin dato y se marca como observación. | Ninguno |

Ningún dato se borra ni se corrige en silencio. Las observaciones aparecen al final de la página, con la productora, el archivo, la fila, el mes, lo que se encontró y lo que se hizo.

## Lo que estos datos no permiten afirmar

- **Bagua Grande:** sus cantidades mezclan kg y unidades de productos distintos (cuyes, gallinas, miel, café tostado). No se suman ni se comparan con los quintales de Norandino. Entre cooperativas solo se comparan soles.
- **Bagua Grande, julio:** 24 de 25 respondieron que no vendieron. Se muestra tal como está en el archivo.
- **Norandino, julio–agosto:** solo respondieron 38 de 113. Sus totales no son comparables con los de enero–junio (79 de 113).
- Las ventas por mes no son pagos del crédito ni mora. La recuperación del crédito necesita datos de cuotas, que no están en estos archivos.
