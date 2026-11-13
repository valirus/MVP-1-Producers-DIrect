# Auditoría de entrega documental - 13 de noviembre de 2026

## Alcance y conclusión

Se revisó main en aef3c46f927a85d23f7cbdd6206bb8cc74e632e4, la matriz de evaluación (segunda tabla, documentación de semana 14) y el PDF del equipo de 34 páginas. Los siete componentes están presentes. Se corrigieron omisiones de publicación y descripciones inconsistentes, y se preparó el paquete con entradas y evidencia ejecutada. No se puede afirmar conciliación perfecta: permanece una discrepancia documentada que requiere validación de fuente.

## Matriz de documentación

| Criterio | Peso | Evidencia incluida |
|---|---:|---|
| README, propósito, estructura y orden | 3 | README.md, instrucciones de entrada y orden 01-04 |
| Un notebook por etapa, sin intervención durante el flujo | 3 | notebooks/ y copias ejecutadas en evidencia/notebooks_ejecutados/ |
| Diccionario de todas las variables finales | 3 | docs/diccionario.html: 25 campos operativos, periodo y dos referencias de origen |
| Limpieza por variable: problema, decisión, justificación e impacto | 4 | docs/INFORME_LIMPIEZA.md y antes_despues.csv generado |
| Manual con capturas y casos | 3 | docs/manual.html y doce capturas; se corrigieron seis imágenes no copiadas a _site |
| Cada visual: propósito, lectura y decisión | 3 | docs/INFORME_VISUALIZACIONES.md y reporte consolidado |
| Versiones y datos de entrada | 1 | requirements.txt, entradas, huellas SHA-256, log y resultados |

La presencia y comprobación de evidencia no predicen la nota del docente. La primera tabla de la matriz corresponde a la entrega final de semana 15, no a esta evaluación documental.

## Discrepancia que se conserva

Bagua Grande, código PD-FR-121-FF-BG, fila 11 de Productoras Bagua Grande. El original declara simultáneamente Ninguno y Yape. La reconstrucción deja usa_yape vacío porque la respuesta es contradictoria. La referencia Base_Nor_BG_limpia(7).xlsx tiene usa_yape=1 (Sí), en su fila 122. Se preservaron ambos archivos tal como fueron recibidos.

Resultado: 3,449 coincidencias y 1 diferencia en 3,450 comparaciones. No cambia los totales de S/ 190,175, 310.36 de área reportada ni 5,444 quintales, pero puede cambiar el denominador y porcentaje de Yape. El pipeline usa la reconstrucción como base operativa; la referencia se utiliza para comparar. No sustituir silenciosamente el vacío por Sí ni modificar el test para ocultar la diferencia. ROTA debe confirmar la respuesta si quiere eliminar la discrepancia.

La prueba estricta sources.test.cjs debe fallar mientras exista esa diferencia. Es un resultado de auditoría, no un fallo de ejecución de los cuatro notebooks. Las 38 pruebas generales son independientes y sí pasan. Las afirmaciones anteriores de cero diferencias no se sostienen con estas entradas y quedan corregidas por este informe.

## Cambios incluidos

- Se agregaron al generador público seis capturas ya existentes que usa el manual: producción, participación, crédito, revisión de seguimiento, seguimiento y reporte. _site pasa de 30 a 36 archivos.
- El workflow incluye ahora tests/resumen.test.cjs, que estaba fuera de la lista del despliegue.
- El README usa Reporte para la productora y documenta la discrepancia actual.
- Se separan valores observados y reglas de validación en el diccionario. Los tipos enteros del reporte describen la muestra; el contrato permite decimales en antigüedad, quintales, ingreso y monto.
- Se corrigieron las categorías omitidas en la descripción de celular y lectoescritura, y se delimitó la interpretación financiera de los agregados.
- El notebook 03 ya no oculta participación por el antiguo mínimo de cinco respuestas; conserva el mismo criterio descriptivo que la web.
- No se modificaron los datos de entrada, la regla de Yape ni las pruebas de conciliación.

## Límites y pendientes

Confirmar documentalmente unidad de área y peso del quintal con Producers Direct. Los 310.36 se muestran como ha por convención del proyecto, no por verificación externa de la unidad. Los formularios conocidos permiten reconstrucción local; el lector web admite cambios de nombres y orden mediante asignación, pero no deduce el significado de cualquier formulario. Los modos no son autenticación. Validar lenguaje y uso en campo sigue siendo una tarea con usuarios.

Para semana 15 conviene ampliar 02_exploracion con análisis univariado, bivariado y multivariado interpretado. Hoy imprime principalmente cobertura y atípicos. Que ejecute correctamente no demuestra que cubra ese criterio de análisis de la primera matriz. Los notebooks 01 y 04 también son envoltorios de scripts; las decisiones detalladas están documentadas, pero el docente puede pedir más desarrollo analítico dentro del notebook final.

## Cómo comprobar el clon del usuario

La captura git remote -v solo confirma el remoto. La rama main aparece con un cambio local; no prueba sincronización ni un árbol limpio. Ejecutar git fetch origin, git status --short --branch y git rev-list --left-right --count HEAD...origin/main. Estando en main, 0 0 significa que los commits coinciden. Revisar git diff y git diff --cached antes de aplicar cambios. No hace falta force push.
