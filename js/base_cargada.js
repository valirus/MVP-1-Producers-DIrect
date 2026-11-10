/* Vista de las filas normalizadas que alimentan los gráficos. */
const datasetPageSize=25;
let datasetPage=0;
function datasetFields() {
  if(!audit) return [];
  const mapped=new Set(audit.sheets.flatMap(s=>Object.keys(s.mapping)));
  return D.fields.filter(([k])=>!['birth','infocorp'].includes(k)&&(mapped.has(k)||rawData.some(r=>r[k]!=null)));
}
function datasetCell(row,key) {
  const value=row[key];
  if(value==null) return '—';
  if(D.extraKinds[key]==='bin') return value===1?'Sí':'No';
  if(Array.isArray(value)) return value.map(prettyLabel).join(', ');
  if(key==='coop') return groupLabel(value);
  if(key==='code'||typeof value==='number'||['territory','province','base'].includes(key)) return value;
  return prettyLabel(value);
}
function resetDataset() {
  datasetPage=0;
  $('quality-search').value='';
  $('quality-missing').value='';
  $('coverage-incomplete').checked=false;
}
function renderDatasetRows() {
  if(!audit) return;
  const query=D.norm($('quality-search').value);
  const missing=$('quality-missing').value;
  const filtered=rawData.filter(r=>(!query||D.norm(r.code+' '+r.coop).includes(query))&&(!missing||r[missing]==null));
  const start=datasetPage*datasetPageSize;
  const batch=filtered.slice(start,start+datasetPageSize);
  const fields=datasetFields();
  $('quality-preview').innerHTML=batch.length?H.table(fields.map(datasetLabel),
    batch.map(r=>fields.map(([k])=>datasetCell(r,k)))):'<p class="empty-state">No se encontraron filas.</p>';
  $('quality-preview').scrollLeft=0;
  $('quality-range').textContent=batch.length?`${start+1}–${start+batch.length} de ${filtered.length} filas`:'0 filas';
  $('quality-prev').disabled=datasetPage===0;
  $('quality-next').disabled=start+batch.length>=filtered.length;
  $('quality-prev').hidden=$('quality-next').hidden=filtered.length<=datasetPageSize;
}
function renderDataset() {
  $('quality-data').hidden=!audit;
  if(!audit) return;
  const sheet=audit.sheets[0].name;
  $('quality-source').textContent=audit.fileName;
  const fields=datasetFields();
  $('quality-counts').textContent=[sheet,audit.period,rawData.length+(rawData.length===1?' fila':' filas'),fields.length+' campos'].filter(Boolean).join(' · ');
  const fieldFilter=$('quality-missing'), selection=fieldFilter.value;
  fieldFilter.replaceChildren(new Option('Cualquiera (sin filtro)',''),
    ...fields.filter(([k])=>audit.missing[k]>0).map(f=>new Option(datasetLabel(f),f[0])));
  if ([...fieldFilter.options].some(o=>o.value===selection)) fieldFilter.value=selection;
  renderDatasetRows();
}
function datasetLabel([key,,label]) {
  return key==='area'?'Área de café (ha)':key==='base'?'Grupo local':label;
}
function renderCoverage() {
  if(!audit) return;
  const count=rawData.length;
  $('coverage-source').textContent=[audit.fileName,audit.sheets[0].name,audit.period,count+(count===1?' fila':' filas')].filter(Boolean).join(' · ');
  const fields=datasetFields().map(field=>({field,missing:audit.missing[field[0]]??0}));
  const visible=$('coverage-incomplete').checked?fields.filter(x=>x.missing>0):fields;
  $('coverage-table').innerHTML=visible.length?`<table class="coverage-table"><thead><tr><th scope="col">Campo</th><th scope="col">Con dato</th><th scope="col">Sin dato</th><th scope="col">Cobertura</th></tr></thead><tbody>${
    visible.map(({field,missing})=>{
      const [key]=field, label=datasetLabel(field), filled=count-missing, pct=100*filled/count;
      return `<tr><th scope="row">${H.esc(label)}</th><td>${filled}</td><td>${
        missing?`<button type="button" class="coverage-link" data-missing="${H.esc(key)}" aria-label="Ver filas sin dato en ${H.esc(label)}">${missing}</button>`:'0'
      }</td><td><div class="coverage-meter"><meter min="0" max="${count}" value="${filled}" aria-hidden="true"></meter><span>${H.fmt(pct,1)} %</span></div></td></tr>`;
    }).join('')
  }</tbody></table>`:'<p class="empty-state">Todos los campos de la vista tienen datos.</p>';
}
function initDataset() {
  $('quality-search').addEventListener('input',()=>{datasetPage=0;renderDatasetRows();});
  $('quality-missing').addEventListener('change',()=>{datasetPage=0;renderDatasetRows();});
  $('coverage-incomplete').addEventListener('change',renderCoverage);
  $('coverage-table').addEventListener('click',event=>{
    const key=event.target.closest('button[data-missing]')?.dataset.missing;
    if(!key) return;
    $('quality-search').value='';
    datasetPage=0;
    nav('quality');
    $('quality-missing').value=key;
    renderDatasetRows();
    $('quality-missing').focus();
  });
  for(const [id,step] of [['quality-prev',-1],['quality-next',1]]){
    $(id).addEventListener('click',()=>{
      datasetPage+=step;
      renderDatasetRows();
      if($(id).disabled) $('quality-preview').focus();
    });
  }
  $('download-data').addEventListener('click',()=>{
    const fields=datasetFields();
    const headers=[...fields.map(f=>f[1]),...(audit.period?['periodo']:[]),'hoja_importada','fila_importada','hoja_origen','fila_excel_origen'];
    const rows=rawData.map(r=>[...fields.map(f=>r[f[0]]),...(audit.period?[audit.period]:[]),r.sourceSheet,r.sourceRow,r.originalSheet,r.originalRow]);
    download('productoras_normalizadas.csv','\ufeff'+[headers,...rows].map(r=>r.map(D.csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');
  });
}
