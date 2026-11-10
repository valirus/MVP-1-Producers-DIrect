# Mantenimiento

El sitio es estático, con cálculo local: HTML/CSS para la interfaz; SheetJS para Excel; JavaScript para importación, filtros y métricas; Chart.js para visuales. No hay API, base compartida ni cuentas. El histórico vive en el sistema de Producers Direct, fuera del tablero.

| Cambio | Archivos que revisar |
|---|---|
| Texto, navegación y modos | `index.html`, `js/roles.js`, `js/app.js` |
| Contrato, columna nueva o formato | `js/data_core.js`, `js/app.js`, diccionario y pruebas |
| Comparación descriptiva | `js/charts.js`, `js/cross.js`, `js/coops.js` |
| Vista de la base cargada | `js/base_cargada.js` |
| Ficha y guía | `js/devolucion.js`, `js/ficha.js`, `index.html`, estilos de impresión, `docs/manual.html` |
| Publicación | `.github/workflows/deploy.yml` y su lista de archivos públicos |

Para un nuevo visual, documenta pregunta, fórmula, unidad, denominador, filtros y limitación. Compara categorías con etiquetas, cifras o forma además del color. Revisa al menos contraste de texto normal de 4.5:1 sobre su fondo; no uses arenas claras para texto. Prueba móvil, teclado y las tablas alternativas. No se declara certificación de accesibilidad.

Valida con `python scripts/ejecutar_notebooks.py` usando copias autorizadas. Para pruebas sin datos reales, ejecuta `node --test tests/core.test.cjs tests/carga.test.cjs tests/cross.test.cjs tests/feedback.test.cjs tests/filtros.test.cjs tests/indicadores.test.cjs tests/ficha.test.cjs tests/graficos.test.cjs`. Para comprobar la conciliación de esta entrega, ejecuta `node tests/sources.test.cjs "ruta-al-original.xlsx" "ruta-a-la-base-limpia.xlsx"`. Sus expectativas son específicas de los Excel 2025 de la entrega.

La lista pública se define en `scripts/preparar_sitio.py`; se usa tanto para la prueba local como en Pages. Revisa antes de publicar las versiones y avisos de las librerías vendorizadas. Mantén el sitio sin Excel, CSV de personas ni auditorías. La publicación copia solo archivos explícitos, pero **eso no vuelve privado un archivo que se haya subido al repositorio**.

La adopción institucional requiere que Producers Direct confirme la titularidad y el mantenimiento del repositorio, un canal de soporte y los permisos de distribución de la base. Cualquier integración con IDENTI, base central, acceso por cooperativa o historial de pagos se diseña con sus responsables y queda fuera de este MVP.
