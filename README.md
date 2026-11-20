# Producers Direct · Tablero del Fondo Rotatorio

Dashboard para consultar la base de productoras del fondo ROTA, preparar visitas de campo y revisar la calidad de los archivos. Permite comparar solicitudes de crédito, área de café, entregas, participación y acceso a servicios. Los datos se procesan en el navegador y se mantienen durante la sesión.

- [Repositorio del proyecto](https://github.com/valirus/MVP-1-Producers-DIrect)
- [Dashboard publicado](https://valirus.github.io/MVP-1-Producers-DIrect/)
- [Contenido de la entrega](docs/ENTREGA_FINAL.md)

## Documentación

| Documento | Contenido |
|---|---|
| [Manual de uso](docs/manual.html) | Carga del Excel, filtros, gráficos, fichas y seguimiento. |
| [Diccionario](docs/diccionario.html) y [contrato de datos](data/data_contract.md) | Campos reconocidos, formatos y unidades. |
| [Preparación y calidad](docs/PREPARACION_Y_CALIDAD.md) | Limpieza, conciliación y decisiones por variable. |
| [Informe de visualizaciones](docs/INFORME_VISUALIZACIONES.md) | Lectura y propósito de cada visual. |
| [Informe técnico](docs/INFORME_TECNICO.md) | Medidas, denominadores, fuentes y límites. |
| [Mantenimiento](docs/COMO_EXTENDER.md) | Archivos que intervienen en cada función, pruebas y publicación. |
| [Notas de versión](docs/ENTREGA_UX.md) | Cambios de interfaz y resultados de verificación. |
| [Reporte de entrega](docs/REPORTE_EQUIPO.md) | Alcance operativo y responsabilidades de continuidad. |
| [Actualización en Windows](docs/APLICAR_UX_WINDOWS.md) | Aplicación del parche e integración mediante Git. |

## Ejecución local

Requiere Python 3 y Node.js. Las librerías del navegador están incluidas en `vendor/`; no se necesita `npm install` ni `pip install` para abrir el tablero o ejecutar las pruebas.

```sh
node scripts/verificar.cjs
python scripts/preparar_sitio.py
python -m http.server 8000 --bind 127.0.0.1 --directory _site
```

Abre `http://localhost:8000`, pulsa **Abrir Excel** y selecciona una base compatible. En Windows puede usarse `py` en lugar de `python`.

Para practicar sin datos operativos:

```sh
node scripts/crear_demo.cjs
```

Selecciona `data/processed/demo_ficticia.xlsx` desde el tablero. Este archivo contiene datos ficticios y no se copia al sitio público.

## Funciones

| Pantalla | Uso |
|---|---|
| Panorama del fondo | Totales de productoras, monto solicitado, superficie y café; comparación territorial y mapa proporcional con tabla desplegable. |
| Área y café entregado | Cajas de cuartiles, mediana y media de las entregas individuales; dispersión con códigos de todas las productoras que comparten coordenadas. |
| Participación y acceso | Celular, lectoescritura, vínculo con la cooperativa, capacitación y servicios. |
| Solicitudes de crédito | Distribución de montos y actividad para la que se solicitó financiamiento. |
| Seguimiento del crédito | Importación independiente de registros mensuales; ventas, gastos y uso declarado del crédito. |
| Equipo de campo | Ficha de visita, reporte para la productora y registro de visitas exportable. |
| Equipo de datos | Revisión del contrato, cobertura por campo y consulta de registros. |

Cooperativa, distrito/provincia y grupo local comparten selectores con búsqueda integrada. Escribir filtra las opciones; seleccionar aplica el filtro a gráficos, tablas y totales. Las dependencias entre filtros se mantienen al cambiar la selección.

El Excel y las visitas de sesión se pierden al recargar o cerrar la página. Las visitas deben exportarse antes de salir. Los modos de trabajo organizan las pantallas; no constituyen permisos de acceso.

## Estructura del proyecto

```text
index.html                 Dashboard
css/ js/ vendor/           Estilos, lógica y librerías del navegador
notebooks/                 Cuatro etapas reproducibles: limpieza, exploración, indicadores y gráficos
scripts/                   Preparación de datos, pruebas y generación del sitio
tests/                     Pruebas de importación, cálculos e interfaz
data/                      Contratos y carpetas locales de entrada y salida
docs/                      Manual, informes, mantenimiento y auditorías
.github/workflows/         Verificación y despliegue de GitHub Pages
```

`_site/` se genera para publicación. `.vscode/` contiene configuración local del editor; no forma parte del producto ni debe subirse al repositorio.

## Notebooks y datos de entrada

Los cuatro notebooks forman un flujo: la salida de cada uno es la entrada del siguiente. Se ejecutan en orden y cada uno guarda sus resultados en `data/processed/` y sus gráficos en `docs/figuras/`.

| Orden | Notebook | Qué hace | Entrada | Salida |
|---|---|---|---|---|
| 1 | `01_limpieza.ipynb` | Diagnóstico de calidad (vacíos, tipos, duplicados, texto, atípicos, contradicciones), decisiones de limpieza justificadas y conciliación con la base de referencia | `data/raw/Base de Datos Nor-BG anónima.xlsx`, `data/processed/Base_Nor_BG_limpia.xlsx` | `productoras_limpia.csv`, `diagnostico_calidad.csv`, `conciliacion_campos.csv` |
| 2 | `02_exploracion.ipynb` | Análisis univariado, bivariado y multivariado (correlaciones, pruebas entre cooperativas y PCA), cada uno con su conclusión | `productoras_limpia.csv` | `pca_productivo.csv`, `hallazgos_exploracion.csv` |
| 3 | `03_indicadores.ipynb` | Definición de 13 indicadores con fórmula, denominador y decisión que apoyan; control contra las cifras del tablero | `productoras_limpia.csv` | `indicadores_kpi.csv`, `kpi_distritos.csv`, `ficha_comparativa.csv` |
| 4 | `04_dashboard.ipynb` | Gráficos del tablero con su mensaje y recomendación, y verificación del sitio web | Salidas del notebook 3 | `docs/figuras/04_*.png` |

### Cómo reproducir los resultados

Los datos de entrada están incluidos en el repositorio: la exportación anónima original y la base limpia de referencia. No hace falta configurar nada más.

```sh
pip install -r requirements.txt
python scripts/ejecutar_notebooks.py          # corre los cuatro notebooks en orden
```

Para abrirlos en Jupyter o regenerar los `.ipynb` con sus salidas guardadas:

```sh
jupyter nbconvert --to notebook --execute --inplace notebooks/0*.ipynb
```

Los notebooks funcionan abiertos desde la raíz del proyecto o desde `notebooks/`. Las versiones exactas de las librerías están en `requirements.txt`. Las fechas de nacimiento se usan solo para calcular la edad y no se guardan en las salidas.

Las reglas de limpieza también están en [Preparación y calidad](docs/PREPARACION_Y_CALIDAD.md) y en el [informe de limpieza](docs/INFORME_LIMPIEZA.md). La [auditoría del 13 de noviembre](docs/AUDITORIA_ENTREGA_13NOV.md) registra una discrepancia de Yape pendiente de resolución en la referencia histórica.

## Verificación y publicación

La revisión del 16/11/2026 obtuvo 45 pruebas automáticas correctas y 26 comprobaciones de interfaz por ancho, a 1320 y 390 px. También se verificaron la sintaxis JavaScript y la generación del sitio. El 20/11/2026 se ejecutaron de principio a fin los cuatro notebooks, con los datos incluidos en el repositorio y sin errores; la conciliación de 15 campos contra la base de referencia coincide al 100 %. El [registro de verificación](docs/ENTREGA_UX.md) detalla el alcance.

Versiones de esta revisión: Node.js 24.22.1 y Python 3.12.14; SheetJS CE 0.20.3 y Chart.js 4.4.0 incluidas en `vendor/`. No hay un proceso de compilación TypeScript ni una configuración de lint.

GitHub Actions ejecuta las pruebas y publica exclusivamente los archivos que enumera `scripts/preparar_sitio.py`. El despliegue se activa al subir a `main`. En el repositorio, GitHub Pages debe usar **GitHub Actions** como origen. Antes de compartir una nueva versión, comprobar que el workflow terminó correctamente y abrir el enlace publicado.

El sitio web publicado en GitHub Pages no incluye datos operativos, Excel, auditorías de sesión ni configuración local (el repositorio sí guarda la base anónima y la de referencia para reproducir los notebooks). La aceptación operativa requiere revisar el tablero con la base autorizada y confirmar las unidades, responsables de mantenimiento y canal de soporte con Producers Direct.
