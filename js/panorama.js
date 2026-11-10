/*
 * Panorama del Fondo: lo esencial en 10 segundos, con poco texto.
 *  - «Así son las productoras de cada cooperativa»: medianas en lenguaje simple.
 *  - «Para qué piden crédito»: % de cada actividad dentro de cada cooperativa.
 *  - «3 cosas a mirar»: alertas automáticas con enlace a su pantalla.
 * El mapa de perfiles (PCA) vive en su propia pantalla, «Mapa de perfiles», para el equipo de análisis.
 * Se carga antes de app.js; usa D, H, audit, GAPS, MIN_N, coopColor y el seguimiento cuando se llama.
 */
'use strict';

let panoramaChart = null;
const PROFILE_ROWS = [
  ['age', 'Edad típica', (v) => `${H.fmt(v, 0)} años`],
  ['family', 'Personas en el hogar', (v) => H.fmt(v, 0)],
  ['years', 'Años en la cooperativa (socio titular)', (v) => `${H.fmt(v, 0)} años`],
  ['area', 'Área de café', (v) => `${H.fmt(v, Number.isInteger(v) ? 0 : 1)} ha`],
  ['qq', 'Café entregado a la cooperativa (2025)', (v) => `${H.fmt(v, 0)} qq`],
  ['income', 'Ingreso principal (2025)', (v) => `S/ ${H.fmt(v, 0)}`],
  ['amount', 'Monto solicitado', (v) => `S/ ${H.fmt(v, 0)}`]
];

const panoramaCoops = (rows) => {
  const rank = (c) => (COOP_ORDER.includes(c) ? COOP_ORDER.indexOf(c) : 99);
  return [...new Set(rows.map((r) => r.coop))].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
};

function renderProfileTable(rows, coops) {
  const groups = coops.map((c) => [groupLabel(c), rows.filter((r) => r.coop === c), coopColor(c)]);
  if (groups.length > 1) groups.push(['Todas', rows, null]);
  const medianOf = (rs, k) => { const vals = rs.map((r) => r[k]).filter(D.finite); return vals.length >= MIN_N ? D.median(vals) : null; };
  const body = PROFILE_ROWS.map(([k, label, fmt]) => {
    const cells = groups.map(([, rs]) => medianOf(rs, k));
    return cells.every((v) => v === null) ? '' : `<tr><th scope="row">${label}</th>${cells.map((v) => `<td>${v === null ? '<span class="muted">—</span>' : fmt(v)}</td>`).join('')}</tr>`;
  }).join('');
  const head = `<tr><th></th>${groups.map(([name, rs, color]) => `<th scope="col">${color ? `<span class="dot" style="background:${color}"></span>` : ''}${H.esc(name)}<small>${rs.length} productoras</small></th>`).join('')}</tr>`;
  $('summary-profile').innerHTML = body ? `<table class="profile-simple"><thead>${head}</thead><tbody>${body}</tbody></table>` : '<p class="chart-note">La base no trae estos datos.</p>';
  $('summary-profile-note').textContent = `Cada número es la mediana: el valor de la productora del medio. «—» quiere decir menos de ${MIN_N} respuestas.`;
}

