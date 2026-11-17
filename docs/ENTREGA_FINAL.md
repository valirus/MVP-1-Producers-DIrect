# Entrega del dashboard y notebooks

## Accesos

| Recurso | Ubicación |
|---|---|
| Código y documentación | https://github.com/valirus/MVP-1-Producers-DIrect |
| Dashboard publicado | https://valirus.github.io/MVP-1-Producers-DIrect/ |
| Manual de operación | [manual.html](manual.html) |
| Referencia técnica | [INFORME_TECNICO.md](INFORME_TECNICO.md) |
| Reproducción de datos | [PREPARACION_Y_CALIDAD.md](PREPARACION_Y_CALIDAD.md) |
| Continuidad y mantenimiento | [COMO_EXTENDER.md](COMO_EXTENDER.md) |

## Contenido de la carpeta

La carpeta `MVP-1-Producers-DIrect` incluye el dashboard, sus librerías, los cuatro notebooks, scripts de preparación, pruebas, contratos de datos y documentación. El [README](../README.md) contiene los comandos de arranque y la descripción de cada carpeta.

Los notebooks conservan el orden: limpieza, exploración, indicadores y validación del dashboard. Las bases operativas se distribuyen por un canal autorizado; no se publican en GitHub ni en GitHub Pages. El proyecto incluye un generador de datos ficticios para practicar el flujo de carga sin utilizar información operativa.

## Verificación de la versión

La revisión de interfaz obtuvo 45 pruebas automáticas correctas y 26 comprobaciones de navegador por ancho a 1320 y 390 px. Se verificaron el notebook 04 y la generación del sitio público. Las fórmulas, casos de prueba y límites se documentan en las [notas de versión](ENTREGA_UX.md).

La conciliación de las bases de referencia se documenta en la [auditoría del 13 de noviembre](AUDITORIA_ENTREGA_13NOV.md). No se considera una validación nueva de esas fuentes: la ejecución de los notebooks 01–03 y de `sources.test.cjs` exige disponer de los dos Excel autorizados.

## Publicación y recepción

Después de integrar la versión en `main`, GitHub Actions ejecuta las pruebas y despliega el dashboard. El enlace de publicación debe abrir la versión integrada y permitir cargar un Excel compatible. La revisión funcional incluye filtros, totales, tablas, fichas y seguimiento con los datos que autorice Producers Direct.

La entrega para evaluación consta de la carpeta del proyecto y el enlace de publicación. La matriz de evaluación del curso se consulta por separado; este documento describe el contenido técnico y operativo de la entrega.
