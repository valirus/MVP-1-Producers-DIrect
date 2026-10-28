// Ejecutar desde la raíz: node tests/core.test.cjs. Casos sintéticos, sin datos personales.
const assert=require('node:assert/strict'),D=require('../js/data_core.js'),P=require('../js/pca_engine.js');
const profile=(headers,rows)=>D.sheetProfile('Carga',[headers,...rows]);
assert.equal(D.parseNumber(null).value,null);assert.equal(D.parseNumber('0').value,0);
assert.equal(D.parseNumber('S/ 1.234,50','comma').value,1234.5);assert.equal(D.parseNumber('1,234.50','dot').value,1234.5);
assert.ok(D.parseNumber('1,234').error);assert.ok(D.parseNumber('abc').error);assert.ok(D.parseNumber(Infinity).error);
assert.equal(D.phone('Celular de teclas'),'BASICO');assert.equal(D.phone('NINGUNO'),'NINGUNO');assert.equal(D.phone(null),null);
assert.equal(D.literacy('SOLO_LECTURA'),'LECTURA');assert.equal(D.activity('Fertilización de café'),'FERTILIZACIÓN');
let r=D.importProfiles([profile(['codigo_productora','cooperativa','ingreso_principal_pen_2025'],[['A','coop nueva',0],['B','COOP NUEVA',null]])]);
assert.equal(r.records.length,2);assert.equal(r.records[0].income,0);assert.equal(r.records[1].income,null);assert.equal(r.records[1].age,null);assert.equal(r.records[1].phone,null);assert.equal(r.audit.imputed,0);
r=D.importProfiles([profile(['codigo_productora','cooperativa'],[['A','X'],[' a ','X'],['A','Y'],[null,'Z']])]);assert.equal(r.records.length,1);assert.equal(r.records[0].coop,'Y');assert.equal(r.audit.quarantine.length,3);
r=D.importProfiles([profile(['codigo_productora','cooperativa','edad_al_cierre_2025','n_familiares_convivientes'],[['A','X',-1,2.5]])]);assert.equal(r.records[0].age,null);assert.equal(r.records[0].family,null);assert.equal(r.audit.issues.length,2);
assert.throws(()=>D.importProfiles([profile(['nombre'],[['No es un identificador homologado']])]),/Mapee/);
const simple=[{x:1,y:5},{x:2,y:4},{x:3,y:3},{x:4,y:2},{x:null,y:1}];assert.equal(D.correlation(simple,'x','y').value,-1);assert.equal(D.correlation(simple,'x','y').n,4);assert.equal(D.correlation(simple,'x','y','spearman').value,-1);
assert.deepEqual(D.ranks([3,1,1,4]),[3,1.5,1.5,4]);assert.equal(D.correlation([{x:1,y:2},{x:1,y:3},{x:1,y:4}],'x','y').value,null);
const eigen=P.eigenSymmetric([[1,.5],[.5,1]]);assert.ok(Math.abs(eigen[0].value-1.5)<1e-12);assert.ok(Math.abs(eigen[1].value-.5)<1e-12);
const samples=Array.from({length:18},(_,i)=>({age:20+i,family:i%5,years:1+(i*3)%13,area:1+(i%6)/2,qq:10+i*2+(i%3),income:1000+(i*i*123)}));
const m=P.fitPCA(samples);assert.equal(m.ok,true);assert.ok(Math.abs(m.variance.reduce((a,b)=>a+b)-100)<1e-9);
for(let i=0;i<6;i++)for(let j=0;j<6;j++){const dot=m.components[i].weights.reduce((s,w,k)=>s+w*m.components[j].weights[k],0);assert.ok(Math.abs(dot-(i===j?1:0))<1e-9);}
for(const w of m.components.map(c=>c.weights)){const j=w.map(Math.abs).indexOf(Math.max(...w.map(Math.abs)));assert.ok(w[j]>=0);}
assert.equal(P.fitPCA(samples.slice(0,6)).ok,false);assert.equal(P.fitPCA(samples.map(r=>({...r,area:1}))).ok,false);assert.equal(P.fitPCA([...samples,{age:44}]).excluded,1);
// Filtro: las coordenadas se conservan porque se reutiliza el modelo completo.
const before=m.scores.get(samples[0]);assert.strictEqual(m.scores.get(samples.filter(r=>r.age<25)[0]),before);
console.log('OK: parseo regional, ausentes/cero, homologación, llaves, dominios, correlaciones y PCA.');
