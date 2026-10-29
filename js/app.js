/* Estado de carga, mapeo revisable y filtros. Ningún dato se persiste o envía. */
'use strict';
const $=id=>document.getElementById(id),D=PDData,H=PDCharts;
let rawData=[],filteredData=[],audit=null,model={ok:false,reason:'Carga una base para armar el mapa de perfiles.'},pending=null;
const pageNames={summary:'Resumen del Fondo Rotatorio',production:'Producción y acopio',credit:'Demanda de crédito',inclusion:'Inclusión y acompañamiento',producer:'Ficha de productora',quality:'Revisión de datos',relations:'Qué se relaciona con qué',cross:'Cruces de datos',territory:'Territorio y alertas'};
function status(text,warning=false,pill=''){ $('status-text').textContent=text;$('status-banner').classList.toggle('warning',warning);$('status-pill').textContent=pill; }
function nav(page){document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===page+'-page'));$('page-title').textContent=pageNames[page];requestAnimationFrame(()=>H.resize());}
document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',()=>nav(b.dataset.page)));
function options(select,rows,first){select.replaceChildren(new Option(first,'all'));for(const v of rows)select.add(new Option(v??'Sin dato',v??'__null__'));}
function populate(){for(const [id,k,title] of [['filter-coop','coop','Todas las cooperativas'],['filter-territory','territory','Todos los territorios'],['filter-base','base','Todas las bases']])options($(id),[...new Set(rawData.map(r=>r[k]))].sort((a,b)=>String(a).localeCompare(String(b))),title);
 // Vista del tablero: global o una cooperativa. La vista de una cooperativa muestra solo sus registros.
 const coops=[...new Set(rawData.map(r=>r.coop))].sort(),prev=$('view-select').value;$('view-select').replaceChildren(new Option('Producers Direct (global)','GLOBAL'));coops.forEach(c=>$('view-select').add(new Option(coopConfig(c).label,c)));
 $('view-select').value=coops.includes(prev)?prev:'GLOBAL';lockCoop();}
