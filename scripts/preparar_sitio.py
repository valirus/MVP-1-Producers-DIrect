"""Construye la carpeta pública del tablero con una lista explícita de archivos."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parent.parent
site = root / "_site"
paths = [
    "index.html", "css/style.css",
    "js/data_core.js", "js/coops.js", "js/charts.js", "js/cross.js", "js/devolucion.js",
    "js/roles.js", "js/filtros.js", "js/ficha.js", "js/base_cargada.js", "js/app.js",
    "js/seguimiento.js", "js/seguimiento_core.js",
    "vendor/xlsx.full.min.js", "vendor/chart.umd.min.js",
    "vendor/LICENSE-Chartjs.md", "vendor/LICENSE-SheetJS.txt",
    "docs/manual.html", "docs/diccionario.html",
    "docs/capturas/inicio.jpg", "docs/capturas/consulta.jpg", "docs/capturas/datos.jpg", "docs/capturas/ficha.jpg", "docs/capturas/cobertura.jpg",
]
if site.is_symlink():
    raise SystemExit("Quita el enlace _site antes de generar la copia pública.")
for name in paths:
    if not (root / name).is_file():
        raise SystemExit(f"Falta el archivo del sitio: {name}")
if site.exists():
    shutil.rmtree(site)
for name in paths:
    dest = site / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(root / name, dest)
print(f"Sitio listo en {site} ({len(paths)} archivos).")
