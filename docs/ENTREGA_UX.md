# Notas de versión · Dashboard del Fondo Rotatorio

Revisión de interfaz del 16/11/2026, basada en `899212a04e299ea280fd5dfaff8c2b5f0438186a`. Se conservan la importación y la arquitectura estática. Las mejoras no requieren dependencias nuevas.

## Cambios

| Sección | Implementación |
|---|---|
| Mapa territorial | El contenedor ya no limita el mapa a una altura de 330 px ni exige 600 px de ancho en móvil. El algoritmo conserva áreas proporcionales al número real de productoras. Se usan todos los grupos del modelo que alimenta la tabla; no hay agrupación «Otros» exclusiva del mapa. Etiquetas de al menos 12 px; si no caben, queda el número o el detalle completo mediante cursor, foco y toque. |
| Tabla territorial | Cerrada al iniciar; `Ver tabla` / `Ocultar tabla` con `details` nativo. Comparte agrupación, selección y totales con el mapa. |
| Filtros | Componente compartido para cooperativa, distrito/provincia y grupo local. Un solo control permite escribir, abrir opciones, recorrerlas y seleccionar; escribir no aplica. Enter selecciona, Escape cancela, flechas recorren y Tab abandona el menú. Equis para recuperar Todos, mensaje sin coincidencias, foco visible, roles combobox/listbox y opción activa. Se conservan los select originales como estado interno y las dependencias existentes. |
| Café entregado | Caja Q1–Q3 sin bigotes, línea de mediana y rombo blanco de media. Total en quintales, n de productoras con entrega válida y faltantes por grupo. Misma escala para las cooperativas de la selección. Tabla con las estadísticas. |
| Dispersión | Código como texto, hectáreas, quintales, cooperativa/símbolo, grupo local y distrito/provincia. Hover o clic abre un panel desplazable; las coordenadas exactas reúnen todos los códigos coincidentes, incluso entre cooperativas. Alternativa por botones para teclado y toque; tabla con cada observación. Sin jitter ni desplazamientos de los datos. |
| Símbolos y leyendas | La forma se asigna por el orden de cooperativas de la carga completa, igual que el color; no cambia al filtrar. Una sola leyenda HTML en la dispersión, sin una segunda leyenda de Chart.js. |
| Redundancias | Una explicación compartida para las tres barras del panorama. Se retiró también una explicación repetida dos veces sobre entrega futura a la cooperativa en Seguimiento. |
| Accesibilidad y adaptación | Paneles y menús desplazables sin recorte del contenedor, tablas alternativas, nombres accesibles, foco visible y respeto por movimiento reducido. Sin rediseñar las otras pantallas. |

La dispersión muestra una entrada de leyenda por cooperativa; los gráficos de categorías muestran una entrada por categoría. Los símbolos identifican la cooperativa y conservan su significado al cambiar los filtros.

## Reglas estadísticas

- Entrada: registros aceptados de la base activa, una observación por código y cooperativa. La importación ya aparta todas las filas con identidad repetida dentro de una cooperativa. El resumen no concatena totales ni registros de Seguimiento.
- Cuartiles: ordenación de los quintales numéricos finitos e interpolación lineal tipo 7 en `(n−1)p`, para p=0.25, 0.5 y 0.75. La media es la suma dividida entre n y el total suma las mismas observaciones.
- Cero es válido; null, ausentes y no válidos no se vuelven cero. Sin dato: n=0 y estadísticas null. Dato único o todos iguales: caja reducida a una línea. No se dibujan bigotes ni se presenta el rango total como parte de la caja.
- Los códigos de texto conservan sus ceros iniciales. Si el archivo ya convirtió `0001` a un número `1`, el tablero no puede reconstruir esos ceros; no los inventa. El detalle prevé «Código no disponible» si falta, aunque el contrato de importación normalmente aparta esos registros.
- Los textos de lectura son fijos. Totales, n, estadísticas, coordenadas y listados se recalculan con los datos visibles. No se añaden conclusiones causales ni recomendaciones automáticas.

## Archivos

