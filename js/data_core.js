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
 if(v==null||String(v).trim()==='')return {value:null};if(typeof v==='number')return finite(v)?{value:v}:{value:null,error:'No finito'};
 let s=String(v).trim().replace(/^(S\/|PEN)\s*/i,'').replace(/\s*(qq|quintales|anos|años)\s*$/i,'').replace(/\s/g,'');
 if(!/^[+-]?\d+(?:[.,]\d+)*$/.test(s))return {value:null,error:'Número no reconocido'};
 if(mode==='comma'){if(!/^[+-]?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/.test(s))return {value:null,error:'Formato decimal coma inválido'};s=s.replace(/\./g,'').replace(',','.');}
 else if(mode==='dot'){if(!/^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(s))return {value:null,error:'Formato decimal punto inválido'};s=s.replace(/,/g,'');}
 else{if(/^[+-]?\d+[.,]\d{3}$/.test(s)||(s.match(/[.,]/g)||[]).length>1)return {value:null,error:'Separador ambiguo: elija formato numérico'};s=s.replace(',','.');}
 return finite(Number(s))?{value:Number(s)}:{value:null,error:'No finito'};
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
 if(!r.code||!r.coop){quarantine.push({...r,reason:'Falta código o cooperativa'});continue;}
 for(const k of numeric){const x=parseNumber(get(k),numberMode);r[k]=x.value;if(x.error)issue(k,x.error);if(r[k]!==null&&!valid(r[k],k)){issue(k,'Fuera de dominio; tratado como ausente');r[k]=null;}}
 if(r.age===null&&norm(get('age'))===''&&get('birth')!=null){const a=ageAt2025(get('birth'));if(a!==null&&valid(a,'age'))r.age=a;else issue('birth','Fecha no reconocida; use fecha Excel o ISO AAAA-MM-DD');}
 for(const k of ['territory','province','base'])r[k]=get(k)==null?null:String(get(k)).trim()||null;
 r.activityRaw=get('activity');r.phoneRaw=get('phone');r.literacyRaw=get('literacy');r.activity=activity(r.activityRaw);r.phone=phone(r.phoneRaw);r.literacy=literacy(r.literacyRaw);
 for(const k of ['phone','literacy'])if(r[k]==='OTRO / REVISAR')issue(k,'Categoría no homologada; revisar valor original');for(const [k,kind] of Object.entries(extraKinds)){const v=get(k);if(kind==='str')r[k]=v==null||String(v).trim()===''?null:norm(v);else if(kind==='multi')r[k]=multi(v);else{const b=bin(v);if(b===undefined){r[k]=null;issue(k,'Se esperaba 0/1 o SI/NO; tratado como ausente');}else r[k]=b;}}
 candidates.push(r);
 }}
 const counts=new Map(),key=r=>JSON.stringify([r.coop,norm(r.code)]);for(const r of candidates)counts.set(key(r),(counts.get(key(r))||0)+1);
 const records=candidates.filter(r=>{if(counts.get(key(r))>1){quarantine.push({...r,reason:'Llave cooperativa + código duplicada: resolver antes de incluir'});return false;}return true;});
 const missing=Object.fromEntries(fields.filter(f=>f[0]!=='birth').map(([k])=>[k,records.filter(r=>r[k]==null).length]));
 return {records,audit:{contract:'2.0',fileName,accepted:records.length,quarantine,issues,emptyRows,missing,period:2025,ageCutoff:'2025-12-31',imputed:0,areaUnit:'Hectáreas (confirmado por Producers Direct)',sheets:profiles.map(p=>({name:p.name,headerRow:p.header+1,fixedCoop:p.fixedCoop,mapping:Object.fromEntries(Object.entries(p.map).map(([k,v])=>[k,{column:v+1,header:String(p.matrix[p.header][v]??'')}]))}))}};
}
const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
function median(a){const b=a.filter(finite).sort((a,b)=>a-b);return b.length?(b[Math.floor((b.length-1)/2)]+b[Math.ceil((b.length-1)/2)])/2:null;}
function ranks(a){const b=a.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v),r=[];for(let i=0;i<b.length;){let j=i+1;while(j<b.length&&b[j].v===b[i].v)j++;for(let k=i;k<j;k++)r[b[k].i]=(i+j+1)/2;i=j;}return r;}
function correlation(rows,x,y,method='pearson'){const pairs=rows.filter(r=>finite(r[x])&&finite(r[y]));let a=pairs.map(r=>r[x]),b=pairs.map(r=>r[y]);const n=a.length;if(n<3)return {n,value:null};if(method==='spearman'){a=ranks(a);b=ranks(b);}const ma=mean(a),mb=mean(b);let aa=0,bb=0,ab=0;a.forEach((v,i)=>{aa+=(v-ma)**2;bb+=(b[i]-mb)**2;ab+=(v-ma)*(b[i]-mb);});return {n,value:aa>0&&bb>0?Math.max(-1,Math.min(1,ab/Math.sqrt(aa*bb))):null};}
const api={norm,fields,extraKinds,numeric,pcaVars,label,parseNumber,phone,literacy,activity,inferMap,sheetProfile,importProfiles,finite,mean,median,ranks,correlation};root.PDData=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
