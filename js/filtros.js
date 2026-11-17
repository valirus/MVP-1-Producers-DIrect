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

/* ---------- Searchable Select Component ---------- */

function createSearchableSelect(selectId, options = {}) {
  const select = byIdF(selectId);
  if (!select || select.dataset.searchableInit === 'true') return;

  const placeholder = options.placeholder || 'Buscar…';
  const allowClear = options.allowClear !== false;
  const minOptionsForSearch = options.minOptionsForSearch || 8;

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'searchable-select-wrapper';
  select.parentNode.insertBefore(wrapper, select);
  wrapper.appendChild(select);

  // Create search input
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'searchable-select-input';
  searchInput.placeholder = placeholder;
  searchInput.setAttribute('aria-label', placeholder);
  searchInput.setAttribute('autocomplete', 'off');
  searchInput.setAttribute('role', 'combobox');
  searchInput.setAttribute('aria-autocomplete', 'list');
  searchInput.setAttribute('aria-controls', selectId + '-listbox');
  searchInput.setAttribute('aria-expanded', 'false');
  wrapper.appendChild(searchInput);

  // Create dropdown listbox
  const listbox = document.createElement('div');
  listbox.id = selectId + '-listbox';
  listbox.className = 'searchable-select-listbox';
  listbox.setAttribute('role', 'listbox');
  listbox.setAttribute('tabindex', '-1');
  wrapper.appendChild(listbox);

  // Clear button
  let clearBtn = null;
  if (allowClear) {
    clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'searchable-select-clear';
    clearBtn.innerHTML = '✕';
    clearBtn.setAttribute('aria-label', 'Limpiar selección');
    clearBtn.hidden = select.value === 'all';
    wrapper.appendChild(clearBtn);
  }

  let highlightedIndex = -1;
  let optionsCache = [];

  function rebuildOptionsCache() {
    optionsCache = [...select.options].map((opt, i) => ({
      index: i,
      value: opt.value,
      text: opt.textContent,
      selected: opt.selected,
      disabled: opt.disabled,
      hidden: opt.hidden
    })).filter((opt, i) => i === 0 || opt.value !== 'all'); // Keep "all" option but don't show in list
  }

  function renderListbox(filter = '') {
    const q = D.norm(filter);
    let shown = 0;
    listbox.innerHTML = '';

    optionsCache.forEach((opt, cacheIndex) => {
      if (opt.index === 0) return; // Skip "all" option in listbox
      const keep = !q || D.norm(opt.text).includes(q);
      if (!keep) return;

      shown++;
      const optionEl = document.createElement('div');
      optionEl.className = 'searchable-select-option' + (opt.selected ? ' selected' : '');
      optionEl.setAttribute('role', 'option');
      optionEl.setAttribute('aria-selected', opt.selected ? 'true' : 'false');
      optionEl.setAttribute('data-value', opt.value);
      optionEl.setAttribute('data-index', opt.index);
      optionEl.textContent = opt.text;

      optionEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectOption(opt.index);
      });

      listbox.appendChild(optionEl);
    });

    // No results message
    if (q && shown === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'searchable-select-no-results';
      noResults.textContent = 'Sin coincidencias';
      listbox.appendChild(noResults);
    }

    highlightedIndex = -1;
    updateClearButton();
  }

  function updateClearButton() {
    if (clearBtn) {
      clearBtn.hidden = select.value === 'all';
    }
  }

  function selectOption(index) {
    select.value = select.options[index].value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    closeListbox();
    searchInput.focus();
  }

  function highlightOption(index) {
    const options = listbox.querySelectorAll('.searchable-select-option');
    options.forEach((opt, i) => {
      opt.classList.toggle('highlighted', i === index);
    });
    highlightedIndex = index;
    if (index >= 0) {
      options[index].scrollIntoView({ block: 'nearest' });
    }
  }

  function openListbox() {
    rebuildOptionsCache();
    renderListbox(searchInput.value);
    listbox.hidden = false;
    searchInput.setAttribute('aria-expanded', 'true');
    wrapper.classList.add('open');
  }

  function closeListbox() {
    listbox.hidden = true;
    searchInput.setAttribute('aria-expanded', 'false');
    wrapper.classList.remove('open');
    highlightedIndex = -1;
  }

  function handleKeydown(e) {
    const options = listbox.querySelectorAll('.searchable-select-option');
    const maxIndex = options.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (listbox.hidden) {
          openListbox();
        } else {
          highlightOption(Math.min(highlightedIndex + 1, maxIndex));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!listbox.hidden) {
          highlightOption(Math.max(highlightedIndex - 1, 0));
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (!listbox.hidden && highlightedIndex >= 0) {
          const opt = options[highlightedIndex];
          selectOption(parseInt(opt.dataset.index, 10));
        } else if (listbox.hidden) {
          openListbox();
        }
        break;
      case 'Escape':
        closeListbox();
        searchInput.focus();
        break;
      case 'Tab':
        closeListbox();
        break;
    }
  }

  function handleInput() {
    openListbox();
    renderListbox(searchInput.value);
  }

  function handleClickOutside(e) {
    if (!wrapper.contains(e.target)) {
      closeListbox();
    }
  }

  function handleClear() {
    select.value = 'all';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    searchInput.value = '';
    updateClearButton();
    closeListbox();
    searchInput.focus();
  }

  // Sync select value to UI
  function syncFromSelect() {
    const selectedOpt = select.options[select.selectedIndex];
    searchInput.value = selectedOpt.value === 'all' ? '' : selectedOpt.textContent;
    updateClearButton();

    // Update listbox selection
    listbox.querySelectorAll('.searchable-select-option').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.value === select.value);
      opt.setAttribute('aria-selected', opt.dataset.value === select.value ? 'true' : 'false');
    });
  }

  // Event listeners
  searchInput.addEventListener('focus', openListbox);
  searchInput.addEventListener('input', handleInput);
  searchInput.addEventListener('keydown', handleKeydown);
  searchInput.addEventListener('click', (e) => e.stopPropagation());

  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleClear();
    });
  }

  // Click on select opens dropdown
  select.addEventListener('click', (e) => {
    e.stopPropagation();
    searchInput.focus();
  });

  select.addEventListener('change', syncFromSelect);

  document.addEventListener('click', handleClickOutside);

  // Initial sync
  syncFromSelect();

  // Mark as initialized
  select.dataset.searchableInit = 'true';

  // Return API
  return {
    refresh: () => {
      rebuildOptionsCache();
      syncFromSelect();
    },
    open: openListbox,
    close: closeListbox
  };
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
function afterFiltersBuilt() {
  // Initialize searchable selects for categorical filters with many options
  ['filter-coop', 'filter-territory', 'filter-base'].forEach(id => {
    const select = byIdF(id);
    if (select && select.options.length > 8) {
      createSearchableSelect(id, {
        placeholder: id === 'filter-base' ? 'Buscar grupo local…' : 'Buscar…',
        minOptionsForSearch: 8
      });
    }
  });

  // Keep legacy search for backward compat
  const baseSearch = byIdF('base-search');
  const baseSearchToggle = byIdF('base-search-toggle');
  if (baseSearchToggle) baseSearchToggle.hidden = true;
  if (baseSearch) baseSearch.hidden = true;
  applySearch('filter-base');
}

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