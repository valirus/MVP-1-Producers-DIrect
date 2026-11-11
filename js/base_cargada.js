/* La tabla muestra lo que usa el tablero; la estructura conserva todas las columnas. */
const datasetPageSize=25;
let datasetPage=0,datasetMissing='',datasetFilterKind='empty';
function datasetFields() {
  if(!audit)return [];
  const mapped=new Set(audit.sheets.flatMap(s=>Object.keys(s.mapping)));
  return D.fields.filter(([k])=>!['birth','infocorp'].includes(k)&&(mapped.has(k)||rawData.some(r=>r[k]!=null)));
}
function datasetCell(row,key) {
  const value=row[key];
  if(value==null)return '—';
  if(D.extraKinds[key]==='bin')return value===1?'Sí':'No';
  if(Array.isArray(value))return value.map(prettyLabel).join(', ');
  if(key==='coop')return groupLabel(value);
  if(key==='code'||typeof value==='number'||['territory','province','base'].includes(key))return value;
  return prettyLabel(value);
}
function resetDataset() {
  datasetPage=0;datasetMissing='';datasetFilterKind='empty';$('quality-search').value='';$('coverage-incomplete').checked=false;
}
function renderDatasetRows() {
  if(!audit)return;
  const query=D.norm($('quality-search').value);
  const invalidKeys=new Set(D.unusableValues(rawData,audit).filter(i=>i.field===datasetMissing||(datasetMissing==='age'&&i.field==='birth')).map(i=>i.row));
  const filtered=rawData.filter(r=>(!query||D.norm(r.code+' '+r.coop).includes(query))&&(!datasetMissing||(datasetFilterKind==='invalid'?invalidKeys.has(r.sourceRow):r[datasetMissing]==null&&!invalidKeys.has(r.sourceRow))));
  datasetPage=Math.min(datasetPage,Math.max(0,Math.ceil(filtered.length/datasetPageSize)-1));
  const start=datasetPage*datasetPageSize,batch=filtered.slice(start,start+datasetPageSize),fields=datasetFields();
  const showFields=datasetMissing&&!fields.some(([k])=>k===datasetMissing)?[...fields,D.fields.find(([k])=>k===datasetMissing)]:fields;
  $('quality-preview').innerHTML=batch.length?H.table(showFields.map(datasetLabel),batch.map(r=>showFields.map(([k])=>datasetCell(r,k)))):'<p class="empty-state">No se encontraron filas.</p>';
  $('quality-preview').scrollLeft=0;
  $('quality-range').textContent=batch.length?`${start+1}–${start+batch.length} de ${filtered.length} filas`:'0 filas';
  $('quality-prev').disabled=datasetPage===0;
  $('quality-next').disabled=start+batch.length>=filtered.length;
  $('quality-prev').hidden=$('quality-next').hidden=filtered.length<=datasetPageSize;
  $('quality-missing-active').hidden=!datasetMissing;
  $('quality-missing-active').querySelector('span').textContent=datasetMissing?(datasetFilterKind==='invalid'?'No válido en ':'Vacío en ')+datasetLabel(D.fields.find(([k])=>k===datasetMissing)):'';
}
function renderDataset() {
  $('quality-data').hidden=!audit;
  if(!audit)return;
  const fields=datasetFields();
  $('quality-source').textContent=audit.fileName;
  $('quality-counts').textContent=[audit.sheets[0].name,audit.period,rawData.length+' registros',fields.length+' campos'].filter(Boolean).join(' · ');
  renderDatasetRows();
}
function datasetLabel([key,,label]) {
  return key==='area'?'Área de café (ha)':key==='base'?'Grupo local':label;
}
function renderCoverage() {
  if(!audit)return;
  const profile=sourceSession?.profiles.find(p=>p.name===sourceSession.selectedName);
  if(!profile)return;
  const report=PDResumen.dataset(rawData,audit,profile);
  $('coverage-source').textContent=[audit.fileName,profile.name,audit.period].filter(Boolean).join(' · ');
  datasetStructure(profile);
  $('contract-checks').innerHTML='<h3>Revisión del contrato</h3><ul class="contract-list">'+report.checks.map(c=>`<li><span class="check-mark ${c.ok?'check-ok':'check-review'}" aria-label="${c.ok?'Cumple':'Revisar'}">${c.ok?'✓':'!'}</span><div><strong>${H.esc(c.name)}</strong><span>${H.esc(c.detail)}</span></div></li>`).join('')+'</ul>';
  const fields=$('coverage-incomplete').checked?report.columns.filter(f=>f.missing>0||f.status==='absent'):report.columns;
  const kind=f=>f.stats.kind==='number'?'Numérico':f.stats.kind==='id'?'Identificador':'Categoría';
  const counts=(f,value,type)=>value?`<button type="button" class="coverage-link" data-missing="${f.key}" data-kind="${type}" aria-label="Ver ${type==='invalid'?'no válidos':'vacíos'} en ${H.esc(datasetLabel(f.field))}">${value}</button>`:'0';
  $('coverage-table').innerHTML=fields.length?`<table class="coverage-table"><thead><tr><th scope="col">Campo</th><th scope="col">Tipo</th><th scope="col">Válidos</th><th scope="col">Vacíos</th><th scope="col">No válidos</th><th scope="col">Resumen</th></tr></thead><tbody>${fields.map(f=>`<tr><th scope="row">${H.esc(datasetLabel(f.field))}<small class="mapping-source">${H.esc(f.status==='absent'?'No incluida (opcional)':f.source)}</small></th><td>${kind(f)}</td><td>${f.filled}</td><td>${f.status==='absent'?'—':counts(f,f.empty,'empty')}</td><td>${counts(f,f.invalid,'invalid')}</td><td>${H.esc(describeText(f.stats,f.key))}</td></tr>`).join('')}</tbody></table>`:'<p class="empty-state">No hay campos por revisar.</p>';
  const invalid=D.unusableValues(rawData,audit);
  $('coverage-values').innerHTML=(invalid.length?`<details><summary>Valores no válidos (${invalid.length})</summary><div class="table-scroll">${H.table(['Fila de Excel','Campo','Motivo'],invalid.map(i=>[i.row,D.label(i.field),i.reason]))}</div></details>`:'')
    +(audit.quarantine.length?`<details><summary>Filas excluidas (${audit.quarantine.length})</summary><div class="table-scroll">${H.table(['Fila de Excel','Código','Cooperativa','Motivo'],audit.quarantine.map(r=>[r.sourceRow,r.code,r.coop,r.reason]))}</div></details>`:'');
  $('extra-columns').innerHTML=report.extras.length?`<details><summary>Columnas fuera del tablero (${report.extras.length})</summary><div class="table-scroll">${H.table(['Columna','Tipo','Celdas llenas','Vacíos','Resumen'],report.extras.map(c=>[c.header,c.stats.kind==='number'?'Numérico':'Texto',c.stats.valid,c.stats.empty,describeText(c.stats)]))}</div></details>`:'';
}
function initDataset() {
  $('quality-search').addEventListener('input',()=>{datasetPage=0;renderDatasetRows();});
  $('clear-missing').addEventListener('click',()=>{datasetMissing='';datasetPage=0;renderDatasetRows();});
  $('coverage-incomplete').addEventListener('change',renderCoverage);
  $('coverage-table').addEventListener('click',event=>{
    const key=event.target.closest('button[data-missing]')?.dataset.missing;if(!key)return;
    $('quality-search').value='';datasetPage=0;datasetMissing=key;datasetFilterKind=event.target.closest('button[data-missing]').dataset.kind||'empty';nav('quality');renderDatasetRows();$('quality-preview').focus();
  });
  for(const [id,step] of [['quality-prev',-1],['quality-next',1]])$(id).addEventListener('click',()=>{datasetPage+=step;renderDatasetRows();if($(id).disabled)$('quality-preview').focus();});
  $('download-data').addEventListener('click',()=>{
    const fields=datasetFields(),headers=[...fields.map(f=>f[1]),...(audit.period?['periodo']:[]),'hoja_importada','fila_importada','hoja_origen','fila_excel_origen'];
    const rows=rawData.map(r=>[...fields.map(f=>r[f[0]]),...(audit.period?[audit.period]:[]),r.sourceSheet,r.sourceRow,r.originalSheet,r.originalRow]);
    download('productoras_normalizadas.csv','\ufeff'+[headers,...rows].map(r=>r.map(D.csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');
  });
}
