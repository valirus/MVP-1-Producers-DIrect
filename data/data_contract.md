# Contrato de datos v2.0 — MVP Producers Direct

Corte admitido: 2025. Grano: una observación de productora por cooperativa en ese corte; no una transacción, desembolso ni pago. La información fuente no permite demostrar impacto o recuperación del crédito.

## Entrada variable, salida estable

1. Se conserva el archivo fuente fuera del repositorio. El dashboard lee una copia en memoria.
2. Se elige hoja y fila de encabezados, se revisa el mapeo y se confirma.
3. Dos campos de identidad permiten incluir la fila. Los campos analíticos son opcionales.
4. Cada visual usa las observaciones válidas de sus campos y publica su denominador. Un dato faltante no bloquea gráficos independientes.
5. La salida CSV y el JSON de auditoría permiten revisar transformaciones, filas omitidas y cobertura.

Se reconocen estos perfiles adjuntos:

- Base limpia: hoja `Productoras` (77 campos). No se cargan sus hojas Diccionario, Revision ni Origen_* como observaciones adicionales.
- Base optimizada: `Sheet1` con 14 campos. No se reconstruye información perdida aguas arriba.
- Formulario original: `Productoras Norandino` y `Productoras Bagua Grande`, encabezados en fila 3. Se combinan solo esas hojas reconocidas; los nombres de hoja aportan la cooperativa y la edad se deriva de la fecha de nacimiento al 31/12/2025.
- Otra estructura: el usuario selecciona hoja, fila y columnas, e indica cooperativa si no hay columna. El mapeo es una decisión semántica: dos preguntas parecidas pueden medir cosas distintas. No existe limpieza universal por similitud del texto.

## Esquema canónico

| Campo | Tipo lógico | Obligación / significado |
|---|---|---|
| codigo_productora | texto no vacío | Necesario. Se recortan espacios; no se inventa un REG-X. |
| cooperativa | texto no vacío | Necesario. Mayúsculas y espacios; BAGUA_GRANDE equivale a BAGUA GRANDE. Se admiten cooperativas nuevas, sin asignar NORANDINO por defecto. |
| distrito, provincia, base_sector | texto nullable | Dimensiones separadas. No se afirma que una provincia sea un distrito. En los formularios combinados, el texto «distrito - provincia» se conserva completo en territorio; no se divide por un guion sin revisión. |
| edad_al_cierre_2025 | entero nullable, 0–120 | Edad de la beneficiaria al 31/12/2025. Si se proporciona fecha Excel o ISO, puede derivarse. Una fecha de texto ambigua no se adivina. |
| n_familiares_convivientes | entero nullable >= 0 | Familiares convivientes. No demuestra dependencia económica ni trabajo en finca. |
| antiguedad_socio_titular_anios | número nullable >= 0 | Antigüedad del titular, que puede ser cónyuge/padre. No implica experiencia personal de la beneficiaria. |
| area_cafe_reportada | número nullable >= 0 | Unidad sin confirmar. No se etiqueta ha ni se convierte. Si fuentes futuras usan unidades diferentes, normalizar con unidad explícita antes de unirlas. |
| quintales_acopiados_2025 | número nullable >= 0 | Acopio reportado, no producción total. Admite decimales. No se mezclan proyecciones con valores observados. Peso del quintal por confirmar. |
| ingreso_principal_pen_2025 | número nullable >= 0 | Ingreso principal anual declarado en PEN; no utilidad ni ingreso familiar total. |
| monto_solicitado_pen | número nullable >= 0 | Solicitud, no desembolso, saldo ni deuda vigente. |
| actividad_a_financiar | texto nullable | Se conserva original y se agrupa para gráficos. Fertilización tiene prioridad; crianza agrupa cuyes/gallinas/cerdos; bodega/apicultura/tostado se agrupan como emprendimiento. Otras descripciones se conservan. |
| tipo_celular_beneficiaria | categoría nullable | SMARTPHONE, BASICO, NINGUNO, OTRO / REVISAR. TECLAS es BASICO. No representa celular del hogar, acceso a internet ni uso de WhatsApp. |
| dificultad_lectoescritura | categoría nullable | NINGUNA, LECTURA, ESCRITURA, AMBAS, OTRO / REVISAR. Ausente no equivale a NINGUNA. |

`fecha_nacimiento_beneficiaria` es una entrada auxiliar; el CSV exporta edad, no la fecha. La trazabilidad incluye hoja/fila y categorías originales. Variables adicionales del archivo no se usan sin definir su significado.

## Calidad y resolución

- Llave: cooperativa normalizada + código normalizado, para el corte 2025. Si esa llave se duplica, **todas las filas de ese conflicto** quedan en cuarentena. No se elige la primera o la última sin evidencia.
- Identidad faltante: fila en cuarentena. Las filas vacías se omiten y se cuentan por separado.
- Números inválidos: null + incidencia con hoja/fila/campo. Negativos, edades >120 y conteos fraccionarios de familiares se rechazan como medición; la fila conserva otros campos válidos. Los extremos válidos permanecen.
- Cero explícito se conserva. Ausente es null; no hay imputación ni mediana/moda automática.
- Formato numérico: las celdas Excel numéricas se respetan. Para texto se elige coma/punto decimal; el modo automático rechaza `1,234` o `1.234` por ambiguos, en lugar de multiplicar un valor por mil accidentalmente.
- Categorías desconocidas de celular/lectoescritura: OTRO / REVISAR + incidencia; el original queda disponible. SIN DATO se muestra separado.
- La auditoría describe la base completa. CSV y visuales describen la selección filtrada. La carga fallida no sustituye la base activa.
- La versión es explícita en la auditoría. No se mezclan cortes distintos en la actual implementación. Antes de incorporar 2026 hay que añadir periodo, tipo de observación y unidades al contrato y actualizar los campos fechados.

## Requisitos por visual

| Visual | Campos / reglas |
|---|---|
| Cobertura y filtros | Identidad válida. |
| Totales de solicitud, área, acopio | Solo mediciones válidas; se informa n con dato / n seleccionado. No sumar áreas de unidades distintas. |
| Destino, celular, lectoescritura | Identidad + categoría; SIN DATO incluido en el denominador del grupo. |
| Correlación y dispersión | Dos campos numéricos válidos del mismo registro. Coeficiente solo con n >= 3 y varianza no nula. La correlación no prueba causalidad. |
| PCA | Seis variables completas, n >= 7 y todas con variación. Estandarización con ddof=1. Descomposición de matriz de correlación; eigenvectores ortonormales y autovalores calculados. |

El PCA se ajusta a la carga completa elegible; los filtros no lo reentrenan. Los porcentajes, pesos y ejes se calculan de nuevo al cargar otra base. La proyección PC1–PC2 conserva solo su varianza sumada; el 78,28% corresponde a **tres componentes del conjunto adjunto**, no a cualquier archivo futuro ni al plano 2D.

## Gobierno mínimo con la empresa

El equipo debe acordar quién confirma el mapeo, qué significan las unidades de área y quintal, el corte temporal y cuándo una solicitud pasa a desembolso. Para cada formulario nuevo, conservar versión, mapeo y aprobación del responsable fuera de la base analítica. Los adaptadores implementados y su mapeo efectivo quedan en el JSON. Esta versión trabaja una carga a la vez: otra carga reemplaza el análisis activo, no acumula un histórico.
