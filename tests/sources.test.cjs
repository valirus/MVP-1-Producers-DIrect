// Verificación local con los archivos autorizados. Nunca imprime valores por persona.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const [raw,clean]=process.argv.slice(2);
if(!raw||!clean)throw Error('Uso: node tests/sources.test.cjs "original.xlsx" "limpia.xlsx"');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'pd-reconcile-'));
try {
 execFileSync(process.execPath,[path.join(__dirname,'../scripts/preparar.cjs'),'--raw',raw,'--clean',clean,'--out',out],{stdio:'inherit'});
 const s=JSON.parse(fs.readFileSync(path.join(out,'comparacion.json')));
 assert.equal(s.rawN,138);assert.equal(s.cleanN,138);assert.equal(s.originMatch,138);
 assert.equal(s.cleanOnly+s.rawOnly+s.cleanQuarantine+s.rawQuarantine,0);
 assert.equal(s.table.length,25);
 assert.ok(s.table.every(x=>x.compared===138&&x.changes===0));
 assert.equal(s.sums.amount,190175);assert.equal(s.sums.qq,5444);assert.ok(Math.abs(s.sums.area-310.36)<1e-8);
 const X=require('../vendor/xlsx.full.min.js'),D=require('../js/data_core.js');
 const read=file=>{
   const wb=X.read(fs.readFileSync(file),{type:'buffer',cellDates:true});
   return D.importProfiles([D.sheetProfile('Productoras',X.utils.sheet_to_json(wb.Sheets.Productoras,{header:1,defval:null,blankrows:true,raw:true}))]).records;
 };
 const generated=read(path.join(out,'base_operativa_desde_raw.xlsx')), reference=read(clean);
 const fields=D.fields.map(([k])=>k).filter(k=>!['birth','infocorp'].includes(k));
 const select=rows=>Object.fromEntries(rows.map(row=>[JSON.stringify([row.coop,D.norm(row.code)]),
   fields.map(k=>Array.isArray(row[k])?[...row[k]].sort():row[k])]));
 assert.deepEqual(select(generated),select(reference),'el Excel reconstruido conserva los 25 campos al volver a cargarlo');
 const audit=JSON.parse(fs.readFileSync(path.join(out,'auditoria_limpia.json')));
 assert.equal(audit.imputed,0);assert.equal(audit.issues.length,1);assert.equal(audit.issues[0].field,'services');
 assert.ok(audit.outliers.some(r=>r.field==='age'&&r.value===89));
 [39.135471284,23.13138807,16.017022522].forEach((v,i)=>assert.ok(Math.abs(s.pca.variance[i]-v)<1e-8));
 console.log('OK: 3,450 comparaciones, trazabilidad, totales, PCA y reglas de calidad de la entrega.');
} finally { fs.rmSync(out,{recursive:true,force:true}); }
