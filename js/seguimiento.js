/*
 * Página «Seguimiento del crédito».
 * Carga propia (botón dentro de la página) para no tocar la carga de la base.
 * Usa la selección de los filtros del tablero: el seguimiento se une a la base por código.
 * Siempre muestra «X de Y productoras respondieron» y no muestra porcentajes ni montos
 * con menos de MIN_N respuestas.
 */
'use strict';

const SEG = PDSeguimiento;

const segState = {
  pending: null,     // perfiles leídos, a la espera de confirmar
  profiles: [],      // perfiles confirmados
  records: [],       // productoras con seguimiento (unidas por código)
  observations: [],
  loadedAt: null,
  message: ''
};
const segCharts = {};

const SEG_COLORS = {
  forest: '#1F5138', clay: '#B85C38', gold: '#B8892E', sky: '#3C6E8F', plum: '#7B5E7B',
  sage: '#7C9A83', sageLight: '#DCE7DE', ink: '#18221C', muted: '#6A776F', line: '#E3E5DD'
};
const SEG_ORDER = { NORANDINO: 0, 'BAGUA GRANDE': 1 };

const segEsc = (value) => PDCharts.esc(value);
const segFmt = (value, decimals = 0) => PDCharts.fmt(value, decimals);
const segSoles = (value) => 'S/ ' + segFmt(value);
const segPct = (part, whole) => whole ? Math.round(100 * part / whole) + '%' : '—';
const segMonth = (month) => prettyLabel(month);
const segMonthShort = (month) => prettyLabel(month).slice(0, 3);

function segCoopColor(coop, index) {
  if (coop === 'NORANDINO') return SEG_COLORS.forest;
  if (coop === 'BAGUA GRANDE') return SEG_COLORS.clay;
  return [SEG_COLORS.sky, SEG_COLORS.gold, SEG_COLORS.plum][index % 3];
}

function segSortCoops(coops) {
  return [...new Set(coops)].sort((a, b) => ((SEG_ORDER[a] ?? 2) - (SEG_ORDER[b] ?? 2)) || String(a).localeCompare(String(b), 'es'));
}

function segBaseIndex(allRows) {
  const index = new Map();
  const repeated = new Set();
  allRows.forEach((row) => {
    const key = SEG.norm(row.code);
    if (index.has(key)) repeated.add(key);
    index.set(key, { code: row.code, coop: row.coop });
  });
  repeated.forEach((key) => index.delete(key)); // un código repetido en la base no se une
  return index;
}

/* ---------- carga ---------- */

async function segReadFiles(fileList) {
  const allRows = typeof rawData !== 'undefined' ? rawData : [];
  if (!allRows.length) {
    segState.message = 'Primero carga la base de productoras con «Cargar Excel». El seguimiento se une a ella por el código.';
    segRerender();
    return;
  }
  if (typeof XLSX === 'undefined') {
    segState.message = 'No se cargó el lector Excel. Revisa la carpeta vendor/.';
    segRerender();
    return;
  }
  const baseIndex = segBaseIndex(allRows);
  const profiles = [];
  for (const file of fileList) {
    try {
      if (file.size > 15 * 1024 * 1024) throw Error('El archivo supera 15 MB.');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      const sheets = workbook.SheetNames.map((name) => ({
        name,
        matrix: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: null, blankrows: true, raw: true })
      }));
      profiles.push(SEG.readFile(file.name, sheets, baseIndex));
    } catch (error) {
      profiles.push({ fileName: file.name, error: 'No se pudo leer: ' + error.message, observations: [], records: [] });
    }
  }
  segState.pending = profiles;
  segState.message = '';
  segRerender();
}

function segConfirm() {
  const valid = (segState.pending || []).filter((profile) => !profile.error);
  if (!valid.length) return;
  const { records, observations } = SEG.combine(valid);
  segState.profiles = valid;
  segState.records = records;
  segState.observations = observations;
  segState.loadedAt = new Date();
  segState.pending = null;
  segState.message = '';
  segRerender();
}

function segCancel() {
  segState.pending = null;
  segState.message = segState.records.length ? 'Carga cancelada. Se mantiene el seguimiento anterior.' : 'Carga cancelada.';
  segRerender();
}

