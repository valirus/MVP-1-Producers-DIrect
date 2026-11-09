# Cómo actualizar el mapeo de columnas cuando cambia el formulario

Esta guía es para quien carga el Excel en el tablero cuando el formulario de ROTA en IDENTI cambia entre ciclos. No hace falta programar.

## Qué es el mapeo

El tablero necesita saber qué columna del Excel corresponde a cada dato (código, área de café, acopio, monto solicitado, etc.). A esa correspondencia la llamamos **mapeo**.

- Si cargas la **exportación original** del formulario (hojas «Productoras Norandino» y «Productoras Bagua Grande», con los títulos en la fila 3), el tablero reconoce las preguntas automáticamente. No hace falta ningún paso de limpieza manual.
- Si una pregunta cambia de nombre, el tablero deja de reconocerla y lo avisa. Se corrige eligiendo la nueva columna y guardando el mapeo para el siguiente ciclo.

## Primera vez: guardar el mapeo

1. Pulsa **Cargar Excel** y elige el archivo.
2. En **Revisar la carga**, comprueba:
   - **Qué cargar**: «Ambas cooperativas» para comparar Norandino y Bagua Grande.
   - La línea verde **«Se incluirán: …»**: cooperativas y número de filas.
   - Cada dato con su columna. Las columnas **Sugeridas** aparecen primero. Si una no encaja (por ejemplo, texto en un monto), el campo se pinta de naranja y explica por qué.
   - **Así se leerán los números**: el valor del Excel y el que usará el tablero.
3. Escribe la **Versión del formulario** (por ejemplo, «ROTA ciclo 2026-1»).
4. Pulsa **Guardar este mapeo**. Se descarga un archivo `mapeo_productoras_AAAA-MM-DD.json`. Guárdalo junto con la documentación del formulario.
5. Pulsa **Confirmar e importar**.

## Ejemplo: la pregunta 10 cambia de nombre

En el ciclo siguiente, el formulario cambia:

| Ciclo anterior | Ciclo nuevo |
|---|---|
| `10. QUINTALES ACOPIADOS DURANTE EL 2025` | `10. QUINTALES ENTREGADOS A LA COOPERATIVA 2026` |

Pasos:

1. **Cargar Excel** con la exportación nueva.
2. Pulsa **Usar un mapeo guardado** y elige el archivo `.json` del ciclo anterior.
3. El tablero aplica todas las columnas que encuentra por su título (aunque hayan cambiado de lugar) y avisa:

   > ⚠️ No encontramos estas columnas del mapeo guardado: «10. QUINTALES ACOPIADOS DURANTE EL 2025» (Acopio 2025 (quintales)). Puede que la pregunta haya cambiado en el formulario: elige su nueva columna abajo y vuelve a guardar el mapeo.

4. En el campo **Acopio 2025 (quintales)**, elige la columna `10. QUINTALES ENTREGADOS A LA COOPERATIVA 2026`. Aparecerá en **Sugeridas** porque contiene números y su título se parece.
5. **Antes de aceptarla, confirma que mide lo mismo.** En el ejemplo, la pregunta pasó de 2025 a 2026: es otro periodo. Si el significado o el periodo cambian, no la unas con la anterior sin acordarlo con el equipo (ver `data/data_contract.md`, «Gobierno mínimo»).
6. Actualiza la **Versión del formulario**, pulsa **Guardar este mapeo** y luego **Confirmar e importar**.

## Avisos que puedes ver

| Aviso | Qué significa | Qué hacer |
|---|---|---|
| «No reconocimos estas preguntas: …» | Esas columnas no se encontraron por su nombre | Elegir su columna, o dejarlas sin dato si el formulario ya no las pregunta |
| «Se esperan números, pero solo 0 de 20 valores lo son» | La columna elegida no corresponde al dato | Elegir otra columna |
| «Esta columna también está asignada a: …» | Una columna está en dos datos | Dejarla solo en el que corresponde |
| «En la fila 5 casi no reconocemos títulos» | La fila de títulos elegida parece de datos | Volver a la fila sugerida |
| «Este archivo contiene columnas con datos personales» | Hay DNI, teléfono o nombres | El tablero no las lee; para compartir el archivo, enviar una copia sin esas columnas |
| «X filas no tienen cooperativa y se apartarán» | Falta la cooperativa en esas filas | Revisar el Excel o asignar la columna de cooperativa |

## Qué guarda el archivo de mapeo

Un archivo de texto (JSON) con la versión del formulario, la fecha, la fila de títulos y, para cada dato, **el título exacto de su columna**. No contiene datos de productoras.
