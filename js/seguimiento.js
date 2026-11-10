/*
 * Pantalla «Seguimiento del crédito»: ingresos, egresos, uso del crédito y cuaderno de registros (enero–agosto 2026).
 * La lectura de los archivos está en seguimiento_core.js (PDSeguimiento), con sus pruebas y su contrato
 * (data/contrato_seguimiento.md). Este archivo solo dibuja la pantalla y la conecta con el resto del tablero.
 * Reglas: «X de Y respondieron», sin porcentajes ni sumas con menos de MIN_N respuestas, sin imputar,
 * gastos de la familia solo sumados por grupo. Todo queda en la memoria del navegador.
 * Se carga antes de app.js; usa rawData, filteredData, H, nav y download de app.js cuando se llama.
 */
'use strict';

const SEG = PDSeguimiento;
const segState = { files: [], pending: null, records: [], observations: [], profiles: [], message: '' };
let segCharts = {};
const segById = (id) => document.getElementById(id);
const segMonthLabel = (m) => m.charAt(0) + m.slice(1).toLowerCase();
const segPct = (yes, n) => (n >= MIN_N ? `${Math.round((100 * yes) / n)}%` : `menos de ${MIN_N} respuestas`);
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

// Cobertura de una pregunta del seguimiento sobre la selección (para «Datos que faltan»).
function segCoverage(rows, field) {
  if (!segState.records.length || !rows.length) return null;
  const recs = segRecordsFor(rows);
  return recs.filter((r) => r.statics[field] === 0 || r.statics[field] === 1).length / rows.length;
}

/* ---------- Carga ---------- */

async function segReadFiles(fileList) {
  if (!rawData.length) { segState.message = 'Primero carga la base de productoras con «Cargar Excel». El seguimiento se une a ella por el código.'; segRerender(); return; }
  const files = [];
  for (const file of fileList) {
    try {
      if (file.size > 15 * 1024 * 1024) throw Error('El archivo supera 15 MB.');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      files.push({ fileName: file.name, sheets: workbook.SheetNames.map((name) => ({ name, matrix: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: null, blankrows: true, raw: true }) })) });
    } catch (error) {
      files.push({ fileName: file.name, error: 'No se pudo leer: ' + error.message });
    }
  }
  const index = segBaseIndex(rawData);
  segState.pendingFiles = files;
  segState.pending = files.map((f) => (f.error ? { fileName: f.fileName, error: f.error, observations: [], records: [] } : SEG.readFile(f.fileName, f.sheets, index)));
  segState.message = '';
  segRerender();
}

function segConfirm() {
  const valid = (segState.pending || []).filter((p) => !p.error);
  if (!valid.length) return;
  segState.files = segState.pendingFiles.filter((f) => !f.error);
  segApply(valid);
  segState.pending = null;
  segRerender();
}

function segApply(profiles) {
  const { records, observations } = SEG.combine(profiles);
  Object.assign(segState, { profiles, records, observations });
  segRenderPeriod();
}

// Si se carga otra base, el seguimiento se vuelve a unir por código (app.js la llama).
function rejoinSeguimiento() {
  if (!segState.files.length) return;
  const index = segBaseIndex(rawData);
  segApply(segState.files.map((f) => SEG.readFile(f.fileName, f.sheets, index)));
}