function segRerender() {
  const rows = typeof filteredData !== 'undefined' ? filteredData : [];
  const allRows = typeof rawData !== 'undefined' ? rawData : [];
  renderSeguimiento(rows, allRows);
}

/* ---------- piezas de la página ---------- */

function segDestroyCharts() {
  Object.keys(segCharts).forEach((id) => {
    try { segCharts[id].destroy(); } catch (error) { /* noop */ }
    delete segCharts[id];
  });
}

function segChart(id, type, data, options = {}, valueFormat = null) {
  const canvas = document.getElementById(id);
  if (!canvas || typeof Chart === 'undefined') return;
  segCharts[id] = new Chart(canvas, {
    type,
    data,
    options: { responsive: true, maintainAspectRatio: false, ...options }
  });
  if (valueFormat) {
    segCharts[id].$pdValueLabels = { format: valueFormat };
    segCharts[id].update('none');
  }
}

function segWrap(label, size = 30) {
  const words = String(label).split(' ');
  const lines = [];
  let line = '';
  words.forEach((word) => {
    if ((line + ' ' + word).trim().length > size && line) { lines.push(line); line = word; }
    else line = (line + ' ' + word).trim();
  });
  if (line) lines.push(line);
  return lines;
}

function segCard(cols, kicker, title, meta, body) {
  return `<article class="card-panel col-${cols}">
    <div class="card-head">
      <div><p class="card-kicker">${segEsc(kicker)}</p><h2>${segEsc(title)}</h2></div>
      ${meta ? `<span class="card-meta">${segEsc(meta)}</span>` : ''}
    </div>
    ${body}
  </article>`;
}

function segEmpty(title, text) {
  return `<div class="card-panel"><div class="empty-state"><strong>${segEsc(title)}</strong><span>${segEsc(text)}</span></div></div>`;
}

const segResponded = (x, y) => `${x} de ${y} productoras respondieron`;

function segLoadPanel(allRows) {
  const loaded = segState.profiles.length
    ? `Seguimiento cargado: ${segState.profiles.map((profile) => profile.fileName).join(' · ')}.`
    : 'Carga los Excel de seguimiento (hoja «Registros»). Puedes elegir los cuatro archivos a la vez.';
  return `<div class="card-panel terr-controls" style="margin-bottom:0">
    <div>
      <p class="card-kicker">Seguimiento del crédito</p>
      <h2>Cómo avanza el crédito</h2>
      <p class="terr-note">${segEsc(loaded)}</p>
      ${segState.message ? `<p class="terr-note"><strong>${segEsc(segState.message)}</strong></p>` : ''}
    </div>
    <div>
      <button class="btn btn-primary" id="seg-open" type="button"${allRows.length ? '' : ' disabled'}>
        <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0 4 4m-4-4L8 8"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>
        Cargar seguimiento
      </button>
      <input type="file" id="seg-input" accept=".xlsx,.xls" multiple hidden aria-label="Seleccionar archivos Excel de seguimiento">
    </div>
  </div>`;
}

