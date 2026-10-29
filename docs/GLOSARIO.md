# Glosario: del lenguaje técnico al lenguaje de la empresa

El tablero lo usa Producers Direct y las cooperativas, no personas de analítica. Los textos visibles evitan los términos de clase y usan estas equivalencias. En el código y las pruebas se conservan los nombres técnicos.

| Término técnico | Cómo se dice en el tablero | Qué significa |
|---|---|---|
| PCA, componente principal (PC1, PC2, PC3) | Mapa de perfiles, ejes 1, 2 y 3 | Resume 6 datos de cada productora en pocos ejes para ver quiénes se parecen. Cada eje recibe un nombre según lo que más pesa (por ejemplo, "Tamaño de la producción"). |
| Varianza explicada | Cuánta información conserva el mapa; "% de las diferencias entre productoras" | Qué parte de las diferencias entre productoras se ve en el mapa. |
| Pesos, cargas, autovectores | Qué variables definen cada eje | Cuánto influye cada dato en un eje. |
| Variables estandarizadas | (no se muestra) | Se pasan a una escala común para que los soles no pesen más que los años. |
| Correlación, Pearson, Spearman | Qué variables suben o bajan juntas; relación débil, moderada o fuerte | Si dos datos tienden a moverse juntos. Se muestra con palabras; los coeficientes quedan en la tabla de colores. |
| Mediana | Productora típica, valor central | La mitad está por encima y la otra mitad por debajo. |
| n, tamaño de muestra | Número de productoras | Cuántas productoras respondieron. |
| Mapa de calor | Comparación por grupo; tabla de colores | Cuanto más oscuro, mayor el porcentaje. |
| Opción múltiple | Podían marcar varios | Los porcentajes no suman 100 %. |
| Cuarentena | Filas apartadas | Filas que no se incluyeron porque falta el código o la cooperativa, o el código está repetido. |
| Incidencias | Observaciones | Avisos sobre datos dudosos. No se corrige ni inventa nada. |
| Mapeo | Qué columna corresponde a cada pregunta | Se confirma al cargar el Excel. |
| Auditoría JSON | Informe de revisión | Archivo con el detalle de la carga. |
| Datos insuficientes (n<5) | Menos de 5 productoras | Con menos de 5 casos no se muestran porcentajes para no sacar conclusiones débiles ni identificar a alguien. |
