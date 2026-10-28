# Auditoría del MVP y de las bases

Fecha: 28 de octubre de 2026. Código revisado: `valirus/MVP-1-Producers-DIrect`, commit `05e328db3ce798fe25367153480c4b8feba5848e`. El ZIP adjunto coincide byte a byte con los blobs de ese commit. No se ha modificado el repositorio remoto.

## Dictamen

El contrato anterior **no representa el procesamiento real** y presupone una base ya estandarizada. Un formulario arbitrario no puede volverse comparable solo cambiando nombres de columnas. La solución es separar el formulario de entrada del esquema analítico, revisar el mapeo y admitir cobertura parcial, sin inventar observaciones.

Unidad de análisis: una productora por cooperativa en el corte 2025. Las 138 filas no representan 138 pagos, desembolsos verificados ni resultados posteriores al programa.

## Hallazgos y corrección

| Prioridad | Evidencia en la versión anterior | Consecuencia | Corrección del parche |
|---|---|---|---|
| Crítica | `data_contract.md` exige 9 campos; el JS valida 5; el ETL Python valida 8; el diccionario enumera 14 como no nulos. Actividad a financiar es obligatoria en JS pero no está en el contrato escrito. | Un archivo puede aprobar un control y fallar o quedar falseado en otro. | Un contrato v2, implementación central en data_core.js y requisitos por gráfico. El antiguo ETL se retira explícitamente. |
| Crítica | JS usa ingreso/área/acopio/monto = 0 y edad = 40, familia = 3, antigüedad = 5 si faltan; teléfono = SMARTPHONE y dificultad = NINGUNA. | Confunde desconocido con observado y altera perfiles, brechas y correlaciones. | null + cobertura; cero explícito conservado; sin imputación. |
| Crítica | pca_engine.js proyecta con pesos escritos a mano, no obtiene autovectores. El HTML siempre anuncia 39,14/23,13/16,02%. | El gráfico y los porcentajes no pertenecen al mismo modelo. | PCA calculado desde los registros completos; porcentajes y pesos dinámicos; controles de n y constantes. |
| Alta | Solo se lee la primera hoja y se espera encabezado en la primera fila. El original tiene dos formularios con encabezado en fila 3. | Rechaza el insumo real y deja fuera Bagua Grande. | Adaptadores para ambos formularios y selector de hoja/fila/mapeo para otros. |
| Alta | Cooperativa por defecto NORANDINO, códigos REG-X, borrado automático de duplicados (JS conserva primera fila; Python última). | Atribución ficticia y pérdida de conflictos sin resolver. | Identidad necesaria y cuarentena de todo conflicto de llave cooperativa+código. |
| Alta | BAGUA_GRANDE de la base limpia no coincide con BAGUA GRANDE esperado por el gráfico. | Desaparecen puntos de una cooperativa aunque estén incluidos en los KPI. | Homologación explícita y series dinámicas para todas las cooperativas. |
| Alta | El optimizado convierte 4 TECLAS en NINGUNO. | Sobrestima falta de celular y oculta canales posibles de acompañamiento. | BASICO diferenciado. Preferir base limpia; el optimizado por sí solo no permite recuperar los cuatro registros. |
| Alta | “ha”, “rendimiento qq/ha”, “carga familiar”, “antigüedad como socia” y “acopiados o proyectados”. | Agrega significado no sustentado por la fuente; mezcla conceptos distintos. | Área sin unidad confirmada; acopio observado; titular puede ser familiar; no inferir dependencia ni rentabilidad. |
| Alta | Títulos fijos anuncian mayor edad con escala y bajos rendimientos bajo 3 ha; demo de 3 filas con apariencia de dato real. | Conclusiones ajenas a lo mostrado o a los filtros. | Inicio vacío; títulos descriptivos y comentarios calculados para la selección. |
| Media | Valores numéricos de texto pasan por Number sin formato regional ni dominio. | Un separador puede generar NaN o cambiar magnitud. | Formato regional explícito, ambiguos a revisión; negativos y conteos inválidos quedan ausentes con incidencia. |
| Media | Totales por cooperativa sin n, porcentajes ni distribución. | La cooperativa con más encuestadas parece “mejor”. | Mediana por productora, totales con n y proporciones con denominador explícito. |

## Comparación de las tres bases

| Fuente | Estructura útil | Registros | Cooperativas | Celular: smartphone / básico / ninguno |
|---|---|---:|---|---|
| Original anónima | Dos hojas, 43 y 39 columnas; encabezado fila 3; hay filas vacías hasta la 1000 | 113 + 25 | Norandino / Bagua Grande | 119 / 4 / 15 |
| Limpia (2) | Productoras: 77 campos y otras seis hojas de documentación/origen | 138 | 113 / 25 | 119 / 4 / 15 |
| Optimizada App vFinal | Sheet1: 14 campos | 138 | 113 / 25 | 119 / 0 / 19 |

Los siete campos numéricos del optimizado coinciden por código con la base limpia: edad, convivientes, antigüedad, área, acopio, ingreso y monto solicitado (0 diferencias). El optimizado sí pierde detalle de actividad y celular. La agrupación de actividad es deliberada para un resumen; no debe sustituir al detalle original. La transformación TECLAS → NINGUNO es un error semántico.

