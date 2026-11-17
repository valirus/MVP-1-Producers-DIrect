/* Ejecuta todas las pruebas sintéticas, sin necesitar los Excel de referencia. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const files=fs.readdirSync(path.join(root,'tests')).filter(name=>name.endsWith('.test.cjs')&&name!=='sources.test.cjs').sort().map(name=>path.join('tests',name));
const result=spawnSync(process.execPath,['--test',...files],{cwd:root,stdio:'inherit'});
if(result.error){console.error(result.error.message);process.exit(1);}
process.exit(result.status??1);
