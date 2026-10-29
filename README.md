# Producers Direct — MVP de analítica, parche v2

Frontend HTML/JS/CSS compatible con el GitHub Pages actual. No requiere npm, servidor de datos ni subir los Excel al repositorio. La carga y el análisis ocurren en el navegador; al recargar se pierde la base activa.

## Probar desde Visual Studio Code

1. Abre la raíz del proyecto (donde están `index.html`, `css`, `js` y `data`).
2. Clic derecho en `index.html` → **Open with Live Server**. Ya tienes el botón **Go Live** en tu captura. Alternativa, si tienes Python: `python -m http.server 8000` y abre `http://localhost:8000`.
3. Pulsa **Cargar Excel**, revisa el mapeo y pulsa **Confirmar e importar**.
4. Para comenzar se recomienda `Base_Nor_BG_limpia(2).xlsx`, hoja **Productoras**. También se admite la optimizada o el original anónimo con la opción de combinar los dos formularios reconocidos.
5. En **Relaciones e insights**, cambia los ejes y alterna Pearson/Spearman. Pulsa una celda de la matriz para explorar ese par. Los filtros afectan a gráficos, comentarios y CSV.
6. En **Calidad de Datos**, revisa cobertura/cuarentena y descarga auditoría JSON. El CSV exporta solo la selección activa; el JSON describe la carga completa.

## Qué cambió

- Contrato mínimo de identidad y datos opcionales por visual; sin valores inventados.
- Selector de hoja, encabezado y mapeo para formularios nuevos. Adaptadores revisados para los dos originales adjuntos. No adivina equivalencia semántica de nuevas preguntas.
- PCA calculado, con pesos/varianza reales; planos PC1–PC2 y PC1–PC3. Modelo fijo durante los filtros para conservar ejes comparables.
- Dispersión configurable y matriz Pearson/Spearman con n de pares y desglose por cooperativa.
- Barras 100% por cooperativa, comentarios calculados y tablas de apoyo, inspiradas en la comparación por grupos del informe PwC.
- Comparación de acopio por mediana o total; se publican los tamaños de grupo.
- Celular básico separado de ninguno. No se supone que el área esté en hectáreas ni que el acopio sea rendimiento.
- Inicio vacío, ficha imprimible, exportación, vista móvil y dependencias locales en `vendor/`.

## Documentación

- `data/data_contract.md`: contrato v2, requisitos de cada visual y reglas de resolución.
- `docs/AUDITORIA_DATASET.md`: hallazgos, comparación de las tres bases, evidencia, preguntas de negocio propuestas y límites.
- `docs/COMO_EXTENDER.md`: cómo añadir una pregunta/visual o un adaptador sin mezclar conceptos.
- `tests/core.test.cjs`: pruebas sintéticas de funciones críticas; ejecutar con `node tests/core.test.cjs` si tienes Node.
- `tests/sources.test.cjs`: comprobación opcional con los tres Excel locales; `node tests/sources.test.cjs "C:\ruta\a\los\Excel"`.

El antiguo ETL Python se retira para evitar dos juegos de reglas. No hace falta ejecutarlo. Los archivos de la empresa se mantienen fuera del código público. `.github/workflows/deploy.yml` conserva el despliegue existente; el parche no publica ni hace push.

## Vistas por cooperativa y análisis cruzado

- **Vista del tablero** (barra lateral): Producers Direct ve la distribución global y cada cooperativa por separado. La vista de una cooperativa muestra solo sus registros y su propio conjunto de gráficos, definido en `js/coops.js`. Agregar una cooperativa o cambiar su formulario no exige tocar el código de los gráficos. La separación es de presentación; el control de acceso real depende del despliegue.
- **Análisis cruzado**: radar de inclusión, barras apiladas al 100 % (respuesta única), ranking de opciones para preguntas de opción múltiple, mapa de calor grupo × indicador, correlaciones de Spearman, burbujas (área, acopio y monto solicitado), ranking de brechas y perfil de edad, con una nota de lectura calculada para cada uno.
- **Territorio y alertas**: semáforo por zona con umbrales editables. Mora y PAR30/PAR60 quedan pendientes hasta que exista el dato.
- **Reglas**: áreas en hectáreas, opción múltiple sin sumar porcentajes y celdas con menos de 5 productoras suprimidas.
- **Pruebas**: `node tests/cross.test.cjs`.

