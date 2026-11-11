# Cierre de requisitos · Entrega final

Esta tabla describe la versión actual. La [matriz anterior](CIERRE_UX_Y_PD.md) conserva las observaciones y las decisiones de las iteraciones previas. Cuando una decisión cambió, rige este cierre.

## Requisitos de la entrega

| Requisito | Evidencia | Estado |
|---|---|---|
| Otra persona puede usar, auditar y mantener el producto | [README](../README.md), [manual](manual.html), [contrato](../data/data_contract.md) y [mantenimiento](COMO_EXTENDER.md). El demo permite practicar sin datos operativos. | Verificado en la entrega local; falta prueba con usuarios de ROTA. |
| Diccionario y significado para negocio | [Diccionario operativo](diccionario.html) de 25 campos y [catálogo de visuales](INFORME_TECNICO.md). | Entregado. Confirmar en campo las unidades y el alcance de las preguntas si cambia el formulario. |
| Exactitud, completitud y trazabilidad | [Preparación y calidad](PREPARACION_Y_CALIDAD.md), [antes/después por variable](limpieza_por_variable.csv), conciliación de llaves y origen. | Verificada la concordancia técnica, no la exactitud de lo declarado. |
| Preparación repetible y original intacto | `data/raw` y `data/processed` separados, [cuatro notebooks numerados](../notebooks/), [versiones](../requirements.txt) y [scripts](../scripts/). | Ejecutado de punta a punta con los archivos autorizados. |
| Manual: acceso, filtros, periodos, visuales, casos, errores y soporte | [Manual](manual.html) con capturas ficticias y rutas para consulta, ficha y equipo de datos. | Entregado. Falta que Producers Direct confirme su canal oficial de soporte. |
| Informe técnico: contexto, datos, limpieza, fórmulas, fuentes, actualización y límites | [Informe técnico](INFORME_TECNICO.md), [contrato](../data/data_contract.md), [reporte del equipo](REPORTE_EQUIPO.md). | Entregado. |

Los nombres DAMA-DMBOK, Kimball, ISO/IEC 25012 y CRISP-DM orientan los entregables solicitados: metadatos, lectura para negocio, calidad y preparación repetible. La entrega no certifica cumplimiento formal de un estándar.

## Decisiones de producto y observaciones

| Tema | Resolución final |
|---|---|
| Navegación y lenguaje | Tres modos: Consulta del fondo, Equipo de campo y Equipo de datos. Nombres claros, filtros en cascada y una sola búsqueda de grupo local. No se muestran textos narrativos o recomendaciones ligadas a la base de prueba. |
| Gráficos de crédito y acceso | Distribución de montos con escala estable para la carga; destino por cooperativa. Educación y servicios del hogar se comparan con barras. Porcentajes y montos conservan denominadores y cifras de apoyo. |
| Colores y lectura | Barras sólidas; cinco colores verificados, etiquetas y tablas de cifras. Los puntos usan color y forma. Las comparaciones densas recurren a tabla o total identificado. |
| Seguimiento del crédito | Se conserva el módulo del repositorio, con sus Excel propios y reglas explícitas. No se mezclan las dos cargas al cambiar la base. |
| Campo y devolución | Ficha de visita, Reporte para la cooperativa y exportación de visitas con archivo, hoja y periodo de referencia. Se aclara quién declara ahorros o aportes y a quién corresponde el crédito vigente. |
| Equipo de datos | Dos herramientas: Resumen del Excel, con contrato, estructura y estadísticas; Registros, con búsqueda, filtros de vacíos o no válidos y CSV. Asignar columnas permite ajustar hoja, encabezado y correspondencias. Punto decimal fijo. |
| PCA, correlaciones, alertas e IQR | PCA e IQR quedan en la documentación y los notebooks locales donde corresponde. Se retiran el PCA, las correlaciones, las alertas de zonas y el IQR de la interfaz web. No se interpreta ni se califica a productoras. |
| Preparación de nuevos archivos | Se reconstruye el Excel operativo del original conocido. Si cambia IDENTI, el equipo revisa el significado y adapta una copia con el contrato; no se adivinan columnas nuevas. |
| Privacidad y despliegue | Los Excel se abren localmente. Los roles no son permisos. Los agregados usan las respuestas disponibles, incluso en grupos pequeños. Las copias deben ser compatibles y adecuadas para sus destinatarios. La carpeta pública se arma con una lista de archivos; no incluye libros ni auditorías. |

Los pendientes operativos, técnicos y de campo están en el [reporte para el equipo](REPORTE_EQUIPO.md).