function lockCoop(){const v=$('view-select').value,lock=v!=='GLOBAL';if(lock)$('filter-coop').value=v;$('filter-coop').disabled=lock;}
function applyView(){const lock=$('view-select').value!=='GLOBAL';if(!lock)$('filter-coop').value='all';$('filter-territory').value='all';$('filter-base').value='all';lockCoop();applyFilters();}
function applyFilters(){const matches=(v,choice)=>choice==='all'||(choice==='__null__'?v==null:v===choice);
 filteredData=rawData.filter(r=>matches(r.coop,$('filter-coop').value)&&matches(r.territory,$('filter-territory').value)&&matches(r.base,$('filter-base').value));
 $('kpi-n').textContent=filteredData.length;$('kpi-n-sub').textContent='Registros de la selección';
 for(const k of ['amount','area','qq']){const vals=filteredData.filter(r=>D.finite(r[k])).map(r=>r[k]);const sum=vals.reduce((a,b)=>a+b,0);$('kpi-'+k).textContent=vals.length?(k==='amount'?'S/ ':'')+H.fmt(sum,k==='area'?1:0)+(k==='qq'?' qq':''):'Sin dato';$('kpi-'+k+'-sub').textContent=`${vals.length}/${filteredData.length} con dato · ${k==='area'?'hectáreas':k==='amount'?'solicitudes, no desembolsos':'acopio reportado 2025'}`;}
 const previous=$('filter-producer').value;$('filter-producer').replaceChildren(new Option('Seleccionar productora…',''));
 filteredData.forEach((r,i)=>$('filter-producer').add(new Option(`${r.code} (${r.coop})`,String(rawData.indexOf(r)))));
 $('filter-producer').value=previous;if(!$('filter-producer').value)clearProducer();else showProducer(false);
 H.render(filteredData,rawData,model);
 renderCross(filteredData,$('view-select').value);renderTerritory(filteredData,$('view-select').value);
 $('view-badge').textContent=coopConfig($('view-select').value).label;
}
function clearProducer(){$('rep-code-coop').textContent='Selecciona una productora de los filtros.';$('producer-fields').replaceChildren();$('btn-print-action').disabled=true;}
function showProducer(go=true){const key=$('filter-producer').value;if(key===''){clearProducer();return;}const r=rawData[Number(key)];if(!r||!filteredData.includes(r)){clearProducer();return;}
 $('rep-code-coop').textContent=`${r.code} | ${r.coop} | ${r.territory||'Territorio sin dato'}`;
 const fields=[['Actividad solicitada',r.activityRaw??'Sin dato'],['Monto solicitado',D.finite(r.amount)?'S/ '+H.fmt(r.amount):'Sin dato'],['Acopio 2025',D.finite(r.qq)?H.fmt(r.qq)+' quintales':'Sin dato'],['Área de café',D.finite(r.area)?H.fmt(r.area)+' ha':'Sin dato'],['Ingreso principal 2025',D.finite(r.income)?'S/ '+H.fmt(r.income):'Sin dato'],['Celular propio',r.phone??'Sin dato']];
 $('producer-fields').innerHTML=fields.map(([t,v])=>`<div class="report-card"><h4>${H.esc(t)}</h4><div class="big">${H.esc(v)}</div></div>`).join('');$('btn-print-action').disabled=false;if(go)nav('producer');
}
$('filter-producer').addEventListener('change',()=>showProducer());$('btn-print-action').addEventListener('click',()=>{if($('filter-producer').value!==''){nav('producer');window.print();}});
['filter-coop','filter-territory','filter-base'].forEach(k=>$(k).addEventListener('change',applyFilters));
$('view-select').addEventListener('change',applyView);
['terr-group','th-net','th-lit','th-yield'].forEach(id=>$(id).addEventListener('input',()=>renderTerritory(filteredData,$('view-select').value)));
for(const id of ['pca-plane','qq-mode','rel-x','rel-y','corr-method'])$(id).addEventListener('change',()=>H.render(filteredData,rawData,model));
$('correlation-matrix').addEventListener('click',e=>{const b=e.target.closest('button[data-x]');if(!b)return;$('rel-x').value=b.dataset.x;$('rel-y').value=b.dataset.y;H.render(filteredData,rawData,model);$('chart-relation').scrollIntoView({behavior:'smooth',block:'center'});});
for(const id of ['rel-x','rel-y'])D.numeric.forEach(k=>$(id).add(new Option(D.label(k),k)));$('rel-x').value='qq';$('rel-y').value='income';
function currentProfile(){return pending.profiles[Number($('sheet-select').value)];}
function mappingUI(){const all=$('sheet-select').value==='known';$('header-row').disabled=all;$('fixed-coop').disabled=all;$('mapping-fields').replaceChildren();
 if(all){$('mapping-note').textContent='Se combinarán únicamente Productoras Norandino y Productoras Bagua Grande, con los títulos detectados. Cooperativa proviene del nombre de cada hoja; revisa los datos importados en Revisión de datos.';$('import-preview').innerHTML='';return;}
 const p=currentProfile();$('header-row').value=p.header+1;$('fixed-coop').value=p.fixedCoop;$('mapping-note').textContent=`${Object.keys(p.map).length} preguntas reconocidas. Código y cooperativa son necesarios; el resto es opcional. Revisa que cada pregunta signifique lo mismo en todas las cooperativas y corresponda a 2025.`;
 for(const [k,canonical,label] of D.fields){const div=document.createElement('div');div.className='field';const lab=document.createElement('label');lab.htmlFor='map-'+k;lab.textContent=label;const select=document.createElement('select');select.id='map-'+k;select.add(new Option('No disponible',''));(p.matrix[p.header]||[]).forEach((h,i)=>select.add(new Option(`${i+1}: ${h??'(sin título)'}`,String(i))));select.value=p.map[k]===undefined?'':String(p.map[k]);select.addEventListener('change',()=>{if(select.value==='')delete p.map[k];else p.map[k]=Number(select.value);});div.append(lab,select);$('mapping-fields').append(div);}
 $('import-preview').innerHTML=H.table((p.matrix[p.header]||[]).map(v=>String(v??'')),p.matrix.slice(p.header+1,p.header+4).map(r=>r.map(v=>v instanceof Date?v.toISOString().slice(0,10):v??'')));
}
$('open-file').addEventListener('click',()=>$('excel-input').click());
$('excel-input').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;
 try{if(typeof XLSX==='undefined')throw Error('No se cargó el lector Excel. Revisa la carpeta vendor/.');if(file.size>15*1024*1024)throw Error('El archivo supera 15 MB; reduce las hojas o filas antes de cargarlo.');
 const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true});const profiles=wb.SheetNames.map(name=>D.sheetProfile(name,XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:null,blankrows:true,raw:true})));
 if(!profiles.some(p=>p.matrix.some(r=>r.some(v=>v!=null))))throw Error('El archivo está vacío.');pending={profiles,fileName:file.name};$('sheet-select').replaceChildren();
 const known=profiles.filter(p=>['Productoras Norandino','Productoras Bagua Grande'].includes(p.name)&&p.map.code!==undefined);if(known.length===2)$('sheet-select').add(new Option('Combinar los dos formularios reconocidos','known'));
 profiles.forEach((p,i)=>$('sheet-select').add(new Option(p.name,String(i))));const preferred=profiles.findIndex(p=>p.name==='Productoras');$('sheet-select').value=preferred>=0?String(preferred):known.length===2?'known':String(Math.max(0,profiles.findIndex(p=>p.map.code!==undefined)));
 mappingUI();$('import-panel').hidden=false;status(`Revisa qué columna corresponde a cada pregunta en ${file.name}. Los datos anteriores siguen activos hasta que confirmes.`,false,'Carga pendiente');$('import-panel').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(err){status('Carga no aplicada: '+err.message+' Los datos anteriores se conservan.',true,'Revisar');}finally{e.target.value='';}});
