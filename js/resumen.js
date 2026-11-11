/* Resúmenes de la selección y del contrato. */
'use strict';
function renderOverview(rows,available,total){
  const model=PDResumen.overview(rows),groups=model.groups;
  $('territory-title').textContent=model.title;
  const map=$('territory-map');
  const shown=groups.length>12?[...groups.slice(0,11),{name:'Otros grupos',n:groups.slice(11).reduce((s,g)=>s+g.n,0)}]:groups;
  const title=groups.length?model.title:'No hay registros en esta selección.';
  map.hidden=groups.length<2;
  const tiles=PDResumen.tiles(shown);
  map.innerHTML=groups.length>1?`<svg viewBox="0 0 900 280" role="img" aria-label="${H.esc(title)}">${tiles.map(t=>{
    const count=t.n+' '+(t.n===1?'productora':'productoras'),label=t.name.length>Math.floor(t.w/8)?t.name.slice(0,Math.max(4,Math.floor(t.w/8)-1))+'…':t.name;
    return `<g><title>${H.esc(t.name)}: ${count}</title><rect x="${t.x+1}" y="${t.y+1}" width="${Math.max(0,t.w-2)}" height="${Math.max(0,t.h-2)}" rx="5" fill="#245547"/>${t.w>75&&t.h>55?`<text x="${t.x+14}" y="${t.y+t.h/2-5}" fill="white" font-size="15">${H.esc(label)}</text><text x="${t.x+14}" y="${t.y+t.h/2+23}" fill="white" font-size="22" font-weight="700">${t.n}</text>`:''}</g>`;
  }).join('')}</svg>`:'';
  const heading=model.level==='territory'?'Distrito y provincia':model.level==='base'?'Grupo local':model.level==='coop'?'Cooperativa':'Selección';
  $('overview-table').innerHTML=groups.length?H.table([heading,'Productoras',...available.map(([,label])=>label)],groups.map(g=>[g.name,g.n,...available.map(([key,,digits])=>total(g.records,key,digits))])):'<p class="empty-state">No hay registros en esta selección.</p>';
}
function describeText(stats,key){
  if(!stats.valid)return '—';
  if(stats.kind==='id')return stats.unique+' únicos';
  if(stats.kind==='number'){const n=v=>H.fmt(v,Number.isInteger(v)?0:2);return 'Promedio '+n(stats.mean)+' · mín. '+n(stats.min)+' · máx. '+n(stats.max);}
  if(stats.modeN<2)return 'Sin repetición';
  if(stats.mode.length>1)return stats.mode.length+' modas · '+stats.modeN+' registros cada una';
  const value=key==='coop'?groupLabel(stats.mode[0]):prettyLabel(stats.mode[0]);
  return 'Moda: '+value+' ('+stats.modeN+')';
}
function datasetStructure(profile){
  const sheets=sourceSession?.sheets||[],headers=profile.matrix[profile.header]||[];
  $('workbook-overview').innerHTML=`<dl class="source-stats"><div><dt>Hojas</dt><dd>${sheets.length}</dd></div><div><dt>Columnas de la hoja</dt><dd>${Math.max(headers.length,sourceSession.sheets.find(s=>s.name===profile.name)?.columns||0)}</dd></div><div><dt>Registros incluidos</dt><dd>${rawData.length}</dd></div><div><dt>Filas excluidas</dt><dd>${audit.quarantine.length}</dd></div></dl>
    <details><summary>Hojas del archivo</summary><div class="table-scroll">${H.table(['Hoja','Columnas','Filas con contenido','Uso'],sheets.map(s=>[s.name,s.columns,s.hidden?'—':s.rows,s.name===profile.name?'Seleccionada':s.state]))}</div></details>`;
}
