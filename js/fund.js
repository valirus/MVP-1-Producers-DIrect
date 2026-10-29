// Páginas de participación (capacitación) y de cobertura de datos.
// Usa utilidades de coops.js y cross.js (share, groupRows, newChart).

let fundCharts = {};
const table2 = (heads, rows, cls = '') => `<table class="terr ${cls}"><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

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
    data: { labels: groups.map(([g, s]) => `${groupLabel(g)}: ${s.pct.toFixed(0)}%`), datasets: [{ data: groups.map(([, s]) => +s.pct.toFixed(1)), backgroundColor: BRAND, borderRadius: 4 }] },
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
  renderParticipation(data); renderCoverage(data);
}
