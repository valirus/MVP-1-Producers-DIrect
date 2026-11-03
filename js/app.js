/*
 * Carga del Excel, filtros encadenados, navegación, KPIs y ficha imprimible.
 * Todo ocurre en el navegador: ningún dato se envía ni se persiste.
 */
'use strict';

const $ = (id) => document.getElementById(id);
const D = PDData;
const H = PDCharts;
const F = PDFilters;

const PAGES = {
  summary: { title: 'Panorama del fondo', sub: 'Lo esencial del Fondo Rotatorio en una vista.' },
  production: { title: 'Producción y acopio', sub: 'Cuánto acopió cada productora en 2025.' },
  inclusion: { title: 'Participación y acceso digital', sub: 'Acceso, lectoescritura y vínculo con la cooperativa.' },
  credit: { title: 'Demanda de crédito', sub: 'Qué piden y cuánto solicitan las productoras.' },
  territory: { title: 'Territorio y alertas', sub: 'Zonas que conviene acompañar primero.' },
  producer: { title: 'Ficha de productora', sub: 'Una ficha breve para trabajo de campo.' },
  strengths: { title: 'Fortalezas y brechas', sub: 'Dónde están las mayores oportunidades.' },
  relations: { title: 'Relaciones entre datos', sub: 'Qué variables se mueven juntas y qué conviene revisar.' }
};

const GEO_FILTERS = [
  ['coop', 'Cooperativa', 'Todas las cooperativas'],
  ['territory', 'Distrito', 'Todos los distritos'],
  ['base', 'Base', 'Todas las bases']
];

const RELATION_LABELS = {
  area: 'Área de café',
  qq: 'Acopio 2025',
  income: 'Ingreso anual',
  amount: 'Monto solicitado',
  age: 'Edad',
  years: 'Antigüedad',
  family: 'Personas en el hogar'
};

const PHONE_LABELS = {
  SMARTPHONE: 'Smartphone',
  BASICO: 'Celular básico',
  NINGUNO: 'Sin celular',
  'OTRO / REVISAR': 'Revisar respuesta'
};

const LITERACY_LABELS = {
  NINGUNA: 'Sin dificultad',
  LECTURA: 'Dificultad para leer',
  ESCRITURA: 'Dificultad para escribir',
  AMBAS: 'Dificultad para leer y escribir',
  'OTRO / REVISAR': 'Revisar respuesta'
};

const CHANNEL_LABELS = {
  WHATSAPP: 'WhatsApp',
  LLAMADAS: 'Llamadas',
  SMS: 'SMS',
  VISITAS: 'Visitas',
  CORREO: 'Correo'
};

let rawData = [];
let filteredData = [];
let audit = null;
let currentPage = 'summary';
let filters = { coop: F.ALL, territory: F.ALL, base: F.ALL, producer: '' };

const reducedMotion = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

const esc = (value) => H.esc(value);

function setStatus(text, warning = false, pill = '') {
  const banner = $('status-banner');
  if (!banner) return;
  banner.classList.toggle('is-warning', warning);
  $('status-text').textContent = text;
  $('status-pill').textContent = pill;
}