function segRenderPeriod() {
  const el = segById('period-seg');
  if (!el) return;
  const months = SEG.monthsPresent(segState.records);
  el.innerHTML = segState.records.length
    ? ` <strong>Seguimiento cargado:</strong> ${segState.records.length} productoras, de ${months[0].toLowerCase()} a ${months[months.length - 1].toLowerCase()} de 2026 (ver «Seguimiento del crédito»).`
    : '';
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
  if (!stats.length) return { html: '<p class="chart-note">Esta pregunta no está en los archivos de esta selección.</p>', draw: () => {} };
  const shown = stats.filter((s) => s.answered >= MIN_N);
  return {
    html: `<div class="chart-box chart-box--short"><canvas id="${id}" role="img" aria-label="${H.esc(label)}"></canvas></div>`
      + `<p class="chart-note">${stats.map((s) => `${groupLabel(s.c)}: ${s.yes} de ${s.answered} respondieron que sí (${segPct(s.yes, s.answered)})`).join('. ')}.</p>`,
    draw: () => segChart(id, {
      type: 'bar',
      data: { labels: shown.map((s) => `${groupLabel(s.c)} (${s.answered})`), datasets: [{ data: shown.map((s) => +(100 * s.yes / s.answered).toFixed(1)), backgroundColor: shown.map((s) => coopColor(s.c)), borderRadius: 4 }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.parsed.x}% (${shown[c.dataIndex].yes} de ${shown[c.dataIndex].answered})` } } }, scales: { x: { min: 0, max: 100, ticks: { callback: (v) => v + '%' } } } }
    })
  };
}

function segTallyTable(recs, field, filter, head) {
  const t = SEG.tally(recs, field, filter);
  return t.answered ? `<p class="chart-note">${t.answered} respuestas, tal como se escribieron:</p>` + segTable([head, 'Productoras'], t.items.slice(0, 8).map((i) => [i.label, i.n])) : '';
}

function renderSeguimiento(rows) {
  const root = segById('seg-root');
  if (!root) return;
  Object.values(segCharts).forEach((c) => { try { c.destroy(); } catch (e) { /* nada */ } });
  segCharts = {};
  const header = `<article class="card-panel seg-head"><div><h3>Seguimiento del crédito (enero a agosto de 2026)</h3>
    <p class="chart-note">Carga los Excel de ingresos y egresos de cada cooperativa (puedes elegir varios a la vez). Se unen a la base por el código de productora. Nada se envía ni se guarda.</p></div>
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
    'El formulario de emprendimiento (Bagua Grande) no pregunta por el uso del insumo: ahí se muestra la actividad financiada.');

  // Cuaderno
  const book = segYesNoBlock('seg-book', recs, coops, 'bookUse', '¿Usa el cuaderno de registros?');
  draws.push(book.draw);
  const bookCard = segCard(6, 'Cuaderno de registros: ¿anota sus ingresos y gastos?', book.html + segTallyTable(recs, 'bookUseful', () => true, '¿Le parece útil?'),
    'Es uno de los criterios de éxito que mencionó Eunice. Mide si dice usarlo, no la calidad de lo que anota.');

  // Ventas por mes
  const monthly = coops.map((c) => ({ c, by: months.map((m) => SEG.monthSummary(recs.filter((r) => r.coop === c), m)) }));
  draws.push(() => segChart('seg-sold', {
    type: 'bar',
    data: { labels: months.map(segMonthLabel), datasets: monthly.map(({ c, by }) => ({ label: groupLabel(c), data: by.map((s) => (s.saleAnswered >= MIN_N ? +(100 * s.soldYes / s.saleAnswered).toFixed(1) : null)), backgroundColor: coopColor(c), borderRadius: 4 })) },
    options: { plugins: { legend: { display: coops.length > 1, position: 'bottom' }, tooltip: { callbacks: { label: (ctx) => { const s = monthly[ctx.datasetIndex].by[ctx.dataIndex]; return `${ctx.dataset.label}: ${ctx.parsed.y}% (${s.soldYes} de ${s.saleAnswered})`; } } } }, scales: { y: { min: 0, max: 100, ticks: { callback: (v) => v + '%' }, title: { display: true, text: '% que vendió en el mes' } } } }
  }));
  const soldRows = monthly.flatMap(({ c, by }) => by.filter((s) => s.saleAnswered).map((s) => [groupLabel(c), segMonthLabel(s.month), `${s.soldYes} de ${s.saleAnswered}`, s.qtyN >= MIN_N ? `${H.fmt(s.qtySold, 1)} qq` : '—']));
  const salesCard = segCard(12, 'Ventas por mes: ¿cuántas vendieron?', `<div class="chart-box"><canvas id="seg-sold" role="img" aria-label="Porcentaje que vendió cada mes"></canvas></div><details class="mini-details"><summary>Ver tabla</summary>${segTable(['Cooperativa', 'Mes', 'Vendieron', 'Quintales (qq) vendidos'], soldRows)}</details>`,
    `Cada barra es el % de quienes respondieron ese mes. Los quintales solo aplican al café; en emprendimiento las cantidades están en kg o unidades y no se suman. Sin barra: menos de ${MIN_N} respuestas.`);

  // Venta de café a la cooperativa
  const deliver = segYesNoBlock('seg-deliver', recs, coops, 'coopDelivered', '¿Llevó su café a la cooperativa?');
  draws.push(deliver.draw);
  const soon = SEG.yesNoSummary(recs.filter((r) => r.statics.coopDelivered === 0), 'coopSoon');
  const coffeeCard = segCard(6, 'Venta de café: ¿lo llevó a la cooperativa?', deliver.html
    + (soon.answered ? `<p class="chart-note">De las que aún no lo llevaron, ${soon.yes} de ${soon.answered} dicen que lo llevarán pronto.</p>` : '')
    + segTallyTable(recs, 'coopWhyNot', (r) => r.statics.coopDelivered === 0, 'Motivo para no llevarlo'),
    'Orienta a quién acompañar para que no venda fuera de la cooperativa cuando baja el precio.');

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

  // Revisión
  const obs = segState.observations.filter((o) => recs.some((r) => r.code === o.code) || !rows.length);
  const obsCard = segCard(12, `Revisión del seguimiento (${obs.length} ${obs.length === 1 ? 'observación' : 'observaciones'})`,
    obs.length ? segTable(['Productora', 'Archivo', 'Fila', 'Mes', 'Dato', 'Qué se encontró', 'Qué se hizo'], obs.slice(0, 100).map((o) => [o.code, o.file, o.row, o.month ? segMonthLabel(o.month) : '—', o.field, o.finding, o.action])) : '<p class="chart-note">Sin observaciones en esta selección.</p>',
    'Ningún valor se corrige: se aparta o se marca para revisarlo con la productora.');

  root.innerHTML = header + `<div class="grid-12">${useCard}${bookCard}${salesCard}${coffeeCard}${moneyCard}${obsCard}</div>`;
  draws.forEach((d) => { try { d(); } catch (e) { console.error('Seguimiento:', e); } });
}

function segReviewPanel() {
  const rows = segState.pending.map((p) => p.error
    ? [p.fileName, '—', '—', '—', '—', '—', '—', `⚠️ ${p.error}`]
    : [p.fileName, p.kindLabel, Object.keys(p.coops).map(groupLabel).join(', ') || '—', p.months.map(segMonthLabel).join(', '), p.rows,
      `${p.matched} de ${p.rows}${p.unmatched.length ? ` (no cruzan: ${p.unmatched.slice(0, 5).join(', ')}${p.unmatched.length > 5 ? '…' : ''})` : ''}`,
      `${p.used.length} usadas · ${p.ignored.length} no usadas`, p.observations.length ? `${p.observations.length} ${p.observations.length === 1 ? 'observación' : 'observaciones'}` : 'Sin observaciones']);
  const ok = segState.pending.some((p) => !p.error);
  return `<article class="card-panel"><h3>Revisar el seguimiento antes de confirmar</h3>
    <p class="chart-note">Cada archivo se reconoce por sus preguntas, no por su nombre. Las productoras que no cruzan con la base no se incluyen.</p>
    ${H.table(['Archivo', 'Tipo', 'Cooperativa', 'Meses', 'Filas', 'Cruzan con la base', 'Preguntas', 'Observaciones'], rows)}
    <div class="actions"><button type="button" class="btn-upload" id="seg-confirm" ${ok ? '' : 'disabled'}>Confirmar carga</button><button type="button" class="btn-print" id="seg-cancel">Cancelar</button></div></article>`;
}

function segRerender() { renderSeguimiento(filteredData); }

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
