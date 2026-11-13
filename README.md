# Producers Direct · Tablero del Fondo Rotatorio

Consulta operativa para la coordinación de ROTA, el equipo de campo y el equipo de datos. El Excel se procesa en el navegador, con reglas fijas. Los gráficos se recalculan con cada carga y filtro. La aplicación no usa IA, API, cuentas ni base central.

| Quiero… | Empiezo en… |
|---|---|
| Abrir el tablero, filtrar, leer gráficos o imprimir | [Manual de uso](docs/manual.html) |
| Saber qué columnas y unidades acepta | [Diccionario](docs/diccionario.html) y [contrato de datos](data/data_contract.md) |
| Reproducir limpieza y revisar las decisiones por campo | [Preparación y calidad](docs/PREPARACION_Y_CALIDAD.md) |
| Entender cada visual, sus medidas y límites | [Informe técnico](docs/INFORME_TECNICO.md) |
| Mantener, integrar y comprobar la entrega | [Guía de mantenimiento](docs/COMO_EXTENDER.md) y [reporte para el equipo](docs/REPORTE_EQUIPO.md) |
| Revisar el alcance acordado y las observaciones anteriores | [Cierre de requisitos](docs/CIERRE_FINAL.md) |
| Ver qué problema tenía cada variable y qué se decidió | [Informe de limpieza](docs/INFORME_LIMPIEZA.md) |
| Entender para qué sirve cada visual y cómo leerlo | [Informe de visualizaciones](docs/INFORME_VISUALIZACIONES.md) |

## Propósito

Producers Direct (PD) otorga financiamiento en insumos y acompañamiento a mujeres productoras de café de dos cooperativas, Norandino y Bagua Grande, mediante el fondo rotatorio ROTA. Este proyecto del curso Introducción a Business Analytics (UTEC) entrega a PD un tablero para consultar el fondo, preparar las visitas de campo y revisar la calidad de los datos. Las decisiones que apoya son a quién visitar, cómo comunicarse con las productoras y cómo dar seguimiento al crédito.

## Estructura de carpetas

```text
.
├── README.md                 Este archivo: propósito, estructura y cómo reproducir
├── index.html                Tablero web (se abre con un Excel; no guarda datos)
├── requirements.txt          Versiones de Python, Node.js y librerías
├── css/  js/  vendor/        Estilos, código del tablero y librerías incluidas (SheetJS, Chart.js)
├── notebooks/                Pipeline: un notebook por etapa (ver el orden abajo)
│   ├── 01_limpieza.ipynb
│   ├── 02_exploracion.ipynb
│   ├── 03_indicadores.ipynb
│   └── 04_dashboard.ipynb
├── scripts/                  preparar.cjs (limpieza), ejecutar_notebooks.py, preparar_sitio.py, crear_demo.cjs
├── data/
│   ├── raw/                  Entrada: Excel original anónimo (no se sube a git)
│   ├── processed/            Entrada de referencia y salidas del pipeline (no se suben a git)
│   ├── data_contract.md      Contrato de datos
│   └── contrato_seguimiento.md
├── tests/                    Pruebas automáticas (node --test)
└── docs/                     Diccionario, manual, informes de limpieza y visualizaciones y capturas
```

## Orden de ejecución de los notebooks

Ejecuta los notebooks en este orden. `python -X utf8 scripts/ejecutar_notebooks.py` los corre uno tras otro sin intervención manual.

| Orden | Notebook | Qué hace | Lee | Escribe |
|---|---|---|---|---|
| 1 | `01_limpieza.ipynb` | Reconstruye los 25 campos desde el original y los concilia con la base limpia | `data/raw/`, `data/processed/` | `data/processed/` |
| 2 | `02_exploracion.ipynb` | Cobertura, faltantes y valores atípicos | Salidas de 01 | Consola |
| 3 | `03_indicadores.ipynb` | Productoras, quintales, mediana, monto solicitado, participación y PCA | Salidas de 01 | Consola |
| 4 | `04_dashboard.ipynb` | Ejecuta las pruebas y genera el sitio público | `index.html`, `js/`, `css/` | `_site/` |

