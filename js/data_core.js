/* Contrato v2: ausente es null. Adaptadores explícitos, sin imputaciones. */
(function(root){
'use strict';
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/\s+/g,' ');
const fields=[['code','codigo_productora','Código de productora'],['coop','cooperativa','Cooperativa'],['territory','distrito','Distrito'],['province','provincia','Provincia'],['base','base_sector','Base / sector'],['age','edad_al_cierre_2025','Edad al cierre de 2025'],['family','n_familiares_convivientes','Familiares convivientes'],['years','antiguedad_socio_titular_anios','Antigüedad del socio titular'],['area','area_cafe_reportada','Área de café (ha)'],['qq','quintales_acopiados_2025','Acopio 2025 (quintales)'],['income','ingreso_principal_pen_2025','Ingreso principal 2025 (S/)'],['amount','monto_solicitado_pen','Monto solicitado (S/)'],['activity','actividad_a_financiar','Actividad a financiar'],['phone','tipo_celular_beneficiaria','Celular de la beneficiaria'],['literacy','dificultad_lectoescritura','Dificultad de lectoescritura'],['birth','fecha_nacimiento_beneficiaria','Nacimiento (para derivar edad)'],
 ['education','nivel_educativo','Nivel educativo'],['internet','acceso_internet','Acceso a internet'],['water','agua_desague','Agua y desagüe'],['services','servicios_financieros','Servicios financieros (opción múltiple)'],['channels','canales_preferidos','Canales preferidos (opción múltiple)'],['yape','usa_yape','Usa Yape'],['savingsCoop','ahorro_capitalizacion_cooperativa','Ahorro en la cooperativa'],['coopCredit','credito_vigente_socio_cooperativa','Crédito vigente en la cooperativa'],['sysCredit','credito_vigente_beneficiaria_sistema','Crédito vigente en el sistema financiero'],['trainedCoop','capacitacion_cooperativa_2025','Capacitación de la cooperativa 2025'],['infocorp','infocorp_categoria','Categoría Infocorp']];
// Preguntas que no existen en todos los formularios: texto, opción múltiple (varias opciones en una respuesta) o 0/1.
const extraKinds={education:'str',internet:'str',water:'str',infocorp:'str',services:'multi',channels:'multi',yape:'bin',savingsCoop:'bin',coopCredit:'bin',sysCredit:'bin',trainedCoop:'bin'};
function bin(v){if(v==null||String(v).trim()==='')return null;if(typeof v==='number')return v===1?1:v===0?0:undefined;const s=norm(v);if(s==='SI'||s==='1')return 1;if(s==='NO'||s==='0')return 0;return undefined;}
function multi(v){if(v==null||String(v).trim()==='')return null;const parts=[...new Set(String(v).split(/[;,]/).map(norm).filter(Boolean))];return parts.length?parts:null;}
const numeric=['age','family','years','area','qq','income','amount'],pcaVars=['age','family','years','area','qq','income'];
const label=k=>fields.find(f=>f[0]===k)?.[2]||k,finite=v=>typeof v==='number'&&Number.isFinite(v);
function parseNumber(v,mode='auto'){
 if(v==null||String(v).trim()==='')return {value:null};if(typeof v==='number')return finite(v)?{value:v}:{value:null,error:'No es un número válido'};
 let s=String(v).trim().replace(/^(S\/|PEN)\s*/i,'').replace(/\s*(qq|quintales|anos|años)\s*$/i,'').replace(/\s/g,'');
 if(!/^[+-]?\d+(?:[.,]\d+)*$/.test(s))return {value:null,error:'Número no reconocido'};
 if(mode==='comma'){if(!/^[+-]?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/.test(s))return {value:null,error:'Número no válido con coma decimal'};s=s.replace(/\./g,'').replace(',','.');}
 else if(mode==='dot'){if(!/^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(s))return {value:null,error:'Número no válido con punto decimal'};s=s.replace(/,/g,'');}
 else{if(/^[+-]?\d+[.,]\d{3}$/.test(s)||(s.match(/[.,]/g)||[]).length>1)return {value:null,error:'No se sabe si la coma o el punto es decimal: elija cómo están escritos los números'};s=s.replace(',','.');}
 return finite(Number(s))?{value:Number(s)}:{value:null,error:'No es un número válido'};
}
function valid(v,k){return v>=0&&(!['age','family'].includes(k)||Number.isInteger(v))&&(k!=='age'||v<=120);}
const coop=v=>norm(v).replace(/_/g,' ')||null;
function phone(v){let s=norm(v).replace(/_/g,' ');if(!s)return null;if(['SMARTPHONE','TELEFONO INTELIGENTE'].includes(s))return 'SMARTPHONE';if(['TECLAS','BASICO','CELULAR DE TECLAS'].includes(s))return 'BASICO';if(['NINGUNO','NO TENGO CELULAR','SIN CELULAR'].includes(s))return 'NINGUNO';return 'OTRO / REVISAR';}
function literacy(v){let s=norm(v).replace(/_/g,' ');if(!s)return null;if(['NINGUNA','NO NO TENGO NINGUNA DIFICULTAD PARA LEER Y ESCRIBIR'].includes(s))return 'NINGUNA';if(['LECTURA','SOLO LECTURA','SI, SOLO PARA LEER'].includes(s))return 'LECTURA';if(['ESCRITURA','SOLO ESCRITURA','SI, SOLO PARA ESCRIBIR'].includes(s))return 'ESCRITURA';if(['AMBAS','SI TENGO DIFICULTADES CON AMBOS'].includes(s))return 'AMBAS';return 'OTRO / REVISAR';}
function activity(v){const s=norm(v).replace(/_/g,' ');if(!s)return null;if(s.includes('FERTILIZA'))return 'FERTILIZACIÓN';if(/CUY|GALLINA|CERDO|CRIANZA/.test(s))return 'CRIANZA DE ANIMALES';if(/BODEGA|APICULTURA|TOSTADO|EMPRENDIMIENTO/.test(s))return 'EMPRENDIMIENTO / OTROS';return s;}
function inferMap(headers){const map={};headers.forEach((h,i)=>{const s=norm(h),f=fields.find(f=>norm(f[1])===s);if(f){map[f[0]]=i;return;}
 const pats=[['code',/^1\. CODIGO\/PRODUCTORA$/],['birth',/^3\. FECHA DE NACIMIENTO DE LA BENEFICIARIA$/],['base',/^4\. BASE\/SECTOR DE LA BENEFICIARIA$/],['territory',/^4\.1 DISTRITO Y PROVINCIA DE LA BENEFICIARIA$/],['family',/^6\. NUMERO DE MIEMBROS DE LA FAMILIA/],['years',/^7\. TIEMPO DE ASOCIADO/],['area',/^9\. AREA DE CULTIVO DE CAFE$/],['qq',/^10\. QUINTALES ACOPIADOS DURANTE EL 2025$/],['income',/^(20|25)\. INGRESO ANUAL.*ACTIVIDAD PRINCIPAL.*2025/],['amount',/^(13|14)\. MONTO REQUERIDO EN SOLES$/],['activity',/^(12\. ACTIVIDAD SECUNDARIA PRODUCTIVA A FINANCIAR|13\. ¿CUAL ES LA ACTIVIDAD PRODUCTIVA A FINANCIAR)/],['phone',/^(26|27)\. ¿LA PRODUCTORA BENEFICIARIA TIENE SMARTPHONE/],['literacy',/^(25|26)\. ¿LA PRODUCTORA BENEFICIARIA TIENE DIFICULTADES PARA LEER Y ESCRIBIR/]];
 pats.forEach(([k,re])=>{if(re.test(s))map[k]=i;});});return map;}
function sheetProfile(name,matrix){let header=0,score=-1;matrix.slice(0,15).forEach((r,i)=>{const n=Object.keys(inferMap(r)).length;if(n>score){score=n;header=i;}});const s=norm(name),fixedCoop=s==='PRODUCTORAS NORANDINO'?'NORANDINO':s==='PRODUCTORAS BAGUA GRANDE'?'BAGUA GRANDE':'';return {name,matrix,header,map:inferMap(matrix[header]||[]),score,fixedCoop};}
function ageAt2025(v){let d;if(v instanceof Date)d=v;else if(typeof v==='number')d=new Date(Date.UTC(1899,11,30)+v*86400000);else if(/^\d{4}-\d{2}-\d{2}/.test(String(v)))d=new Date(String(v).slice(0,10)+'T00:00:00Z');else return null;return finite(d.getTime())?2025-d.getUTCFullYear():null;}
function importProfiles(profiles,{numberMode='auto',fileName=''}={}){
 const candidates=[],issues=[],quarantine=[];let emptyRows=0;
 for(const p of profiles){if(p.map.code===undefined||(p.map.coop===undefined&&!p.fixedCoop))throw Error('Mapee código y cooperativa, o indique una cooperativa para esa hoja.');
 for(let i=p.header+1;i<p.matrix.length;i++){const cells=p.matrix[i]||[];if(!cells.some(v=>v!=null&&String(v).trim()!=='')){emptyRows++;continue;}
 const get=k=>p.map[k]===undefined?null:cells[p.map[k]],issue=(field,reason)=>issues.push({sheet:p.name,row:i+1,field,reason});
 const r={code:String(get('code')??'').trim(),coop:coop(get('coop')||p.fixedCoop),sourceSheet:p.name,sourceRow:i+1};
 if(!r.code||!r.coop){quarantine.push({...r,reason:'Falta el código o la cooperativa'});continue;}
 for(const k of numeric){const x=parseNumber(get(k),numberMode);r[k]=x.value;if(x.error)issue(k,x.error);if(r[k]!==null&&!valid(r[k],k)){issue(k,'Valor fuera de rango; se dejó sin dato');r[k]=null;}}
 if(r.age===null&&norm(get('age'))===''&&get('birth')!=null){const a=ageAt2025(get('birth'));if(a!==null&&valid(a,'age'))r.age=a;else issue('birth','Fecha no reconocida; use una fecha de Excel o el formato AAAA-MM-DD');}
 for(const k of ['territory','province','base'])r[k]=get(k)==null?null:String(get(k)).trim()||null;
 r.activityRaw=get('activity');r.phoneRaw=get('phone');r.literacyRaw=get('literacy');r.activity=activity(r.activityRaw);r.phone=phone(r.phoneRaw);r.literacy=literacy(r.literacyRaw);
 for(const k of ['phone','literacy'])if(r[k]==='OTRO / REVISAR')issue(k,'Respuesta no reconocida; revisar el valor original');for(const [k,kind] of Object.entries(extraKinds)){const v=get(k);if(kind==='str')r[k]=v==null||String(v).trim()===''?null:norm(v);else if(kind==='multi')r[k]=multi(v);else{const b=bin(v);if(b===undefined){r[k]=null;issue(k,'Se esperaba 0/1 o SI/NO; se dejó sin dato');}else r[k]=b;}}
 candidates.push(r);
 }}
 const counts=new Map(),key=r=>JSON.stringify([r.coop,norm(r.code)]);for(const r of candidates)counts.set(key(r),(counts.get(key(r))||0)+1);
 const records=candidates.filter(r=>{if(counts.get(key(r))>1){quarantine.push({...r,reason:'Código repetido en la misma cooperativa: resolver antes de incluir'});return false;}return true;});
 const missing=Object.fromEntries(fields.filter(f=>f[0]!=='birth').map(([k])=>[k,records.filter(r=>r[k]==null).length]));
 return {records,audit:{contract:'2.0',fileName,accepted:records.length,quarantine,issues,emptyRows,missing,unmapped:unmappedFields(profiles),sensitive:sensitiveHeaders(profiles),period:2025,ageCutoff:'2025-12-31',imputed:0,areaUnit:'Hectáreas (confirmado por Producers Direct)',sheets:profiles.map(p=>({name:p.name,headerRow:p.header+1,fixedCoop:p.fixedCoop,mapping:Object.fromEntries(Object.entries(p.map).map(([k,v])=>[k,{column:v+1,header:String(p.matrix[p.header][v]??'')}]))}))}};
}
// Columnas de análisis que se esperan en cada hoja. Si el formulario cambia el texto de una pregunta,
// la columna deja de reconocerse: se avisa en vez de mostrar el campo como "sin respuestas".
const expectedFields=['territory','age','family','years','area','qq','income','amount','activity','phone','literacy'];
function unmappedFields(profiles){
 return profiles.map(p=>({sheet:p.name,fields:expectedFields.filter(k=>p.map[k]===undefined&&!(k==='age'&&p.map.birth!==undefined)).map(k=>({key:k,label:label(k)}))})).filter(s=>s.fields.length);
}
// Encabezados con datos personales. El tablero nunca los lee (solo usa columnas mapeadas), pero se avisa.
const sensitiveRules=[['DNI / documento',/\bDNI\b|DOCUMENTO DE IDENTIDAD|N(UMERO|RO)?\.? DE DOCUMENTO|\bRUC\b/],['Teléfono',/TELEFONO|NUMERO DE CELULAR|CELULAR DE CONTACTO|\bWHATSAPP\b.*NUMERO|NUMERO.*\bWHATSAPP\b/],['Nombre',/NOMBRE|APELLIDO/],['Correo',/CORREO|E-?MAIL/],['Dirección',/DIRECCION|DOMICILIO/]];
const notPersonal=/COOPERATIVA|ORGANIZACION|BASE|SECTOR|DISTRITO|PROVINCIA|ACTIVIDAD|INTELIGENTE|SMARTPHONE/;
function sensitiveHeaders(profiles){
 const out=[];
 for(const p of profiles){const used=new Set(Object.values(p.map));(p.matrix[p.header]||[]).forEach((h,i)=>{const s=norm(h);if(!s||used.has(i)||notPersonal.test(s))return;const rule=sensitiveRules.find(([,re])=>re.test(s));if(rule)out.push({sheet:p.name,column:i+1,header:String(h).trim(),kind:rule[0]});});}
 return out;
}
/* ---------- Carga guiada: qué contiene cada columna y si encaja con el dato esperado ---------- */
// Tipo de dato que espera cada campo del tablero.
const fieldKinds={code:'id',coop:'coop',birth:'date',age:'num',family:'num',years:'num',area:'num',qq:'num',income:'num',amount:'num',services:'multi',channels:'multi',yape:'bin',savingsCoop:'bin',coopCredit:'bin',sysCredit:'bin',trainedCoop:'bin'};
const fieldKind=k=>fieldKinds[k]||'cat';
const isBlankCell=v=>v==null||String(v).trim()==='';
const looksNumber=v=>typeof v==='number'?finite(v):parseNumber(v).value!==null;
const cellText=v=>v instanceof Date?v.toISOString().slice(0,10):String(v).trim();
// Resumen de cada columna con las primeras maxRows filas de datos.
function columnProfiles(matrix,header,maxRows=300){
 const heads=matrix[header]||[],rows=matrix.slice(header+1,header+1+maxRows),width=Math.max(heads.length,...rows.map(r=>(r||[]).length),0),out=[];
 for(let i=0;i<width;i++){const vals=rows.map(r=>(r||[])[i]).filter(v=>!isBlankCell(v));const texts=vals.map(cellText);
  out.push({index:i,header:isBlankCell(heads[i])?'':String(heads[i]).trim(),filled:vals.length,numeric:vals.filter(looksNumber).length,dates:vals.filter(v=>v instanceof Date).length,bin:vals.filter(v=>{const b=bin(v);return b===0||b===1;}).length,distinct:new Set(texts.map(norm)).size,samples:[...new Set(texts)].slice(0,3)});}
 return out;
}
const share=(a,b)=>b?a/b:0;
// ¿La columna encaja con el campo? Devuelve {ok:true} o {ok:false, reason} en lenguaje sencillo.
function columnCompat(key,col){
 if(!col)return {ok:true};
 if(!col.filled)return {ok:false,reason:'La columna está vacía en las filas revisadas.'};
 const kind=fieldKind(key),n=col.filled;
 if(kind==='num'&&share(col.numeric,n)<0.6)return {ok:false,reason:`Se esperan números, pero solo ${col.numeric} de ${n} valores lo son.`};
 if(kind==='date'&&share(col.dates+col.numeric,n)<0.6)return {ok:false,reason:`Se esperan fechas, pero solo ${col.dates+col.numeric} de ${n} valores lo son.`};
 if(kind==='id'&&n>=5&&share(col.distinct,n)<0.8)return {ok:false,reason:`Los códigos deberían ser distintos, pero hay solo ${col.distinct} valores distintos en ${n} filas.`};
 if(kind==='coop'&&col.distinct>10)return {ok:false,reason:`Se esperan pocas cooperativas, pero hay ${col.distinct} valores distintos.`};
 if((kind==='cat'||kind==='multi'||kind==='coop')&&share(col.numeric,n)>=0.8)return {ok:false,reason:'Se espera texto, pero la columna tiene casi solo números.'};
 if(kind==='bin'&&share(col.bin,n)<0.8)return {ok:false,reason:`Se espera Sí/No (o 1/0), pero solo ${col.bin} de ${n} valores lo son.`};
 return {ok:true};
}
const stopWords=new Set(['DE','LA','EL','EN','DEL','LOS','LAS','POR','QUE','CON','UNA','SUS','PARA','TIENE','BENEFICIARIA','PRODUCTORA']);
const tokens=s=>norm(s).split(/[^A-Z0-9Ñ]+/).filter(t=>t.length>=3&&!stopWords.has(t));
// Parecido entre el título de la columna y el campo: palabras en común (o con la misma raíz).
function nameScore(key,header){const f=fields.find(x=>x[0]===key);if(!f||!header)return 0;const a=[...new Set([...tokens(f[1].replace(/_/g,' ')),...tokens(f[2])])];return tokens(header).filter(t=>a.includes(t)||a.some(x=>x.length>=5&&t.length>=5&&t.slice(0,5)===x.slice(0,5))).length;}
// Columnas sugeridas para un campo: compatibles y con nombre parecido (o la ya asignada).
function suggestedColumns(key,cols,current){
 return cols.filter(c=>c.header&&(c.index===current||(columnCompat(key,c).ok&&nameScore(key,c.header)>0))).sort((a,b)=>(b.index===current)-(a.index===current)||nameScore(key,b.header)-nameScore(key,a.header)||a.index-b.index).slice(0,8).map(c=>c.index);
}
// Cooperativas y filas que entrarían, antes de importar.
function scopePreview(profiles){
 const counts=new Map();
 for(const p of profiles){if(p.map.code===undefined)continue;for(let i=p.header+1;i<p.matrix.length;i++){const r=p.matrix[i]||[];if(isBlankCell(r[p.map.code]))continue;const c=coop(p.map.coop===undefined?p.fixedCoop:(r[p.map.coop]||p.fixedCoop))||'SIN COOPERATIVA';counts.set(c,(counts.get(c)||0)+1);}}
 return [...counts].map(([name,rows])=>({coop:name,rows})).sort((a,b)=>b.rows-a.rows);
}
// Mapeo guardado: cada campo se identifica por el TEXTO del encabezado, no por su posición.
function exportMapping(profiles,{formVersion='',fileName=''}={}){
 return {tipo:'pd-mapeo-productoras',version:1,formulario:formVersion||null,archivoOrigen:fileName||null,creado:new Date().toISOString().slice(0,10),
  hojas:profiles.map(p=>({hoja:p.name,filaTitulos:p.header+1,cooperativaFija:p.fixedCoop||null,campos:Object.fromEntries(Object.entries(p.map).map(([k,i])=>[k,String((p.matrix[p.header]||[])[i]??'').trim()]))}))};
}
function applyMapping(profile,saved){
 if(!saved||saved.tipo!=='pd-mapeo-productoras'||!Array.isArray(saved.hojas)||!saved.hojas.length)throw Error('El archivo no es un mapeo guardado desde este tablero.');
 const sheet=saved.hojas.find(h=>h.hoja===profile.name)||saved.hojas[0],wanted=Object.values(sheet.campos||{}).map(norm);
 const hits=r=>{const heads=(profile.matrix[r]||[]).map(norm);return wanted.filter(h=>heads.includes(h)).length;};
 const savedRow=Number(sheet.filaTitulos)-1;if(Number.isInteger(savedRow)&&savedRow>=0&&hits(savedRow)>hits(profile.header))profile.header=savedRow;
 const heads=(profile.matrix[profile.header]||[]).map(norm),map={},missing=[];
 for(const [k,h] of Object.entries(sheet.campos||{})){const i=heads.indexOf(norm(h));if(i>=0)map[k]=i;else missing.push({key:k,label:label(k),header:h});}
 profile.map=map;if(sheet.cooperativaFija&&!profile.fixedCoop)profile.fixedCoop=sheet.cooperativaFija;
 return {applied:Object.keys(map).length,missing,formVersion:saved.formulario||''};
}
const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
function median(a){const b=a.filter(finite).sort((a,b)=>a-b);return b.length?(b[Math.floor((b.length-1)/2)]+b[Math.ceil((b.length-1)/2)])/2:null;}
function ranks(a){const b=a.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v),r=[];for(let i=0;i<b.length;){let j=i+1;while(j<b.length&&b[j].v===b[i].v)j++;for(let k=i;k<j;k++)r[b[k].i]=(i+j+1)/2;i=j;}return r;}
// Mediana de la cooperativa de la productora para la hoja "Mi finca". Solo con minN productoras con dato.
function peerMedian(allRows,row,key,minN=5){const vals=allRows.filter(r=>r.coop===row.coop&&finite(r[key])).map(r=>r[key]);return vals.length>=minN?{median:median(vals),n:vals.length}:null;}
function correlation(rows,x,y,method='pearson'){const pairs=rows.filter(r=>finite(r[x])&&finite(r[y]));let a=pairs.map(r=>r[x]),b=pairs.map(r=>r[y]);const n=a.length;if(n<3)return {n,value:null};if(method==='spearman'){a=ranks(a);b=ranks(b);}const ma=mean(a),mb=mean(b);let aa=0,bb=0,ab=0;a.forEach((v,i)=>{aa+=(v-ma)**2;bb+=(b[i]-mb)**2;ab+=(v-ma)*(b[i]-mb);});return {n,value:aa>0&&bb>0?Math.max(-1,Math.min(1,ab/Math.sqrt(aa*bb))):null};}
const api={norm,fields,extraKinds,numeric,pcaVars,label,parseNumber,phone,literacy,activity,inferMap,sheetProfile,importProfiles,unmappedFields,fieldKind,columnProfiles,columnCompat,nameScore,suggestedColumns,scopePreview,exportMapping,applyMapping,sensitiveHeaders,peerMedian,finite,mean,median,ranks,correlation};root.PDData=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
