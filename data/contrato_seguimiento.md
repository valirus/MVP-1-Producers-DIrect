# Contrato de seguimiento 1.1

La especificación vigente y accesible desde el tablero está en [Formato y reglas de seguimiento](../docs/seguimiento.html). Incluye el formato mensual recomendado, los formularios anchos heredados, los encabezados, unidades y reglas de unión.

Cambios frente a 1.0:

- Añadir un Excel conserva los ya confirmados. Se pueden retirar archivos individuales.
- Se exige un año único, procedente de periodo o de la selección explícita del usuario. El nombre de archivo no determina el año.
- La llave es código + cooperativa. Sin cooperativa se vincula solo cuando el código es único en la base.
- Las cantidades de emprendimiento no se suman como quintales.
- Se conservan las cantidades numéricas grandes. Se retiró el límite arbitrario de 200 quintales mensuales.
- Los solapamientos iguales o complementarios no duplican cifras. Un conflicto de respuestas excluye ese mes hasta resolver el origen. Una respuesta fija en conflicto permanece vacía.
- Vacío y cero son distintos. Una respuesta «No» no rellena importes vacíos con cero.
- El lector usa reglas de encabezados y tipos, sin IA, inferencias de negocio ni imputación.

Las referencias a casos concretos y a la exclusión por atípicos de versiones anteriores ya no describen el comportamiento actual.
