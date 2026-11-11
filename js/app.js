/* Coordinación de la sesión. Los datos se mantienen solo en memoria. */
'use strict';
const $ = id => document.getElementById(id), D = PDData, H = PDCharts;
let rawData = [], filteredData = [], audit = null, pending = null, datasetVersion = 0;
let page = 'summary';
const pageNames = { summary: 'Panorama del fondo', production: 'Área y café entregado', inclusion: 'Participación y acceso', credit: 'Solicitudes de crédito', producer: 'Ficha de productora', quality: 'Registros', coverage: 'Resumen del Excel', seguimiento: 'Seguimiento del crédito' };
const aggregates = ['summary', 'production', 'inclusion', 'credit'];

function setImportError(message = '') {
  $('import-error').textContent = message;
  $('import-error').hidden = !message;
}
let viewData = {};
let producerRow = null, producerLimit = 8;
function syncControls() {
  $('sheet-picker').hidden = !pending;
  $('start-title').textContent=['quality','coverage'].includes(page)?'Abre una base de productoras':'Abre el Excel de productoras';
  $('start-panel').querySelector('p').hidden=['quality','coverage'].includes(page);
  $('start-panel').hidden = !!audit || !!pending;
  $('open-file').hidden = !audit || !!pending;
  document.querySelector('.filters-bar').hidden = !audit || !!pending || !(aggregates.includes(page) || page === 'producer' || page === 'seguimiento') || !document.querySelector('.filters-bar .field:not([hidden])');
  $('no-selection').hidden = !audit || !!pending || !aggregates.includes(page) || page==='summary' || !!viewData[page];
  document.querySelectorAll('.page').forEach(x=>{
    const key=x.id.replace('-page','');
    x.hidden = !audit || !!pending;
    x.classList.toggle('empty-view',aggregates.includes(key) && key!=='summary' && !viewData[key]);
  });
}
function nav(next) {
  if (!ROLES[currentRole].pages.includes(next)) return;
  page = next;
  document.querySelectorAll('.nav button').forEach(b => {
    const active = b.dataset.page === next;
    b.classList.toggle('active', active);
    if (active) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === next + '-page'));
  $('page-title').textContent = pageNames[next];
  syncControls();
  if (next === 'quality') renderDataset();
  if (next === 'coverage') renderCoverage();
  if (next === 'seguimiento' && audit) renderSeguimiento(filteredData);
  if (next === 'producer') renderProducerBrowser();
  requestAnimationFrame(() => H.resize());
}
document.querySelectorAll('.nav button').forEach(b => b.addEventListener('click', () => { nav(b.dataset.page); $('page-title').focus(); }));
const choice = (r, key, v) => v === 'all' || (v === '__null__' ? r[key] == null : r[key] === v);
const region = r => r.territory && r.province && !D.norm(r.territory).endsWith(' - '+D.norm(r.province)) ? r.territory+' - '+r.province : r.territory || r.province;
function setOptions(id, values, title, reset = false) {
  const select = $(id), previous = reset ? 'all' : select.value;
  select.replaceChildren(new Option(title, 'all'));
  [...new Set(values)].sort((a,b) => String(a).localeCompare(String(b),'es')).forEach(v => select.add(new Option(v == null ? 'Sin respuesta' : groupLabel(v), v ?? '__null__')));
  select.value = [...select.options].some(o => o.value === previous) ? previous : 'all';
  select.closest('.field').hidden = !values.some(v=>v!=null) || select.options.length<=2;
}
function applyFilters(reset = false) {
  setOptions('filter-coop', rawData.map(r => r.coop), 'Todas', reset);
  const coops = rawData.filter(r => choice(r, 'coop', $('filter-coop').value));
  setOptions('filter-territory', coops.map(region), 'Todos', reset);
  const areas = coops.filter(r => choice({region: region(r)}, 'region', $('filter-territory').value));
  setOptions('filter-base', areas.map(r => r.base), 'Todos los grupos locales', reset);
  filteredData = areas.filter(r => choice(r, 'base', $('filter-base').value));

  if (reset || (producerRow && !filteredData.includes(producerRow))) {
    const excluded = producerRow;
    producerRow = null;
    producerLimit = 8;
    setProducerNote(!reset && excluded ? `${excluded.code} no está en la selección.` : '');
  }
  afterFiltersBuilt();
  if (producerRow) showProducer(); else clearProducer();
  if (page === 'producer') renderProducerBrowser();

  const n = filteredData.length;
  $('overview-data').hidden = !audit;
  $('kpi-n').textContent = n;
  const total = (rows,key,digits) => {
    const vals=rows.map(r=>r[key]).filter(D.finite);
    return vals.length ? vals.reduce((a,b)=>a+b,0).toLocaleString('es-PE',{maximumFractionDigits:digits}) : '—';
  };
  const coverage=(rows,k)=>rows.filter(r=>D.finite(r[k])).length;
  const metrics=[['amount','Monto solicitado (S/)',2],['area','Área de café (ha)',2],['qq','Café entregado (quintales)',2]];
  const available=metrics.filter(([k])=>coverage(filteredData,k)>0);
  for(const [key,,digits] of metrics){
    const el=$('kpi-'+key), show=available.some(([k])=>k===key);
    el.closest('.kpi-card').hidden=false;
    if(!show)el.textContent='Sin datos';
    if (show) {
      el.textContent=(key==='amount'?'S/ ':'')+total(filteredData,key,digits);
      const unit=key==='area'?'ha':key==='qq'?'quintales':'';
      if (unit) {
        const suffix=document.createElement('span');
        suffix.className='kpi-unit';
        suffix.textContent=' '+unit;
        el.append(suffix);
      }
      const valid=coverage(filteredData,key);
      if(valid<n) {
        const note=document.createElement('div');
        note.className='kpi-coverage';
        note.textContent=valid+' de '+n+' con dato';
        el.append(note);
      }
    }
  }
  renderOverview(filteredData,available,total);
  if (page === 'seguimiento' && audit) renderSeguimiento(filteredData);
  const cross=renderCross(filteredData);
  const stats=H.render(filteredData, rawData);
  viewData={...stats,inclusion:stats.inclusion||cross};
  $('reset-filters').hidden=['filter-coop','filter-territory','filter-base'].every(id=>$(id).value==='all') && !document.querySelector('[data-for="filter-base"]').value;
  syncControls();
}
for (const id of ['filter-coop','filter-territory','filter-base']) $(id).addEventListener('change', () => {
  $('base-search').value='';
  setBaseSearch(false);
  applyFilters();
});
$('reset-filters').addEventListener('click', () => {
  $('base-search').value='';
  setBaseSearch(false);
  applyFilters(true);
});
function clearProducer() {
  clearVisit(); clearProducerExtras();
  $('rep-code-coop').textContent = '';
  $('producer-fields').replaceChildren();
  $('btn-print-action').disabled = true;
}
function selectedProducer() {
  return producerRow;
}
function renderProducerBrowser() {
  const selected = !!selectedProducer();
  $('producer-browser').hidden = selected;
  $('producer-change').hidden = !selected;
  if (selected || !audit) return;
  const query = D.norm($('producer-query').value);
  const rows = filteredData.filter(r => D.norm(r.code).includes(query))
    .sort((a,b) => a.code.localeCompare(b.code, 'es', {numeric:true}) || a.coop.localeCompare(b.coop, 'es'));
  $('producer-results-empty').hidden = !!rows.length;
  $('producer-more').hidden = rows.length <= producerLimit;
  $('producer-results').replaceChildren(...rows.slice(0,producerLimit).map(row => {
    const item = document.createElement('li'), button = document.createElement('button');
    const code = document.createElement('strong'), location = document.createElement('span');
    code.textContent = row.code;
    location.textContent = [groupLabel(row.coop), region(row)].filter(Boolean).join(' · ');
    button.type = 'button';
    button.append(code, location);
    button.addEventListener('click', () => {
      producerRow = row;
      setProducerNote('');
      showProducer();
      renderProducerBrowser();
      if ($('report-printable').hidden) $('btn-print-action').focus();
      else $('rep-code-coop').focus();
    });
    item.append(button);
    return item;
  }));
}
function showProducer() {
  const r = selectedProducer();
  if (!r) return clearProducer();
  $('rep-code-coop').textContent = [r.code,groupLabel(r.coop),region(r)].filter(Boolean).join(' · ');
  const num = (k, suffix = '', prefix = '') => D.finite(r[k]) ? prefix+H.fmt(r[k],Number.isInteger(r[k])?0:2)+suffix : null;
  const yes = x => x === 1 ? 'Sí' : x === 0 ? 'No' : null;
  const fields = [['Actividad solicitada',r.activity ? prettyLabel(r.activity) : null],['Monto solicitado',num('amount','','S/ ')],['Café entregado',num('qq',' quintales')],['Área de café',num('area',' ha')],['Ingreso principal declarado',num('income','','S/ ')],['Celular propio',({SMARTPHONE:'Smartphone',BASICO:'Celular de teclas',NINGUNO:'Sin celular'})[r.phone]||r.phone],['Antigüedad de la socia titular',num('years',' años')],['¿La productora tiene ahorros o aportes de capital en su cooperativa?',yes(r.savingsCoop)],['¿La socia titular tiene un crédito vigente con la cooperativa?',yes(r.coopCredit)]];
  $('producer-fields').innerHTML=fields.filter(([,v])=>v!=null).map(([k,v])=>`<div class="report-card"><h4>${H.esc(k)}</h4><div class="big">${H.esc(v)}</div></div>`).join('');
  $('btn-print-action').disabled=false;
  renderVisit(r); updateProducerExtras(r);
}
$('producer-query').addEventListener('input', () => { producerLimit=8; renderProducerBrowser(); });
$('producer-more').addEventListener('click', () => {
  const previousLimit=producerLimit;
  producerLimit+=8;
  renderProducerBrowser();
  $('producer-results').children[previousLimit]?.firstElementChild.focus();
});
$('producer-change').addEventListener('click', () => {
  producerRow=null;
  setProducerNote('');
  clearProducer();
  renderProducerBrowser();
  $('producer-query').focus();
});
$('btn-print-action').addEventListener('click', () => { if (selectedProducer()) window.print(); });
function openPicker() { importRequest++; setImportError(); $('excel-input').click(); }
$('open-file').addEventListener('click',openPicker);
$('start-open').addEventListener('click',openPicker);
function cancelImport() {
  pending=null;
  setImportError();
  syncControls();
  (audit?$('open-file'):$('start-open')).focus();
}
function loadProfile(profile,fileName,session) {
  const result=D.importProfiles([profile],{fileName,numberMode:'dot'});
  if (!result.records.length) throw Error('No hay filas válidas. Revisa el código y la cooperativa.');
  if(pendingDownload && !window.confirm('Hay visitas por descargar. ¿Cambiar de base?')) return;
  if(session)sourceSession={...session,selectedName:profile.name};
  rawData=result.records; audit=result.audit; pending=null; datasetVersion++;
  sessionVisits=[]; pendingDownload=false; updateVisitStatus();
  setCoopColors(rawData);
  resetSeguimiento();
  $('base-search').value='';
  setBaseSearch(false);
  $('producer-query').value='';
  resetDataset();
  applyFilters(true);
  renderDataset();
  if (page === 'coverage') renderCoverage();
  setImportError();
  $('page-title').focus();
}
function visibleWorkbookSheets(wb) { return inspectWorkbook(wb).profiles.map(({name,matrix})=>({name,matrix})); }
$('excel-input').addEventListener('change', async e => {
  const file=e.target.files[0]; if (!file) return;
  const request=++importRequest;
  try {
    if (file.size>15*1024*1024) throw Error('El archivo supera 15 MB.');
    const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true});
    if(request!==importRequest)return;
    const {profiles,sheets}=inspectWorkbook(wb);
    if(!profiles.length)throw Error('No hay hojas visibles dentro del límite: 50.000 filas, 250 columnas y 2 millones de celdas.');
    const session={profiles,sheets,fileName:file.name,numberMode:'dot'};
    const choices=profiles.filter(p=>p.map.code!==undefined&&(p.map.coop!==undefined||p.fixedCoop));
    const clean=choices.find(p=>D.norm(p.name)==='PRODUCTORAS')||(choices.length===1?choices[0]:null);
    if(clean&&!D.ambiguousFields(clean.matrix[clean.header]).length)loadProfile(clean,file.name,session);
    else beginConfiguration(session,clean?.name||choices[0]?.name);
  } catch(err) {
    if(request!==importRequest)return;
    pending=null;setImportError(err.message);syncControls();
  } finally { if(request===importRequest)e.target.value=''; }
});
$('cancel-import').addEventListener('click',cancelImport);
$('sheet-picker').addEventListener('submit',e=>{
  e.preventDefault();
  if (!pending) return;
  try { saveConfiguration(); }
  catch(err) { setImportError(err.message); }
});
function download(name,content,type) {
  const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
initDataset(); initRoles(); applyFilters(true);
