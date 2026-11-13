# Informe de limpieza por variable

Este informe documenta, para cada uno de los 25 campos finales del tablero, el problema encontrado en el Excel original, la decisión tomada y su impacto. Complementa [Preparación y calidad](PREPARACION_Y_CALIDAD.md), que explica las reglas por grupo, y [limpieza_por_variable.csv](limpieza_por_variable.csv), que trae los conteos de cada campo.

**Origen:** `Base de Datos Nor-BG anónima.xlsx`, hojas `Productoras Norandino` (113 filas) y `Productoras Bagua Grande` (25 filas). **Proceso:** `notebooks/01_limpieza.ipynb`, que llama a `scripts/preparar.cjs`. **Resultado:** `base_operativa_desde_raw.xlsx`, la base que abre el tablero.

## Resumen del resultado

| Medida | Valor |
|---|---|
| Productoras incluidas | 138 de 138 (Norandino 113, Bagua Grande 25) |
| Filas apartadas | 0 |
| Valores imputados | 0 |
| Campos finales | 25 |
| Comparaciones entre la base reconstruida y la limpia de referencia | 3,450, sin discrepancias |
| Incidencias | 1 (respuesta contradictoria en servicios financieros) |
| Campos con valores extremos marcados | 7 (edad, familiares, antigüedad, área, café, ingreso y monto) |

## Limpieza por variable

