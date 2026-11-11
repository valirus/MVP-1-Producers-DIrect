# Preparar un Excel cuando cambia IDENTI

1. Conserva el original intacto y trabaja sobre una copia autorizada.
2. Comprueba el periodo, la unidad de medida y el significado de la pregunta. Luego renombra las columnas de la copia según el [diccionario](diccionario.html). Usa una columna de cooperativa y otra de código de productora.
3. Guarda importes y medidas como números de Excel. Si un texto como «1,234» es ambiguo, confirma el separador en la fuente antes de convertirlo.
4. Abre la copia y revisa las filas en **Equipo de datos → Registros** y los faltantes en **Resumen del Excel**. Compara los totales con el Excel de origen antes de distribuirla.

Por ejemplo, renombra «Quintales entregados durante el año» a `quintales_acopiados` solo si mide café efectivamente entregado. Usa la columna `periodo` para identificar el año. «Cosecha total» no es el mismo dato.

Si el nuevo encabezado se usará de forma permanente, registra su equivalencia en `js/data_core.js` después de validarla con ROTA y añade una prueba. La web no adivina el significado de columnas nuevas.
