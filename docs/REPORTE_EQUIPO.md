# Reporte de entrega · Fondo Rotatorio ROTA

## Alcance del producto

El dashboard permite a la coordinación de ROTA consultar la caracterización de las productoras, comparar solicitudes y entregas, preparar visitas y revisar la calidad de los archivos recibidos. El procesamiento es local en el navegador; la base central y los registros oficiales permanecen en los sistemas de Producers Direct.

| Perfil de uso | Funciones |
|---|---|
| Coordinación del fondo | Panorama territorial, área y café entregado, participación, solicitudes y seguimiento mensual. |
| Equipo de campo | Consulta por código, ficha de visita, reporte para la productora y registro de acciones de visita. |
| Responsable de datos | Revisión de columnas, cobertura, registros excluidos y consulta de la base aceptada. |

Los modos de trabajo organizan las funciones. No autentican usuarios ni restringen el acceso a los datos de un Excel cargado.

## Documentos de recepción

- [Entrega del dashboard y notebooks](ENTREGA_FINAL.md): accesos y contenido de la carpeta.
- [Manual de uso](manual.html): operación del tablero y recorridos de consulta.
- [Informe técnico](INFORME_TECNICO.md): definiciones, medidas y límites.
- [Preparación y calidad](PREPARACION_Y_CALIDAD.md): fuentes y reproducción de los notebooks.
- [Mantenimiento](COMO_EXTENDER.md): estructura del código, verificaciones y publicación.
- [Notas de versión](ENTREGA_UX.md): cambios recientes y evidencia de pruebas.

## Operación

La consulta comienza al abrir un Excel compatible con el contrato. Gráficos, tablas y totales se recalculan con la selección activa. Los datos faltantes se distinguen de los ceros y los registros con identificadores repetidos se apartan para revisión.

Las visitas registradas y la base cargada permanecen únicamente durante la sesión. Es necesario descargar el CSV de visitas antes de recargar, cerrar o cambiar de archivo. El seguimiento mensual utiliza un archivo independiente y no sustituye el registro oficial de desembolsos o pagos.

## Continuidad

| Responsabilidad | Actividad |
|---|---|
| Coordinación de ROTA | Confirmar el alcance de las preguntas, las unidades y el uso de los reportes en campo. |
| Responsable de datos | Mantener las equivalencias de columnas, resolver incidencias de origen y distribuir las bases autorizadas. |
| Mantenimiento técnico | Conservar el repositorio, ejecutar las pruebas y comprobar el despliegue de cada versión. |

El monto solicitado no equivale a un desembolso. Las entregas y el área declarada no permiten por sí solas medir productividad, mora o solvencia. Los análisis describen las respuestas disponibles; las decisiones operativas requieren contrastarlas con los registros del programa.

Los resultados de conciliación anteriores conservan su fecha y fuente. La discrepancia histórica en Yape se mantiene documentada hasta que el responsable de datos resuelva el valor de origen.
