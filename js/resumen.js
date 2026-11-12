/* Resúmenes de la selección y del contrato. */
'use strict';
/* Ajusta el nombre completo y la cantidad al recuadro: reduce la letra hasta que entren, sin recortar. */
function tileText(name,count,w,h){
  const pad=8,maxW=Math.max(10,w-2*pad),maxH=Math.max(10,h-2*pad),cw=.58;
  const wrap=(size)=>{
    const limit=Math.max(1,Math.floor(maxW/(size*cw))),lines=[];let cur='';
    name.split(' ').forEach(word=>{const next=cur?cur+' '+word:word;if(!cur||next.length<=limit)cur=next;else{lines.push(cur);cur=word;}});
    if(cur)lines.push(cur);return lines;
  };
  const fits=(lines,size)=>Math.max(...lines.map(l=>l.length))*size*cw<=maxW;
  for(let size=15;size>=5;size-=.5){
    const lines=wrap(size),countSize=Math.min(22,size*1.5);
    if(fits(lines,size)&&lines.length*size*1.2+countSize*1.25<=maxH)return {size,countSize,lines,inline:false};
    const one=name+' · '+count;
    if(one.length*size*cw<=maxW&&size*1.3<=maxH)return {size,countSize:size,lines:[one],inline:true};
  }
  return {size:5,countSize:5,lines:[name+' · '+count],inline:true};
}
function renderOverview(rows,available,total){
  const model=PDResumen.overview(rows),groups=model.groups;
  $('territory-title').textContent=model.title;
  const map=$('territory-map');
  const shown=groups.length>12?[...groups.slice(0,11),{name:'Otros grupos',n:groups.slice(11).reduce((s,g)=>s+g.n,0)}]:groups;
  const title=groups.length?model.title:'No hay registros en esta selección.';
  map.hidden=groups.length<2;
  const tiles=PDResumen.tiles(shown);
  map.innerHTML=groups.length>1?`<svg viewBox="0 0 900 280" role="img" aria-label="${H.esc(title)}">${tiles.map(t=>{
    const count=t.n+' '+(t.n===1?'productora':'productoras'),f=tileText(t.name,t.n,t.w,t.h);
    const block=f.inline?f.size*1.2:f.lines.length*f.size*1.2+f.countSize*1.25,top=t.y+(t.h-block)/2;
    const lines=f.lines.map((line,i)=>`<text x="${t.x+8}" y="${top+f.size*1.05+i*f.size*1.2}" fill="white" font-size="${f.size}">${H.esc(line)}</text>`).join('');
    const num=f.inline?'':`<text x="${t.x+8}" y="${top+f.lines.length*f.size*1.2+f.countSize*1.05}" fill="white" font-size="${f.countSize}" font-weight="700">${t.n}</text>`;
    return `<g><title>${H.esc(t.name)}: ${count}</title><rect x="${t.x+1}" y="${t.y+1}" width="${Math.max(0,t.w-2)}" height="${Math.max(0,t.h-2)}" rx="5" fill="#245547"/>${lines}${num}</g>`;
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
  $('workbook-overview').innerHTML=`<dl class="source-stats"><div><dt>Hojas</dt><dd>${sheets.length}</dd></div><div><dt>Columnas de la hoja</dt><dd>${Math.max(headers.length,sourceSession.sheets.find(s=>s.name===profile.name)?.columns||0)}</dd></div><div><dt>Filas incluidas</dt><dd>${rawData.length}</dd></div><div><dt>Filas excluidas</dt><dd>${audit.quarantine.length}</dd></div></dl>
    <details><summary>Hojas del archivo</summary><div class="table-scroll">${H.table(['Hoja','Columnas','Filas con contenido','Uso'],sheets.map(s=>[s.name,s.columns,s.hidden?'—':s.rows,s.name===profile.name?'Seleccionada':s.state]))}</div></details>`;
}