function segReviewPanel() {
  const profiles = segState.pending;
  const valid = profiles.filter((profile) => !profile.error);
  const body = profiles.map((profile) => {
    if (profile.error) {
      return `<tr>
        <td><span class="zone-name">${segEsc(profile.fileName)}</span></td>
        <td colspan="6" class="cell-muted">${segEsc(profile.error)}</td>
        <td><span class="priority priority--high">No se cargará</span></td>
      </tr>`;
    }
    const coops = Object.entries(profile.coops).map(([coop, n]) => `${groupLabel(coop)} (${n})`).join(', ') || '—';
    const unmatched = profile.unmatched.length
      ? `<span class="signal signal--alert">${profile.unmatched.length} no están en la base: ${segEsc(profile.unmatched.slice(0, 6).join(', '))}${profile.unmatched.length > 6 ? '…' : ''}</span>`
      : '<span class="signal signal--ok">Todas están en la base</span>';
    const notUsed = [...profile.ignored, ...profile.unknown.map((header) => `No reconocida: ${header}`)];
    return `<tr>
      <td><span class="zone-name">${segEsc(profile.fileName)}</span><span class="cell-n">Hoja ${segEsc(profile.sheet)}</span></td>
      <td>${segEsc(profile.kindLabel)}<span class="cell-n">${segEsc(coops)}</span></td>
      <td>${segEsc(profile.months.map(segMonth).join(', '))}</td>
      <td>${profile.rows}</td>
      <td>${profile.matched}<div class="signal-list">${unmatched}</div></td>
      <td>${profile.used.length} preguntas<span class="cell-n">${segEsc(profile.used.join(' · '))}</span></td>
      <td>${notUsed.length ? `${notUsed.length} grupos<span class="cell-n">${segEsc(notUsed.join(' · '))}</span>` : '—'}</td>
      <td>${profile.observations.length
        ? `<span class="priority priority--mid">${profile.observations.length} observaciones</span>`
        : '<span class="priority priority--low">Sin observaciones</span>'}</td>
    </tr>`;
  }).join('');

  return `<div class="card-panel">
    <div class="card-head">
      <div><p class="card-kicker">Revisión antes de confirmar</p><h2>Qué se va a cargar</h2></div>
      <span class="card-meta">${valid.length} de ${profiles.length} archivos reconocidos</span>
    </div>
    <div class="table-shell">
      <table class="priority-table">
        <thead><tr><th>Archivo</th><th>Tipo</th><th>Meses</th><th>Productoras</th><th>En la base</th><th>Preguntas que se usan</th><th>No se usan</th><th>Estado</th></tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    <p class="terr-note">Cada pregunta se reconoce por el texto de su encabezado, no por su posición. Al confirmar se reemplaza el seguimiento cargado antes; la base de productoras no cambia. El detalle de las observaciones aparece al final de la página.</p>
    <div class="filter-actions">
      <button class="btn btn-primary" id="seg-confirm" type="button"${valid.length ? '' : ' disabled'}>Confirmar carga</button>
      <button class="btn btn-secondary" id="seg-cancel" type="button">Cancelar</button>
    </div>
  </div>`;
}

/* ---------- secciones de resultados ---------- */

function segReasonsChart(id, tallyResult, color) {
  const items = tallyResult.items;
  segChart(id, 'bar', {
    labels: items.map((item) => segWrap(item.label)),
    datasets: [{ data: items.map((item) => item.n), backgroundColor: color, borderRadius: 4, barPercentage: 0.7 }]
  }, {
    indexAxis: 'y',
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => `${context.raw} productoras` } } },
    scales: {
      x: { beginAtZero: true, suggestedMax: Math.max(0, ...items.map((item) => item.n)) * 1.15 + 0.5, ticks: { precision: 0 }, grid: { color: SEG_COLORS.line }, title: { display: true, text: 'Productoras', color: SEG_COLORS.muted, font: { size: 10, weight: '600' } } },
      y: { grid: { display: false }, ticks: { color: SEG_COLORS.ink, font: { size: 10.5, weight: '600' } } }
    }
  }, (value) => segFmt(value));
}