function renderActivityChart(rows, coops) {
  if (panoramaChart) { panoramaChart.destroy(); panoramaChart = null; }
  const answered = rows.filter((r) => r.activity);
  if (!answered.length || typeof Chart === 'undefined') { $('summary-activity-note').textContent = 'La base no trae la actividad a financiar.'; return; }
  const totals = new Map();
  answered.forEach((r) => totals.set(r.activity, (totals.get(r.activity) || 0) + 1));
  const top = [...totals].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([a]) => a);
  const catOf = (r) => (top.includes(r.activity) ? r.activity : 'OTRAS');
  const cats = [...top, ...(answered.some((r) => !top.includes(r.activity)) ? ['OTRAS'] : [])];
  const byCoop = coops.map((c) => { const rs = answered.filter((r) => r.coop === c); return { c, n: rs.length, pct: cats.map((k) => (rs.length ? (100 * rs.filter((r) => catOf(r) === k).length) / rs.length : 0)), count: cats.map((k) => rs.filter((r) => catOf(r) === k).length) }; }).filter((g) => g.n >= MIN_N);
  panoramaChart = new Chart($('chart-summary-activity'), {
    type: 'bar',
    data: { labels: cats.map((k) => (k === 'OTRAS' ? 'Otras' : prettyLabel(k))), datasets: byCoop.map((g) => ({ label: `${groupLabel(g.c)} (${g.n})`, data: g.pct.map((p) => +p.toFixed(1)), backgroundColor: coopColor(g.c), borderRadius: 4 })) },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: byCoop.length > 1, position: 'bottom' }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.x}% (${byCoop[ctx.datasetIndex].count[ctx.dataIndex]} productoras)` } } }, scales: { x: { min: 0, max: 100, ticks: { callback: (v) => v + '%' } } } }
  });
  $('summary-activity-note').textContent = byCoop.map((g) => { const i = g.pct.indexOf(Math.max(...g.pct)); return `${groupLabel(g.c)}: ${Math.round(g.pct[i])} % pide para ${(cats[i] === 'OTRAS' ? 'otras actividades' : prettyLabel(cats[i]).toLowerCase())}`; }).join('. ') + '.';
}

function panoramaAlerts(rows, coops) {
  const alerts = [];
  // 1. La brecha más grande en alguna cooperativa.
  let worst = null;
  coops.forEach((c) => GAPS.forEach((g) => { const s = share(rows.filter((r) => r.coop === c), g.f); if (s.pct !== null && (!worst || s.pct > worst.pct)) worst = { c, g, pct: s.pct, n: s.n }; }));
  if (worst && worst.pct >= 50) alerts.push({ icon: '⚠️', text: `${Math.round(worst.pct)} % de ${groupLabel(worst.c)}: «${worst.g.label}» (de ${worst.n} que respondieron). Es la brecha más grande de esta selección.`, page: 'cross', link: 'Ver brechas' });
  // 2. Avance del crédito según el seguimiento.
  if (typeof segState !== 'undefined' && segState.records.length) {
    const recs = segRecordsFor(rows);
    const fert = coops.map((c) => ({ c, ...PDSeguimiento.yesNoSummary(recs.filter((r) => r.coop === c), 'fertUsed') })).filter((s) => s.answered >= MIN_N)[0];
    const book = coops.map((c) => ({ c, ...PDSeguimiento.yesNoSummary(recs.filter((r) => r.coop === c), 'bookUse') })).filter((s) => s.answered >= MIN_N)[0];
    if (fert) alerts.push({ icon: fert.yes / fert.answered >= 0.7 ? '✅' : '⚠️', text: `${Math.round((100 * fert.yes) / fert.answered)} % de ${groupLabel(fert.c)} ya aplicó el fertilizante (${fert.yes} de ${fert.answered}).`, page: 'seguimiento', link: 'Ver seguimiento' });
    else if (book) alerts.push({ icon: '✅', text: `${Math.round((100 * book.yes) / book.answered)} % de ${groupLabel(book.c)} usa el cuaderno de registros.`, page: 'seguimiento', link: 'Ver seguimiento' });
  } else {
    alerts.push({ icon: 'ℹ️', text: 'Carga el seguimiento 2026 para ver si ya usaron el crédito y cuánto venden.', page: 'seguimiento', link: 'Cargar seguimiento' });
  }
  // 3. Una zona que concentra a la mayoría, o datos para revisar.
  const zones = groupRows(rows, 'territory');
  const big = zones.reduce((m, z) => (z[1].length > (m ? m[1].length : 0) ? z : m), null);
  if (big && zones.length > 1 && big[1].length / rows.length > 0.5) alerts.push({ icon: '📍', text: `${groupLabel(big[0])} concentra el ${Math.round((100 * big[1].length) / rows.length)} % de las productoras: comparar zonas pesa poco.`, page: 'territory', link: 'Ver territorio' });
  if (audit && audit.quarantine.length) alerts.push({ icon: '🗂️', text: `${audit.quarantine.length} ${audit.quarantine.length === 1 ? 'fila apartada' : 'filas apartadas'} al cargar: no entran a los gráficos hasta revisarlas.`, page: 'quality', link: 'Revisar' });
  if (audit && audit.extremes && audit.extremes.length) alerts.push({ icon: '🔎', text: `${audit.extremes.length} ${audit.extremes.length === 1 ? 'valor extremo' : 'valores extremos'} para confirmar con la cooperativa.`, page: 'quality', link: 'Revisar' });
  return alerts.slice(0, 3);
}

function renderPanorama(rows) {
  const list = $('summary-alerts');
  if (!list) return;
  if (!rows.length) {
    $('summary-profile').innerHTML = '<p class="cx-empty">Carga una base para ver cómo son las productoras.</p>';
    $('summary-profile-note').textContent = '';
    $('summary-activity-note').textContent = '';
    if (panoramaChart) { panoramaChart.destroy(); panoramaChart = null; }
    list.innerHTML = '<li class="muted">Las alertas aparecen al cargar una base.</li>';
    return;
  }
  const coops = panoramaCoops(rows);
  renderProfileTable(rows, coops);
  renderActivityChart(rows, coops);
  const alerts = panoramaAlerts(rows, coops);
  list.innerHTML = alerts.length
    ? alerts.map((a) => `<li><span class="alert-icon" aria-hidden="true">${a.icon}</span><span>${H.esc(a.text)}</span><button type="button" class="link-btn link-btn--small" data-nav="${a.page}">${a.link} →</button></li>`).join('')
    : '<li class="muted">Nada urgente en esta selección.</li>';
}