function closeMenu() {
  const side = $('sidebar');
  const toggle = $('menu-toggle');
  if (side) side.classList.remove('nav-open');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

function setPage(page, moveFocus = true) {
  if (!PAGES[page]) page = 'summary';
  currentPage = page;

  document.querySelectorAll('.nav button').forEach((button) => {
    const active = button.dataset.page === page;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  document.querySelectorAll('.page').forEach((section) => {
    section.classList.toggle('active', section.id === page + '-page');
  });

  $('page-title').textContent = PAGES[page].title;
  $('page-sub').textContent = PAGES[page].sub;
  document.body.dataset.page = page;
  closeMenu();

  requestAnimationFrame(() => {
    H.resize();
    if (typeof resizeCross === 'function') resizeCross();
  });

  if (moveFocus) $('page-title').focus({ preventScroll: true });
}

/* ---------- filtros encadenados ---------- */

function readFilters() {
  filters = {
    coop: $('filter-coop')?.value || F.ALL,
    territory: $('filter-territory')?.value || F.ALL,
    base: $('filter-base')?.value || F.ALL,
    producer: $('filter-producer')?.value || ''
  };
}

function fillGeoSelect(id, values, allLabel, selected) {
  const select = $(id);
  if (!select) return;
  const options = [new Option(allLabel, F.ALL)];
  values.forEach((value) => {
    options.push(new Option(value === F.NULL ? 'Sin dato' : groupLabel(value), value));
  });
  select.replaceChildren(...options);
  select.value = values.includes(selected) ? selected : F.ALL;
  select.disabled = rawData.length === 0;
}

function fillProducerSelect(producers, selected) {
  const select = $('filter-producer');
  if (!select) return;
  const options = [new Option('Seleccionar productora…', '')];
  producers.forEach((producer) => {
    options.push(new Option(`${producer.code} · ${groupLabel(producer.coop)}`, producer.value));
  });
  select.replaceChildren(...options);
  select.value = producers.some((producer) => producer.value === selected) ? selected : '';
  select.disabled = producers.length === 0;
}

function syncSelects(result) {
  fillGeoSelect('filter-coop', result.options.coop, 'Todas las cooperativas', result.filters.coop);
  fillGeoSelect('filter-territory', result.options.territory, 'Todos los distritos', result.filters.territory);
  fillGeoSelect('filter-base', result.options.base, 'Todas las bases', result.filters.base);
  fillProducerSelect(result.options.producer, result.filters.producer);
  filters = {
    coop: $('filter-coop')?.value || F.ALL,
    territory: $('filter-territory')?.value || F.ALL,
    base: $('filter-base')?.value || F.ALL,
    producer: $('filter-producer')?.value || ''
  };
}

function renderChips() {
  const wrap = $('filter-chips');
  const clear = $('clear-filters');
  if (!wrap) return;

  const chips = [];
  GEO_FILTERS.forEach(([key, label]) => {
    const value = filters[key];
    if (value === F.ALL) return;
    const text = value === F.NULL ? 'Sin dato' : groupLabel(value);
    chips.push({ key, label, text });
  });

  if (filters.producer !== '') {
    const row = rawData[Number(filters.producer)];
    if (row) chips.push({ key: 'producer', label: 'Productora', text: `${row.code}` });
  }

  wrap.innerHTML = chips.map((chip) => `
    <button type="button" class="filter-chip" data-key="${chip.key}" aria-label="Quitar filtro ${esc(chip.label)}: ${esc(chip.text)}">
      <span>${esc(chip.label)}</span><strong>${esc(chip.text)}</strong><span class="chip-x" aria-hidden="true">×</span>
    </button>`).join('');

  if (clear) clear.hidden = chips.length === 0;
}

function renderSelectionSummary() {
  const summary = $('selection-summary');
  if (!summary) return;
  summary.innerHTML = rawData.length
    ? `<strong>${filteredData.length}</strong> de ${rawData.length} productoras`
    : 'Sin datos cargados';
}

/* ---------- KPIs ---------- */

function sumOf(rows, key) {
  return rows.reduce((total, row) => total + (D.finite(row[key]) ? row[key] : 0), 0);
}

function countOf(rows, key) {
  return rows.filter((row) => D.finite(row[key])).length;
}

function updateKpis() {
  $('kpi-n').textContent = rawData.length ? String(filteredData.length) : '—';
  $('kpi-n-sub').textContent = rawData.length ? `de ${rawData.length} en la base` : 'Sin datos cargados';

  const amountCount = countOf(filteredData, 'amount');
  const amount = sumOf(filteredData, 'amount');
  $('kpi-amount').textContent = amountCount ? 'S/ ' + H.fmt(amount) : '—';
  $('kpi-amount-sub').textContent = amountCount ? `${amountCount} solicitudes con monto` : 'Sin montos declarados';

  const areaCount = countOf(filteredData, 'area');
  const area = sumOf(filteredData, 'area');
  $('kpi-area').textContent = areaCount ? H.fmt(area, 1) + ' ha' : '—';
  $('kpi-area-sub').textContent = areaCount ? `${areaCount} productoras con área` : 'Sin área declarada';

  const qqCount = countOf(filteredData, 'qq');
  const qq = sumOf(filteredData, 'qq');
  $('kpi-qq').textContent = qqCount ? H.fmt(qq) + ' qq' : '—';
  $('kpi-qq-sub').textContent = qqCount ? `${qqCount} productoras con acopio` : 'Sin acopio declarado';
}

/* ---------- ficha imprimible ---------- */

function reportItem(label, value) {
  const empty = value == null || value === '';
  return `<div class="report-item">
    <dt>${esc(label)}</dt>
    <dd class="${empty ? 'is-empty' : ''}">${esc(empty ? 'Sin dato' : value)}</dd>
  </div>`;
}

function reportHeroItem(label, value) {
  return `<div class="report-hero-item">
    <span>${esc(label)}</span>
    <strong>${esc(value == null || value === '' ? 'Sin dato' : value)}</strong>
  </div>`;
}

function yesNo(value) {
  return value == null ? null : value ? 'Sí' : 'No';
}

function renderReport() {
  const content = $('report-content');
  const printButton = $('btn-print-action');
  if (!content) return;

  const index = filters.producer === '' ? null : Number(filters.producer);
  const row = index == null ? null : rawData[index];

  if (!row || !filteredData.includes(row)) {
    if (printButton) printButton.disabled = true;
    content.innerHTML = rawData.length
      ? '<div class="report-empty"><h2>Selecciona una productora</h2><p>Usa el filtro <strong>Productora</strong> para ver su ficha. Solo se muestran los datos que existen en la base.</p></div>'
      : '<div class="report-empty"><h2>Carga una base</h2><p>El Excel se procesa en tu navegador. Al cargarlo podrás generar fichas imprimibles.</p></div>';
    return;
  }

  if (printButton) printButton.disabled = false;

  const amount = D.finite(row.amount) ? 'S/ ' + H.fmt(row.amount) : null;
  const qq = D.finite(row.qq) ? H.fmt(row.qq) + ' qq' : null;
  const area = D.finite(row.area) ? H.fmt(row.area, 1) + ' ha' : null;
  const income = D.finite(row.income) ? 'S/ ' + H.fmt(row.income) : null;

  const channelText = Array.isArray(row.channels) && row.channels.length
    ? row.channels.map((channel) => CHANNEL_LABELS[channel] || prettyLabel(channel)).join(', ')
    : null;

  const location = [groupLabel(row.coop)];
  if (row.territory) location.push(groupLabel(row.territory));
  if (row.base) location.push(groupLabel(row.base));

  content.innerHTML = `
    <div class="report-top">
      <div class="report-brandline"><span class="brand-mark" aria-hidden="true">PD</span>Producers Direct</div>
      <div class="report-date">Fondo Rotatorio · Corte 2025</div>
    </div>

    <div class="report-header">
      <div>
        <p class="report-kicker">Ficha de productora</p>
        <h2>${esc(row.code)}</h2>
        <p class="report-sub">${esc(location.join(' · '))}</p>
      </div>
      <span class="report-stamp">Uso interno</span>
    </div>

    <div class="report-hero">
      ${reportHeroItem('Monto solicitado', amount)}
      ${reportHeroItem('Acopio 2025', qq)}
      ${reportHeroItem('Área de café', area)}
    </div>

    <section class="report-section">
      <h3>Solicitud de crédito</h3>
      <dl class="report-grid">
        ${reportItem('Actividad a financiar', row.activity ? prettyLabel(row.activity) : null)}
        ${reportItem('Monto solicitado', amount)}
      </dl>
    </section>

    <section class="report-section">
      <h3>Producción</h3>
      <dl class="report-grid">
        ${reportItem('Área de café', area)}
        ${reportItem('Acopio 2025', qq)}
        ${reportItem('Ingreso principal 2025', income)}
        ${reportItem('Nivel educativo', row.education ? prettyLabel(row.education) : null)}
      </dl>
    </section>

    <section class="report-section">
      <h3>Perfil</h3>
      <dl class="report-grid">
        ${reportItem('Edad al cierre 2025', D.finite(row.age) ? H.fmt(row.age) + ' años' : null)}
        ${reportItem('Años en la cooperativa', D.finite(row.years) ? H.fmt(row.years) + ' años' : null)}
        ${reportItem('Personas en el hogar', D.finite(row.family) ? H.fmt(row.family) : null)}
        ${reportItem('Acceso a internet', row.internet ? prettyLabel(row.internet) : null)}
      </dl>
    </section>

    <section class="report-section">
      <h3>Acceso y participación</h3>
      <dl class="report-grid">
        ${reportItem('Celular propio', PHONE_LABELS[row.phone] || (row.phone ? prettyLabel(row.phone) : null))}
        ${reportItem('Lectoescritura', LITERACY_LABELS[row.literacy] || (row.literacy ? prettyLabel(row.literacy) : null))}
        ${reportItem('Canales preferidos', channelText)}
        ${reportItem('Ahorro en la cooperativa', yesNo(row.savingsCoop))}
        ${reportItem('Crédito vigente en la cooperativa', yesNo(row.coopCredit))}
      </dl>
    </section>

    <div class="report-footer">
      <p>Fuente: ${esc(row.sourceSheet)} · fila ${esc(row.sourceRow)}. Datos declarados en la encuesta 2025.</p>
      <p>Sin datos de contacto en esta ficha.</p>
    </div>`;
}

/* ---------- render general ---------- */

function refresh({ goProducer = false } = {}) {
  const result = F.cascade(rawData, filters);
  syncSelects(result);
  filteredData = F.filterRows(rawData, filters);

  renderChips();
  renderSelectionSummary();
  updateKpis();

  H.render(filteredData, rawData);
  renderStrengths(filteredData, filters.coop);
  renderTerritory(filteredData, filters.coop);
  renderReport();

  if (goProducer && filters.producer !== '') setPage('producer');
}

/* ---------- eventos ---------- */

document.querySelectorAll('.nav button').forEach((button) => {
  button.addEventListener('click', () => setPage(button.dataset.page));
});

$('menu-toggle')?.addEventListener('click', () => {
  const side = $('sidebar');
  const open = side.classList.toggle('nav-open');
  $('menu-toggle').setAttribute('aria-expanded', String(open));
});

['filter-coop', 'filter-territory', 'filter-base'].forEach((id) => {
  $(id)?.addEventListener('change', () => {
    readFilters();
    refresh();
  });
});

$('filter-producer')?.addEventListener('change', () => {
  readFilters();
  refresh({ goProducer: true });
});

$('filter-chips')?.addEventListener('click', (event) => {
  const chip = event.target.closest('.filter-chip');
  if (!chip) return;
  const key = chip.dataset.key;
  filters[key] = key === 'producer' ? '' : F.ALL;
  refresh();
});

$('clear-filters')?.addEventListener('click', () => {
  filters = { coop: F.ALL, territory: F.ALL, base: F.ALL, producer: '' };
  refresh();
});

$('terr-group')?.addEventListener('change', () => {
  renderTerritory(filteredData, filters.coop);
});

function populateRelationSelects() {
  for (const id of ['rel-x', 'rel-y']) {
    const select = $(id);
    if (!select) continue;
    const previous = select.value;
    select.replaceChildren(...D.numeric.map((key) => new Option(RELATION_LABELS[key] || D.label(key), key)));
    if (D.numeric.includes(previous)) select.value = previous;
    else select.value = id === 'rel-x' ? 'qq' : 'income';
  }
}

for (const id of ['rel-x', 'rel-y']) {
  $(id)?.addEventListener('change', () => H.renderRelations(filteredData, rawData));
}

$('correlation-matrix')?.addEventListener('click', (event) => {
  const cell = event.target.closest('button[data-x]');
  if (!cell) return;
  $('rel-x').value = cell.dataset.x;
  $('rel-y').value = cell.dataset.y;
  H.renderRelations(filteredData, rawData);
  $('chart-relation')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
});

$('btn-print-action')?.addEventListener('click', () => {
  if (filters.producer === '') return;
  renderReport();
  setPage('producer', false);
  setTimeout(() => window.print(), 80);
});

$('open-file')?.addEventListener('click', () => $('excel-input').click());

$('excel-input')?.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    if (typeof XLSX === 'undefined') throw Error('No se cargó el lector Excel. Revisa la carpeta vendor/.');
    if (file.size > 15 * 1024 * 1024) throw Error('El archivo supera 15 MB; reduce las hojas o filas antes de cargarlo.');

    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
    const profiles = workbook.SheetNames.map((name) => D.sheetProfile(name, XLSX.utils.sheet_to_json(workbook.Sheets[name], {
      header: 1,
      defval: null,
      blankrows: true,
      raw: true
    })));

    if (!profiles.some((profile) => profile.matrix.some((row) => row.some((value) => value != null)))) {
      throw Error('El archivo está vacío.');
    }

    const selected = D.selectProfiles(profiles);
    for (const profile of selected) {
      const values = Object.values(profile.map);
      if (new Set(values).size !== values.length) {
        throw Error('El formato de la hoja tiene columnas duplicadas y no se puede importar automáticamente.');
      }
    }

    const result = D.importProfiles(selected, { fileName: file.name });
    if (!result.records.length) throw Error('No se encontraron productoras válidas en las hojas reconocidas.');

    rawData = result.records;
    audit = result.audit;
    filters = { coop: F.ALL, territory: F.ALL, base: F.ALL, producer: '' };
    $('download-data').disabled = false;

    refresh();
    setPage('summary', false);

    const warnings = audit.quarantine.length + audit.issues.length;
    const warningText = warnings
      ? ` ${audit.quarantine.length} filas apartadas, ${audit.issues.length} observaciones.`
      : '';
    setStatus(
      `${audit.fileName}: ${rawData.length} productoras cargadas.${warningText}`,
      warnings > 0,
      warnings ? 'Con observaciones' : 'Carga completa'
    );
  } catch (error) {
    setStatus('No se pudo cargar: ' + error.message + ' La base anterior se conserva.', true, 'Carga no aplicada');
  } finally {
    event.target.value = '';
  }
});

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$('download-data')?.addEventListener('click', () => {
  const fields = D.fields.filter((field) => field[0] !== 'birth');
  const cell = (value) => '"' + String(Array.isArray(value) ? value.join('; ') : value ?? '')
    .replace(/^[=+@\-\t\r]/, "'$&")
    .replace(/"/g, '""') + '"';
  const headers = [
    ...fields.map((field) => field[1]),
    'hoja_origen',
    'fila_excel_origen',
    'actividad_original',
    'celular_original',
    'lectoescritura_original'
  ];
  const lines = filteredData.map((row) => [
    ...fields.map((field) => row[field[0]]),
    row.sourceSheet,
    row.sourceRow,
    row.activityRaw,
    row.phoneRaw,
    row.literacyRaw
  ]);
  download(
    'productoras_seleccion.csv',
    '\ufeff' + [headers, ...lines].map((line) => line.map(cell).join(',')).join('\r\n'),
    'text/csv;charset=utf-8'
  );
});

/* ---------- arranque ---------- */

populateRelationSelects();
setPage('summary', false);
refresh();
setStatus('Carga una base para comenzar. No se muestran datos de demostración.', false, 'Sin datos');
