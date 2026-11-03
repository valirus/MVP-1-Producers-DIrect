// Gráfico de participación en capacitaciones.
// Usa utilidades de coops.js y cross.js (share, groupRows, newChart).

let fundCharts = {};

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

function renderFundPages(data) { renderParticipation(data); }