function segUseSection(groups, charts) {
  const cards = [];
  groups.forEach((group) => {
    const { coop, recs, total } = group;
    const name = groupLabel(coop);
    const fert = SEG.yesNoSummary(recs, 'fertUsed');
    if (fert.answered) {
      if (fert.answered < MIN_N) {
        cards.push(segCard(6, `${name} · Fertilizante`, '¿Ya aplicó el fertilizante?', segResponded(fert.answered, total), `<p class="cx-empty">Menos de ${MIN_N} productoras respondieron.</p>`));
      } else {
        const reasons = SEG.tally(recs, 'fertWhyNot', (record) => record.statics.fertUsed === 0);
        const id = `seg-fert-${charts.length}`;
        charts.push(() => segReasonsChart(id, reasons, SEG_COLORS.clay));
        cards.push(segCard(6, `${name} · Fertilizante`, '¿Ya aplicó el fertilizante?', segResponded(fert.answered, total), `
          <div class="stat-strip">
            <div class="stat"><span class="stat-label">Ya lo aplicó</span><strong>${fert.yes} · ${segPct(fert.yes, fert.answered)}</strong></div>
            <div class="stat"><span class="stat-label">Todavía no</span><strong>${fert.no} · ${segPct(fert.no, fert.answered)}</strong></div>
          </div>
          <p class="card-kicker" style="margin-top:14px">Por qué no lo aplicó</p>
          <div class="chart-box"${reasons.items.length ? '' : ' data-empty="Nadie indicó un motivo."'}><canvas id="${id}" role="img" aria-label="Motivos por los que no aplicó el fertilizante"></canvas></div>
          <p class="card-footnote">${reasons.answered} de las ${fert.no} que todavía no lo aplicaron indicaron un motivo.</p>`));
      }
    }
    const activity = SEG.tally(recs, 'activity');
    if (activity.answered) {
      if (activity.answered < MIN_N) {
        cards.push(segCard(6, `${name} · Emprendimiento`, '¿Qué actividad se financió?', segResponded(activity.answered, total), `<p class="cx-empty">Menos de ${MIN_N} productoras respondieron.</p>`));
      } else {
        const id = `seg-act-${charts.length}`;
        charts.push(() => segReasonsChart(id, activity, SEG_COLORS.clay));
        cards.push(segCard(6, `${name} · Emprendimiento`, '¿Qué actividad se financió?', segResponded(activity.answered, total), `
          <div class="chart-box"><canvas id="${id}" role="img" aria-label="Actividad financiada con el crédito"></canvas></div>
          <p class="card-footnote">Este formulario no pregunta si ya se usó el insumo; el avance se ve en las ventas de cada mes.</p>`));
      }
    }
  });

  // Cuaderno de registros: tabla por cooperativa
  const usefulLabels = [...new Set(groups.flatMap((group) => SEG.tally(group.recs, 'bookUseful').items.map((item) => item.label)))];
  const bookRows = groups.map((group) => {
    const use = SEG.yesNoSummary(group.recs, 'bookUse');
    const useful = SEG.tally(group.recs, 'bookUseful');
    if (!use.answered && !useful.answered) return '';
    if (use.answered < MIN_N) {
      return `<tr><td><span class="zone-name">${segEsc(groupLabel(group.coop))}</span></td><td>${segResponded(use.answered, group.total)}</td><td colspan="${1 + usefulLabels.length}" class="cell-muted">Menos de ${MIN_N} productoras respondieron</td></tr>`;
    }
    const cells = usefulLabels.map((label) => {
      const n = (useful.items.find((item) => item.label === label) || { n: 0 }).n;
      return `<td>${useful.answered >= MIN_N ? segPct(n, useful.answered) : '—'}<span class="cell-n">${n} productoras</span></td>`;
    }).join('');
    return `<tr>
      <td><span class="zone-name">${segEsc(groupLabel(group.coop))}</span></td>
      <td>${segResponded(use.answered, group.total)}</td>
      <td>${segPct(use.yes, use.answered)}<span class="cell-n">${use.yes} lo usan</span></td>
      ${cells}
    </tr>`;
  }).join('');
  if (bookRows.trim()) {
    cards.push(segCard(12, 'Cuaderno de registros', '¿Anotan sus ingresos y gastos?', '', `
      <div class="table-shell"><table class="priority-table">
        <thead><tr><th>Cooperativa</th><th>Respondieron</th><th>Usa el cuaderno</th>${usefulLabels.map((label) => `<th>${segEsc(label)}</th>`).join('')}</tr></thead>
        <tbody>${bookRows}</tbody>
      </table></div>`));
  }

  if (!cards.length) return '';
  // Si queda una tarjeta de media columna sin pareja, ocupa todo el ancho.
  const halves = cards.map((card, index) => card.includes('class="card-panel col-6"') ? index : -1).filter((index) => index >= 0);
  if (halves.length % 2 === 1) {
    const last = halves[halves.length - 1];
    cards[last] = cards[last].replace('class="card-panel col-6"', 'class="card-panel col-12"');
  }
  return `<div class="grid-12">${cards.join('')}</div>`;
}

