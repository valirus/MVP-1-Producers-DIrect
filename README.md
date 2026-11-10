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

## Arranque local

Desde la carpeta que contiene este README:

```sh
python scripts/preparar_sitio.py
python -m http.server 8000 --bind 127.0.0.1 --directory _site
```

En Windows, puedes usar `py` en lugar de `python`. Abre [localhost:8000](http://localhost:8000). Pulsa **Abrir Excel** y elige una copia autorizada que cumpla el contrato. Para practicar, ejecuta antes `node scripts/crear_demo.cjs` y abre `data/processed/demo_ficticia.xlsx` desde el selector. No se copia ese archivo a `_site`.

**Consulta del fondo** incluye indicadores, café entregado, participación, solicitudes, seguimiento del crédito y fichas. **Equipo de datos** tiene **Base cargada** (búsqueda, filtro de faltantes y CSV) y **Cobertura por campo** (registros con y sin dato, con acceso a las filas faltantes). Volver a cargar la página borra el Excel y las visitas de la sesión; exporta las visitas antes de cerrar.

## Reproducir el proyecto

1. Coloca el original autorizado en `data/raw/` (prefijo `Base de Datos Nor-BG`) y el Excel limpio de referencia en `data/processed/` (prefijo `Base_Nor_BG_limpia`). Si están en otro lugar, configura `PD_RAW` y `PD_CLEAN` con rutas absolutas.
2. Entorno probado: **Python 3.12.14 y Node.js 24.22.1**. Las versiones de las bibliotecas están en [requirements.txt](requirements.txt) y [vendor/README.md](vendor/README.md). No hay instalación de paquetes para ejecutar el flujo.
3. Ejecuta `python scripts/ejecutar_notebooks.py`. Ejecuta por orden `01_limpieza`, `02_exploracion`, `03_indicadores`, `04_dashboard`. También se pueden abrir individualmente en Jupyter y ejecutar todas sus celdas en ese orden, con las mismas entradas. Las etapas 02 y 03 leen las salidas de 01.
4. Para regenerar solo el Excel operativo desde la exportación conocida: `node scripts/preparar.cjs --raw "ruta-al-original.xlsx" --out data/processed`. Para conciliarlo con una referencia, agrega `--clean "ruta-a-la-base-limpia.xlsx"`. Los resultados se escriben aparte y no reconstruyen las 77 columnas del libro histórico.

## Integración y publicación

Consulta [Integrar la entrega en el repositorio](docs/INTEGRACION.md). La integración parte de `main` en `9c94c96`, sin requerir los ZIP anteriores.

El workflow ejecuta las pruebas y usa el mismo generador de `_site` que la prueba local. GitHub Pages publica solo ese directorio. Conserva **Settings → Pages → GitHub Actions**. La URL histórica es [GitHub Pages del proyecto](https://valirus.github.io/MVP-1-Producers-DIrect/); la versión final de este ZIP se verá allí solo cuando se integre y publique.

No añadas Excel, CSV de personas ni auditorías al repositorio. Revisa el diff contra la rama de destino; si el repositorio avanzó, integra en una rama de trabajo. El [reporte del equipo](docs/REPORTE_EQUIPO.md) indica qué revisar antes de compartir el tablero.
