/* Una sola transformación: importa con el mismo contrato JavaScript que usa la web.
   Uso: node scripts/preparar.cjs --raw archivo.xlsx --clean archivo.xlsx --out data/processed */
const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto');
const X=require('../vendor/xlsx.full.min.js'), D=require('../js/data_core.js'), P=require('../js/pca_engine.js');
const parse=(file,names)=>{
  const bytes=fs.readFileSync(file), wb=X.read(bytes,{type:'buffer',cellDates:true});
  const profiles=names.map(name=>{
    if(!wb.Sheets[name])throw Error('No se encontró la hoja '+name);
    return D.sheetProfile(name,X.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:null,blankrows:true,raw:true}));
  });
  const result=D.importProfiles(profiles,{fileName:path.basename(file),includeOutliers:true});
  return {...result,profiles,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
};
const key=r=>JSON.stringify([D.norm(r.coop),D.norm(r.code)]);
const rawNames=['Productoras Norandino','Productoras Bagua Grande'];
const blank=v=>v==null||String(v).trim()==='';
const same=(x,y)=>JSON.stringify(Array.isArray(x)?[...x].sort():x)===JSON.stringify(Array.isArray(y)?[...y].sort():y);
const stats=(data,k)=>{
  const vals=data.map(r=>r[k]).filter(D.finite).sort((a,b)=>a-b);
  return vals.length?{n:vals.length,min:vals[0],mediana:D.median(vals),max:vals.at(-1)}:null;
};
const fields=D.fields.filter(([k])=>!['birth','infocorp'].includes(k));
const exportFields=[...fields.map(f=>f[1]),'periodo','hoja_origen','fila_excel_origen'];
const pack=(r,period)=>[...fields.map(([k])=>Array.isArray(r[k])?r[k].join('; '):r[k]),period,r.originalSheet,r.originalRow];
function writeCSV(out,name,headers,rows){
  fs.writeFileSync(path.join(out,name),'\ufeff'+[headers,...rows].map(row=>row.map(D.csvCell).join(',')).join('\r\n')+'\r\n');
}
function exportRaw(raw,out){
  const rows=raw.records.map(r=>pack(r,raw.audit.period));
  writeCSV(out,'base_operativa_desde_raw.csv',exportFields,rows);
  const book=X.utils.book_new();
  X.utils.book_append_sheet(book,X.utils.aoa_to_sheet([exportFields,...rows]),'Productoras');
  fs.writeFileSync(path.join(out,'base_operativa_desde_raw.xlsx'),Buffer.from(X.write(book,{bookType:'xlsx',type:'array'})));
  fs.writeFileSync(path.join(out,'auditoria_raw.json'),JSON.stringify(raw.audit,null,2)+'\n');
}
function main(args){
  const get=k=>args[args.indexOf(k)+1];
  if(!['--raw','--out',...(args.includes('--clean')?['--clean']:[])].every(k=>args.includes(k)&&get(k)&&!get(k).startsWith('--')))
    throw Error('Uso: node scripts/preparar.cjs --raw original.xlsx --out data/processed [--clean base_de_referencia.xlsx]');
  const raw=parse(get('--raw'),rawNames);
  const clean=args.includes('--clean')?parse(get('--clean'),['Productoras']):null;
  if(!raw.records.length||(clean&&!clean.records.length))throw Error('Se requiere al menos un registro válido por archivo.');
  const out=get('--out');
  const sourcePaths=[get('--raw'),...(clean?[get('--clean')]:[])].map(p=>fs.realpathSync(p));
  fs.mkdirSync(out,{recursive:true});
  const generated=path.join(out,'base_operativa_desde_raw.xlsx');
  if(fs.existsSync(generated)&&sourcePaths.includes(fs.realpathSync(generated)))throw Error('El archivo generado no puede ser una entrada en el mismo directorio de salida.');
  exportRaw(raw,out);
  if(!clean){
    console.log(JSON.stringify({archivo:generated,filas:raw.records.length,periodo:raw.audit.period},null,2));
    return;
  }
  const sourceIndex=new Map(raw.records.map(r=>[key(r),r]));
  const cleanIndex=new Map(clean.records.map(r=>[key(r),r]));
  const cleanOnly=clean.records.filter(r=>!sourceIndex.has(key(r))).length;
  const rawOnly=raw.records.filter(r=>!cleanIndex.has(key(r))).length;
  const pRaw=new Map(raw.profiles.map(p=>[p.name,p]));
  const table=fields.map(([field,canonical,label])=>{
    let mapped=0,sourceNull=0,sourceNum=0,sourceText=0,changes=0,compared=0;
    const differences=[];
    for(const r of clean.records){
      const rr=sourceIndex.get(key(r));if(!rr)continue;
      const p=pRaw.get(rr.sourceSheet),col=p.map[field];
      if(col!==undefined){mapped++;const x=p.matrix[rr.sourceRow-1]?.[col];if(blank(x))sourceNull++;else if(typeof x==='number')sourceNum++;else sourceText++;}
      compared++;if(!same(rr[field],r[field])){changes++;differences.push({cooperativa:r.coop,codigo:r.code,hoja:rr.sourceSheet,fila:rr.sourceRow,valor_normalizado_raw:rr[field],valor_base_limpia:r[field]});}
    }
    const rawOutliers=raw.audit.outliers.filter(r=>r.field===field).length;
    const cleanOutliers=clean.audit.outliers.filter(r=>r.field===field).length;
    const cleanValues=clean.records.map(r=>r[field]).filter(v=>v!=null);
    return {field,canonical,label,raw_issues:raw.audit.issues.filter(x=>x.field===field).length,clean_issues:clean.audit.issues.filter(x=>x.field===field).length,
      clean_number:cleanValues.filter(v=>typeof v==='number').length,clean_text:cleanValues.filter(v=>typeof v==='string').length,clean_list:cleanValues.filter(Array.isArray).length,
      raw_column_rows:mapped,raw_cell_blanks:sourceNull,raw_numbers:sourceNum,raw_text_or_other:sourceText,raw_normalized_missing:raw.audit.missing[field],clean_missing:clean.audit.missing[field],compared,changes,rawOutliers,cleanOutliers,rawStats:stats(raw.records,field),cleanStats:stats(clean.records,field),differences};
  });
  const pca=P.fitPCA(clean.records);
  const sums=Object.fromEntries(['amount','area','qq'].map(k=>[k,clean.records.filter(r=>D.finite(r[k])).reduce((s,r)=>s+r[k],0)]));
  const sourceRows=clean.records.filter(r=>sourceIndex.has(key(r)));
  const originMatch=sourceRows.filter(r=>{const rr=sourceIndex.get(key(r));return rr.sourceSheet===r.originalSheet&&rr.sourceRow===r.originalRow;}).length;
  const summary={node:process.version,contract:'2.2',rawSha256:raw.sha256,cleanSha256:clean.sha256,rawN:raw.records.length,cleanN:clean.records.length,cleanOnly,rawOnly,originMatch,rawQuarantine:raw.audit.quarantine.length,cleanQuarantine:clean.audit.quarantine.length,rawIssues:raw.audit.issues.length,cleanIssues:clean.audit.issues.length,coopCounts:Object.fromEntries([...new Set(clean.records.map(r=>r.coop))].map(g=>[g,clean.records.filter(r=>r.coop===g).length])),sums,pca:pca.ok?{n:pca.n,variance:pca.variance}:null,table};
  const write=(name,data)=>fs.writeFileSync(path.join(out,name),JSON.stringify(data,null,2)+'\n');
  write('comparacion.json',summary);write('auditoria_limpia.json',clean.audit);
  writeCSV(out,'base_operativa_limpia.csv',exportFields,clean.records.map(r=>pack(r,clean.audit.period)));
  const summaryCols=['canonical','label','raw_column_rows','raw_cell_blanks','raw_numbers','raw_text_or_other','raw_normalized_missing','raw_issues','rawOutliers','clean_missing','clean_number','clean_text','clean_list','clean_issues','cleanOutliers','compared','changes'];
  writeCSV(out,'antes_despues.csv',summaryCols,table.map(r=>summaryCols.map(k=>r[k])));
  console.log(JSON.stringify({raw:summary.rawN,limpia:summary.cleanN,coincidenFilasOrigen:originMatch,camposComparados:fields.length,rawOnly,cleanOnly,totales:sums,diferencias:table.filter(r=>r.changes).map(r=>[r.canonical,r.changes]),sinImputar:true},null,2));
}
if(require.main===module)try{main(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=1;}