function segSalesSection(groups, months, charts) {
  const summaries = groups.map((group) => ({ ...group, months: months.map((month) => SEG.monthSummary(group.recs, month)) }));
  const id = 'seg-sales-share';
  charts.push(() => segChart(id, 'line', {
    labels: months.map(segMonthShort),
    datasets: summaries.map((group, index) => ({
      label: groupLabel(group.coop),
      data: group.months.map((m) => m.saleAnswered >= MIN_N ? Math.round(100 * m.soldYes / m.saleAnswered) : null),
      borderColor: segCoopColor(group.coop, index),
      backgroundColor: segCoopColor(group.coop, index),
      tension: 0, pointRadius: 4, pointHoverRadius: 6, spanGaps: false
    }))
  }, {
    plugins: {
      legend: { display: summaries.length > 1, position: 'bottom' },
      tooltip: { callbacks: { label: (context) => {
        const m = summaries[context.datasetIndex].months[context.dataIndex];
        return `${context.dataset.label}: ${context.raw}% vendió (${m.soldYes} de ${m.saleAnswered} que respondieron)`;
      } } }
    },
    scales: {
      y: { min: 0, max: 100, ticks: { callback: (value) => value + '%' }, grid: { color: SEG_COLORS.line }, title: { display: true, text: 'Productoras que vendieron', color: SEG_COLORS.muted, font: { size: 10, weight: '600' } } },
      x: { grid: { display: false } }
    }
  }));

  const hasCafe = summaries.some((group) => group.kind === 'cafe');
  const head = summaries.map((group) => `<th>${segEsc(groupLabel(group.coop))} · vendieron</th>${group.kind === 'cafe' ? `<th>${segEsc(groupLabel(group.coop))} · café vendido</th>` : ''}`).join('');
  const body = months.map((month, monthIndex) => `<tr><td><span class="zone-name">${segEsc(segMonth(month))}</span></td>${summaries.map((group) => {
    const m = group.months[monthIndex];
    const coverage = `<span class="cell-n">${segResponded(m.saleAnswered, group.total)}</span>`;
    const share = m.saleAnswered >= MIN_N
      ? `<td>${segPct(m.soldYes, m.saleAnswered)}<span class="cell-n">${m.soldYes} vendieron</span>${coverage}</td>`
      : `<td class="cell-muted">${m.saleAnswered ? `Menos de ${MIN_N} respuestas` : 'Sin datos de este mes'}${coverage}</td>`;
    if (group.kind !== 'cafe') return share;
    const qty = m.saleAnswered >= MIN_N
      ? `<td>${segFmt(m.qtySold || 0, 1)} qq${m.qtyExcluded ? `<span class="cell-n">Sin los quintales apartados de ${m.qtyExcluded} productora${m.qtyExcluded > 1 ? 's' : ''}</span>` : ''}</td>`
      : '<td class="cell-muted">—</td>';
    return share + qty;
  }).join('')}</tr>`).join('');

  return `<div class="grid-12">${segCard(12, 'Avance de ventas', '¿Cuántas vendieron cada mes?', '', `
    <div class="chart-box"><canvas id="${id}" role="img" aria-label="Porcentaje de productoras que vendieron cada mes"></canvas></div>
    <div class="table-shell"><table class="priority-table">
      <thead><tr><th>Mes</th>${head}</tr></thead><tbody>${body}</tbody>
    </table></div>
    <p class="terr-note">El porcentaje se calcula sobre las productoras que respondieron ese mes; no se muestra con menos de ${MIN_N} respuestas.${hasCafe ? ' Los quintales son solo de café; las unidades de los emprendimientos (kg o unidades) no se suman porque no son comparables.' : ''}</p>`)}</div>`;
}

