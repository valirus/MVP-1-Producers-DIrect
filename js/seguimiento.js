/*
 * Pantalla «Seguimiento del crédito»: ingresos, egresos, uso del crédito y cuaderno de registros.
 * La lectura de los archivos está en seguimiento_core.js (PDSeguimiento), con sus pruebas y su contrato
 * (data/contrato_seguimiento.md). Este archivo solo dibuja la pantalla y la conecta con el resto del tablero.
 * Reglas: «X de Y respondieron», sin porcentajes ni sumas con menos de MIN_N respuestas, sin imputar,
 * gastos de la familia solo sumados por grupo. Todo queda en la memoria del navegador.
 * Se carga antes de app.js; usa rawData, filteredData, H, nav y download de app.js cuando se llama.
 */
'use strict';

const SEG = PDSeguimiento;
const segState = { pending: null, records: [], profiles: [], message: '' };
function resetSeguimiento() { Object.assign(segState,{pending:null,records:[],profiles:[],message:''}); }
let segCharts = {};
const segById = (id) => document.getElementById(id);
const segMonthLabel = (m) => m.charAt(0) + m.slice(1).toLowerCase();
const segPct = (yes, n) => `${Math.round((100 * yes) / n)}%`;
const segMoney = (v) => `S/ ${H.fmt(v, 0)}`;

/* ---------- Unión con la base de productoras ---------- */

function segBaseIndex(allRows) {
  const index = new Map(), repeated = new Set();
  allRows.forEach((row) => {
    const key = SEG.norm(row.code);
    if (index.has(key)) repeated.add(key);
    index.set(key, { code: row.code, coop: row.coop });
  });
  repeated.forEach((key) => index.delete(key)); // un código repetido en la base no se une
  return index;
}

// Registros de seguimiento de las productoras que están en la selección actual (filtros del tablero).
function segRecordsFor(rows) {
  const keys = new Set(rows.map((r) => SEG.norm(r.code) + '|' + r.coop));
  return segState.records.filter((rec) => keys.has(rec.key + '|' + rec.coop));
}

// Resumen de una productora para la ficha de visita y la hoja «Mi finca».
function segFactsFor(row) {
  if (!row || !segState.records.length) return null;
  const rec = segState.records.find((r) => r.key === SEG.norm(row.code) && r.coop === row.coop);
  if (!rec) return null;
  const months = Object.entries(rec.months).filter(([, v]) => v && !v.conflict);
  const answered = months.filter(([, v]) => v.sold === 0 || v.sold === 1);
  const sales = months.map(([, v]) => v.sales).filter((v) => v != null);
  return {
    fert: rec.statics.fertUsed ?? null,
    book: rec.statics.bookUse ?? null,
    soldMonths: answered.filter(([, v]) => v.sold === 1).length,
    answeredMonths: answered.length,
    salesTotal: sales.length ? sales.reduce((a, b) => a + b, 0) : null,
    salesMonths: sales.filter((v) => v > 0).length,
    firstMonth: months[0]?.[0], lastMonth: months[months.length - 1]?.[0]
  };
}

/* ---------- Carga ---------- */

async function segReadFiles(fileList) {
  if (!rawData.length) { segState.message = 'Primero carga la base de productoras con «Abrir Excel». El seguimiento se une a ella por el código.'; segRerender(); return; }
  const version=datasetVersion;
  const files = [];
  for (const file of fileList) {
    try {
      if (file.size > 15 * 1024 * 1024) throw Error('El archivo supera 15 MB.');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      const sheets=visibleWorkbookSheets(workbook);
      if (!sheets.length) throw Error('No hay hojas visibles dentro del tamaño admitido.');
      files.push({ fileName: file.name, sheets });
    } catch (error) {
      files.push({ fileName: file.name, error: 'No se pudo leer: ' + error.message });
    }
  }
  if(version!==datasetVersion) return;
  const index = segBaseIndex(rawData);
  segState.pending = files.map((f) => (f.error ? { fileName: f.fileName, error: f.error, observations: [], records: [] } : SEG.readFile(f.fileName, f.sheets, index)));
  segState.message = '';
  segRerender();
}

