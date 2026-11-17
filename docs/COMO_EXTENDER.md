# Mantenimiento

El sitio es estático, con cálculo local: HTML/CSS para la interfaz; SheetJS para Excel; JavaScript para importación, filtros y métricas; Chart.js para visuales. No hay API, base compartida ni cuentas. El histórico vive en el sistema de Producers Direct, fuera del tablero.

| Cambio | Archivos que revisar |
|---|---|
| Texto, navegación y modos | `index.html`, `js/roles.js`, `js/app.js` |
| Contrato, columna nueva o formato | `js/data_core.js`, `js/app.js`, diccionario y pruebas |
| Leyendas de gráficos | `PDLegend` en `js/filtros.js`, estilos `.chart-legend` en `css/style.css`; las leyendas nativas se sustituyen por botones con `aria-pressed`. |
| Selectores con búsqueda y dependencias | `js/filtros.js`, `js/app.js`, `index.html`, `css/style.css` |
| Mapa, cuartiles y coordenadas coincidentes | `js/resumen_core.js`, `js/resumen.js`, `js/charts.js`, `tests/ux.test.cjs` |
| Comparación descriptiva | `js/charts.js`, `js/cross.js`, `js/coops.js` |
| Vista de la base cargada | `js/base_cargada.js` |
| Ficha y guía | `js/devolucion.js`, `js/ficha.js`, `index.html`, estilos de impresión, `docs/manual.html` |
| Publicación | `.github/workflows/deploy.yml` y su lista de archivos públicos |

Para un nuevo visual, documenta pregunta, fórmula, unidad, denominador, filtros y limitación. Compara categorías con etiquetas, cifras o forma además del color. Revisa al menos contraste de texto normal de 4.5:1 sobre su fondo; no uses arenas claras para texto. Prueba móvil, teclado y las tablas alternativas. No se declara certificación de accesibilidad.

Valida con `python scripts/ejecutar_notebooks.py` usando copias autorizadas. Para pruebas sin datos reales, ejecuta `node scripts/verificar.cjs`. Para comprobar la conciliación de esta entrega, ejecuta `node tests/sources.test.cjs "ruta-al-original.xlsx" "ruta-a-la-base-limpia.xlsx"`. Sus expectativas son específicas de los Excel 2025 de la entrega.

La lista pública se define en `scripts/preparar_sitio.py`; se usa tanto para la prueba local como en Pages. Revisa antes de publicar las versiones y avisos de las librerías vendorizadas. Mantén el sitio sin Excel, CSV de personas ni auditorías. La publicación copia solo archivos explícitos, pero **eso no vuelve privado un archivo que se haya subido al repositorio**.

La adopción institucional requiere que Producers Direct confirme la titularidad y el mantenimiento del repositorio, un canal de soporte y los permisos de distribución de la base. Cualquier integración con IDENTI, base central, acceso por cooperativa o historial de pagos se diseña con sus responsables y queda fuera de este MVP.

La prueba de interfaz sin dependencias está en `tests/ux-browser.html`: sirve la raíz del repositorio con `python -m http.server 8000 --bind 127.0.0.1` y abre `/tests/ux-browser.html` (1320 px) o `/tests/ux-browser.html?mobile` (390 px). Genera datos ficticios en memoria y muestra comprobaciones y resultado; no forma parte del sitio público. No sustituye una revisión con dispositivos físicos o lectores de pantalla.
