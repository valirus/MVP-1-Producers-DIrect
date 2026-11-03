/* Carga automática de formularios reconocidos y filtros. Ningún dato se persiste o envía. */
'use strict';
const $=id=>document.getElementById(id),D=PDData,H=PDCharts;
let rawData=[],filteredData=[],audit=null,model={ok:false,reason:'Carga una base para armar el mapa de perfiles.'};
const pageNames={summary:'Panorama del Fondo Rotatorio',production:'Producción y acopio',credit:'Demanda de crédito',inclusion:'Participación y acceso digital',producer:'Ficha de productora',relations:'Qué se relaciona con qué',cross:'Cruces de datos',territory:'Territorio y alertas'};
const pageSubs={summary:'Qué hay que saber del Fondo antes de decidir',production:'Cuánto produce y acopia cada cooperativa',credit:'Qué piden las productoras y para qué',inclusion:'Cómo llegar a las productoras y lograr que participen',producer:'Resumen de información disponible',relations:'Qué variables suben o bajan juntas',cross:'Comparaciones entre cooperativas y zonas',territory:'Zonas que necesitan más acompañamiento'};
function status(text,warning=false,pill=''){ $('status-text').textContent=text;$('status-banner').classList.toggle('warning',warning);$('status-pill').textContent=pill; }
function nav(page){document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===page+'-page'));$('page-title').textContent=pageNames[page];$('page-sub').textContent=pageSubs[page]||'';requestAnimationFrame(()=>H.resize());}
document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',()=>nav(b.dataset.page)));
function options(select,rows,first){select.replaceChildren(new Option(first,'all'));for(const v of rows)select.add(new Option(v==null?'Sin dato':groupLabel(v),v??'__null__'));}
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
 filteredData.forEach((r,i)=>$('filter-producer').add(new Option(`${r.code} (${groupLabel(r.coop)})`,String(rawData.indexOf(r)))));
 $('filter-producer').value=previous;if(!$('filter-producer').value)clearProducer();else showProducer(false);
 H.render(filteredData,rawData,model);
 renderCross(filteredData,$('view-select').value);renderTerritory(filteredData,$('view-select').value);renderFundPages(filteredData);
 $('view-badge').textContent=coopConfig($('view-select').value).label;
}
function clearProducer(){$('rep-code-coop').textContent='Selecciona una productora de los filtros.';$('producer-fields').replaceChildren();$('btn-print-action').disabled=true;}
function showProducer(go=true){const key=$('filter-producer').value;if(key===''){clearProducer();return;}const r=rawData[Number(key)];if(!r||!filteredData.includes(r)){clearProducer();return;}
 $('rep-code-coop').textContent=`${r.code} | ${groupLabel(r.coop)} | ${r.territory?groupLabel(r.territory):'Territorio sin dato'}`;
 const fields=[['Actividad solicitada',r.activity?prettyLabel(r.activity):'Sin dato'],['Monto solicitado',D.finite(r.amount)?'S/ '+H.fmt(r.amount):'Sin dato'],['Acopio 2025',D.finite(r.qq)?H.fmt(r.qq)+' quintales':'Sin dato'],['Área de café',D.finite(r.area)?H.fmt(r.area)+' ha':'Sin dato'],['Ingreso principal 2025',D.finite(r.income)?'S/ '+H.fmt(r.income):'Sin dato'],['Celular propio',r.phone?({SMARTPHONE:'Smartphone',BASICO:'Celular básico',NINGUNO:'Sin celular'}[r.phone]||prettyLabel(r.phone)):'Sin dato'],['Años de asociada (titular)',D.finite(r.years)?r.years+' años':'Sin dato'],['Ahorro en la cooperativa',r.savingsCoop==null?'Sin dato':r.savingsCoop?'Sí':'No'],['Crédito vigente en la cooperativa',r.coopCredit==null?'Sin dato':r.coopCredit?'Sí':'No']];
 $('producer-fields').innerHTML=fields.map(([t,v])=>`<div class="report-card"><h4>${H.esc(t)}</h4><div class="big">${H.esc(v)}</div></div>`).join('');$('btn-print-action').disabled=false;if(go)nav('producer');
}
$('filter-producer').addEventListener('change',()=>showProducer());$('btn-print-action').addEventListener('click',()=>{if($('filter-producer').value!==''){nav('producer');window.print();}});
['filter-coop','filter-territory','filter-base'].forEach(k=>$(k).addEventListener('change',applyFilters));
$('view-select').addEventListener('change',applyView);