function segConfirm() {
  const valid = (segState.pending || []).filter((p) => !p.error);
  if (!valid.length) return;
  const {records}=SEG.combine(valid);
  Object.assign(segState,{profiles:valid,records,pending:null});
  segRerender();
}
/* ---------- Dibujo ---------- */

function segChart(id, config) {
  const canvas = segById(id);
  if (!canvas || typeof Chart === 'undefined') return;
  segCharts[id] = new Chart(canvas, { ...config, options: { responsive: true, maintainAspectRatio: false, animation: false, ...config.options } });
}

function segCard(span, title, body, note = '') {
  return `<article class="card-panel col-${span}"><h3>${title}</h3>${body}${note ? `<p class="chart-note">${note}</p>` : ''}</article>`;
}

const segTable = (head, rows) => (rows.length ? H.table(head, rows) : '<p class="chart-note">Sin respuestas en esta selección.</p>');

function segCoops(recs) {
  const rank = (c) => (COOP_ORDER.includes(c) ? COOP_ORDER.indexOf(c) : 99);
  return [...new Set(recs.map((r) => r.coop))].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

// Barra de % Sí por cooperativa para una pregunta Sí/No.
function segYesNoBlock(id, recs, coops, field, label) {
  const stats = coops.map((c) => ({ c, ...SEG.yesNoSummary(recs.filter((r) => r.coop === c), field) })).filter((s) => s.answered > 0);
  if (!stats.some(s=>s.answered>=MIN_N)) return { html: '<p class="chart-note">Esta pregunta no está en los archivos de esta selección.</p>', draw: () => {} };
  const shown = stats.filter((s) => s.answered >= MIN_N);
  return {
    html: `<div class="chart-box chart-box--short"><canvas id="${id}" role="img" aria-label="${H.esc(label)}"></canvas></div>`
      + `<p class="chart-note">${shown.map((s) => `${H.esc(groupLabel(s.c))}: ${s.yes} de ${s.answered} respondieron que sí (${segPct(s.yes, s.answered)})`).join('. ')}.</p>`,
    draw: () => segChart(id, {
      type: 'bar',
      data: { labels: shown.map((s) => `${groupLabel(s.c)} (${s.answered})`), datasets: [{ data: shown.map((s) => +(100 * s.yes / s.answered).toFixed(1)), backgroundColor: shown.map((s) => coopColor(s.c)), borderRadius: 4 }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.parsed.x}% (${shown[c.dataIndex].yes} de ${shown[c.dataIndex].answered})` } } }, scales: { x: { min: 0, max: 100, ticks: { callback: (v) => v + '%' } } } }
    })
  };
}

function segTallyTable(recs, field, filter, head) {
  const t = SEG.tally(recs, field, filter);
  return t.answered>=MIN_N ? `<p class="chart-note">${t.answered} respuestas, tal como se escribieron:</p>` + segTable([head, 'Productoras'], t.items.filter(i=>i.n>=MIN_N).slice(0,8).map((i) => [i.label, i.n])) : '';
}

function renderSeguimiento(rows) {
  const root = segById('seg-root');
  if (!root) return;
  Object.values(segCharts).forEach((c) => { try { c.destroy(); } catch (e) { /* nada */ } });
  segCharts = {};
  const header = `<article class="card-panel seg-head"><div><h3>Archivos de seguimiento</h3>
    <p class="chart-note">Selecciona los Excel de seguimiento de un mismo ciclo.</p></div>
    <div class="seg-actions"><button type="button" class="btn-upload" id="seg-open">Cargar seguimiento</button><input type="file" id="seg-input" accept=".xlsx,.xls" multiple hidden></div>
    ${segState.message ? `<p class="seg-message" role="status">${H.esc(segState.message)}</p>` : ''}
    ${segState.records.length ? `<p class="seg-loaded">✔️ ${segState.profiles.length} archivos · ${segState.records.length} productoras · meses: ${SEG.monthsPresent(segState.records).map(segMonthLabel).join(', ')}.</p>` : ''}</article>`;
  if (segState.pending) { root.innerHTML = header + segReviewPanel(); return; }
  if (!segState.records.length) { root.innerHTML = header + '<p class="cx-empty">Todavía no hay seguimiento cargado.</p>'; return; }

  const recs = segRecordsFor(rows);
  const coops = segCoops(recs);
  if (!recs.length) { root.innerHTML = header + '<p class="cx-empty">Ninguna productora de la selección actual tiene seguimiento. Prueba quitando filtros.</p>'; return; }
  const months = SEG.monthsPresent(recs);
  const draws = [];

  // Uso del crédito
  const fert = segYesNoBlock('seg-fert', recs, coops, 'fertUsed', '¿Ya aplicó el fertilizante?');
  draws.push(fert.draw);
  const why = segTallyTable(recs, 'fertWhyNot', (r) => r.statics.fertUsed === 0, 'Motivo para no aplicarlo');
  const act = segTallyTable(recs, 'activity', () => true, 'Actividad financiada');
  const useCard = segCard(6, 'Uso del crédito: ¿ya aplicó el fertilizante?', fert.html + why + (act ? `<h4 class="seg-sub">Emprendimiento financiado</h4>${act}` : ''),
    '');

  // Cuaderno
  const book = segYesNoBlock('seg-book', recs, coops, 'bookUse', '¿Usa el cuaderno de registros?');
  draws.push(book.draw);
  const bookCard = segCard(6, 'Cuaderno de registros: ¿anota sus ingresos y gastos?', book.html + segTallyTable(recs, 'bookUseful', () => true, '¿Le parece útil?'),
    '');

  // Ventas por mes
  const monthly = coops.map((c) => ({ c, by: months.map((m) => SEG.monthSummary(recs.filter((r) => r.coop === c), m)) }));
  draws.push(() => segChart('seg-sold', {
    type: 'bar',
    data: { labels: months.map(segMonthLabel), datasets: monthly.map(({ c, by }) => ({ label: groupLabel(c), data: by.map((s) => (s.saleAnswered >= MIN_N ? +(100 * s.soldYes / s.saleAnswered).toFixed(1) : null)), backgroundColor: coopColor(c), borderRadius: 4 })) },
    options: { plugins: { legend: { display: coops.length > 1, position: 'bottom' }, tooltip: { callbacks: { label: (ctx) => { const s = monthly[ctx.datasetIndex].by[ctx.dataIndex]; return `${ctx.dataset.label}: ${ctx.parsed.y}% (${s.soldYes} de ${s.saleAnswered})`; } } } }, scales: { y: { min: 0, max: 100, ticks: { callback: (v) => v + '%' }, title: { display: true, text: '% que vendió en el mes' } } } }
  }));
  const soldRows = monthly.flatMap(({ c, by }) => by.filter((s) => s.saleAnswered>=MIN_N || s.qtyN>=MIN_N).map((s) => [groupLabel(c), segMonthLabel(s.month), s.saleAnswered>=MIN_N?`${s.soldYes} de ${s.saleAnswered}`:'—', s.qtyN >= MIN_N ? `${H.fmt(s.qtySold, 1)} qq` : '—']));
  const salesCard = segCard(12, 'Ventas por mes: ¿cuántas vendieron?', `<div class="chart-box"><canvas id="seg-sold" role="img" aria-label="Porcentaje que vendió cada mes"></canvas></div><details class="mini-details"><summary>Ver tabla</summary>${segTable(['Cooperativa', 'Mes', 'Vendieron', 'Quintales (qq) vendidos'], soldRows)}</details>`,
    `Cada barra es el % de quienes respondieron ese mes. Los quintales solo aplican al café; en emprendimiento las cantidades están en kg o unidades y no se suman. Sin barra: menos de ${MIN_N} respuestas.`);

  // Venta de café a la cooperativa
  const deliver = segYesNoBlock('seg-deliver', recs, coops, 'coopDelivered', '¿Llevó su café a la cooperativa?');
  draws.push(deliver.draw);
  const soon = SEG.yesNoSummary(recs.filter((r) => r.statics.coopDelivered === 0), 'coopSoon');
  const coffeeCard = segCard(6, 'Venta de café: ¿lo llevó a la cooperativa?', deliver.html
    + (soon.answered>=MIN_N ? `<p class="chart-note">De las que aún no lo llevaron, ${soon.yes} de ${soon.answered} dicen que lo llevarán pronto.</p>` : '')
    + segTallyTable(recs, 'coopWhyNot', (r) => r.statics.coopDelivered === 0, 'Motivo para no llevarlo'),
    '');

  // Ingresos y gastos
  const money = monthly.flatMap(({ c, by }) => by.filter((s) => s.salesN || s.workN || s.famN).map((s) => [groupLabel(c), segMonthLabel(s.month),
    s.salesN >= MIN_N ? `${segMoney(s.sales)} (${s.salesN})` : `— (${s.salesN})`,
    s.workN >= MIN_N ? `${segMoney(s.workExp)} (${s.workN})` : `— (${s.workN})`,
    s.famN >= MIN_N ? `${segMoney(s.famExp)} (${s.famN})` : `— (${s.famN})`]));
  draws.push(() => segChart('seg-money', {
    type: 'bar',
    data: { labels: months.map(segMonthLabel), datasets: monthly.flatMap(({ c, by }) => [
      { label: `${groupLabel(c)}: ventas`, data: by.map((s) => (s.salesN >= MIN_N ? s.sales : null)), backgroundColor: coopColor(c), borderRadius: 4 },
      { label: `${groupLabel(c)}: gasto de la finca o emprendimiento`, data: by.map((s) => (s.workN >= MIN_N ? s.workExp : null)), backgroundColor: coopColor(c) + '66', borderColor: coopColor(c), borderWidth: 1, borderRadius: 4 }
    ]) },
    options: { plugins: { legend: { display: true, position: 'bottom' }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${segMoney(ctx.parsed.y)}` } } }, scales: { y: { beginAtZero: true, ticks: { callback: (v) => 'S/ ' + v.toLocaleString('es-PE') } } } }
  }));
  const moneyCard = segCard(12, 'Ingresos y gastos por mes (S/)', `<div class="chart-box"><canvas id="seg-money" role="img" aria-label="Ventas y gastos por mes"></canvas></div>${segTable(['Cooperativa', 'Mes', 'Ventas (respondieron)', 'Gasto de la finca o emprendimiento', 'Gasto de la familia'], money)}`,
    'Entre paréntesis, cuántas productoras dieron ese dato. «Ventas» es lo que recibió por vender (precio por cantidad), sin restar costos, aunque el formulario lo llame «ganancia». No se calcula «ventas menos gastos» porque las que responden ventas y gastos no son siempre las mismas cada mes. El gasto de la familia es un dato sensible: solo se muestra sumado por grupo.');

  root.innerHTML = header + `<div class="grid-12">${useCard}${bookCard}${salesCard}${coffeeCard}${moneyCard}</div>`;
  draws.forEach((d) => { try { d(); } catch (e) { console.error('Seguimiento:', e); } });
}

