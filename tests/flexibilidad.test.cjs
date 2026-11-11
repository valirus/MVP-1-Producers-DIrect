// Regresiones de la auditoría: columnas, vacíos, cruces, unidades y cargas solapadas.
const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../js/data_core.js'),S=require('../js/seguimiento_core.js');
const main=matrix=>D.importProfiles([D.sheetProfile('Campaña',matrix)]);
const tracking=(matrix,base,period=2027)=>S.readFile('seguimiento.xlsx',[{name:'Datos',matrix}],base,{period});
test('un campo que no viene en Excel permanece visible como columna ausente',()=>{
 const result=main([['Código de productora','Cooperativa','Área de café'],['A','Nueva',0],['B','Nueva',null]]);
 const coverage=D.coverage(result.records,result.audit);
 assert.equal(coverage.length,25);
 const area=coverage.find(f=>f.key==='area');assert.equal(area.filled,1);assert.equal(area.missing,1);assert.equal(area.status,'mapped');
 const income=coverage.find(f=>f.key==='income');assert.equal(income.status,'absent');assert.equal(income.missing,2);
});
test('no válidos, vacíos y ceros se distinguen sin imputar',()=>{
 const result=main([['codigo_productora','cooperativa','monto_solicitado_pen'],['A','Nueva',0],['B','Nueva','1,500'],['C','Nueva',null],['D','Nueva',-5]]);
 const amount=D.coverage(result.records,result.audit).find(f=>f.key==='amount');
 assert.equal(amount.invalid,2);assert.equal(amount.filled,1);assert.equal(amount.missing,3);assert.equal(result.audit.imputed,0);
});
test('no se permite asignar una misma columna a dos conceptos',()=>{
 const p=D.sheetProfile('P',[['codigo_productora','cooperativa','area_cafe_reportada'],['A','B',2]]);p.map.qq=p.map.area;
 assert.throws(()=>D.importProfiles([p]),/dos campos/);
});
test('el CSV mantiene fechas de periodo y puede volver a importarse',()=>{
 const result=main([['cooperativa','codigo_productora','quintales_acopiados_2029','usa_yape'],['Nueva','A',40,0]]);
 assert.equal(result.audit.period,2029);assert.equal(result.records[0].yape,0);
});
test('una fecha inexistente no produce una edad válida',()=>{
 const r=main([['codigo_productora','cooperativa','fecha_nacimiento_beneficiaria','periodo'],['A','B','2001-02-30',2027]]);
 assert.equal(r.records[0].age,null);
});
test('un campo derivado distingue su origen de una columna ausente',()=>{
 const r=main([['codigo_productora','cooperativa','fecha_nacimiento_beneficiaria','periodo','servicios_financieros'],['A','B','2000-01-01',2027,'YAPE']]);
 for(const field of ['age','yape'])assert.equal(D.coverage(r.records,r.audit).find(f=>f.key===field).status,'derived');
});
const base=S.baseIndex([{code:'A',coop:'Uno'},{code:'B',coop:'Uno'},{code:'A',coop:'Dos'}]);
test('códigos iguales entre cooperativas requieren una cooperativa explícita',()=>{
 assert.equal(base.get('A'),undefined);
 const p=tracking([['codigo_productora','cooperativa','mes','ventas_pen','periodo'],['A','Uno','julio',200,2027],['A','Dos','julio',300,2027]],base);
 assert.equal(p.error,null);const r=S.combine([p]).records;assert.equal(r.length,2);assert.equal(r.reduce((s,r)=>s+r.months.JULIO.sales,0),500);
});
test('las cantidades de emprendimientos no se suman como quintales',()=>{
 const p=tracking([['codigo_productora','mes','cantidad_vendida','unidad_cantidad','ventas_pen'],['B','julio',120,'kg',500]],base);
 const summary=S.monthSummary(S.combine([p]).records,'JULIO');assert.equal(summary.qtyN,0);assert.equal(summary.qtySold,null);assert.equal(summary.sales,500);
});
test('un cero y una cantidad grande declarada permanecen disponibles',()=>{
 const p=tracking([['codigo_productora','mes','cantidad_vendida','unidad_cantidad','ventas_pen'],['B','julio',6510,'qq',0]],base);
 const summary=S.monthSummary(S.combine([p]).records,'JULIO');assert.equal(summary.qtySold,6510);assert.equal(summary.sales,0);
});
test('un mismo seguimiento se puede cargar dos veces sin duplicar el mes',()=>{
 const p=tracking([['Código','¿Vendió café en julio?','Ganancia total de la venta (en soles) julio'],['B','Sí',1500]],base);
 const combined=S.combine([p,p]);assert.equal(combined.records.length,1);assert.equal(combined.records[0].months.JULIO.conflict,undefined);assert.equal(S.monthSummary(combined.records,'JULIO').sales,1500);
});
test('meses complementarios se acumulan y los conflictos no reviven con una tercera copia',()=>{
 const header=['codigo_productora','mes','ventas_pen'];
 const p=tracking([header,['B','julio',100]],base),q=tracking([header,['B','agosto',200]],base),other=tracking([header,['B','julio',300]],base);
 let r=S.combine([p,q]);assert.deepEqual(S.monthsPresent(r.records),['JULIO','AGOSTO']);assert.equal(S.monthSummary(r.records,'AGOSTO').sales,200);
 r=S.combine([p,other,p]);assert.equal(r.records[0].months.JULIO.conflict,true);assert.equal(S.monthSummary(r.records,'JULIO').sales,null);
});
test('un conflicto de respuesta fija queda sin dato aunque se añada otra copia',()=>{
 const header=['Código','¿Usa su cuaderno de registros?','¿Vendió café en julio?'];
 const p=tracking([header,['B','Sí','Sí']],base),q=tracking([header,['B','No','Sí']],base);
 assert.equal(S.combine([p,q,p]).records[0].statics.bookUse,null);
});
test('No no se convierte en ventas cero; un número inválido no aparece como importe',()=>{
 const p=tracking([['codigo_productora','mes','vendio','ventas_pen'],['B','julio','No','1,5']],base);
 const r=S.combine([p]);assert.equal(S.monthSummary(r.records,'JULIO').sales,null);assert.equal(r.observations.length,1);
});
test('dos filas del mismo código y mes quedan fuera de la carga',()=>{
 const p=tracking([['codigo_productora','mes','ventas_pen'],['B','julio',100],['B','julio',100]],base);
 assert.equal(p.records.length,0);assert.equal(p.matched,0);
});
test('un año incompatible se rechaza sin unir meses de campañas distintas',()=>{
 assert.match(tracking([['codigo_productora','mes','ventas_pen','periodo'],['B','julio',100,2028]],base).error,/año/);
});
test('se encuentra una hoja compatible aunque el libro tenga notas',()=>{
 const p=S.readFile('p.xlsx',[{name:'Notas',matrix:[['Texto'],['Prueba']]},{name:'Mensual',matrix:[['codigo_productora','mes','ventas_pen'],['B','julio',100]]}],base,{period:2027});assert.equal(p.error,null);assert.equal(p.sheet,'Mensual');
});
test('el resumen de Excel distingue hojas vacías, ocultas y sobredimensionadas',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),X=require('../vendor/xlsx.full.min.js');
 const ctx={D,XLSX:X,document:{getElementById:()=>({addEventListener(){}})}};vm.createContext(ctx);
 vm.runInContext(fs.readFileSync(require.resolve('../js/importacion.js'),'utf8')+';this.inspect=inspectWorkbook;',ctx);
 const wb={SheetNames:['Visible','Oculta','Grande','Vacía'],Sheets:{Visible:{'!ref':'A1:B2',A1:{v:'codigo_productora',t:'s'},B1:{v:'cooperativa',t:'s'},A2:{v:'D1',t:'s'},B2:{v:'DEMO',t:'s'}},Oculta:{'!ref':'A1:A5'},Grande:{'!ref':'A1:ZZ999999'},Vacía:{}},Workbook:{Sheets:[{Hidden:0},{Hidden:1},{Hidden:0},{Hidden:0}]}};
 const result=ctx.inspect(wb);assert.equal(result.sheets.length,4);assert.equal(result.profiles.length,1);assert.equal(result.profiles[0].map.code,0);assert.equal(result.sheets[1].state,'Oculta');assert.equal(result.sheets[2].state,'Supera el límite');
});
test('el formato ancho no mezcla códigos iguales de cooperativas distintas',()=>{
 const p=tracking([['Código','Cooperativa','¿Vendió café en julio?'],['A','Uno','Sí'],['A','Dos','No']],base);assert.equal(p.records.length,2);assert.equal(S.combine([p]).records.length,2);
});
test('combinar perfiles de años distintos falla incluso fuera de la interfaz',()=>{
 const p=tracking([['codigo_productora','mes','ventas_pen'],['B','julio',100]],base,2027),q=tracking([['codigo_productora','mes','ventas_pen'],['B','julio',200]],base,2028);
 assert.throws(()=>S.combine([p,q]),/año/);
});
test('las categorías desconocidas no se interpretan como respuestas negativas',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../js/coops.js'),'utf8')+';this.ind=INDICATORS;',ctx);
 for(const [id,key] of [['smart','phone'],['net','internet'],['lit','literacy'],['sewer','water']])assert.equal(ctx.ind.find(i=>i.id===id).f({[key]:'DESCONOCIDO'}),null);
 const r=main([['codigo_productora','cooperativa','acceso_internet','agua_desague'],['A','B','En casa','Solo agua']]);assert.equal(r.records[0].internet,'EN_CASA');assert.equal(r.records[0].water,'SOLO_AGUA');
});
const R=require('../js/resumen_core.js');
test('el resumen se adapta a distritos, grupos locales y una sola cooperativa',()=>{
 const rows=[{coop:'Única',territory:'Copallín',province:'Bagua',base:'A',amount:1500},{coop:'Única',territory:'Copallín',province:'Bagua',base:'B',amount:1500}];
 const m=R.overview(rows);assert.equal(m.level,'base');assert.equal(m.groups.length,2);assert.equal(m.groups.reduce((n,g)=>n+g.n,0),2);
 assert.equal(R.overview([...rows,{coop:'Única',territory:'Otro',base:'C'}]).level,'territory');
 assert.equal(R.overview([rows[0]]).groups[0].n,1);assert.equal(R.overview([]).groups.length,0);
});
test('las áreas del resumen territorial son proporcionales a los registros',()=>{
 const tiles=R.tiles([{name:'A',n:8},{name:'B',n:2},{name:'C',n:1}]);
 assert.equal(tiles.length,3);assert.ok(Math.abs(tiles.reduce((s,t)=>s+t.w*t.h,0)-900*280)<1e-6);
 for(const t of tiles)assert.ok(Math.abs(t.w*t.h/(900*280)-t.n/11)<1e-10);
});
test('el resumen estadístico conserva los ceros y distingue moda y promedio',()=>{
 const numbers=R.describe([0,10,null],'number');assert.equal(numbers.mean,5);assert.equal(numbers.empty,1);assert.equal(numbers.min,0);
 const words=R.describe(['A','B','B',null],'category');assert.deepEqual(words.mode,['B']);assert.equal(words.modeN,2);
 assert.equal(R.describe([null,null],'number').mean,null);
 assert.deepEqual(R.describe(['A','B'],'category').mode,['A','B']);
});
test('la revisión distingue duplicados, identificadores vacíos y campos numéricos no válidos',()=>{
 const p=D.sheetProfile('Datos',[['codigo_productora','cooperativa','monto_solicitado_pen','observacion'],['A','X',0,'A'],['B','X','1,5','B'],['C','X',null,'B'],['D','X',1,'C'],['D','X',2,'D'],[null,'X',3,'E']]);
 const r=D.importProfiles([p],{numberMode:'dot'}),report=R.dataset(r.records,r.audit,p);
 assert.equal(report.repeated,2);assert.equal(report.missingKeys,1);
 const amount=report.columns.find(f=>f.key==='amount');assert.equal(amount.invalid,1);assert.equal(amount.empty,1);assert.equal(amount.stats.mean,0);
 assert.equal(report.extras.length,1);assert.equal(report.checks.filter(c=>!c.ok).length,3);
});
test('la navegación separa las fichas del fondo y de los datos',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../js/roles.js'),'utf8')+';this.roles=ROLES;',ctx);
 assert.equal(ctx.roles.consulta.pages.includes('producer'),false);assert.equal(ctx.roles.campo.pages.includes('producer'),true);assert.equal(ctx.roles.datos.pages.includes('producer'),false);
});
test('el formato del seguimiento usa punto decimal y no tiene selector de separador',()=>{
 const fs=require('node:fs');assert.equal(S.number('1,500.25').value,1500.25);assert.equal(S.number('1,5').value,null);
 assert.equal(fs.readFileSync(require.resolve('../index.html'),'utf8').includes('id="number-mode"'),false);
});
test('una columna con valores y sin encabezado se identifica en la revisión',()=>{
 const p=D.sheetProfile('P',[['codigo_productora','cooperativa',null],['A','X',20]]),r=D.importProfiles([p]);
 const report=R.dataset(r.records,r.audit,p);assert.equal(report.checks.find(c=>c.name==='Encabezados completos').ok,false);assert.equal(report.extras[0].header,'Columna 3 (sin título)');
});