$('sheet-select').addEventListener('change',mappingUI);$('header-row').addEventListener('change',()=>{const p=currentProfile(),value=Number($('header-row').value);if(!Number.isInteger(value)||value<1||value>p.matrix.length){$('header-row').value=p.header+1;return;}p.header=value-1;p.map=D.inferMap(p.matrix[p.header]||[]);mappingUI();});
$('cancel-import').addEventListener('click',()=>{$('import-panel').hidden=true;pending=null;status(rawData.length?`Carga activa: ${audit.fileName} (${rawData.length} registros).`:'Carga cancelada. No hay datos activos.',false,rawData.length?'Datos activos':'Sin datos');});
$('confirm-import').addEventListener('click',()=>{if(!pending)return;try{
 let profiles;if($('sheet-select').value==='known')profiles=pending.profiles.filter(p=>['Productoras Norandino','Productoras Bagua Grande'].includes(p.name)&&p.map.code!==undefined);else{const p=currentProfile();p.fixedCoop=$('fixed-coop').value.trim();profiles=[p];}
 for(const p of profiles){const vals=Object.values(p.map);if(new Set(vals).size!==vals.length)throw Error('Una misma columna está asignada a varias preguntas. Revisa cuál corresponde a cada una.');}
 const result=D.importProfiles(profiles,{numberMode:$('number-mode').value,fileName:pending.fileName});let nextModel;try{nextModel=PDPCA.fitPCA(result.records);}catch(error){nextModel={ok:false,reason:error.message};}
 rawData=result.records;audit=result.audit;model=nextModel;pending=null;$('import-panel').hidden=true;$('filter-producer').value='';clearProducer();populate();applyFilters();renderQuality();$('download-audit').disabled=false;$('download-data').disabled=false;
 const warnings=audit.quarantine.length+audit.issues.length;status(`${audit.fileName}: ${rawData.length} productoras incluidas; ${audit.quarantine.length} filas apartadas; ${audit.issues.length} observaciones. No se completó ningún dato que faltara.`,!!warnings,warnings?'Revisar datos':'Carga completa');
 }catch(err){status('Carga no aplicada: '+err.message+' Revisa qué columna corresponde a cada pregunta; los datos anteriores siguen activos.',true,'Revisar');}});
function renderQuality(){if(!audit)return;$('quality-summary').textContent=`Datos de 2025 · ${audit.accepted} productoras incluidas · ${audit.quarantine.length} filas apartadas · ${audit.issues.length} observaciones · ${audit.emptyRows} filas vacías omitidas.`;
 const rows=D.fields.filter(f=>f[0]!=='birth').map(([k,,label])=>[label,`${audit.accepted-audit.missing[k]}/${audit.accepted}`,audit.missing[k]?'Incompleto':'Completo']);
 $('quality-table').innerHTML=H.table(['Pregunta','Productoras con dato','Estado'],rows)+`<p class="chart-note">Área: hectáreas, según Producers Direct. Edad: corte fijo al 31/12/2025. No se asume que una fila sea un préstamo desembolsado. Si cargas la versión optimizada de 14 columnas, no se pueden recuperar categorías que ya fueron descartadas; se recomienda la base limpia de 77 campos.</p>`;
 $('quality-issues').innerHTML=H.table(['Hoja','Fila','Pregunta / código','Observación'],[...audit.quarantine.map(r=>[r.sourceSheet,r.sourceRow,r.code,r.reason]),...audit.issues.map(r=>[r.sheet,r.row,D.label(r.field),r.reason])].slice(0,100));}
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('download-audit').addEventListener('click',()=>download('auditoria_pd.json',JSON.stringify(audit,null,2),'application/json'));
$('download-data').addEventListener('click',()=>{const fields=D.fields.filter(f=>f[0]!=='birth');const cell=v=>'"'+String(Array.isArray(v)?v.join('; '):v??'').replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';const headers=[...fields.map(f=>f[1]),'hoja_origen','fila_excel_origen','actividad_original','celular_original','lectoescritura_original'];const lines=filteredData.map(r=>[...fields.map(f=>r[f[0]]),r.sourceSheet,r.sourceRow,r.activityRaw,r.phoneRaw,r.literacyRaw]);download('productoras_seleccion.csv','\ufeff'+[headers,...lines].map(r=>r.map(cell).join(',')).join('\r\n'),'text/csv;charset=utf-8');});
populate();applyFilters();
