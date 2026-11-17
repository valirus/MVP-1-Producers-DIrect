# Actualización del dashboard en Windows

El paquete contiene el proyecto completo en `MVP-1-Producers-DIrect/` y un parche en `entrega/ux-dashboard.patch`. El parche actualiza los archivos de la versión y permite que Git compruebe su integración. La carpeta `.git`, los datos y la configuración local se conservan.

## Preparación

Guardar el ZIP en Downloads y extraerlo en una carpeta nueva. No es necesario volver a clonar el repositorio. En los comandos siguientes, sustituir `C:\ruta\MVP-1-Producers-DIrect` por la ruta del clon y `<carpeta-extraida>` por la carpeta del paquete:

```powershell
& '<carpeta-extraida>\entrega\Aplicar-UX.ps1' -RepoPath 'C:\ruta\MVP-1-Producers-DIrect'
```

El script comprueba el remoto, revisa cambios locales, integra avances lineales de `origin/main`, aplica el parche y ejecuta las pruebas y el generador del sitio. No crea commits ni hace push. Se distribuye en UTF-8 con BOM para que Windows PowerShell lea correctamente los mensajes en español.

La configuración local no versionada de `.vscode/` no impide la actualización. Cualquier modificación en archivos versionados o cualquier archivo nuevo fuera de esa carpeta requiere revisión previa. El parche añade `.vscode/` a `.gitignore`; no borra ni publica la configuración del editor.

## Aplicación manual

Como alternativa al script, pegar este bloque en PowerShell desde el clon. Cambiar únicamente el valor de `$Parche`:

```powershell
& {
    $ErrorActionPreference = 'Stop'
    $Parche = '<carpeta-extraida>\entrega\ux-dashboard.patch'
    git status --short
    git diff --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Hay cambios en archivos versionados.' }
    git diff --cached --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Hay cambios preparados para commit.' }
    $Nuevos = @(git ls-files --others --exclude-standard -- . ':(exclude).vscode/**')
    if ($LASTEXITCODE -ne 0 -or $Nuevos.Count -gt 0) { throw 'Revisar los archivos nuevos fuera de .vscode.' }
    git switch main
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo cambiar a main.' }
    git fetch origin main
    if ($LASTEXITCODE -ne 0) { throw 'Fallo fetch.' }
    git merge --ff-only origin/main
    if ($LASTEXITCODE -ne 0) { throw 'Integrar la divergencia antes de aplicar.' }
    git apply --check --3way $Parche
    if ($LASTEXITCODE -ne 0) { throw 'El parche requiere revision.' }
    git apply --3way $Parche
    if ($LASTEXITCODE -ne 0) { throw 'Resolver los conflictos antes de continuar.' }
    node scripts/verificar.cjs
    if ($LASTEXITCODE -ne 0) { throw 'Fallaron las pruebas.' }
    py -X utf8 scripts/preparar_sitio.py
    if ($LASTEXITCODE -ne 0) { throw 'Fallo la generacion del sitio.' }
    git diff --cached --check
    if ($LASTEXITCODE -ne 0) { throw 'Revisar el diff preparado.' }
    git status --short
    git diff --cached --stat
    git diff --cached
}
```

Si `py` no está disponible, usar `python`. `git apply --3way` prepara los archivos en el índice; el contenido que se confirmará se revisa mediante `git diff --cached`.

## Revisión local

```powershell
py -m http.server 8000 --bind 127.0.0.1 --directory _site
```

Abrir `http://localhost:8000`, cargar un Excel compatible y revisar filtros, tablas, gráficos y fichas. Para practicar, generar primero `data/processed/demo_ficticia.xlsx` mediante `node scripts/crear_demo.cjs`. Detener el servidor con Ctrl+C.

La prueba de interfaz se ejecuta sirviendo la raíz, sin `--directory _site`, y abriendo `/tests/ux-browser.html` o `/tests/ux-browser.html?mobile`. El marco móvil mide 390 px y comprueba el diseño adaptable.

## Commit e integración con main

Después de revisar las diferencias y la vista local:

```powershell
& {
    git status --short
    git diff --cached --stat
    git commit -m "Actualiza dashboard y documentacion de entrega"
    if ($LASTEXITCODE -ne 0) { throw 'No se creo el commit.' }
    git fetch origin main
    if ($LASTEXITCODE -ne 0) { throw 'Fallo fetch.' }
    git merge --no-edit origin/main
    if ($LASTEXITCODE -ne 0) { throw 'Resolver los conflictos antes de continuar.' }
    node scripts/verificar.cjs
    if ($LASTEXITCODE -ne 0) { throw 'Fallaron las pruebas.' }
    py -X utf8 scripts/preparar_sitio.py
    if ($LASTEXITCODE -ne 0) { throw 'Fallo la generacion del sitio.' }
    git status --short
    git diff origin/main --stat
    git push origin main
}
```

Si el push se rechaza por un avance remoto, ejecutar `git fetch origin main`, integrar con `git merge origin/main`, resolver los conflictos y repetir las verificaciones antes de subir. No se necesita force push. La publicación queda confirmada cuando GitHub Actions termina correctamente y el enlace de GitHub Pages sirve la versión integrada.

## Trabajo local pendiente

Revisar `git diff`, `git diff --cached` y `git status`. Puede guardarse el trabajo con un commit propio o apartarse temporalmente mediante `git stash push -u -m "Trabajo local anterior a la actualizacion"`. Para recuperarlo, usar `git stash apply` y revisar los conflictos; el respaldo del stash permanece disponible.

Las credenciales, los Excel operativos y los archivos `.env` se mantienen fuera del repositorio. Los notebooks 01–03 y `tests/sources.test.cjs` requieren los dos Excel de referencia autorizados.
