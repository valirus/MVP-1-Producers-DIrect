/*
 * Páginas "Fortalezas y brechas" y "Territorio y alertas".
 * Dependen de coops.js (indicadores y utilidades) y Chart.js.
 * Regla fija: un porcentaje solo se muestra con MIN_N respuestas o más.
 */

const CROSS_COLORS = {
  forest: '#1F5138',
  forestSoft: '#2E6A4A',
  clay: '#B85C38',
  gold: '#B8892E',
  sky: '#3C6E8F',
  sage: '#7C9A83',
  sageLight: '#DCE7DE',
  line: '#E3E5DD',
  ink: '#18221C',
  inkSoft: '#34443A',
  muted: '#6A776F'
};

let crossCharts = {};

const escHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

const ALL_VIEW = 'all';

/* Indicadores que resumen acceso y participación. Se excluye capacitación a propósito. */
const FOCUS_INDICATORS = [
  { id: 'smart', short: 'Smartphone' },
  { id: 'net', short: 'Internet' },
  { id: 'lit', short: 'Lectoescritura' },
  { id: 'save', short: 'Ahorro' },
  { id: 'coopcred', short: 'Crédito' },
  { id: 'wa', short: 'WhatsApp' }
].map((item) => ({ ...item, indicator: INDICATORS.find((indicator) => indicator.id === item.id) }))
  .filter((item) => item.indicator);

/* Brechas visibles: mismas preguntas, en sentido negativo. */
const FOCUS_GAPS = GAPS.filter((gap) => !/capacitaci/i.test(gap.label));

function crossChart(id, config) {
  const canvas = document.getElementById(id);
  if (!canvas || typeof Chart === 'undefined') return;
  if (crossCharts[id]) {
    try { crossCharts[id].destroy(); } catch (error) { /* noop */ }
    delete crossCharts[id];
  }
  crossCharts[id] = new Chart(canvas, {
    ...config,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...(config.options || {})
    }
  });
}

function destroyCrossCharts() {
  Object.values(crossCharts).forEach((instance) => {
    try { instance.destroy(); } catch (error) { /* noop */ }
  });
  crossCharts = {};
}

function resizeCross() {
  Object.values(crossCharts).forEach((instance) => {
    try { instance.resize(); } catch (error) { /* noop */ }
  });
}

const crossLabelsPlugin = {
  id: 'pdCrossLabels',
  afterDatasetsDraw(chart) {
    if (!chart.options.pdCrossLabels || chart.options.indexAxis !== 'y') return;
    const { ctx } = chart;
    ctx.save();
    ctx.font = '700 10.5px Inter, Segoe UI, sans-serif';
    ctx.fillStyle = CROSS_COLORS.inkSoft;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      chart.getDatasetMeta(datasetIndex).data.forEach((bar, index) => {
        const value = Number(dataset.data[index]);
        if (!Number.isFinite(value)) return;
        const start = bar.base ?? bar.x;
        ctx.fillText(Math.round(value) + '%', Math.max(bar.x, start) + 6, bar.y);
      });
    });
    ctx.restore();
  }
};

if (typeof Chart !== 'undefined') Chart.register(crossLabelsPlugin);

function groupsFor(data, view) {
  const key = !view || view === ALL_VIEW ? 'coop' : (coopConfig(view).groupBy || 'territory');
  let all = groupRows(data, key);
  if (!all.length) all = [['Selección', data]];
  const kept = all.filter(([, rows]) => rows.length >= MIN_N);
  return { key, kept, hidden: all.length - kept.length };
}

function insightCard(label, value, small, accent = false) {
  return `<div class="insight${accent ? ' insight--accent' : ''}">
    <span class="insight-label">${escHtml(label)}</span>
    <strong>${value}</strong>
    <small>${escHtml(small)}</small>
  </div>`;
}

function horizontalBar(id, items, colorFor) {
  if (!items.length) return;
  crossChart(id, {
    type: 'bar',
    data: {
      labels: items.map((item) => item.label),
      datasets: [{
        data: items.map((item) => +item.pct.toFixed(1)),
        backgroundColor: items.map((item, index) => colorFor(item, index)),
        borderRadius: 5,
        barPercentage: 0.74,
        categoryPercentage: 0.86
      }]
    },
    options: {
      indexAxis: 'y',
      pdCrossLabels: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const item = items[context.dataIndex];
              return `${context.parsed.x}% (${item.n} respuestas)`;
            }
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          grid: { display: false },
          ticks: { callback: (value) => value + '%' }
        },
        y: {
          grid: { display: false },
          ticks: { color: CROSS_COLORS.ink, font: { size: 10.5, weight: '600' } }
        }
      }
    }
  });
}