En las seis variables del PCA no hay faltantes. No fue necesario imputar ni eliminar productoras. Totales de referencia: solicitudes **S/ 190 175**, acopio **5 444 quintales**, área reportada **310,4 unidades no confirmadas**. No deben compararse con los montos asignados del documento del fondo sin resolver moneda, tipo de cambio, fecha y definición.

## Qué aportan los gráficos

| Pregunta provisional | Gráfico | Resultado comprobable del corte adjunto | Uso y límite |
|---|---|---|---|
| ¿Se asocian escala y actividad económica? | Dispersión acopio–ingreso; Pearson/Spearman global y por cooperativa | Pearson global acopio–ingreso = 0,747; área–acopio = 0,698; área–ingreso = 0,540. | Observar perfiles y casos a revisar; no estimar retorno de crédito ni causalidad. |
| ¿Cómo conviven perfil demográfico y escala? | PCA, pesos y varianza acumulada; planos PC1–PC2 y PC1–PC3 | Primeros componentes: 39,1355%, 23,1314%, 16,0170%; tres suman 78,2839%. PC1–PC2 suma 62,2669%. | Compresión exploratoria, no score de riesgo ni elegibilidad. Ejes fijos al filtrar; se reajustan con otra carga. |
| ¿Cambia el destino solicitado entre cooperativas? | Barras 100% apiladas + recuentos | Norandino: 113/113 fertilización. Bagua Grande: 22/25 crianza (88%); 3/25 emprendimiento (12%). | Planear contenidos de acompañamiento. No demuestra uso efectivo ni colocación. |
| ¿Qué canales y materiales conviene preparar? | Celular propio y lectoescritura por cooperativa | En la base limpia, 119 smartphone, 4 básicos y 15 sin celular propio. No equivale a acceso del hogar o a conectividad. | Planificar combinación presencial/telefónica/digital; confirmar internet y preferencias antes de elegir WhatsApp. |
| ¿La diferencia de volumen se explica por tamaño de la muestra? | Alternar mediana y total de acopio | Norandino: n=113, mediana 32, total 4 522 qq. Bagua Grande: n=25, mediana 30, total 922 qq. | El total es útil operativamente, pero no indica que una cooperativa tenga mayor rendimiento. |

Se toma del informe **Informe Final - UTEC_PwC.pdf** la forma de comparar categorías con barras proporcionales y comentario al lado, no sus datos, conclusiones o explicaciones causales. Los comentarios aquí se generan desde los filtros activos y los denominadores correspondientes.

## Verificación realizada

- Ingesta real de los tres Excel: 138 registros en cada uno, 0 cuarentenas y 0 incidencias de conversión con los adaptadores adjuntos.
- PCA del motor JS contrastado independientemente con NumPy: autovalores, pesos, proporciones y signos coinciden con tolerancia 1e-9.
- Pearson y Spearman (empates con rango medio) contrastados con Pandas, tolerancia 1e-12.
- Pruebas sintéticas de ausentes/cero, formatos numéricos regionales y ambiguos, duplicados, identidades ausentes, nuevos nombres de cooperativa, dominios, categorías, n pequeño, variables constantes y ortogonalidad de los ejes.
- Revisión en Chromium: carga de los tres Excel, filtros por cooperativa/territorio, selección vacía, cambio Pearson/Spearman, selección de celda de matriz y ficha. Vista de escritorio (1440 px) y móvil (390 px), sin desbordamiento horizontal del documento y sin errores de JavaScript.
- Casos de interfaz adicionales: carga parcial con ceros/ausentes, formatos ambiguos, cooperativas nuevas, cuarentena, exportaciones JSON/CSV, mapeo manual de encabezados desconocidos y rechazo de una carga sin sustituir la base activa.
- Las reglas se pueden volver a ejecutar con `node tests/core.test.cjs` y, teniendo los Excel, `node tests/sources.test.cjs CARPETA`.

## Pendientes para acordar con Producers Direct

1. **Pregunta y decisión:** qué persona usará cada visual y qué acción puede tomar con él. Estas preguntas son propuestas del equipo, no requerimientos confirmados del cliente.
2. **Unidades y temporalidad:** unidad de área, peso del quintal, periodo y si el dato es observado/proyectado. El parche no certifica comparabilidad de unidades entre nuevas fuentes.
3. **Referencia de cada pregunta:** beneficiaria, socio titular, hogar o actividad a financiar. No unir ingresos secundarios de distinto alcance.
4. **Seguimiento:** para morosidad, PAR30, tasa de recuperación o incremento de ingreso hacen falta desembolsos, vencimientos, pagos, saldos y mediciones posteriores comparables. La encuesta inicial no contiene esos resultados.
5. **Nuevos formularios:** un responsable debe validar el mapeo y las categorías. Esta entrega no es un extractor universal ni un histórico multiarchivo; cada carga sustituye el análisis anterior en memoria.

## Archivos que sustentan la auditoría

Fuentes locales aportadas: Base de Datos Nor-BG anónima.xlsx; Base_Nor_BG_limpia(2).xlsx (Productoras y Diccionario); Base_Producers_Direct_Optimizada_App_vFinal.xlsx; Diccionario_Datos_MVP_Producers_Direct.xlsx. Contexto: SOBRE EL FONDO ROTATORIO - UTEC(1).pdf; Entregable 1_ Prototipo de Dashboard para el Cliente-Gamboa.pdf; actividad del laboratorio PCA. El documento del fondo expresa metas; no se interpretan como logros observados.
