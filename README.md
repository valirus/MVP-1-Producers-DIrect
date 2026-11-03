# Producers Direct — MVP de analítica, parche v2

Frontend HTML/JS/CSS compatible con el GitHub Pages actual. No requiere npm, servidor de datos ni subir los Excel al repositorio. La carga y el análisis ocurren en el navegador; al recargar se pierde la base activa.

## Probar desde Visual Studio Code

1. Abre la raíz del proyecto (donde están `index.html`, `css`, `js` y `data`).
2. Clic derecho en `index.html` → **Open with Live Server**. Alternativa, si tienes Python: `python -m http.server 8000` y abre `http://localhost:8000`.
3. Pulsa **Cargar Excel**. Las hojas reconocidas se importan automáticamente; no hay una pantalla de revisión previa.
4. Se prioriza la hoja **Productoras**. Si no existe, se combinan las hojas reconocidas de Norandino y Bagua Grande; si el archivo contiene varias hojas posibles, se muestra un aviso y se conserva la base activa.
5. Usa los filtros encadenados (cooperativa → distrito → base → productora). Al elegir una cooperativa, los demás filtros solo ofrecen opciones válidas para ella.
6. **Exportar selección** descarga un CSV de los registros que muestran los filtros actuales.
7. **Imprimir ficha** genera una hoja A4 lista para trabajo de campo.

## Qué cambió

- Contrato mínimo de identidad y datos opcionales por visual; sin valores inventados.
- Carga automática para los formularios reconocidos. Para agregar un formato nuevo, registra un adaptador explícito en `js/data_core.js`; no se adivina la equivalencia de preguntas.
- Filtros encadenados (`js/filters.js`) que reducen y desactivan opciones según la selección previa.
- Panorama: solo KPIs y perfiles típicos por cooperativa, en lenguaje convencional (sin términos técnicos).
- Producción y acopio: gráfico de acopio por productora, texto mínimo.
- Participación y acceso digital: celular propio, lectoescritura y vínculo con la cooperativa.
- Demanda de crédito: para qué piden y cuánto solicitan, limpio y directo.
- Ficha de productora imprimible (A4), consolidada y poco subjetiva.
- Territorio y alertas: semáforo por zona, texto claro de un vistazo, filtros superpuestos eliminados.
- Dos pestañas de análisis orientadas a preguntas de negocio: “Fortalezas y brechas” y “Relaciones entre datos”.
- Paleta propia (verde bosque, terracota, salvia, papel cálido), tipografía display serif para títulos y KPIs, foco, reduced-motion e impresión A4.
- Barras 100 % por cooperativa, comentarios calculados y tablas de apoyo.
- Comparación de acopio por mediana o total; se publican los tamaños de grupo.
- Celular básico separado de ninguno. No se supone que el área esté en hectáreas ni que el acopio sea rendimiento.
- Inicio vacío, ficha imprimible, exportación, vista móvil y dependencias locales en `vendor/`.

## Documentación

- `data/data_contract.md`: contrato v2, requisitos de cada visual y reglas de resolución.
- `docs/AUDITORIA_DATASET.md`: hallazgos, comparación de las tres bases, evidencia, preguntas de negocio propuestas y límites.
- `docs/OBJETIVOS_PD.md`: qué respondió Producers Direct y dónde se ve en el tablero.
- `docs/COMO_EXTENDER.md`: cómo añadir una pregunta/visual o un adaptador sin mezclar conceptos.
- `docs/GLOSARIO.md`: equivalencias entre términos técnicos y lenguaje del tablero.
- `tests/core.test.cjs`, `tests/cross.test.cjs`, `tests/filters.test.cjs`: pruebas sintéticas; ejecutar con `node`.

El antiguo ETL Python se retira para evitar dos juegos de reglas. No hace falta ejecutarlo. Los archivos de la empresa se mantienen fuera del código público. `.github/workflows/deploy.yml` conserva el despliegue existente; el parche no publica ni hace push.

## Vistas y análisis

- **Panorama del fondo**: KPIs (productoras, monto solicitado, área de café, acopio 2025) y perfil típico por cooperativa.
- **Producción y acopio**: cuánto acopió cada productora en 2025.
- **Participación y acceso digital**: celular propio, dificultad de lectoescritura y vínculo con la cooperativa.
- **Demanda de crédito**: actividad a financiar y monto solicitado.
- **Territorio y alertas**: semáforo por zona (sin internet, lectoescritura, rendimiento).
- **Ficha de productora**: hoja A4 para trabajo de campo.
- **Fortalezas y brechas**: dónde están las oportunidades y qué falta con más frecuencia.
- **Relaciones entre datos**: qué variables se mueven juntas (Spearman fijo).

## Lenguaje del tablero

Los textos visibles usan el lenguaje de la empresa y no los términos de clase. Las equivalencias están en `docs/GLOSARIO.md`.

## Orden del tablero

El menú sigue los objetivos del Fondo Rotatorio: panorama, quiénes son las productoras, solicitudes de crédito, seguimiento y alertas, y análisis. El detalle de qué respondió Producers Direct y dónde se refleja está en `docs/OBJETIVOS_PD.md`.

## Reglas

Áreas en hectáreas, opción múltiple sin sumar porcentajes y celdas con menos de 5 productoras suprimidas. Pruebas: `node tests/filters.test.cjs`, `node tests/cross.test.cjs`, `node tests/core.test.cjs`.
