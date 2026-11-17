'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../js/data_core.js'),R=require('../js/resumen_core.js');
const header=['codigo_productora','cooperativa','area_cafe_reportada','quintales_acopiados'];
const imported=rows=>D.importProfiles([D.sheetProfile('Productoras',[header,...rows])]);
test('cuartiles interpolados, mediana, media y total usan entregas individuales; cero no es vacío',()=>{
 const {records}=imported([['001','A',1,0],['002','A',1,10],['003','A',2,20],['004','A',3,100],['005','A',null,null]]);
 const s=R.coffeeDistribution(records)[0];
 assert.deepEqual(s,{coop:'A',n:4,missing:1,total:130,q1:7.5,median:15,q3:40,mean:32.5});
 const filtered=R.coffeeDistribution(records.filter(r=>r.code==='002'))[0];
 assert.equal(filtered.n,1);assert.equal(filtered.q1,10);assert.equal(filtered.q3,10);assert.equal(filtered.total,10);
});
test('grupos vacíos, sin dato, dato único y valores idénticos no inventan ceros',()=>{
 assert.deepEqual(R.coffeeDistribution([]),[]);
 const s=R.coffeeDistribution([{coop:'A',qq:null},{coop:'B',qq:0},{coop:'C',qq:12},{coop:'C',qq:12}]);
 assert.equal(s[0].n,0);assert.equal(s[0].total,null);assert.equal(s[0].median,null);assert.equal(s[0].mean,null);
 assert.equal(s[1].n,1);assert.equal(s[1].q1,0);assert.equal(s[1].q3,0);assert.equal(s[1].total,0);
 assert.equal(s[2].median,12);assert.equal(s[2].q1,12);assert.equal(s[2].q3,12);
});
test('la importación aparta identificadores duplicados antes de calcular distribuciones',()=>{
 const {records,audit}=imported([['001','A',1,10],['001','A',1,10],['001','B',1,20],['002','A',1,30]]);
 assert.equal(audit.quarantine.length,2);
 const s=R.coffeeDistribution(records);assert.equal(s.find(g=>g.coop==='A').total,30);assert.equal(s.find(g=>g.coop==='B').total,20);
});
test('coincidencias exactas reúnen todos los códigos, conservando ceros y cooperativas',()=>{
 const {records}=imported([['0001','A',1,10],['0002','A',1,10],['0001','B',1,10],['0003','A',1.00001,10],['0004','A',null,10],['0005','A',0,0]]);
 const points=R.coffeePoints(records),p=points.find(p=>p.x===1&&p.y===10);
 assert.equal(points.length,3);assert.deepEqual(p.records.map(r=>r.code),['0001','0002','0001']);
 assert.equal(p.records.length,3);assert.equal(points.find(p=>p.x===0).y,0);
 assert.equal(R.coffeePoints(records.filter(r=>r.coop==='B'))[0].records.length,1);
});
test('el mapa mantiene las áreas incluso con un grupo mínimo y comparte agrupación con la tabla',()=>{
 const groups=[{name:'Grande',n:999},{name:'Pequeño',n:1}];
 for(const [width,height] of [[900,468],[320,280]]){
  for(const t of R.tiles(groups,width,height))assert.ok(Math.abs(t.w*t.h/(width*height)-t.n/1000)<1e-10);
 }
});
test('la forma y el color de cada cooperativa permanecen estables al cambiar la selección',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),ctx={};vm.createContext(ctx);
 vm.runInContext(fs.readFileSync(require.resolve('../js/coops.js'),'utf8')+';this.api={setCoopColors,coopMark,coopColor};',ctx);
 ctx.api.setCoopColors([{coop:'NORANDINO'},{coop:'BAGUA GRANDE'},{coop:'OTRA'}]);
 const before=ctx.api.coopMark('BAGUA GRANDE');
 assert.equal(before.style,'triangle');assert.equal(ctx.api.coopMark('BAGUA GRANDE').symbol,before.symbol);
 assert.notEqual(ctx.api.coopMark('NORANDINO').style,before.style);
});
