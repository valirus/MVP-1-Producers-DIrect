# Página «Seguimiento del crédito»

Responde, para Producers Direct, cómo avanza el crédito después de la entrega del insumo. Está en el grupo **Consulta del fondo** del menú y usa los mismos filtros del tablero (cooperativa, distrito, base o sector).

## Cómo usarla

1. Carga la base de productoras con **Abrir Excel**, como siempre.
2. Entra a **Seguimiento del crédito** y pulsa **Cargar seguimiento**. Elige los Excel de ingresos y egresos de un mismo ciclo.
3. Revisa los meses y cuántas filas de cada archivo se vinculan con la base. Pulsa **Confirmar carga** o **Cancelar**.
4. Filtra por cooperativa o por zona con los filtros de arriba.

El seguimiento queda en la memoria del navegador, igual que la base: no se envía ni se guarda. Al cambiar la base se limpia el seguimiento. Vuelve a abrir los archivos del ciclo que corresponda.

## Qué muestra

| Bloque | Pregunta de Producers Direct | Qué ver |
|---|---|---|
| Uso del crédito | ¿Ya usaron el insumo? ¿Por qué no? | Norandino: % que ya aplicó el fertilizante y motivos de quienes no. Bagua Grande: actividad financiada (su formulario no pregunta por el uso del insumo). |
| Cuaderno de registros | ¿Anotan sus ingresos y gastos? | % que usa el cuaderno y qué tan útil le parece, por cooperativa. |
| Avance de ventas | ¿Cuántas venden cada mes? | % que vendió en cada mes, con «X de Y productoras respondieron». Quintales vendidos solo para café. |
| Venta de café (Norandino) | ¿Llevan su café a la cooperativa? ¿Por qué no? | Sí/No, si lo llevará pronto y los motivos: precio bajo, transporte, venta a otro comprador. Orienta a quién acompañar para que no venda fuera de la cooperativa cuando baja el precio. |
| Ingresos y gastos | ¿Cuánto venden y gastan por mes? | Ventas (S/), gasto de la finca o del emprendimiento y gasto de la familia, por mes y cooperativa, con su cobertura. |

Reglas que siguen todos los bloques:

- Siempre «X de Y productoras respondieron».
- Sin porcentajes ni montos con menos de 5 respuestas.
- Sin imputar datos.
- Gastos de la familia solo sumados.
- Entre cooperativas solo se comparan soles.

Detalle de campos y decisiones: [`data/contrato_seguimiento.md`](../data/contrato_seguimiento.md).

## Archivos

| Archivo | Qué hace |
|---|---|
| `js/seguimiento_core.js` | Lee los Excel, mapea los encabezados por texto y por mes, aplica las reglas de calidad, une los archivos y calcula los resúmenes. No depende de la página; se prueba con Node. |
| `js/seguimiento.js` | Dibuja la página, su carga, la revisión antes de confirmar y los gráficos. Reutiliza los componentes y estilos del tablero. |
| `tests/seguimiento.test.cjs` | Pruebas con datos sintéticos: encabezados repetidos, enero sin mes, columnas en otro orden, números como texto, quintales apartados, ventas con 0 vendidos, códigos que no cruzan, archivos no reconocidos, unión y resúmenes. |

Enganches con el tablero existente (únicos cambios fuera de estos archivos):

- `index.html`: botón del menú, `<section id="seguimiento-page">` y dos `<script>`.
- `js/app.js`: entrada `seguimiento` en `pageNames` y navegación que llama a `renderSeguimiento`. Esa función se ejecuta al abrir la página y con cada cambio de filtro.

## Cuando llegue un formulario nuevo

- **Pregunta nueva de mes:** agregar una regla en `MONTH_RULES` (`seguimiento_core.js`) con el inicio del texto del encabezado y su tipo.
- **Pregunta nueva fija:** agregar una regla en `STATIC_RULES`.
- **Pregunta que no se quiere usar:** agregarla en `IGNORED_RULES` para que la revisión la muestre como «no se usa».
- **Siempre:** añadir el caso a `tests/seguimiento.test.cjs` y documentarlo en el contrato.

Pruebas:

```
node tests/core.test.cjs
node tests/cross.test.cjs
node tests/filtros.test.cjs
node tests/seguimiento.test.cjs
```
