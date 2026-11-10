# Integrar la entrega en el repositorio del equipo

Repositorio: [valirus/MVP-1-Producers-DIrect](https://github.com/valirus/MVP-1-Producers-DIrect). Base contrastada con GitHub y el ZIP de `main`: `9c94c96fb2c489c99b6290b68992111df64e3e14`. El paquete se aplica directamente sobre esa base: no necesita las entregas intermedias.

1. Descarga `Producers_Direct_Entrega_Integrada.zip` en Descargas. Extrae el paquete **fuera del repositorio**. Puedes usar `Expand-Archive` o el Explorador.
2. Abre el repositorio habitual en VS Code y usa su terminal PowerShell. Ejecuta el script `Integrar-Entrega.ps1` del paquete con la ruta del repositorio actual. Necesita Git, Node.js y Python 3. Si Git no tiene nombre o correo configurado, el script se detiene antes de aplicar cambios.
3. El script trae `origin/main`, comprueba la base y el parche, crea una rama en una carpeta vecina, ejecuta las pruebas, genera `_site` y hace un commit local. No modifica tus archivos abiertos, incluidos los cambios locales de `.vscode`, ni hace push. Si `main` avanzó o el parche no coincide, se detiene. Si falla una prueba, deja la copia separada para revisar.
4. Abre la carpeta nueva y prueba con `py -m http.server 8000 --bind 127.0.0.1 --directory _site`. Entra en `http://127.0.0.1:8000`. Puedes seleccionar el Excel ficticio incluido en el paquete.
5. Cuando apruebes la copia, desde la carpeta nueva ejecuta `git push -u origin entrega-final-producers-direct` y [abre un PR contra main](https://github.com/valirus/MVP-1-Producers-DIrect/compare/main...entrega-final-producers-direct?expand=1). No uses force push. La publicación sigue el workflow de Pages después de integrar en `main`.

Para revisar sin el script, el archivo `entrega-contra-main.patch` es un parche Git binario normal. Desde un checkout limpio del SHA indicado, crea una rama, ejecuta `git apply --index --check ruta-al-parche` y después `git apply --index ruta-al-parche`. Corre las pruebas del workflow y `py scripts/preparar_sitio.py` antes de confirmar el commit. No copies la carpeta `sitio` encima de tu repo: ese árbol es una vista de referencia y una copia independiente para prueba.
