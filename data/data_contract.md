# Contrato de Datos Mandatorio - Producers Direct MVP

Este contrato define las especificaciones técnicas obligatorias para la ingesta de bases de datos del Fondo Rotatorio.

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `codigo_productora` | String | Sí | Identificador único de la beneficiaria |
| `cooperativa` | String | Sí | Nombre de la cooperativa (`NORANDINO` / `BAGUA GRANDE`) |
| `edad_al_cierre_2025` | Integer | Sí | Edad en años al 31/12/2025 (Variable PCA) |
| `n_familiares_convivientes` | Integer | Sí | Número de convivientes en el hogar (Variable PCA) |
| `antiguedad_socio_titular_anios` | Integer | Sí | Años de antigüedad como socia (Variable PCA) |
| `area_cafe_reportada` | Float | Sí | Área de cultivo de café en Hectáreas (Variable PCA) |
| `quintales_acopiados_2025` | Integer | Sí | Quintales acopiados o proyectados 2025 (Variable PCA) |
| `ingreso_principal_pen_2025` | Float | Sí | Ingreso principal en Soles PEN (Variable PCA) |
| `monto_solicitado_pen` | Float | Sí | Monto del crédito solicitado en PEN |