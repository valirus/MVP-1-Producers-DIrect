/*
 * Búsqueda y filtros (evaluación B4–B12):
 *  - B7: la ficha se abre desde «Abrir ficha de productora» y se puede volver a la pantalla anterior.
 *  - B8: estado claro cuando la productora elegida sale de la selección.
 *  - B4/B6: cuántas opciones tiene cada filtro y búsqueda en listas largas.
 *  - B9: leyendas que dicen que son interactivas y nunca dejan el gráfico vacío.
 *  - B11: umbrales de alerta con mínimo 1 %.
 *  - B12: método de medida visible en «Qué muestra la selección».
 * Se carga antes de app.js; las funciones usan $, rawData y nav de app.js cuando se llaman.
 */
'use strict';

const byIdF = (id) => document.getElementById(id);
let currentPageName = 'summary';
let lastAnalysisPage = 'summary';

/* ---------- B7: volver desde la ficha ---------- */

// app.js llama a esta función en cada cambio de pantalla.
function trackPage(page) {
  currentPageName = page;
  if (page !== 'producer') lastAnalysisPage = page;
  const back = byIdF('back-from-producer');
  if (back) {
    back.hidden = page !== 'producer' || lastAnalysisPage === 'producer';
    back.textContent = `← Volver a ${pageNames[lastAnalysisPage] || 'la pantalla anterior'}`;
  }
}

byIdF('back-from-producer')?.addEventListener('click', () => nav(lastAnalysisPage));

// Si se quita la productora estando en su ficha, se vuelve a donde estaba.
function afterProducerChange() {
  setProducerNote('');
  if (byIdF('filter-producer').value === '' && currentPageName === 'producer') nav(lastAnalysisPage);
}

/* ---------- B8: la productora elegida ya no está en la selección ---------- */

function setProducerNote(text) {
  const note = byIdF('producer-note');
  if (!note) return;
  note.hidden = !text;
  note.textContent = text;
}

// app.js la llama después de reconstruir la lista de productoras.
function checkProducerStillVisible(previous) {
  const select = byIdF('filter-producer');
  if (previous && select.value !== previous) {
    select.value = '';
    const row = rawData[Number(previous)];
    setProducerNote(row ? `${row.code} no está en la selección actual (cambiaste un filtro), así que se quitó su ficha. Elige otra productora o limpia los filtros.` : '');
  } else if (!previous) {
    setProducerNote('');
  }
}

/* ---------- B4 y B6: conteos y búsqueda en listas ---------- */

function applySearch(selectId) {
  const select = byIdF(selectId);
  const input = document.querySelector(`.filter-search[data-for="${selectId}"]`);
  if (!select || !input) return;
  const q = D.norm(input.value);
  let shown = 0;
  [...select.options].forEach((opt, i) => {
    const keep = i === 0 || !q || opt.selected || D.norm(opt.textContent).includes(q);
    opt.hidden = !keep;
    opt.disabled = !keep;
    if (keep && i > 0) shown++;
  });
  input.classList.toggle('no-results', !!q && shown === 0);
  input.title = q ? `${shown} coincidencias` : '';
}

// app.js la llama cada vez que se reconstruyen las listas de filtros.
function afterFiltersBuilt() {
  const count = (id) => Math.max(0, (byIdF(id)?.options.length || 1) - 1);
  const help = (id, text) => { const el = byIdF(id); if (el) el.textContent = text; };
  const nT = count('filter-territory'), nB = count('filter-base'), nP = count('filter-producer');
  help('help-territory', `Tal como aparece en el formulario, por ejemplo: Tabaconas - San Ignacio. ${nT} ${nT === 1 ? 'opción' : 'opciones'}.`);
  help('help-base', `Grupo de socias dentro de la cooperativa, según el formulario. ${nB} ${nB === 1 ? 'opción' : 'opciones'}.`);
  help('help-producer', `Elegir una productora abre su ficha. ${nP} en la selección actual.`);
  applySearch('filter-base');
  applySearch('filter-producer');
}

document.querySelectorAll('.filter-search').forEach((input) => {
  input.addEventListener('input', () => applySearch(input.dataset.for));
});

/* ---------- B9: leyendas interactivas ---------- */

if (typeof Chart !== 'undefined') {
  const legend = Chart.defaults.plugins.legend;
  const defaultClick = legend.onClick;
  legend.title = { display: true, text: 'Toca un elemento para ocultarlo o mostrarlo', color: '#566159', font: { size: 11 } };
  legend.onHover = (event) => { if (event.native?.target) event.native.target.style.cursor = 'pointer'; };
  legend.onLeave = (event) => { if (event.native?.target) event.native.target.style.cursor = 'default'; };
  legend.onClick = function onLegendClick(event, item, legendObj) {
    const chart = legendObj.chart;
    if (item.datasetIndex !== undefined) {
      const visible = chart.data.datasets.filter((d, i) => chart.isDatasetVisible(i)).length;
      // No se deja ocultar la última serie: el gráfico vacío parecería «sin datos».
      if (visible === 1 && chart.isDatasetVisible(item.datasetIndex)) return;
    }
    defaultClick.call(this, event, item, legendObj);
  };
}

/* ---------- B11: umbrales de alerta ---------- */

['th-net', 'th-lit', 'th-yield'].forEach((id) => {
  byIdF(id)?.addEventListener('change', (event) => {
    const v = Number(event.target.value);
    if (!Number.isFinite(v) || v < 1) event.target.value = 1;
    if (v > 100) event.target.value = 100;
    event.target.dispatchEvent(new Event('input'));
  });
});

/* ---------- B12: con qué se midió la relación ---------- */

function renderMethodNote() {
  const select = byIdF('corr-method');
  const note = byIdF('method-note');
  if (!select || !note) return;
  note.innerHTML = select.value === 'spearman'
    ? 'Medido con: <strong>orden de los valores</strong> (Spearman), menos sensible a casos extremos.'
    : 'Medido con: <strong>relación en línea recta</strong> (Pearson).';
}
byIdF('corr-method')?.addEventListener('change', renderMethodNote);
renderMethodNote();
