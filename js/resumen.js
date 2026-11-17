/* Resúmenes de la selección y del contrato. */
'use strict';
/* Etiquetas en píxeles legibles. Los bloques pequeños conservan el área; el detalle
 * completo queda en title, foco y toque, en vez de reducir el texto a 5 px. */
function tileText(name,count,w,h){
  const maxW=w-20,maxH=h-16;
  for(let size=16;size>=12;size--){
    const limit=Math.floor(maxW/(size*.58)),lines=[];let current='';
    name.split(' ').forEach(word=>{if(current&&(current+' '+word).length>limit){lines.push(current);current=word;}else current=current?current+' '+word:word;});
    if(current)lines.push(current);
    if(lines.every(line=>line.length*size*.58<=maxW)&&(lines.length+1)*size*1.3<=maxH)return {size,lines:[...lines,String(count)]};
  }
  return maxW>=String(count).length*8&&maxH>=18?{size:14,lines:[String(count)]}:{size:12,lines:[]};
}
let overviewMapGroups=[];
function drawTerritoryMap(){
  const map=$('territory-map'),groups=overviewMapGroups;
  if(groups.length<2){map.replaceChildren();return;}
  const width=Math.max(280,Math.round(map.getBoundingClientRect().width)||900),height=Math.max(280,Math.min(480,Math.round(width*.52)));
  map.innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="group" aria-label="Bloques proporcionales al número de productoras">${PDResumen.tiles(groups,width,height).map((t,i)=>{
    const count=t.n+' '+(t.n===1?'productora':'productoras'),full=t.name+': '+count,f=tileText(t.name,t.n,t.w,t.h);
    const top=t.y+(t.h-f.lines.length*f.size*1.3)/2;
    return `<g role="button" tabindex="0" data-tile="${i}" aria-label="${H.esc(full)}"><title>${H.esc(full)}</title><rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" fill="#245547" stroke="white" stroke-width="2"/>${f.lines.map((line,j)=>`<text x="${t.x+10}" y="${top+f.size+j*f.size*1.3}" fill="white" font-size="${f.size}" pointer-events="none">${H.esc(line)}</text>`).join('')}</g>`;
  }).join('')}</svg>`;
  const show=event=>{
    const tile=event.target.closest('[data-tile]');if(!tile)return;
    const group=groups[Number(tile.dataset.tile)],note=$('territory-selection');
    note.textContent=group.name+': '+group.n+' '+(group.n===1?'productora':'productoras');note.hidden=false;
  };
  map.onpointerover=show;map.onclick=show;map.onfocusin=show;
  map.onkeydown=event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();show(event);}};
}
if(typeof ResizeObserver!=='undefined'){
  let lastWidth=0;
  new ResizeObserver(entries=>{const width=Math.round(entries[0].contentRect.width);if(width>0&&width!==lastWidth){lastWidth=width;requestAnimationFrame(drawTerritoryMap);}}).observe(document.getElementById('territory-map'));
}
function renderOverview(rows,available,total){
  const model=PDResumen.overview(rows),groups=model.groups;
  $('territory-title').textContent=model.title;
  overviewMapGroups=groups;
  $('territory-map').hidden=groups.length<2;
  $('territory-selection').hidden=true;
  drawTerritoryMap();
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
  $('workbook-overview').innerHTML=`<dl class="source-stats"><div><dt>Hojas</dt><dd>${sheets.length}</dd></div><div><dt>Columnas de la hoja</dt><dd>${Math.max(headers.length,sourceSession.sheets.find(s=>s.name===profile.name)?.columns||0)}</dd></div><div><dt>Filas incluidas</dt><dd>${rawData.length}</dd></div><div><dt>Filas excluidas</dt><dd>${audit.quarantine.length}</dd></div></dl>
    <details><summary>Hojas del archivo</summary><div class="table-scroll">${H.table(['Hoja','Columnas','Filas con contenido','Uso'],sheets.map(s=>[s.name,s.columns,s.hidden?'—':s.rows,s.name===profile.name?'Seleccionada':s.state]))}</div></details>`;
}
