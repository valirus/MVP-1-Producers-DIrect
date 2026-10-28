"""El ETL anterior se retiró: imputaba y eliminaba duplicados sin revisión.

Usa «Cargar Excel» en index.html: mapea columnas, confirma y descarga la
selección normalizada CSV + la auditoría JSON desde Calidad de Datos.
Las reglas únicas viven en js/data_core.js y se verifican en tests/.
No ejecutamos dos limpiadores con reglas distintas.
"""
def clean_producers_data(*args, **kwargs):
    raise RuntimeError('ETL retirado. Importa el Excel desde el dashboard y revisa Calidad de Datos; consulta data/data_contract.md.')

if __name__ == '__main__':
    print(__doc__)