// ---------- Fortalezas y brechas ----------

function indicatorTable(kept) {
  if (!kept.length) {
    return `<p class="cx-empty">Ningún grupo alcanza ${MIN_N} productoras. Ajusta los filtros para comparar.</p>`;
  }
  const head = `<tr><th>Grupo</th><th>Productoras</th>${FOCUS_INDICATORS.map((item) => `<th>${escHtml(item.short)}</th>`).join('')}</tr>`;
  const body = kept.map(([group, rows]) => {
    const cells = FOCUS_INDICATORS.map((item) => {
      const result = share(rows, item.indicator.f);
      if (result.pct == null) {
        return `<td class="na" title="Menos de ${MIN_N} respuestas">—</td>`;
      }
      const alpha = (0.08 + 0.78 * (result.pct / 100)).toFixed(2);
      const color = result.pct > 58 ? '#fff' : CROSS_COLORS.ink;
      return `<td style="background:rgba(31,81,56,${alpha});color:${color}" title="${escHtml(item.indicator.label)}: ${result.pct.toFixed(1)}% (${result.n} respuestas)">${result.pct.toFixed(0)}%</td>`;
    }).join('');
    return `<tr><th>${escHtml(groupLabel(group))}</th><td>${rows.length}</td>${cells}</tr>`;
  }).join('');
  return `<div class="table-scroll"><table class="heat"><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
}

function renderStrengths(data, view) {
  const grid = document.getElementById('strengths-grid');
  const insights = document.getElementById('strengths-insights');
  if (!grid) return;

  destroyCrossCharts();

  if (!data.length) {
    if (insights) {
      insights.innerHTML = insightCard('Lectura', 'Sin datos', 'Carga una base o ajusta los filtros.', true) +
        insightCard('Brecha principal', '—', 'Sin respuestas') +
        insightCard('Fortaleza principal', '—', 'Sin respuestas');
    }
    grid.innerHTML = '<div class="card-panel col-12"><div class="empty-state"><strong>Sin productoras en la selección</strong><span>Ajusta los filtros o carga otra base.</span></div></div>';
    return;
  }

  const gaps = FOCUS_GAPS
    .map((gap) => ({ label: gap.label, ...share(data, gap.f) }))
    .filter((item) => item.pct != null)
    .sort((a, b) => b.pct - a.pct);

  const wins = FOCUS_INDICATORS
    .map((item) => ({ label: item.indicator.label, ...share(data, item.indicator.f) }))
    .filter((item) => item.pct != null)
    .sort((a, b) => b.pct - a.pct);

  const { kept } = groupsFor(data, view);
  const opportunities = kept.map(([group, rows]) => {
    const values = FOCUS_INDICATORS
      .map((item) => share(rows, item.indicator.f).pct)
      .filter((value) => value != null);
    return {
      group,
      average: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
    };
  }).filter((item) => item.average != null).sort((a, b) => a.average - b.average);

  if (insights) {
    const topGap = gaps[0];
    const topWin = wins[0];
    const weakest = opportunities[0];
    insights.innerHTML = insightCard(
      'Brecha principal',
      topGap ? `${escHtml(topGap.label)} <span class="value">${topGap.pct.toFixed(0)}%</span>` : 'Sin datos',
      topGap ? `${topGap.n} respuestas · cuanto más alto, más productoras afectadas` : 'Faltan respuestas para medir brechas',
      true
    ) + insightCard(
      'Fortaleza principal',
      topWin ? `${escHtml(topWin.label)} <span class="value">${topWin.pct.toFixed(0)}%</span>` : 'Sin datos',
      topWin ? `${topWin.n} respuestas · ya está presente en el grupo` : 'Faltan respuestas para medir fortalezas'
    ) + insightCard(
      'Mayor oportunidad',
      weakest ? escHtml(groupLabel(weakest.group)) : 'Sin comparación',
      weakest ? `Acceso promedio ${weakest.average.toFixed(0)}% en los indicadores clave` : 'No hay grupos con suficiente información'
    );
  }

  const totalText = `${data.length} productoras en la selección`;
  const gapNote = gaps.length
    ? `La brecha más frecuente es «${gaps[0].label.toLowerCase()}» (${gaps[0].pct.toFixed(0)}%).`
    : `Menos de ${MIN_N} respuestas por indicador.`;
  const winNote = wins.length
    ? `La fortaleza más extendida es «${wins[0].label.toLowerCase()}» (${wins[0].pct.toFixed(0)}%).`
    : `Menos de ${MIN_N} respuestas por indicador.`;

  grid.innerHTML = `
    <article class="card-panel col-6">
      <div class="card-head">
        <div>
          <p class="card-kicker">Brechas</p>
          <h2>Qué falta con más frecuencia</h2>
        </div>
        <span class="card-meta">${escHtml(totalText)}</span>
      </div>
      <div class="chart-box"><canvas id="cv-strengths-gaps" role="img" aria-label="Brechas más frecuentes"></canvas></div>
      <p class="card-footnote">${escHtml(gapNote)} Se omiten los indicadores con menos de ${MIN_N} respuestas.</p>
    </article>

    <article class="card-panel col-6">
      <div class="card-head">
        <div>
          <p class="card-kicker">Fortalezas</p>
          <h2>Qué ya está presente</h2>
        </div>
        <span class="card-meta">${escHtml(totalText)}</span>
      </div>
      <div class="chart-box"><canvas id="cv-strengths-wins" role="img" aria-label="Fortalezas más extendidas"></canvas></div>
      <p class="card-footnote">${escHtml(winNote)} Un porcentaje alto indica una base sobre la que apoyarse.</p>
    </article>

    <article class="card-panel col-12">
      <div class="card-head">
        <div>
          <p class="card-kicker">Comparación</p>
          <h2>Acceso y participación por grupo</h2>
        </div>
        <span class="card-meta">Verde más intenso = mayor proporción</span>
      </div>
      ${indicatorTable(kept)}
      <p class="card-footnote">Porcentaje de productoras de cada grupo que cumple el indicador. Las celdas con menos de ${MIN_N} respuestas se muestran como «—».</p>
    </article>`;

  horizontalBar('cv-strengths-gaps', gaps, (item, index) => index < 2 ? CROSS_COLORS.clay : CROSS_COLORS.sageLight);
  horizontalBar('cv-strengths-wins', wins, (item, index) => index < 2 ? CROSS_COLORS.forest : CROSS_COLORS.sageLight);
}

// ---------- Territorio y alertas ----------

const TERRITORY_LIMITS = { noInternet: 30, literacy: 25, yieldDrop: 25 };

function percentCell(value, n, title) {
  return value == null
    ? `<td class="na" title="Menos de ${MIN_N} respuestas">—</td>`
    : `<td title="${escHtml(title)}">${value.toFixed(0)}%<small class="cell-n">${n} resp.</small></td>`;
}

function renderTerritory(data, view) {
  const root = document.getElementById('territory-body');
  if (!root) return;

  const select = document.getElementById('terr-group');
  const by = select ? select.value : 'territory';
  const byLabels = { territory: 'distrito', province: 'provincia', base: 'base o sector' };

  if (!data.length) {
    root.innerHTML = '<div class="card-panel"><div class="empty-state"><strong>Sin datos para evaluar</strong><span>Carga una base o ajusta los filtros.</span></div></div>';
    return;
  }

  const groups = groupRows(data, by);
  if (!groups.length) {
    root.innerHTML = `<div class="card-panel"><div class="empty-state"><strong>Sin ${byLabels[by] || 'zonas'} en la base</strong><span>Prueba con otro nivel de agrupación.</span></div></div>`;
    return;
  }

  const yields = data.filter((row) => row.area > 0 && Number.isFinite(row.qq)).map((row) => row.qq / row.area);
  const referenceYield = median(yields);

  const rows = groups.map(([group, list]) => {
    const n = list.length;
    if (n < MIN_N) {
      return { group, n, insufficient: true, alerts: 0 };
    }
    const area = list.reduce((sum, row) => sum + (Number.isFinite(row.area) ? row.area : 0), 0);
    const qq = list.reduce((sum, row) => sum + (Number.isFinite(row.qq) ? row.qq : 0), 0);
    const yieldValue = area > 0 ? qq / area : null;
    const noInternet = share(list, (row) => {
      const value = homeInternet(row.internet);
      return value == null ? null : 1 - value;
    });
    const literacy = share(list, (row) => row.literacy ? +(row.literacy !== 'NINGUNA') : null);
    const link = share(list, (row) => row.savingsCoop == null && row.coopCredit == null
      ? null
      : +Boolean(row.savingsCoop || row.coopCredit));
    const signals = [];
    if (noInternet.pct != null && noInternet.pct >= TERRITORY_LIMITS.noInternet) {
      signals.push({ text: `Sin internet ${noInternet.pct.toFixed(0)}%`, alert: true });
    }
    if (literacy.pct != null && literacy.pct >= TERRITORY_LIMITS.literacy) {
      signals.push({ text: `Lectoescritura ${literacy.pct.toFixed(0)}%`, alert: true });
    }
    if (yieldValue != null && referenceYield && yieldValue < referenceYield * (1 - TERRITORY_LIMITS.yieldDrop / 100)) {
      signals.push({ text: `Rendimiento ${yieldValue.toFixed(1)} qq/ha`, alert: true });
    }
    return { group, n, area, qq, yieldValue, noInternet, literacy, link, signals, insufficient: false, alerts: signals.length };
  }).sort((a, b) => {
    if (a.insufficient !== b.insufficient) return a.insufficient ? 1 : -1;
    return b.alerts - a.alerts || b.n - a.n;
  });

  const evaluated = rows.filter((row) => !row.insufficient);
  const withAlert = evaluated.filter((row) => row.alerts > 0);
  const pending = rows.filter((row) => row.insufficient);

  const body = rows.map((row) => {
    if (row.insufficient) {
      return `<tr>
        <td><span class="zone-name">${escHtml(groupLabel(row.group))}</span></td>
        <td>${row.n}</td>
        <td colspan="5" class="cell-muted">Datos insuficientes (menos de ${MIN_N} productoras)</td>
        <td><span class="priority priority--low">Sin evaluar</span></td>
      </tr>`;
    }
    const level = row.alerts === 0 ? 'low' : row.alerts === 1 ? 'mid' : 'high';
    const levelLabel = row.alerts === 0 ? 'Sin alerta' : row.alerts === 1 ? 'Seguimiento' : 'Prioridad alta';
    const signalHtml = row.signals.length
      ? row.signals.map((signal) => `<span class="signal signal--alert">${escHtml(signal.text)}</span>`).join('')
      : '<span class="signal signal--ok">Dentro de umbrales</span>';
    return `<tr>
      <td><span class="zone-name">${escHtml(groupLabel(row.group))}</span></td>
      <td>${row.n}</td>
      <td>${row.area.toFixed(1)}</td>
      <td>${row.yieldValue == null ? '—' : row.yieldValue.toFixed(1)}</td>
      ${percentCell(row.noInternet.pct, row.noInternet.n, `Sin internet en casa: ${row.noInternet.pct == null ? 'sin dato' : row.noInternet.pct.toFixed(1) + '%'}`)}
      ${percentCell(row.literacy.pct, row.literacy.n, `Dificultad de lectoescritura: ${row.literacy.pct == null ? 'sin dato' : row.literacy.pct.toFixed(1) + '%'}`)}
      ${percentCell(row.link.pct, row.link.n, `Con ahorro o crédito en la cooperativa: ${row.link.pct == null ? 'sin dato' : row.link.pct.toFixed(1) + '%'}`)}
      <td><span class="priority priority--${level}">${levelLabel}</span><div class="signal-list">${signalHtml}</div></td>
    </tr>`;
  }).join('');

  root.innerHTML = `
    <div class="terr-kpis">
      <div class="terr-kpi">
        <span class="label">Zonas evaluadas</span>
        <strong>${evaluated.length}</strong>
        <small>con ${MIN_N} productoras o más</small>
      </div>
      <div class="terr-kpi">
        <span class="label">Zonas con alerta</span>
        <strong>${withAlert.length}</strong>
        <small>según las reglas de abajo</small>
      </div>
      <div class="terr-kpi">
        <span class="label">Zonas sin evaluar</span>
        <strong>${pending.length}</strong>
        <small>menos de ${MIN_N} productoras</small>
      </div>
    </div>

    <div class="card-panel">
      <div class="card-head">
        <div>
          <p class="card-kicker">Semáforo</p>
          <h2>Prioridad por ${byLabels[by] || 'zona'}</h2>
        </div>
        <span class="card-meta">${data.length} productoras</span>
      </div>
      <div class="table-shell">
        <table class="priority-table">
          <thead>
            <tr>
              <th>Zona</th>
              <th>Productoras</th>
              <th>Área (ha)</th>
              <th>Rend. (qq/ha)</th>
              <th>Sin internet</th>
              <th>Lectoescritura</th>
              <th>Vínculo cooperativa</th>
              <th>Estado y señales</th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      <p class="terr-note">Reglas fijas: alerta si al menos ${TERRITORY_LIMITS.noInternet}% no tiene internet en casa, si al menos ${TERRITORY_LIMITS.literacy}% tiene dificultad de lectoescritura, o si el rendimiento está más de ${TERRITORY_LIMITS.yieldDrop}% por debajo del típico (${referenceYield ? referenceYield.toFixed(1) : '—'} qq/ha). «Vínculo cooperativa» es informativo: ahorro o crédito vigente.</p>
      <p class="terr-note">Pagos y mora aún no están en la base; se podrán evaluar cuando existan cuotas del primer ciclo.</p>
    </div>`;
}
