// Opcional: node tests/sources.test.cjs RUTA_A_LA_CARPETA_CON_LOS_TRES_EXCEL
// Lee archivos locales; imprime solo agregados y porcentajes, nunca las filas.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const XLSX=require('../vendor/xlsx.full.min.js'),D=require('../js/data_core.js'),P=require('../js/pca_engine.js');
const dir=process.argv[2];if(!dir)throw Error('Indica la carpeta que contiene los Excel originales adjuntos.');
const files=['Base_Producers_Direct_Optimizada_App_vFinal.xlsx','Base_Nor_BG_limpia(2).xlsx','Base de Datos Nor-BG anónima.xlsx'];
for(const file of files){const wb=XLSX.read(fs.readFileSync(path.join(dir,file)),{type:'buffer',cellDates:true});const ps=wb.SheetNames.map(n=>D.sheetProfile(n,XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:null,blankrows:true})));const clean=ps.find(p=>p.name==='Productoras'),selected=clean?[clean]:file.startsWith('Base de Datos')?ps:[ps[0]];
 const {records:r,audit}=D.importProfiles(selected,{fileName:file}),m=P.fitPCA(r);
 assert.equal(r.length,138);assert.equal(audit.issues.length,0);assert.equal(audit.quarantine.length,0);
 assert.equal(r.reduce((s,r)=>s+r.amount,0),190175);assert.equal(r.reduce((s,r)=>s+r.qq,0),5444);
 const expected=[39.13547128409382,23.13138806980714,16.01702252213466];expected.forEach((v,i)=>assert.ok(Math.abs(m.variance[i]-v)<1e-8));
 assert.equal(r.filter(r=>r.phone==='BASICO').length,file.startsWith('Base_Producers')?0:4);
 console.log(file,JSON.stringify({n:r.length,issues:audit.issues.length,pca:m.variance.slice(0,3),basic:r.filter(r=>r.phone==='BASICO').length}));
}
console.log('OK: los tres archivos coinciden en conteos, agregados numéricos y PCA; se reproduce la pérdida de TECLAS en el optimizado.');
