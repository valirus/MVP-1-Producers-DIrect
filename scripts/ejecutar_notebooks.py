"""Ejecuta notebooks en orden sin Jupyter, sin persistir celdas ni datos en los .ipynb."""
import json
import os
from pathlib import Path

root = Path(__file__).resolve().parent.parent
os.chdir(root)
for notebook in sorted((root / "notebooks").glob("[0-9][0-9]_*.ipynb")):
    print(f"\n>>> {notebook.name}", flush=True)
    scope = {}
    for i, cell in enumerate(json.loads(notebook.read_text(encoding="utf-8"))["cells"], 1):
        if cell["cell_type"] == "code":
            exec(compile("".join(cell["source"]), f"{notebook.name}:celda {i}", "exec"), scope)