| Variable | Problema encontrado | Decisión tomada | Impacto |
|---|---|---|---|
| **Código de productora**<br>`codigo_productora` | El código identifica a la productora solo junto con la cooperativa; no hay garantía de que sea único entre archivos. | La llave es cooperativa + código, normalizados sin tildes ni mayúsculas. Si una llave se repite se apartan todas las filas con esa llave; no se elige un duplicado. | 138 de 138 filas incluidas, 0 apartadas. |
| **Cooperativa**<br>`cooperativa` | El libro original no trae una columna de cooperativa: está en el nombre de cada hoja. | Se toma del nombre de la hoja de origen reconocida y se normaliza. | 0 faltantes; permite filtrar y comparar por cooperativa. |
| **Distrito**<br>`distrito` | Distrito y provincia vienen juntos en una sola celda con separadores distintos («Tabaconas - San Ignacio», «Jamalca-Utcubamba», «Copallín- Bagua»). | Se separa por el guion y se normalizan espacios. | 6 distritos limpios, 0 faltantes. |
| **Provincia**<br>`provincia` | Misma celda combinada que el distrito. | Se obtiene de la segunda parte de la celda original; el filtro la muestra junto al distrito. | 4 provincias, 0 faltantes. |
| **Grupo local de la cooperativa**<br>`base_sector` | Texto libre con espacios dobles y variantes de mayúsculas; el original tiene 24 textos distintos. | Se normalizan espacios y mayúsculas y se conserva la escritura original en el archivo fuente. | 24 textos se reducen a 23 grupos; 0 faltantes. |
| **Edad**<br>`edad_al_cierre` | El original trae la fecha de nacimiento, no la edad. Hay un valor extremo (89 años). | Se calcula la edad al 31 de diciembre de 2025 (año del periodo). El valor extremo se marca y no se elimina. | 138 con edad; 1 bandera de extremo. |
| **Familiares convivientes**<br>`n_familiares_convivientes` | La regla de extremos (cercas de Tukey) marca 13 valores porque la mayoría responde entre 2 y 5. | Debe ser un entero no negativo. Los extremos se conservan: son respuestas posibles. | 138 válidos; 13 banderas, 0 eliminados. |
| **Antigüedad del socio titular**<br>`antiguedad_socio_titular_anios` | Pertenece al socio titular, que puede ser el cónyuge o el padre; no a la beneficiaria. Hay 15 valores extremos. | Se toma tal como está en la columna del original; no se deduce de la edad. | 138 válidos; 15 banderas, 0 eliminados. |
| **Área de café**<br>`area_cafe_reportada` | El original no documenta la unidad. 29 valores quedan fuera de las cercas de Tukey. | Se rotula como hectáreas y no se convierte; la confirmación de la unidad con ROTA queda pendiente y anotada en el contrato. | 138 válidos; 29 banderas, 0 eliminados. |
| **Café entregado (quintales)**<br>`quintales_acopiados` | «Acopiado durante 2025» se podría leer como cosecha total; el peso del quintal no está documentado. | Se interpreta como café entregado a la cooperativa; no se convierte ni se calcula productividad. | 138 válidos; 12 banderas, 0 eliminados. |
| **Ingreso principal (S/)**<br>`ingreso_principal_pen` | La pregunta está en otra posición en cada hoja (columna Y en Norandino, W en Bagua Grande) y no equivale a utilidad ni al ingreso del hogar. | Se asigna por encabezado y no por posición. Se conservan los valores y se marcan 10 extremos. | 138 válidos; 10 banderas, 0 eliminados. |
| **Monto solicitado (S/)**<br>`monto_solicitado_pen` | En Norandino casi no hay variación, así que la regla de extremos marca 29 solicitudes legítimas. | Se conservan todas; el extremo es una bandera de revisión, no una prueba de error. | 138 válidos; total solicitado S/ 190,175. |
| **Actividad a financiar**<br>`actividad_a_financiar` | Norandino solo trae «Fertilización». Bagua Grande es texto libre con 14 variantes («Crianza de cuy», «cuyes», «cerdos», «gallinas»…). | Un diccionario explícito agrupa las respuestas en tres categorías comparables. | 3 categorías, 0 vacías. Es el destino declarado, no un uso verificado. |
| **Celular de la beneficiaria**<br>`tipo_celular_beneficiaria` | Frases largas y espacios sobrantes («No tengo celular», « No tengo celular», «Smartphone »). | Diccionario explícito. Una respuesta fuera del catálogo pasa a «Otra respuesta» y registra una incidencia. | 0 incidencias, 0 «otra respuesta». |
| **Dificultad de lectoescritura**<br>`dificultad_lectoescritura` | Respuestas escritas como frases largas («Sí, solo para leer», «No no tengo ninguna dificultad…»). Una ausencia no es lo mismo que «ninguna». | Diccionario explícito; la ausencia queda vacía y no se asume «ninguna». | 138 con respuesta. |
| **Nivel educativo**<br>`nivel_educativo` | Distintas escrituras del mismo nivel entre hojas. | Categorías normalizadas. El indicador «secundaria o superior» se calcula sobre niveles reconocidos. | 138 con respuesta, 6 categorías. |
| **Acceso a internet**<br>`acceso_internet` | Tres frases largas distintas; «sin señal en el sector» solo existe en el formulario de Norandino. | Se normalizan en tres categorías. El indicador de internet en casa usa las respuestas del campo. | 138 con respuesta. |
| **Agua y desagüe**<br>`agua_desague` | Espacios finales y frases distintas («Sí, con ambos servicios», «Solo agua »). | Se normalizan en cuatro categorías. | 138 con respuesta. |
| **Servicios financieros (opción múltiple)**<br>`servicios_financieros` | Varias opciones en una sola celda sin separador consistente («Yape Cuentas bancarias»), «Ninguna» frente a «Ninguno» y una respuesta contradictoria («Ninguno» con «Yape», hoja de Bagua Grande, fila 11). | Se separan las opciones, se quitan repeticiones y se conservan varias respuestas. La contradicción se conserva como incidencia y se excluye del indicador «sin servicios financieros». | 138 con respuesta; 1 incidencia. |
| **Canales preferidos (opción múltiple)**<br>`canales_preferidos` | El original tiene 8 combinaciones por el orden y los espacios con que se marcaron. | Se separan, se ordenan y se unifican. | 5 combinaciones; una productora puede aparecer en varios canales. |
| **Usa Yape**<br>`usa_yape` | No existe como pregunta: se menciona dentro de los servicios financieros. | Se deriva de los servicios mencionados. No se deduce cuando la respuesta de servicios es contradictoria. | 1 valor vacío, que no se rellena. |
| **Ahorros o aportes de capital de la beneficiaria**<br>`ahorro_capitalizacion_cooperativa` | Respuestas Sí/No escritas con tilde y mayúsculas. | Se convierten a 1 (Sí) y 0 (No). Un valor incompatible quedaría vacío con incidencia. | 138 válidos, 0 incidencias. |
| **Crédito vigente en la cooperativa**<br>`credito_vigente_socio_cooperativa` | La pregunta se refiere al socio titular, no a la beneficiaria, y no es el crédito de ROTA. | Se convierte a Sí/No y la definición lo aclara en el diccionario. | 138 válidos. |
| **Crédito vigente en el sistema financiero**<br>`credito_vigente_beneficiaria_sistema` | Podría leerse como historial de pagos, pero solo indica si hay un crédito. | Se convierte a Sí/No sin inferir mora ni calificación. | 138 válidos. |
| **Capacitación de la cooperativa**<br>`capacitacion_cooperativa` | Es una respuesta declarada: no hay asistencia por sesión ni confirmación de quién asistió. | Se convierte a Sí/No y se informa como «declaró participar». | 138 válidos. |

## Reglas generales

- **Sin imputación.** Un cero o un «No» explícito se conserva. Una ausencia no se convierte en cero ni en «No».
- **Extremos.** Se marcan con las cercas de Tukey, `[Q1 − 1.5×IQR, Q3 + 1.5×IQR]`, solo en los notebooks y la auditoría local. Son una bandera de revisión: no se borran ni se corrigen. Si casi todas las respuestas coinciden, la regla puede marcar respuestas legítimas, como pasa con el monto de Norandino.
- **Trazabilidad.** Cada fila conserva su hoja y su fila del Excel original (`hoja_origen`, `fila_excel_origen`) y el periodo (`periodo`, 2025).
- **Privacidad.** El original es anónimo. El repositorio no incluye Excel ni auditorías detalladas; `.gitignore` los excluye.

## Cómo reproducirlo

Con el original y la base limpia indicados en `PD_RAW` y `PD_CLEAN` (ver el [README](../README.md)), ejecuta `python -X utf8 scripts/ejecutar_notebooks.py`. La etapa 01 vuelve a generar la base operativa y las auditorías en `data/processed/`.