function segCoffeeSection(groups, charts) {
  const cards = [];
  groups.forEach((group) => {
    const delivered = SEG.yesNoSummary(group.recs, 'coopDelivered');
    if (!delivered.answered) return;
    const name = groupLabel(group.coop);
    if (delivered.answered < MIN_N) {
      cards.push(segCard(12, `${name} · Venta de café`, '¿Llevó su café a la cooperativa?', segResponded(delivered.answered, group.total), `<p class="cx-empty">Menos de ${MIN_N} productoras respondieron.</p>`));
      return;
    }
    const notDelivered = group.recs.filter((record) => record.statics.coopDelivered === 0);
    const soon = SEG.yesNoSummary(notDelivered, 'coopSoon');
    const reasons = SEG.tally(group.recs, 'coopWhyNot', (record) => record.statics.coopDelivered === 0);
    const price = reasons.items.filter((item) => /PRECIO/.test(SEG.norm(item.label))).reduce((sum, item) => sum + item.n, 0);
    const otherBuyer = reasons.items.filter((item) => /OTRO COMPRADOR/.test(SEG.norm(item.label))).reduce((sum, item) => sum + item.n, 0);
    const transport = reasons.items.filter((item) => /TRANSPORTE/.test(SEG.norm(item.label))).reduce((sum, item) => sum + item.n, 0);
    const id = `seg-coffee-${charts.length}`;
    charts.push(() => segReasonsChart(id, reasons, SEG_COLORS.forest));

    cards.push(segCard(6, `${name} · Venta de café`, '¿Llevó su café a la cooperativa?', segResponded(delivered.answered, group.total), `
      <div class="stat-strip">
        <div class="stat"><span class="stat-label">Sí lo llevó</span><strong>${delivered.yes} · ${segPct(delivered.yes, delivered.answered)}</strong></div>
        <div class="stat"><span class="stat-label">No lo llevó</span><strong>${delivered.no} · ${segPct(delivered.no, delivered.answered)}</strong></div>
      </div>
      <div class="mini-list">
        <div class="mini-row"><span>De las que no lo llevaron, lo llevará pronto</span><strong>${soon.answered >= MIN_N ? `${soon.yes} · ${segPct(soon.yes, soon.answered)}` : `${soon.yes}`}</strong></div>
        <div class="mini-row"><span>No lo llevará pronto</span><strong>${soon.no}</strong></div>
        <div class="mini-row"><span>Respondieron esta pregunta</span><strong>${soon.answered} de ${delivered.no}</strong></div>
      </div>`));

    const lecture = [];
    if (price) lecture.push(`${price} por el precio bajo`);
    if (transport) lecture.push(`${transport} por falta de transporte`);
    if (otherBuyer) lecture.push(`${otherBuyer} porque lo vendió a otro comprador`);
    cards.push(segCard(6, `${name} · Venta de café`, '¿Por qué no lo llevó?', `${reasons.answered} de ${delivered.no} indicaron un motivo`, `
      <div class="chart-box"${reasons.items.length ? '' : ' data-empty="Nadie indicó un motivo."'}><canvas id="${id}" role="img" aria-label="Motivos por los que no llevó café a la cooperativa"></canvas></div>
      ${lecture.length ? `<p class="card-footnote">De las ${reasons.answered} que indicaron un motivo: ${segEsc(lecture.join(', '))}. Son las productoras a las que conviene acompañar para que no vendan fuera de la cooperativa cuando baja el precio.</p>` : ''}`));
  });
  return cards.length ? `<div class="grid-12">${cards.join('')}</div>` : '';
}