## Arranque local

Desde la carpeta que contiene este README:

```sh
python scripts/preparar_sitio.py
python -m http.server 8000 --bind 127.0.0.1 --directory _site
```

En Windows, puedes usar `py` en lugar de `python`. Abre [localhost:8000](http://localhost:8000). Pulsa **Abrir Excel** y elige un Excel compatible con el contrato. Para practicar, ejecuta antes `node scripts/crear_demo.cjs` y abre `data/processed/demo_ficticia.xlsx` desde el selector. No se copia ese archivo a `_site`.

**Consulta del fondo** incluye indicadores, resumen territorial, café entregado, participación, solicitudes y seguimiento del crédito. **Equipo de campo** contiene la ficha de visita y el reporte para la cooperativa. **Equipo de datos** contiene **Resumen del Excel** (revisión del contrato y estadísticas por columna) y **Registros** (búsqueda, filas vacías o no válidas y CSV). Volver a cargar la página borra el Excel y las visitas de la sesión; exporta las visitas antes de cerrar.

## Reproducir el proyecto

### Requisitos

| Herramienta | Versión probada | Uso |
|---|---|---|
| Python | 3.12.14 y 3.13.1 | Ejecutor de notebooks y generador de `_site`. Solo biblioteca estándar: no hace falta `pip install`. |
| Node.js | 24.22.1 y 24.11.1 | Limpieza (`scripts/preparar.cjs`) y pruebas (`node --test`). Sin `npm install`. |
| SheetJS CE / Chart.js | 0.20.3 / 4.4.0 | Incluidas en `vendor/` ([vendor/README.md](vendor/README.md)). |
| Git | cualquiera reciente | Clonar el repositorio. |

Jupyter es opcional. Las versiones están anotadas también en [requirements.txt](requirements.txt).

### Entradas (fuera del repositorio)

Se necesitan dos Excel de referencia. **No se suben al repositorio**: `.gitignore` excluye `*.xlsx`, `data/raw/*` y `data/processed/*`.

| Variable | Archivo | Ubicación por defecto |
|---|---|---|
| `PD_RAW` | Original anónimo, hojas `Productoras Norandino` y `Productoras Bagua Grande` (nombre que empieza con `Base de Datos Nor-BG`) | `data/raw/` |
| `PD_CLEAN` | Base limpia de referencia (nombre que empieza con `Base_Nor_BG_limpia`) | `data/processed/` |

Hay dos maneras de indicarlos:

- **Opción A, copiar los archivos:** deja un solo archivo de cada tipo en su carpeta por defecto.
- **Opción B, dejarlos donde están (recomendada):** define las variables con rutas absolutas.

```powershell
# PowerShell
$env:PD_RAW   = "C:\ruta\Base de Datos Nor-BG anónima.xlsx"
$env:PD_CLEAN = "C:\ruta\Base_Nor_BG_limpia.xlsx"
```

```sh
# bash / Git Bash
export PD_RAW="/ruta/Base de Datos Nor-BG anónima.xlsx"
export PD_CLEAN="/ruta/Base_Nor_BG_limpia.xlsx"
```

### Comandos

Desde la raíz de un clon limpio:

```sh
git clone https://github.com/valirus/MVP-1-Producers-DIrect.git
cd MVP-1-Producers-DIrect
# definir PD_RAW y PD_CLEAN (opción B) o copiar los Excel (opción A)
python -X utf8 scripts/ejecutar_notebooks.py
node tests/sources.test.cjs "$PD_RAW" "$PD_CLEAN"      # PowerShell: $env:PD_RAW $env:PD_CLEAN
python -m http.server 8000 --bind 127.0.0.1 --directory _site
```

- En Windows, puedes usar `py` en lugar de `python`.
- `-X utf8` evita que las tildes salgan mal en la consola de Windows («at�picos»). También sirve `PYTHONIOENCODING=utf-8`. No cambia los resultados.
- El ejecutor corre `01_limpieza`, `02_exploracion`, `03_indicadores` y `04_dashboard`, en ese orden, y no guarda salidas dentro de los `.ipynb`. También puedes abrirlos en Jupyter y ejecutar todas sus celdas en el mismo orden. 02 y 03 leen las salidas de 01.
- `tests/sources.test.cjs` concilia el original con la base limpia. Necesita las dos rutas como argumentos, por eso 04 no lo incluye.

### Salidas

| Etapa | Escribe | Contenido |
|---|---|---|
| 01 limpieza | `data/processed/base_operativa_desde_raw.xlsx` y `.csv` | Base operativa generada desde el original: **es la que se abre en el tablero** |
| | `data/processed/base_operativa_limpia.csv` | La misma base leída desde la referencia limpia |
| | `data/processed/auditoria_raw.json`, `auditoria_limpia.json` | Incidencias, filas apartadas, imputaciones y periodo |
| | `data/processed/comparacion.json`, `antes_despues.csv` | Conciliación por campo y PCA |
| 02 exploración | — (consola) | Registros por cooperativa, faltantes, atípicos y diferencias por campo |
| 03 indicadores | — (consola) | Productoras, quintales, mediana, monto solicitado, participación y varianza del PCA |
| 04 dashboard | `_site/` (30 archivos) | Pruebas `node --test` y sitio público, sin Excel, CSV ni notebooks |

Todas las salidas quedan ignoradas por git. Para ver el tablero con la base generada, abre [localhost:8000](http://localhost:8000), pulsa **Abrir Excel** y elige `data/processed/base_operativa_desde_raw.xlsx`.

Valores esperados con los Excel de referencia (sirven para comprobar la ejecución):
- 138 productoras: Norandino 113 y Bagua Grande 25;
- 0 diferencias entre el original y la limpia en 25 campos, sin imputaciones;
- S/ 190,175 solicitados, 310.36 ha y 5,444 quintales;
- PCA con 138 filas completas, donde los primeros tres ejes explican el 78.28 %;
- 38 de 38 pruebas pasan y `sources.test.cjs` hace 3,450 comparaciones.

Para regenerar solo el Excel operativo: `node scripts/preparar.cjs --raw "ruta-al-original.xlsx" --out data/processed`. Agrega `--clean "ruta-a-la-base-limpia.xlsx"` para conciliarlo con la referencia. No reconstruye las 77 columnas del libro histórico.

### Última verificación

**10/11/2026:** clon limpio de `main` en `ddb65cf`, con Windows 11, Python 3.13.1 y Node.js 24.11.1.
- Se reprodujo todo: los notebooks 01 a 04 corren en orden (unos 4 s), dan los valores esperados de arriba y funcionan con las opciones A y B.
- El tablero local abre con `base_operativa_desde_raw.xlsx`, muestra las mismas cifras y no da errores en la consola.
- Ningún Excel ni ninguna salida aparece en `git status`.
- Única incidencia: las tildes salen mal en la consola si no se usa `-X utf8`.
- Pendiente: probar en macOS/Linux y con Jupyter.

## Integración y publicación

La entrega final ya está integrada en `main` (PR #22). [Integrar la entrega en el repositorio](docs/INTEGRACION.md) queda como registro de cómo se aplicó.

El workflow ejecuta las pruebas y usa el mismo generador de `_site` que la prueba local. GitHub Pages publica solo ese directorio. Conserva **Settings → Pages → GitHub Actions**. El tablero publicado está en [GitHub Pages del proyecto](https://valirus.github.io/MVP-1-Producers-DIrect/).

No añadas Excel, CSV de personas ni auditorías al repositorio. Revisa el diff contra la rama de destino; si el repositorio avanzó, integra en una rama de trabajo. El [reporte del equipo](docs/REPORTE_EQUIPO.md) indica qué revisar antes de compartir el tablero.
