// Páginas ligadas a los objetivos del Fondo Rotatorio: condiciones del crédito,
// apoyo a la preselección, participación y cobertura de datos.
// Usa utilidades de coops.js y cross.js (share, groupRows, median, newChart, fmtPct).

const FUND = { rate: 0.08, minMonths: 6, maxMonths: 12 };

// Cuota mensual con cuotas iguales. Es una referencia: el cronograma real depende
// del periodo en que se entregue el crédito.
function monthlyPayment(principal, months, annualRate = FUND.rate) {
  const r = annualRate / 12;
  return r === 0 ? principal / months : principal * r / (1 - Math.pow(1 + r, -months));
}

let fundCharts = {};
const money = v => v === null || v === undefined ? '—' : 'S/ ' + Math.round(v).toLocaleString('es-PE');
const esc2 = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const table2 = (heads, rows, cls = '') => `<table class="terr ${cls}"><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

// ---------- Condiciones del Fondo ----------

function renderFund(data) {
  const amountEl = document.getElementById('fund-amount'), monthsEl = document.getElementById('fund-months');
  if (!amountEl) return;
  const amounts = data.map(r => r.amount).filter(v => Number.isFinite(v) && v > 0);
  if (!amountEl.dataset.touched) amountEl.value = amounts.length ? Math.round(median(amounts)) : '';
  const months = Math.min(FUND.maxMonths, Math.max(FUND.minMonths, +monthsEl.value || FUND.minMonths));
  const P = +amountEl.value;
  const out = document.getElementById('fund-result');
  if (P > 0) {
    const cuota = monthlyPayment(P, months), total = cuota * months;
    out.innerHTML = `<div class="kpis-grid kpis-3">
      <div class="kpi-card"><div class="kpi-title">Cuota mensual aprox.</div><div class="kpi-val">${money(cuota)}</div><div class="kpi-sub">${months} cuotas iguales</div></div>
      <div class="kpi-card"><div class="kpi-title">Intereses del periodo</div><div class="kpi-val">${money(total - P)}</div><div class="kpi-sub">8% anual</div></div>
      <div class="kpi-card"><div class="kpi-title">Total a devolver</div><div class="kpi-val">${money(total)}</div><div class="kpi-sub">capital + intereses</div></div></div>`;
  } else out.innerHTML = '<p class="cx-empty">Escribe un monto para estimar la cuota.</p>';

  const body = document.getElementById('fund-portfolio');
  const groups = groupRows(data, 'coop');
  if (!groups.length) { body.innerHTML = '<p class="cx-empty">Carga una base para ver las solicitudes por cooperativa.</p>'; return; }
  const rows = groups.map(([g, rs]) => {
    const a = rs.map(r => r.amount).filter(v => Number.isFinite(v) && v > 0);
    const sum = a.reduce((t, v) => t + v, 0), inter = a.reduce((t, v) => t + monthlyPayment(v, months) * months - v, 0);
    return [`<b>${groupLabel(g)}</b>`, a.length + ' de ' + rs.length, money(sum), a.length >= MIN_N ? money(median(a)) : '—', money(inter)];
  });
  body.innerHTML = table2(['Cooperativa', 'Productoras con monto', 'Total solicitado', 'Monto típico', `Intereses estimados a ${months} meses`], rows) +
    '<p class="cx-note">Son montos solicitados en la encuesta, no créditos entregados. Los intereses son una estimación con cuotas iguales; el cronograma real depende de la fecha de entrega. El crédito se entrega en insumos, no en efectivo.</p>';
}

// ---------- Apoyo a la preselección ----------

function renderSelect(data) {
  const root = document.getElementById('select-body');
  if (!root) return;
  const yEl = document.getElementById('sel-years'), qEl = document.getElementById('sel-qq');
  const ys = data.map(r => r.years).filter(Number.isFinite), qs = data.map(r => r.qq).filter(Number.isFinite);
  if (!yEl.dataset.touched) yEl.value = ys.length ? Math.round(median(ys)) : 0;
  if (!qEl.dataset.touched) qEl.value = qs.length ? Math.round(median(qs)) : 0;
  const minY = +yEl.value || 0, minQ = +qEl.value || 0;
  if (!data.length) { root.innerHTML = '<p class="cx-empty">No hay productoras con los filtros actuales.</p>'; return; }
  const known = data.filter(r => Number.isFinite(r.years) && Number.isFinite(r.qq));
  const both = known.filter(r => r.years >= minY && r.qq >= minQ);
  const onlyY = known.filter(r => r.years >= minY && r.qq < minQ).length;
  const onlyQ = known.filter(r => r.years < minY && r.qq >= minQ).length;
  const none = known.length - both.length - onlyY - onlyQ;
  const unknown = data.length - known.length;
  const kpi = (t, v, s) => `<div class="kpi-card"><div class="kpi-title">${t}</div><div class="kpi-val">${v}</div><div class="kpi-sub">${s}</div></div>`;
  let html = `<div class="kpis-grid">${kpi('Cumplen los dos criterios', both.length, 'años de asociada y acopio')}${kpi('Solo años de asociada', onlyY, 'acopio por debajo del mínimo')}${kpi('Solo acopio', onlyQ, 'menos años de asociada')}${kpi('No cumplen ninguno', none, unknown ? unknown + ' sin dato en algún criterio' : 'con ambos datos')}</div>`;

  const byCoop = groupRows(data, 'coop').map(([g, rs]) => {
    const k = rs.filter(r => Number.isFinite(r.years) && Number.isFinite(r.qq)), b = k.filter(r => r.years >= minY && r.qq >= minQ).length;
    return [`<b>${groupLabel(g)}</b>`, rs.length, b, k.length ? Math.round(100 * b / k.length) + '%' : '—'];
  });
  const link = [['Ahorro en la cooperativa', r => r.savingsCoop ?? null], ['Crédito vigente en la cooperativa', r => r.coopCredit ?? null], ['Capacitación de la cooperativa 2025', r => r.trainedCoop ?? null]]
    .map(([t, f]) => { const s = share(both, f); return [t, s.pct === null ? (s.n ? 'Pocas respuestas (' + s.n + ')' : 'Sin dato en esta base') : s.pct.toFixed(0) + '%']; });
  html += `<div class="grid-12"><div class="card-panel col-6"><h3>Cuántas cumplen, por cooperativa</h3>${table2(['Cooperativa', 'Productoras', 'Cumplen los dos', '% con ambos datos'], byCoop)}</div>
    <div class="card-panel col-6"><h3>Vínculo con la cooperativa de quienes cumplen</h3>${table2(['Qué relación tienen', 'Productoras'], link)}
    <p class="cx-note">Según Producers Direct, el acceso a otros beneficios de la cooperativa (préstamos, ahorro, acopio) es más útil que el historial de Infocorp para anticipar el repago.</p></div></div>`;

  const list = both.slice().sort((a, b) => b.years - a.years || b.qq - a.qq).slice(0, 40);
  html += `<div class="card-panel"><h3>Productoras que cumplen ambos criterios${both.length > 40 ? ' (primeras 40)' : ''}</h3><div class="table-scroll">${table2(['Código', 'Cooperativa', 'Distrito', 'Años de asociada', 'Acopio 2025 (qq)', 'Área (ha)', 'Monto solicitado'],
    list.map(r => [esc2(r.code), groupLabel(r.coop), esc2(r.territory ? groupLabel(r.territory) : '—'), r.years, r.qq, Number.isFinite(r.area) ? r.area : '—', money(r.amount)]))}</div>
    <p class="cx-note">Esta lista apoya, no reemplaza, la preselección que hace la cooperativa: ella conoce a las socias activas y a sus familias. Los años de asociada son los del socio titular. Las mujeres que son esposas o hijas de socios entran con la antigüedad del titular.</p></div>`;
  root.innerHTML = html;
}

// ---------- Participación (capacitación) ----------

function renderParticipation(data) {
  Object.values(fundCharts).forEach(c => c.destroy()); fundCharts = {};
  const box = document.getElementById('part-body'), cv = document.getElementById('cv-part'), note = document.getElementById('note-part');
  if (!box) return;
  const groups = groupRows(data, 'coop').map(([g, rs]) => [g, share(rs, r => r.trainedCoop ?? null)]).filter(([, s]) => s.pct !== null);
  box.hidden = !groups.length;
  note.textContent = groups.length ? '' : 'Ninguna cooperativa tiene respuestas suficientes sobre capacitación en esta base.';
  if (!groups.length) return;
  fundCharts.part = newChart(cv, {
    type: 'bar',
    data: { labels: groups.map(([g]) => groupLabel(g)), datasets: [{ data: groups.map(([, s]) => +s.pct.toFixed(1)), backgroundColor: BRAND, borderRadius: 4 }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { min: 0, max: 100, grid: { display: false }, title: { display: true, text: '% de productoras que recibieron capacitación en 2025' } }, y: { grid: { display: false } } } }
  });
  note.textContent = 'Reto de Producers Direct: que las socias asistan ellas mismas, y no solo sus esposos. Este dato mide si recibieron capacitación, no quién asistió.';
}

// ---------- Datos que faltan ----------

const WISHLIST = [
  ['Uso y decisión sobre los recursos del hogar', 'Quién decide cómo se gasta el ingreso y el crédito', () => null],
  ['Nivel educativo', 'Para adaptar materiales y canales', d => coverageOf(d, 'education')],
  ['Salud', 'Condiciones que limitan la participación', () => null],
  ['Ocio', 'Tiempo propio de las mujeres', () => null],
  ['Uso del tiempo', 'Trabajo doméstico y de cuidado frente al tiempo para capacitarse', () => null],
  ['Venta del café a otros compradores y precio', 'Cuánto del café sale de la cooperativa cuando el precio fluctúa', () => null],
  ['Pagos del crédito', 'Cumplimiento por cuota; permitirá medir mora cuando se entregue el primer ciclo', () => null]
];

function coverageOf(d, k) { return d.length ? d.filter(r => r[k] != null).length / d.length : 0; }

function renderCoverage(data) {
  const root = document.getElementById('coverage-body');
  if (!root) return;
  if (!data.length) { root.innerHTML = '<p class="cx-empty">Carga una base para ver qué datos tiene cada cooperativa.</p>'; return; }
  const groups = groupRows(data, 'coop');
  const skip = ['code', 'coop', 'birth', 'infocorp'];
  const fields = PDData.fields.filter(f => !skip.includes(f[0]));
  const cell = p => { if (p === 0) return '<span class="sem sem-na">No lo recoge</span>'; const t = Math.round(p * 100); return `<span class="sem ${p >= .9 ? 'sem-ok' : p >= .5 ? 'sem-warn' : 'sem-bad'}">${t}%</span>`; };
  const rows = fields.map(([k, , label]) => [label, cell(coverageOf(data, k)), ...groups.map(([, rs]) => cell(coverageOf(rs, k)))]);
  const wish = WISHLIST.map(([t, why, f]) => { const p = f(data); return [`<b>${t}</b>`, why, p === null ? '<span class="sem sem-bad">No se recoge hoy</span>' : p === 0 ? '<span class="sem sem-bad">No se recoge hoy</span>' : p >= 0.995 ? '<span class="sem sem-ok">Ya se recoge (100%)</span>' : `<span class="sem sem-warn">Parcial: ${Math.round(p * 100)}% de las productoras</span>`]; });
  root.innerHTML = `<div class="card-panel"><h3>Información que Producers Direct quisiera tener</h3>${table2(['Tema', 'Para qué serviría', 'Estado en la base'], wish)}
    <p class="cx-note">Producers Direct señaló que no la recoge por tiempo o costo. Es la información que permitiría entender mejor la situación de las mujeres productoras y atacar el problema de su baja participación.</p></div>
    <div class="card-panel"><h3>Cuánto de cada pregunta tiene respuesta</h3><div class="table-scroll">${table2(['Pregunta', 'Todas', ...groups.map(([g]) => groupLabel(g))], rows)}</div>
    <p class="cx-note">Cada cooperativa usa su propio formulario, por eso hay preguntas que una cooperativa no hace. “No lo recoge” significa que esa pregunta no está en su formulario, no que las productoras no hayan respondido.</p></div>
    <div class="card-panel"><h3>Datos que no hace falta pedir</h3><ul class="plain-list"><li><b>Historial en Infocorp.</b> Se intentó con Bagua Grande y resultó poco relevante para el repago; por eso el tablero no lo usa como señal de riesgo.</li><li><b>Certificación orgánica o de Comercio Justo de cada finca.</b> La certificación es de la cooperativa y no de cada productora; se asume que las socias activas cumplen las normas orgánicas.</li></ul></div>`;
}

function renderFundPages(data) {
  renderFund(data); renderSelect(data); renderParticipation(data); renderCoverage(data);
}
