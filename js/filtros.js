/*
 * Búsqueda y filtros (evaluación B4–B12):
 *  - B7: la ficha se abre desde «Ficha de productora» y se puede volver a la pantalla anterior.
 *  - B8: estado claro cuando la productora elegida sale de la selección.
 *  - B4/B6: cuántas opciones tiene cada filtro y búsqueda en listas largas.
 *  - B9: leyendas que dicen que son interactivas y nunca dejan el gráfico vacío.
 *  - B11: umbrales de alerta con mínimo 1 %.
 *  - B12: método de medida visible en «Qué muestra la selección».
 * Se carga antes de app.js; las funciones usan $, rawData y nav de app.js cuando se llaman.
 */
'use strict';

const byIdF = (id) => document.getElementById(id);
/* ---------- B8: la productora elegida ya no está en la selección ---------- */

function setProducerNote(text) {
  const note = byIdF('producer-note');
  if (!note) return;
  note.hidden = !text;
  note.textContent = text;
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
  if(selectId==='filter-base')byIdF('reset-filters').hidden=!q&&['filter-coop','filter-territory','filter-base'].every(id=>byIdF(id).value==='all');
}

// app.js la llama cada vez que se reconstruyen las listas de filtros.
const baseSearch=byIdF('base-search'), baseSearchToggle=byIdF('base-search-toggle');
function setBaseSearch(open) {
  baseSearch.hidden=!open;
  baseSearchToggle.setAttribute('aria-expanded',String(open));
}
function afterFiltersBuilt() {
  baseSearchToggle.hidden=byIdF('filter-base').options.length<9 && !baseSearch.value;
  if(baseSearchToggle.hidden) setBaseSearch(false);
  applySearch('filter-base');
}
baseSearchToggle.addEventListener('click',()=>{
  if(baseSearch.hidden){
    setBaseSearch(true);
    baseSearch.focus();
  }else{
    baseSearch.value='';
    setBaseSearch(false);
    applySearch('filter-base');
  }
});

document.querySelectorAll('.filter-search').forEach((input) => {
  input.addEventListener('input', () => applySearch(input.dataset.for));
});

/* ---------- B9: leyendas interactivas ---------- */

if (typeof Chart !== 'undefined') {
  const legend = Chart.defaults.plugins.legend;
  const defaultClick = legend.onClick;
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

/* ---------- Enlaces entre pantallas (por ejemplo, de Cruces a Relaciones) ---------- */
document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-nav]');
  if (link) nav(link.dataset.nav);
});
