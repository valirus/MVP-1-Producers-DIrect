// Ejecutar desde la raíz: node tests/cross.test.cjs. Casos sintéticos, sin datos personales.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),D=require('../js/data_core.js');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/../js/coops.js','utf8')+';this.api={share,multiShare,groupRows,spearman,median,coopConfig,MIN_N};',ctx);
const A=ctx.api;

// Opción múltiple: un registro puede marcar varias opciones y los porcentajes no suman 100.
const rows=[['YAPE; PLIN'],['YAPE'],['NINGUNO'],['YAPE'],['PLIN'],[null]].map(([s])=>({services:s?s.split(/;\s*/):null}));
const m=A.multiShare(rows,'services');assert.equal(m.n,5);
assert.equal(m.items.find(i=>i.option==='YAPE').count,3);assert.equal(m.items.find(i=>i.option==='YAPE').pct,60);
assert.ok(m.items.reduce((s,i)=>s+i.pct,0)>100);

// Supresión: menos de MIN_N respuestas no devuelve porcentaje.
const few=[{x:1},{x:0},{x:1},{x:1}];assert.equal(A.share(few,r=>r.x).pct,null);
const enough=[...few,{x:0}];assert.equal(A.share(enough,r=>r.x).pct,60);assert.equal(A.share([...enough,{x:null}],r=>r.x).n,5);

// Spearman y mediana
assert.ok(Math.abs(A.spearman([1,2,3,4],[1,4,9,16])-1)<1e-12);assert.ok(Math.abs(A.spearman([1,2,3,4],[4,3,2,1])+1)<1e-12);assert.equal(A.median([3,1,2]),2);

// Cada cooperativa tiene su configuración; una nueva usa la de respaldo.
assert.notDeepEqual(A.coopConfig('NORANDINO').cross,A.coopConfig('BAGUA GRANDE').cross);assert.equal(A.coopConfig('COOP NUEVA').label,'COOP NUEVA');

// Campos adicionales del formulario: ausentes quedan null y no se inventan valores.
const prof=(h,r)=>D.sheetProfile('Carga',[h,...r]);
let r=D.importProfiles([prof(['codigo_productora','cooperativa','servicios_financieros','usa_yape','acceso_internet','canales_preferidos'],[['A','X','YAPE; plin',1,'en_casa','LLAMADAS;WHATSAPP'],['B','X',null,'NO',null,null],['C','X','NINGUNO','quizá','FUERA_DE_CASA','SMS']])]);
assert.deepEqual(r.records[0].services,['YAPE','PLIN']);assert.equal(r.records[0].yape,1);assert.equal(r.records[0].internet,'EN_CASA');assert.deepEqual(r.records[0].channels,['LLAMADAS','WHATSAPP']);
assert.equal(r.records[1].services,null);assert.equal(r.records[1].yape,0);assert.equal(r.records[1].internet,null);
assert.equal(r.records[2].yape,null);assert.equal(r.audit.issues.length,1);assert.equal(r.audit.imputed,0);
// Un formulario sin esas preguntas sigue cargando
r=D.importProfiles([prof(['codigo_productora','cooperativa'],[['A','X']])]);assert.equal(r.records[0].services,null);assert.equal(r.records[0].infocorp,null);assert.equal(r.audit.issues.length,0);
console.log('OK: opción múltiple, supresión n<5, configuración por cooperativa y campos opcionales del formulario.');