function segReviewPanel() {
  const rows=segState.pending.map(p=>[p.fileName,p.error?'—':p.months.map(segMonthLabel).join(', '),
    p.error||`${p.matched} de ${p.rows}`]);
  const ok=segState.pending.some(p=>!p.error&&p.matched>0);
  return `<article class="card-panel"><h3>Confirmar archivos</h3>
    <div class="table-scroll">${H.table(['Archivo','Meses','Filas vinculadas a la base'],rows)}</div>
    <div class="actions"><button type="button" class="btn-upload" id="seg-confirm" ${ok?'':'disabled'}>Confirmar carga</button><button type="button" class="btn-print" id="seg-cancel">Cancelar</button></div></article>`;
}
function segRerender() { renderSeguimiento(filteredData); if (typeof renderSegHint==='function') renderSegHint(); }

// Eventos (delegados: la pantalla se vuelve a dibujar).
document.addEventListener('click', (event) => {
  const id = event.target.closest('button')?.id;
  if (id === 'seg-open') segById('seg-input')?.click();
  if (id === 'seg-confirm') segConfirm();
  if (id === 'seg-cancel') { segState.pending = null; segState.message = segState.records.length ? 'Carga cancelada. Se mantiene el seguimiento anterior.' : 'Carga cancelada.'; segRerender(); }
});
document.addEventListener('change', (event) => {
  if (event.target.id === 'seg-input' && event.target.files.length) { segReadFiles([...event.target.files]).finally(() => { event.target.value = ''; }); }
});
