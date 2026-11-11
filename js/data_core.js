/* Contrato v2: ausente es null. Adaptadores explícitos, sin imputaciones. */
(function(root){
'use strict';
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/\s+/g,' ');
const fields=[['code','codigo_productora','Código de productora'],['coop','cooperativa','Cooperativa'],['territory','distrito','Distrito'],['province','provincia','Provincia'],['base','base_sector','Base / sector'],['age','edad_al_cierre','Edad'],['family','n_familiares_convivientes','Familiares convivientes'],['years','antiguedad_socio_titular_anios','Antigüedad del socio titular'],['area','area_cafe_reportada','Área de café'],['qq','quintales_acopiados','Café entregado (quintales)'],['income','ingreso_principal_pen','Ingreso principal (S/)'],['amount','monto_solicitado_pen','Monto solicitado (S/)'],['activity','actividad_a_financiar','Actividad a financiar'],['phone','tipo_celular_beneficiaria','Celular de la beneficiaria'],['literacy','dificultad_lectoescritura','Dificultad de lectoescritura'],['birth','fecha_nacimiento_beneficiaria','Nacimiento (para derivar edad)'],
 ['education','nivel_educativo','Nivel educativo'],['internet','acceso_internet','Acceso a internet'],['water','agua_desague','Agua y desagüe'],['services','servicios_financieros','Servicios financieros (opción múltiple)'],['channels','canales_preferidos','Canales preferidos (opción múltiple)'],['yape','usa_yape','Usa Yape'],['savingsCoop','ahorro_capitalizacion_cooperativa','Ahorros o aportes de capital de la beneficiaria'],['coopCredit','credito_vigente_socio_cooperativa','Crédito vigente en la cooperativa'],['sysCredit','credito_vigente_beneficiaria_sistema','Crédito vigente en el sistema financiero'],['trainedCoop','capacitacion_cooperativa','Capacitación de la cooperativa'],['infocorp','infocorp_categoria','Categoría Infocorp']];
// Preguntas que no existen en todos los formularios: texto, opción múltiple (varias opciones en una respuesta) o 0/1.
const extraKinds={education:'str',internet:'str',water:'str',infocorp:'str',services:'multi',channels:'multi',yape:'bin',savingsCoop:'bin',coopCredit:'bin',sysCredit:'bin',trainedCoop:'bin'};
function bin(v){if(typeof v==='boolean')return v?1:0;if(v==null||String(v).trim()==='')return null;if(typeof v==='number')return v===1?1:v===0?0:undefined;const s=norm(v);if(s==='SI'||s==='1')return 1;if(s==='NO'||s==='0')return 0;return undefined;}
function multi(v){if(v==null||String(v).trim()==='')return null;const parts=[...new Set(String(v).split(/[;,]/).map(norm).filter(Boolean))];return parts.length?parts:null;}
const numeric=['age','family','years','area','qq','income','amount'],pcaVars=['age','family','years','area','qq','income'];
const label=k=>fields.find(f=>f[0]===k)?.[2]||k,finite=v=>typeof v==='number'&&Number.isFinite(v);
function parseNumber(v,mode='auto'){
 if(v==null||String(v).trim()==='')return {value:null};if(typeof v==='number')return finite(v)?{value:v}:{value:null,error:'No es un número válido'};
 let s=String(v).trim().replace(/^(S\/|PEN)\s*/i,'').replace(/\s*(qq|quintales|anos|años)\s*$/i,'').replace(/\s/g,'');
 if(!/^[+-]?\d+(?:[.,]\d+)*$/.test(s))return {value:null,error:'Número no reconocido'};
 if(mode==='comma'){if(!/^[+-]?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/.test(s))return {value:null,error:'Número no válido con coma decimal'};s=s.replace(/\./g,'').replace(',','.');}
 else if(mode==='dot'){if(!/^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(s))return {value:null,error:'Número no válido con punto decimal'};s=s.replace(/,/g,'');}
 else{if(/^[+-]?\d+[.,]\d{3}$/.test(s)||(s.match(/[.,]/g)||[]).length>1)return {value:null,error:'Separador ambiguo: guarda esta celda como número en Excel'};s=s.replace(',','.');}
 return finite(Number(s))?{value:Number(s)}:{value:null,error:'No es un número válido'};
}
function valid(v,k){return v>=0&&(!['age','family'].includes(k)||Number.isInteger(v))&&(k!=='age'||v<=120);}
const coop=v=>norm(v).replace(/_/g,' ')||null;
function phone(v){let s=norm(v).replace(/_/g,' ');if(!s)return null;if(['SMARTPHONE','TELEFONO INTELIGENTE'].includes(s))return 'SMARTPHONE';if(['TECLAS','BASICO','CELULAR DE TECLAS'].includes(s))return 'BASICO';if(['NINGUNO','NO TENGO CELULAR','SIN CELULAR'].includes(s))return 'NINGUNO';return 'OTRO / REVISAR';}
function literacy(v){let s=norm(v).replace(/_/g,' ');if(!s)return null;if(['NINGUNA','NO NO TENGO NINGUNA DIFICULTAD PARA LEER Y ESCRIBIR'].includes(s))return 'NINGUNA';if(['LECTURA','SOLO LECTURA','SI, SOLO PARA LEER'].includes(s))return 'LECTURA';if(['ESCRITURA','SOLO ESCRITURA','SI, SOLO PARA ESCRIBIR'].includes(s))return 'ESCRITURA';if(['AMBAS','SI TENGO DIFICULTADES CON AMBOS'].includes(s))return 'AMBAS';return 'OTRO / REVISAR';}
function activity(v){const s=norm(v).replace(/_/g,' ');if(!s)return null;if(s.includes('FERTILIZA'))return 'FERTILIZACIÓN';if(/CUY|GALLINA|CERDO|CRIANZA/.test(s))return 'CRIANZA DE ANIMALES';if(/BODEGA|APICULTURA|TOSTADO|EMPRENDIMIENTO/.test(s))return 'EMPRENDIMIENTO / OTROS';return s;}
const datedFields=new Set(['age','qq','income','trainedCoop']);
const yearsIn=v=>[...new Set((String(v??'').match(/(?<!\d)(?:19|20|21)\d{2}(?!\d)/g)||[]).map(Number))];
const heading=v=>norm(v).replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');
const yearColumn=/^(?:ANIO|ANO|YEAR|PERIODO|ANIO_ENCUESTA|ANO_ENCUESTA|ANIO_DE_LA_ENCUESTA|PERIODO_ENCUESTA)$/;
const aliases={code:['CODIGO','CODIGO_DE_PRODUCTORA','ID_PRODUCTORA'],coop:['COOPERATIVA_DE_LA_PRODUCTORA'],age:['EDAD'],qq:['CAFE_ENTREGADO_QUINTALES','ACOPIO_QUINTALES'],income:['INGRESO_PRINCIPAL']};
 const pats=[['code',/^1\. CODIGO\/PRODUCTORA$/],['birth',/^3\. FECHA DE NACIMIENTO DE LA BENEFICIARIA$/],['base',/^4\. BASE\/SECTOR DE LA BENEFICIARIA$/],['territory',/^4\.1 DISTRITO Y PROVINCIA DE LA BENEFICIARIA$/],['family',/^6\. NUMERO DE MIEMBROS DE LA FAMILIA/],['years',/^7\. TIEMPO DE ASOCIADO/],['services',/^1[56]\. ¿QUE SERVICIOS FINANCIEROS/],['savingsCoop',/^17\. ¿LA BENEFICIARIA CUENTA CON ALGUN AHORRO/],['coopCredit',/^1[68]\. ¿LA SOCIA TITULAR.*CREDITOS VIGENTES/],['sysCredit',/^1[89]\.\s*¿LA BENEFICIARIA TIENE CREDITOS EN EL SISTEMA/],['trainedCoop',/^2[23]\. PRODUCTORA BENEFICIA.*ACTIVIDADES DE CAPACITACION DE LA COOPERATIVA/],['education',/^2[45]\. NIVEL O GRADO EDUCATIVO/],['channels',/^2[89]\. ¿PREFIERE LAS LLAMADAS/],['internet',/^(29|30)\. ¿ACCEDE A INTERNET/],['water',/^3[12]\. ¿CUENTA CON AGUA Y DESAGUE/],['area',/^9\. AREA DE CULTIVO DE CAFE$/],['qq',/^10\. QUINTALES (?:ACOPIADOS|ENTREGADOS) ?(?:DURANTE EL (?:19|20|21)\d{2})?$/],['income',/^(20|25)\. INGRESO ANUAL.*ACTIVIDAD PRINCIPAL/],['amount',/^(13|14)\. MONTO REQUERIDO EN SOLES$/],['activity',/^(12\. ACTIVIDAD SECUNDARIA PRODUCTIVA A FINANCIAR|13\. ¿CUAL ES LA ACTIVIDAD PRODUCTIVA A FINANCIAR)/],['phone',/^(26|27)\. ¿LA PRODUCTORA BENEFICIARIA TIENE SMARTPHONE/],['literacy',/^(25|26)\. ¿LA PRODUCTORA BENEFICIARIA TIENE DIFICULTADES PARA LEER Y ESCRIBIR/]];
function detectedField(h){
 const raw=norm(h),clean=heading(h);
 const f=fields.find(([k,name,title])=>[heading(name),heading(title),...(aliases[k]||[])].some(a=>clean===a||(datedFields.has(k)&&clean.replace(/_(?:DE_)?(?:19|20|21)\d{2}$/,'')===a)));
 return f?.[0]||pats.find(([,re])=>re.test(raw))?.[0];
}
function inferMap(headers){
 const buckets=new Map();
 headers.forEach((h,i)=>{const k=detectedField(h);if(k)buckets.set(k,[...(buckets.get(k)||[]),i]);});
 return Object.fromEntries([...buckets].filter(([,is])=>is.length===1).map(([k,[i]])=>[k,i]));
}
function ambiguousFields(headers){
 const keys=headers.map(detectedField).filter(Boolean);
 return [...new Set(keys.filter((k,i)=>keys.indexOf(k)!==i))];
}
function resolvePeriod(profiles){
 const years=new Set();
 for(const p of profiles){
  const headers=p.matrix[p.header]||[];
  for(const k of datedFields)if(p.map[k]!==undefined) yearsIn(headers[p.map[k]]).forEach(y=>years.add(y));
  const cols=headers.map((h,i)=>yearColumn.test(heading(h))?i:-1).filter(i=>i>=0);
  if(cols.length>1)throw Error('Deja una sola columna de año o periodo.');
  if(cols.length){
   for(let i=p.header+1;i<p.matrix.length;i++){
    const row=p.matrix[i]||[];
    if(p.map.code===undefined||!norm(row[p.map.code]))continue;
    const val=String(row[cols[0]]??'').trim();
    if(!val)continue;
    if(!/^(?:19|20|21)\d{2}$/.test(val))throw Error('Usa un año de cuatro dígitos en la columna de periodo.');
    years.add(Number(val));
   }
  }
 }
 if(years.size>1)throw Error('El archivo mezcla periodos. Carga un año por separado o ajusta las columnas seleccionadas.');
 return [...years][0]??null;
}
function sheetProfile(name,matrix){let header=0,score=-1;matrix.slice(0,15).forEach((r,i)=>{const n=Object.keys(inferMap(r)).length;if(n>score){score=n;header=i;}});const s=norm(name),fixedCoop=s==='PRODUCTORAS NORANDINO'?'NORANDINO':s==='PRODUCTORAS BAGUA GRANDE'?'BAGUA GRANDE':'';return {name,matrix,header,map:inferMap(matrix[header]||[]),score,fixedCoop};}
// Nombres de lugares: espacios y guiones uniformes ("Bosques Del Santuario -guayabal" -> "Bosques Del Santuario - guayabal").
const cleanPlace=s=>String(s).replace(/\s+/g,' ').replace(/\s*-\s*/g,' - ').trim();
// Variantes que solo difieren en mayúsculas o tildes se juntan bajo la más frecuente. El original queda en <campo>Raw.
function unifyPlaces(records){for(const k of ['territory','province','base']){const byKey=new Map();for(const r of records){if(r[k]==null)continue;const key=norm(r[k]);if(!byKey.has(key))byKey.set(key,new Map());const m=byKey.get(key);m.set(r[k],(m.get(r[k])||0)+1);}
 const pick=new Map([...byKey].map(([key,m])=>[key,[...m].sort((a,b)=>b[1]-a[1])[0][0]]));for(const r of records)if(r[k]!=null)r[k]=pick.get(norm(r[k]));}}
function ageAtYearEnd(v,year){let d;if(v instanceof Date)d=v;else if(typeof v==='number')d=new Date(Date.UTC(1899,11,30)+v*86400000);else if(/^\d{4}-\d{2}-\d{2}$/.test(String(v))){d=new Date(String(v)+'T00:00:00Z');if(!finite(d.getTime())||d.toISOString().slice(0,10)!==String(v))return null;}else return null;return finite(d.getTime())?year-d.getUTCFullYear():null;}
function importProfiles(profiles,{numberMode='auto',fileName='',includeOutliers=false}={}){
 for(const p of profiles){const values=Object.values(p.map);if(new Set(values).size!==values.length)throw Error('Una columna no puede asignarse a dos campos.');}
 const period=resolvePeriod(profiles);
 const candidates=[],issues=[],quarantine=[];let emptyRows=0;
 for(const p of profiles){if(sensitiveHeaders([p]).some(s=>Object.values(p.map).includes(s.column-1)))throw Error('No se pueden asignar campos personales.');
 if(p.map.code===undefined||(p.map.coop===undefined&&!p.fixedCoop))throw Error('Mapee código y cooperativa, o indique una cooperativa para esa hoja.');
 for(let i=p.header+1;i<p.matrix.length;i++){const cells=p.matrix[i]||[];if(!cells.some(v=>v!=null&&String(v).trim()!=='')){emptyRows++;continue;}
 const get=k=>p.map[k]===undefined?null:cells[p.map[k]],issue=(field,reason)=>issues.push({sheet:p.name,row:i+1,field,reason});
 const heads=(p.matrix[p.header]||[]).map(norm);
 const os=cells[heads.indexOf('HOJA_ORIGEN')], or=cells[heads.indexOf('FILA_EXCEL_ORIGEN')];
 const r={code:String(get('code')??'').trim(),coop:coop(get('coop')||(p.map.coop===undefined?p.fixedCoop:null)),sourceSheet:p.name,sourceRow:i+1,originalSheet:typeof os==='string'?os:p.name,originalRow:Number.isInteger(or)&&or>0?or:i+1};
 if(!r.code||!r.coop){quarantine.push({...r,reason:'Falta el código o la cooperativa'});continue;}
 for(const k of numeric){const x=parseNumber(get(k),numberMode);r[k]=x.value;if(x.error)issue(k,x.error);if(r[k]!==null&&!valid(r[k],k)){issue(k,'Valor fuera de rango; no se usa en los cálculos');r[k]=null;}}
 if(r.age===null&&norm(get('age'))===''&&get('birth')!=null&&period!==null){const a=ageAtYearEnd(get('birth'),period);if(a!==null&&valid(a,'age'))r.age=a;else issue('birth','Fecha no reconocida; use una fecha de Excel o el formato AAAA-MM-DD');}
 for(const k of ['territory','province','base']){const raw=get(k)==null?null:String(get(k)).trim()||null;r[k+'Raw']=raw;r[k]=raw&&cleanPlace(raw);}
 r.activityRaw=get('activity');r.phoneRaw=get('phone');r.literacyRaw=get('literacy');r.activity=activity(r.activityRaw);r.phone=phone(r.phoneRaw);r.literacy=literacy(r.literacyRaw);
 for(const k of ['phone','literacy'])if(r[k]==='OTRO / REVISAR')issue(k,'Respuesta no reconocida; revisar el valor original');for(const [k,kind] of Object.entries(extraKinds)){const v=get(k);if(kind==='str')r[k]=v==null||String(v).trim()===''?null:norm(v);else if(kind==='multi')r[k]=multi(v);else{const b=bin(v);if(b===undefined){r[k]=null;issue(k,'Se esperaba 0/1 o SI/NO; no se usa en los cálculos');}else r[k]=b;}}
 // Adaptaciones explícitas para los dos formularios originales.
 const loc=r.territory?.match(/^(.*?)\s*-\s*(.*?)$/);
 if(p.fixedCoop && !r.province && loc?.[1] && loc?.[2]) { r.territory=loc[1]; r.province=loc[2]; }
 const serviceDict=[['CUENTA_BANCARIA',/CUENTAS? BANCARIAS?/],['CAJA_AHORRO',/CAJAS? DE AHORROS?/],['NINGUNO',/NINGUN[OA]/],['YAPE',/\bYAPE\b/],['PLIN',/\bPLIN\b/]];
 const channelDict=[['LLAMADAS',/LLAMADAS/],['WHATSAPP',/WHATSAPP/],['SMS',/\bSMS\b/]];
 for(const [k,dict] of [['services',serviceDict],['channels',channelDict]]) {
   const v=norm(get(k));
   if(v && p.fixedCoop) { const matches=dict.filter(([,rx])=>rx.test(v)).map(([name])=>name);r[k]=matches.length?matches:r[k]; }
 }
 if(r.services?.length && p.map.yape===undefined) r.yape=r.services.includes('NINGUNO')&&r.services.length>1?null:r.services.includes('YAPE')?1:0;
 for(const k of ['internet','water'])if(r[k])r[k]=r[k].replace(/ /g,'_');
 if(r.education){r.education=r.education.replace(/ /g,'_');if(r.education==='ESTUDIOS_TECNICOS_COMPLETOS')r.education='TECNICO_COMPLETO';}
 if(p.fixedCoop && r.internet){const v=norm(get('internet'));r.internet=/^SI, EN MI CASA/.test(v)?'EN_CASA':/NO HAY SENAL/.test(v)?'SIN_SENAL_SECTOR':/SALIR FUERA/.test(v)?'FUERA_DE_CASA':r.internet;}
 if(p.fixedCoop && r.water) r.water=/AMBOS/.test(r.water)?'AMBOS':r.water.replace(/ /g,'_');
 if(r.services?.includes('NINGUNO') && r.services.length>1)issue('services','Respuesta contradictoria: marcó Ninguno y otro servicio. Se conserva para revisión.');
 candidates.push(r);
 }}
 const counts=new Map(),key=r=>JSON.stringify([r.coop,norm(r.code)]);for(const r of candidates)counts.set(key(r),(counts.get(key(r))||0)+1);
 const records=candidates.filter(r=>{if(counts.get(key(r))>1){quarantine.push({...r,reason:'Código repetido en la misma cooperativa: resolver antes de incluir'});return false;}return true;});
 unifyPlaces(records);
 const missing=Object.fromEntries(fields.filter(f=>f[0]!=='birth').map(([k])=>[k,records.filter(r=>r[k]==null).length]));
 return {records,audit:{contract:'2.2',fileName,numberMode,accepted:records.length,quarantine,issues,emptyRows,missing,...(includeOutliers?{outliers:flagOutliers(records)}:{}),unmapped:unmappedFields(profiles,period),sensitive:sensitiveHeaders(profiles),period,ageCutoff:period===null?null:period+'-12-31',imputed:0,sheets:profiles.map(p=>({name:p.name,headerRow:p.header+1,fixedCoop:p.fixedCoop,mapping:Object.fromEntries(Object.entries(p.map).map(([k,v])=>[k,{column:v+1,header:String(p.matrix[p.header][v]??'')}]))}))}};
}
// Columnas de análisis que se esperan en cada hoja. Si el formulario cambia el texto de una pregunta,
// la columna deja de reconocerse: se avisa en vez de mostrar el campo como "sin respuestas".
const expectedFields=['territory','age','family','years','area','qq','income','amount','activity','phone','literacy'];
function unmappedFields(profiles,period=resolvePeriod(profiles)){
 return profiles.map(p=>({sheet:p.name,fields:expectedFields.filter(k=>p.map[k]===undefined&&!(k==='age'&&period!==null&&p.map.birth!==undefined)).map(k=>({key:k,label:label(k)}))})).filter(s=>s.fields.length);
}
// Encabezados con datos personales. El tablero nunca los lee (solo usa columnas mapeadas), pero se avisa.
const sensitiveRules=[['DNI / documento',/\bDNI\b|DOCUMENTO DE IDENTIDAD|N(UMERO|RO)?\.? DE DOCUMENTO|\bRUC\b/],['Teléfono',/TELEFONO|NUMERO DE CELULAR|CELULAR DE CONTACTO|\bWHATSAPP\b.*NUMERO|NUMERO.*\bWHATSAPP\b/],['Nombre',/NOMBRE|APELLIDO/],['Correo',/CORREO|E-?MAIL/],['Dirección',/DIRECCION|DOMICILIO/]];
const notPersonal=/COOPERATIVA|ORGANIZACION|BASE|SECTOR|DISTRITO|PROVINCIA|ACTIVIDAD|INTELIGENTE|SMARTPHONE/;
function sensitiveHeaders(profiles){
 const out=[];
 for(const p of profiles){const known=new Set(fields.map(f=>norm(f[1])));(p.matrix[p.header]||[]).forEach((h,i)=>{const s=norm(h);if(!s||known.has(s))return;const rule=sensitiveRules.find(([kind,re])=>re.test(s)&&!(['Nombre','Teléfono'].includes(kind)&&notPersonal.test(s)));if(rule)out.push({sheet:p.name,column:i+1,header:String(h).trim(),kind:rule[0]});});}
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
 for(const p of profiles){if(sensitiveHeaders([p]).some(s=>Object.values(p.map).includes(s.column-1)))throw Error('No se pueden asignar campos personales.');
 if(p.map.code===undefined)continue;for(let i=p.header+1;i<p.matrix.length;i++){const r=p.matrix[i]||[];if(isBlankCell(r[p.map.code]))continue;const c=coop(p.map.coop===undefined?p.fixedCoop:(r[p.map.coop]||p.fixedCoop))||'SIN COOPERATIVA';counts.set(c,(counts.get(c)||0)+1);}}
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
 for(const [k,h] of Object.entries(sheet.campos||{})){const i=heads.indexOf(norm(h));if(i>=0&&fields.some(f=>f[0]===k)&&!sensitiveHeaders([profile]).some(s=>s.column===i+1))map[k]=i;else missing.push({key:k,label:label(k),header:h});}
 profile.map=map;
 return {applied:Object.keys(map).length,missing,formVersion:saved.formulario||''};
}
/* ---------- Ficha de visita: datos que faltan y registro descargable ---------- */
// Datos clave de la ficha; los que estén vacíos se piden en la visita de la etapa de solicitud.
const visitKeyFields=['activity','amount','area','qq','income','phone','literacy','age','family','years','territory'];
function missingVisitFields(r){return visitKeyFields.filter(k=>r[k]==null||r[k]==='').map(k=>({key:k,label:label(k)}));}
// CSV de visitas: una fila por paso. Protege contra fórmulas al abrir en Excel.
const visitCsvHeaders=['codigo_productora','cooperativa','etapa','quien_visita','fecha_visita','paso','cumplido','fecha_paso','evidencia_u_observacion','archivo_base','hoja_base','periodo_base','registrado'];
function csvCell(v){
 const raw=String(Array.isArray(v)?v.join('; '):v??'');
 const neutral=(typeof v==='string'||Array.isArray(v))&&/^(?:[\t\r\n]|\s*[=+@-])/.test(raw)?"'"+raw:raw;
 return '"'+neutral.replace(/"/g,'""')+'"';
}
function visitsCsv(visits){
 const rows=visits.flatMap(v=>v.steps.map(s=>[v.code,v.coop,v.stage,v.who,v.date,s.text,s.done?'SI':'NO',s.date,s.evidence,v.sourceFile,v.sourceSheet,v.period,v.savedAt]));
 return '\ufeff'+[visitCsvHeaders,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n');
}
const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
function median(a){const b=a.filter(finite).sort((a,b)=>a-b);return b.length?(b[Math.floor((b.length-1)/2)]+b[Math.ceil((b.length-1)/2)])/2:null;}
function ranks(a){const b=a.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v),r=[];for(let i=0;i<b.length;){let j=i+1;while(j<b.length&&b[j].v===b[i].v)j++;for(let k=i;k<j;k++)r[b[k].i]=(i+j+1)/2;i=j;}return r;}
// Mediana de referencia para el reporte de la cooperativa.
function peerMedian(allRows,row,key,minN=5){const vals=allRows.filter(r=>r.coop===row.coop&&finite(r[key])).map(r=>r[key]);return vals.length>=minN?{median:median(vals),n:vals.length}:null;}
// Montos más frecuentes por cooperativa (CO9): muestra si el monto es un paquete fijo. Solo grupos con minN o más montos.
function commonAmounts(rows,{minN=5,top=3}={}){const by=new Map();for(const r of rows){if(!r.coop||!finite(r.amount))continue;if(!by.has(r.coop))by.set(r.coop,[]);by.get(r.coop).push(r.amount);}
 return [...by].filter(([,a])=>a.length>=minN).map(([group,a])=>{const c=new Map();a.forEach(v=>c.set(v,(c.get(v)||0)+1));return {coop:group,n:a.length,top:[...c].sort((x,y)=>y[1]-x[1]||x[0]-y[0]).slice(0,top).map(([amount,count])=>({amount,count,pct:100*count/a.length}))};}).sort((x,y)=>y.n-x.n);}
// Montos exactos si caben en el gráfico; si no, rangos de igual ancho.
function amountScale(values) {
 const amounts=[...new Set(values.filter(finite))].sort((a,b)=>a-b);
 if(amounts.length<=10){
  const indexes=new Map(amounts.map((value,i)=>[value,i]));
  return {exact:true,bins:amounts.map(value=>[value,value]),indexOf:value=>indexes.get(value)};
 }
 const min=amounts[0],max=amounts.at(-1);
 const ideal=(max-min)/8, power=10**Math.floor(Math.log10(ideal));
 const step=Math.max(.01,([1,2,2.5,5,10].find(n=>n*power>=ideal)||10)*power);
 const start=Math.floor(min/step)*step;
 const count=Math.floor((max-start)/step+1e-9)+1;
 return {exact:false,bins:Array.from({length:count},(_,i)=>[start+i*step,start+(i+1)*step]),
  indexOf:value=>Math.min(count-1,Math.max(0,Math.floor((value-start)/step+1e-9)))};
}
function correlation(rows,x,y,method='pearson'){const pairs=rows.filter(r=>finite(r[x])&&finite(r[y]));let a=pairs.map(r=>r[x]),b=pairs.map(r=>r[y]);const n=a.length;if(n<3)return {n,value:null};if(method==='spearman'){a=ranks(a);b=ranks(b);}const ma=mean(a),mb=mean(b);let aa=0,bb=0,ab=0;a.forEach((v,i)=>{aa+=(v-ma)**2;bb+=(b[i]-mb)**2;ab+=(v-ma)*(b[i]-mb);});return {n,value:aa>0&&bb>0?Math.max(-1,Math.min(1,ab/Math.sqrt(aa*bb))):null};}
function flagOutliers(rows) {
 const quantile=(values,q)=>{const i=(values.length-1)*q,j=Math.floor(i);return values[j]+(values[Math.ceil(i)]-values[j])*(i-j);};
 return numeric.flatMap(field=>{
  const vals=rows.map(r=>r[field]).filter(finite).sort((a,b)=>a-b);
  if(vals.length<5)return [];
  const q1=quantile(vals,.25),q3=quantile(vals,.75),iqr=q3-q1,low=q1-1.5*iqr,high=q3+1.5*iqr;
  return rows.filter(r=>finite(r[field])&&(r[field]<low||r[field]>high)).map(r=>({field,value:r[field],code:r.code,coop:r.coop,sheet:r.sourceSheet,row:r.sourceRow,originalSheet:r.originalSheet,originalRow:r.originalRow,low,high}));
 });
}
// Estado técnico de cada campo del contrato, incluidos los que no traía el archivo.
function unusableValues(records,audit){
 const rows=new Map(records.map(r=>[JSON.stringify([r.sourceSheet,r.sourceRow]),r]));
 return audit.issues.filter(i=>{
  const r=rows.get(JSON.stringify([i.sheet,i.row]));
  return r && (i.field==='birth'?r.age==null:r[i.field]==null);
 });
}
function coverage(records,audit){
 const unusable=unusableValues(records,audit);
 return fields.filter(([k])=>!['birth','infocorp'].includes(k)).map(field=>{
  const key=field[0],sourceCols=audit.sheets.flatMap(s=>s.mapping[key]?[s.mapping[key].header]:[]);
  const filled=records.filter(r=>r[key]!=null).length;
  const derived=!sourceCols.length&&((key==='age'&&audit.period&&audit.sheets.some(s=>s.mapping.birth))||(key==='yape'&&audit.sheets.some(s=>s.mapping.services)));
  const invalid=unusable.filter(i=>i.field===key||(key==='age'&&i.field==='birth')).length;
  return {key,field,filled,missing:records.length-filled,invalid,status:sourceCols.length?'mapped':derived?'derived':'absent',source:sourceCols.join(' · ')||(derived?(key==='age'?'Desde nacimiento y periodo':'Desde servicios financieros'):'Columna no incluida')};
 });
}
const api={coverage,unusableValues,ambiguousFields,resolvePeriod,flagOutliers,missingVisitFields,csvCell,visitsCsv,norm,fields,extraKinds,numeric,pcaVars,label,parseNumber,phone,literacy,activity,inferMap,sheetProfile,importProfiles,commonAmounts,amountScale,cleanPlace,unifyPlaces,unmappedFields,fieldKind,columnProfiles,columnCompat,nameScore,suggestedColumns,scopePreview,exportMapping,applyMapping,sensitiveHeaders,peerMedian,finite,mean,median,ranks,correlation};root.PDData=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