| Función | Archivos nuevos o modificados |
|---|---|
| Interfaz | `index.html`, `css/style.css`, `js/app.js`, `js/filtros.js` |
| Mapa y estadísticas | `js/resumen.js`, `js/resumen_core.js` |
| Gráficos y símbolos | `js/charts.js`, `js/coops.js` |
| Explicación duplicada | `js/seguimiento.js` |
| Verificación y CI | `scripts/verificar.cjs`, `tests/ux.test.cjs`, `tests/ux-browser.html`, `.github/workflows/deploy.yml` |
| Configuración local | `.gitignore` excluye `.vscode/`; el instalador conserva su contenido. |
| Documentación | `README.md`, `docs/REPORTE_EQUIPO.md`, `requirements.txt` (comentario de verificación), `docs/manual.html`, `docs/INFORME_TECNICO.md`, `docs/INFORME_VISUALIZACIONES.md`, `docs/COMO_EXTENDER.md`, `docs/CIERRE_FINAL.md`, este informe, `docs/ENTREGA_FINAL.md` y `docs/APLICAR_UX_WINDOWS.md` |

Los informes históricos de limpieza y conciliación conservan su fecha y alcance. No se reescriben como verificaciones nuevas. Se retiró de la guía la captura de las antiguas barras de medianas; las otras capturas mantienen su función de referencia y el texto explica los controles actuales.

La actualización de instalación conserva `.vscode/` como configuración local excluida de Git. El script de Windows se distribuye con marca de codificación UTF-8 (BOM) para su lectura por Windows PowerShell.

## Verificación realizada

Entorno: Linux, Node.js 24.22.1 y Python 3.12.14. Navegador Chromium mediante vista local.

| Comprobación | Resultado |
|---|---|
| Base antes de modificar | 39 pruebas generales correctas; generación de 36 archivos públicos correcta. |
| `node scripts/verificar.cjs` | 45 pruebas correctas: las 39 previas y 6 regresiones de estadísticas, faltantes/cero, identidades duplicadas, coordenadas coincidentes, proporcionalidad y símbolos. |
| Sintaxis JavaScript | `node --check` de scripts del proyecto, correcto. No existe un pipeline TypeScript ni una configuración de lint. |
| Generador público | `python scripts/preparar_sitio.py`, correcto; conserva la lista explícita de 36 archivos y deja fuera datos, pruebas y notebooks. |
| Notebook 04 | Ejecutado por separado: pruebas y generación pública correctas, sin cambiar el notebook ni guardar sus salidas. |
| Interfaz de escritorio | 26 comprobaciones en marco de 1320 px: cargar, buscar sin aplicar, elegir con Enter, limpiar, dependencias, tablas, leyenda única, hover/clic, coincidencias, ceros, faltantes, error de aplicación y ancho. |
| Interfaz móvil | Las mismas 26 comprobaciones en marco de 390 px; sin desbordamiento horizontal de la página. Inspección visual de las cajas y la dispersión. |
| Consulta manual en navegador | Carga real por selector de un Excel ficticio de 63 filas; clic sobre un punto mostró 30 códigos coincidentes de tres cooperativas, con ceros iniciales y listado desplazable. |
| Consola | La ejecución final del ensayo no presenta errores de aplicación ni promesas rechazadas. La extensión del navegador de pruebas genera mensajes propios, ajenos al dashboard. Se corrigió una notificación de ResizeObserver aplazando el dibujo al siguiente fotograma. |
| Instalación con configuración local | Parche aplicado en un clon con `.vscode/settings.json` no versionado; contenido conservado y excluido de Git. Otros archivos no versionados se detectan para revisión. Codificación UTF-8 con BOM comprobada. |
| Diff y paquete | `git diff --check`; aplicación del parche y verificaciones repetidas en una copia limpia de la base. ZIP revisado sin `.git`, `_site`, `.openai`, dependencias instaladas, cachés, credenciales ni `.env`. |

El ensayo de interfaz es reproducible sin instalaciones: sirve la raíz y abre `tests/ux-browser.html` y `tests/ux-browser.html?mobile`. Genera casos ficticios en memoria; no forma parte de GitHub Pages. Los eventos de hover y clic del ensayo son eventos DOM simulados; la consulta manual de 30 coincidencias también se comprobó mediante clic real en el canvas.

## Límites de esta verificación

La revisión de interfaz no incluyó la ejecución de los notebooks 01–03 ni la conciliación `tests/sources.test.cjs`, que requieren los dos Excel autorizados de referencia. Los resultados históricos y la discrepancia de Yape conservan el alcance de su auditoría original.

No se probaron dispositivos táctiles físicos, Safari, Firefox, NVDA/VoiceOver, ni se ejecutó PowerShell en Windows desde este entorno. El marco de 390 px verifica CSS adaptable; la alternativa de consulta funciona por clic y teclado, pero no equivale a una prueba física de toque. La aceptación operativa requiere una revisión de Producers Direct con la base autorizada.