function segMoneySection(groups, months, charts) {
  const summaries = groups.map((group) => ({ ...group, months: months.map((month) => SEG.monthSummary(group.recs, month)) }));
  const salesValue = (m) => m.saleAnswered >= MIN_N ? (m.sales || 0) : null;
  const expValue = (m, key) => m.expAnswered >= MIN_N ? (m[key] || 0) : null;

  charts.push(() => segChart('seg-money-sales', 'bar', {
    labels: months.map(segMonthShort),
    datasets: summaries.map((group, index) => ({
      label: groupLabel(group.coop),
      data: group.months.map(salesValue),
      backgroundColor: segCoopColor(group.coop, index),
      borderRadius: 4
    }))
  }, {
    plugins: {
      legend: { display: summaries.length > 1, position: 'bottom' },
      tooltip: { callbacks: { label: (context) => {
        const m = summaries[context.datasetIndex].months[context.dataIndex];
        return `${context.dataset.label}: ${segSoles(context.raw)} (${segResponded(m.saleAnswered, summaries[context.datasetIndex].total)})`;
      } } }
    },
    scales: { y: { beginAtZero: true, ticks: { callback: (value) => segSoles(value) }, grid: { color: SEG_COLORS.line } }, x: { grid: { display: false } } }
  }));

  const expDatasets = [];
  summaries.forEach((group, index) => {
    const color = segCoopColor(group.coop, index);
    const work = group.kind === 'cafe' ? 'finca' : 'emprendimiento';
    expDatasets.push({ label: `${groupLabel(group.coop)} · ${work}`, stack: group.coop, data: group.months.map((m) => expValue(m, 'workExp')), backgroundColor: color, borderRadius: 3, pdGroup: index });
    expDatasets.push({ label: `${groupLabel(group.coop)} · familia`, stack: group.coop, data: group.months.map((m) => expValue(m, 'famExp')), backgroundColor: color + '66', borderRadius: 3, pdGroup: index });
  });
  charts.push(() => segChart('seg-money-exp', 'bar', { labels: months.map(segMonthShort), datasets: expDatasets }, {
    plugins: {
      legend: { display: true, position: 'bottom' },
      tooltip: { callbacks: { label: (context) => {
        const group = summaries[context.dataset.pdGroup];
        const m = group.months[context.dataIndex];
        return `${context.dataset.label}: ${segSoles(context.raw)} (${segResponded(m.expAnswered, group.total)})`;
      } } }
    },
    scales: { y: { stacked: true, beginAtZero: true, ticks: { callback: (value) => segSoles(value) }, grid: { color: SEG_COLORS.line } }, x: { stacked: true, grid: { display: false } } }
  }));

  const cell = (value, answered, total, extra = '') => answered >= MIN_N
    ? `<td>${segSoles(value || 0)}<span class="cell-n">${segResponded(answered, total)}${extra}</span></td>`
    : `<td class="cell-muted">${answered ? `Menos de ${MIN_N} respuestas` : 'Sin datos de este mes'}<span class="cell-n">${segResponded(answered, total)}</span></td>`;

  // Una tabla por cooperativa, una al lado de la otra.
  const tables = summaries.map((group) => {
    const work = group.kind === 'cafe' ? 'Gasto de la finca' : 'Gasto del emprendimiento';
    const body = months.map((month, monthIndex) => {
      const m = group.months[monthIndex];
      return `<tr><td><span class="zone-name">${segEsc(segMonth(month))}</span></td>${
        cell(m.sales, m.saleAnswered, group.total, m.salesN ? ` · ${m.salesN} con ventas` : '')
        + cell(m.workExp, m.expAnswered, group.total)
        + cell(m.famExp, m.expAnswered, group.total)}</tr>`;
    }).join('');
    return segCard(summaries.length > 1 ? 6 : 12, 'Ingresos y gastos', `${groupLabel(group.coop)}: totales por mes`, '', `
      <div class="table-shell"><table class="priority-table" style="min-width:0">
        <thead><tr><th>Mes</th><th>Ventas (S/)</th><th>${work}</th><th>Gasto de la familia</th></tr></thead><tbody>${body}</tbody>
      </table></div>`);
  }).join('');

  return `<div class="grid-12">
    ${segCard(6, 'Ingresos', 'Ventas (S/) por mes', '', '<div class="chart-box"><canvas id="seg-money-sales" role="img" aria-label="Ventas en soles por mes y cooperativa"></canvas></div>')}
    ${segCard(6, 'Gastos', 'Gastos (S/) por mes', '', '<div class="chart-box"><canvas id="seg-money-exp" role="img" aria-label="Gastos en soles por mes y cooperativa"></canvas></div>')}
    ${tables}
  </div>
  <p class="terr-note">Totales de las productoras que respondieron cada mes; no son totales de toda la cooperativa. Ventas y gastos se muestran por separado porque no siempre respondieron las mismas productoras. Los gastos de la familia son datos sensibles: aquí solo se muestran sumas, y no se muestran con menos de ${MIN_N} respuestas.</p>`;
}

function segObservationsSection(keys) {
  const list = segState.observations.filter((item) => keys.has(SEG.norm(item.code)));
  const body = list.length
    ? list.map((item) => `<tr>
        <td><span class="zone-name">${segEsc(item.code)}</span></td>
        <td>${segEsc(item.file)}<span class="cell-n">Fila ${segEsc(item.row)}</span></td>
        <td>${item.month ? segEsc(segMonth(item.month)) : '—'}</td>
        <td>${segEsc(item.finding)}</td>
        <td>${segEsc(item.action)}</td>
      </tr>`).join('')
    : `<tr><td colspan="5" class="cell-muted">Sin observaciones en la selección.</td></tr>`;
  return `<div class="grid-12">${segCard(12, 'Revisión de datos', 'Observaciones del seguimiento', `${list.length} en la selección`, `
    <div class="table-shell"><table class="priority-table">
      <thead><tr><th>Productora</th><th>Archivo</th><th>Mes</th><th>Qué se encontró</th><th>Qué se hizo</th></tr></thead>
      <tbody>${body}</tbody>
    </table></div>
    <p class="terr-note">No se corrige ni se inventa ningún dato: lo dudoso se aparta del cálculo o se marca para revisarlo con la productora.</p>`)}</div>`;
}