['terr-group','th-net','th-lit','th-yield'].forEach(id=>$(id).addEventListener('input',()=>renderTerritory(filteredData,$('view-select').value)));
for(const id of ['pca-plane','qq-mode','rel-x','rel-y','corr-method'])$(id).addEventListener('change',()=>H.render(filteredData,rawData,model));
$('correlation-matrix').addEventListener('click',e=>{const b=e.target.closest('button[data-x]');if(!b)return;$('rel-x').value=b.dataset.x;$('rel-y').value=b.dataset.y;H.render(filteredData,rawData,model);$('chart-relation').scrollIntoView({behavior:'smooth',block:'center'});});
for(const id of ['rel-x','rel-y'])D.numeric.forEach(k=>$(id).add(new Option(D.label(k),k)));$('rel-x').value='qq';$('rel-y').value='income';
function compactChartDetails(){document.querySelectorAll('.card-panel .chart-box').forEach(box=>{if(['chart-pca','chart-variance'].includes(box.querySelector('canvas')?.id))return;const note=box.nextElementSibling?.classList.contains('chart-note')?box.nextElementSibling:null;const table=note?.nextElementSibling?.classList.contains('table-scroll')?note.nextElementSibling:null;if(!note&&!table)return;const details=document.createElement('details');details.className='chart-details';const summary=document.createElement('summary');summary.textContent='Ver detalles';details.append(summary);if(note)details.append(note);if(table)details.append(table);box.after(details);});}
$('open-file').addEventListener('click',()=>$('excel-input').click());
$('excel-input').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;
 try{if(typeof XLSX==='undefined')throw Error('No se cargó el lector Excel. Revisa la carpeta vendor/.');if(file.size>15*1024*1024)throw Error('El archivo supera 15 MB; reduce las hojas o filas antes de cargarlo.');
 const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true});const profiles=wb.SheetNames.map(name=>D.sheetProfile(name,XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:null,blankrows:true,raw:true})));
 if(!profiles.some(p=>p.matrix.some(r=>r.some(v=>v!=null))))throw Error('El archivo está vacío.');
 const selected=D.selectProfiles(profiles);
 for(const p of selected){const vals=Object.values(p.map);if(new Set(vals).size!==vals.length)throw Error('El formato de la hoja tiene columnas duplicadas y no se puede importar automáticamente.');}
 const result=D.importProfiles(selected,{fileName:file.name});if(!result.records.length)throw Error('No se encontraron productoras válidas en las hojas reconocidas.');
 let nextModel;try{nextModel=PDPCA.fitPCA(result.records);}catch(error){nextModel={ok:false,reason:error.message};}
 rawData=result.records;audit=result.audit;model=nextModel;$('filter-producer').value='';clearProducer();populate();applyFilters();$('download-data').disabled=false;
 const warnings=audit.quarantine.length+audit.issues.length;const warningText=warnings?` ${audit.quarantine.length} filas apartadas, ${audit.issues.length} observaciones.`:'';
 status(`${audit.fileName}: ${rawData.length} productoras cargadas.${warningText}`,!!warnings,warnings?'Con observaciones':'Carga completa');
 }catch(err){status('No se pudo cargar: '+err.message+' La base anterior se conserva.',true,'Carga no aplicada');}finally{e.target.value='';}});
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('download-data').addEventListener('click',()=>{const fields=D.fields.filter(f=>f[0]!=='birth');const cell=v=>'"'+String(Array.isArray(v)?v.join('; '):v??'').replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';const headers=[...fields.map(f=>f[1]),'hoja_origen','fila_excel_origen','actividad_original','celular_original','lectoescritura_original'];const lines=filteredData.map(r=>[...fields.map(f=>r[f[0]]),r.sourceSheet,r.sourceRow,r.activityRaw,r.phoneRaw,r.literacyRaw]);download('productoras_seleccion.csv','\ufeff'+[headers,...lines].map(r=>r.map(cell).join(',')).join('\r\n'),'text/csv;charset=utf-8');});
compactChartDetails();populate();applyFilters();