/* ---------- render principal ---------- */

function renderSeguimiento(rows, allRows) {
  const root = document.getElementById('seg-root');
  if (!root) return;
  segDestroyCharts();
  rows = rows || [];
  allRows = allRows || [];

  let html = segLoadPanel(allRows);
  if (segState.pending) html += segReviewPanel();

  const charts = [];
  if (!allRows.length) {
    html += segEmpty('Carga primero la base de productoras', 'Usa «Cargar Excel». Después carga aquí los archivos de seguimiento.');
  } else if (!segState.records.length) {
    html += segEmpty('Sin seguimiento cargado', 'Usa «Cargar seguimiento» y elige los Excel de ingresos y egresos.');
  } else {
    // Unir el seguimiento con la selección actual de la base, por código.
    const selected = new Map(rows.map((row) => [SEG.norm(row.code), row]));
    const recs = segState.records
      .filter((record) => selected.has(record.key))
      .map((record) => ({ ...record, coop: selected.get(record.key).coop }));
    const coops = segSortCoops(rows.map((row) => row.coop).filter(Boolean));
    const groups = coops.map((coop) => {
      const list = recs.filter((record) => record.coop === coop);
      return { coop, recs: list, total: rows.filter((row) => row.coop === coop).length, kind: list[0] ? list[0].kind : null };
    });
    const withData = groups.filter((group) => group.recs.length);
    const small = withData.filter((group) => group.recs.length < MIN_N);
    const shown = withData.filter((group) => group.recs.length >= MIN_N);

    const book = SEG.yesNoSummary(recs, 'bookUse');
    const coverage = groups.map((group) => `${groupLabel(group.coop)} ${group.recs.length} de ${group.total}`).join(' · ');
    html += `<div class="terr-kpis" style="margin-bottom:0">
      <div class="terr-kpi"><span class="label">Respondieron el seguimiento</span><strong>${recs.length} de ${rows.length}</strong><small>${segEsc(coverage)}</small></div>
      <div class="terr-kpi"><span class="label">Usan el cuaderno de registros</span><strong>${book.answered >= MIN_N ? segPct(book.yes, book.answered) : '—'}</strong><small>${book.yes} de ${book.answered} productoras que respondieron</small></div>
      <div class="terr-kpi"><span class="label">Observaciones en los datos</span><strong>${segState.observations.filter((item) => selected.has(SEG.norm(item.code))).length}</strong><small>detalle al final de la página</small></div>
    </div>`;

    if (small.length) {
      html += `<p class="terr-note">${segEsc(small.map((group) => groupLabel(group.coop)).join(', '))}: menos de ${MIN_N} productoras con seguimiento en la selección; no se muestran sus resultados.</p>`;
    }

    if (!shown.length) {
      html += segEmpty('Sin datos suficientes', recs.length ? `Menos de ${MIN_N} productoras con seguimiento en la selección. Amplía los filtros.` : 'Ninguna productora de la selección tiene seguimiento.');
    } else {
      const months = SEG.monthsPresent(shown.flatMap((group) => group.recs));
      html += segUseSection(shown, charts);
      html += segSalesSection(shown, months, charts);
      html += segCoffeeSection(shown, charts);
      html += segMoneySection(shown, months, charts);
    }
    html += segObservationsSection(new Set(recs.map((record) => record.key)));
  }

  root.style.display = 'flex';
  root.style.flexDirection = 'column';
  root.style.gap = '16px';
  root.innerHTML = html;
  charts.forEach((draw) => {
    try { draw(); } catch (error) { console.error('Error en un gráfico de seguimiento:', error); }
  });
}

/* ---------- eventos (delegados: el contenido se vuelve a dibujar) ---------- */

(function segBindEvents() {
  const root = document.getElementById('seg-root');
  if (!root) return;
  root.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.id === 'seg-open') document.getElementById('seg-input')?.click();
    if (button.id === 'seg-confirm') segConfirm();
    if (button.id === 'seg-cancel') segCancel();
  });
  root.addEventListener('change', async (event) => {
    if (event.target.id !== 'seg-input') return;
    const files = [...event.target.files];
    event.target.value = '';
    if (files.length) await segReadFiles(files);
  });
})();
