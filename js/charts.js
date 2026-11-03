/* Gráficos del tablero. Se recalculan con la selección y nunca inventan datos. */
const PDCharts = (() => {
  const D = PDData;
  const charts = {};
  const reduced = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const C = {
    forestDark: '#0F2E22',
    forest: '#1F5138',
    forestSoft: '#2E6A4A',
    sage: '#7C9A83',
    sageLight: '#DCE7DE',
    sagePale: '#EDF3EE',
    clay: '#B85C38',
    gold: '#B8892E',
    sky: '#3C6E8F',
    plum: '#7B5E7B',
    ink: '#18221C',
    inkSoft: '#34443A',
    muted: '#6A776F',
    line: '#E3E5DD',
    paper: '#F6F4EE'
  };
  const palette = [C.forest, C.clay, C.sky, C.gold, C.plum, C.sage];
  const order = { NORANDINO: 0, 'BAGUA GRANDE': 1 };

  const el = (id) => document.getElementById(id);
  const fmt = (value, decimals = 0) => value == null || !Number.isFinite(value)
    ? 'Sin dato'
    : value.toLocaleString('es-PE', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
  const pct = (value, decimals = 0) => value == null || !Number.isFinite(value)
    ? 'Sin dato'
    : fmt(value, decimals) + '%';
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const table = (headers, rows) => `<table><thead><tr>${headers.map((header) => `<th scope="col">${esc(header)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

  function coopColor(coop, index = 0) {
    const key = String(coop ?? '').toUpperCase();
    if (key === 'NORANDINO') return C.forest;
    if (key === 'BAGUA GRANDE') return C.clay;
    return palette[index % palette.length];
  }

  function sortCoops(allRows) {
    return [...new Set(allRows.map((row) => row.coop).filter(Boolean))]
      .sort((a, b) => ((order[a] ?? 2) - (order[b] ?? 2)) || String(a).localeCompare(String(b), 'es'));
  }

  function groupsPresent(rows, allRows) {
    return sortCoops(allRows).filter((coop) => rows.some((row) => row.coop === coop));
  }

  function medianOf(rows, key) {
    return D.median(rows.filter((row) => D.finite(row[key])).map((row) => row[key]));
  }

  function setEmpty(id, message) {
    const canvas = el(id);
    const box = canvas ? canvas.closest('.chart-box') : null;
    if (!box) return;
    if (message) box.dataset.empty = message;
    else delete box.dataset.empty;
  }

  function destroyChart(id) {
    if (charts[id]) {
      try { charts[id].destroy(); } catch (error) { /* noop */ }
      delete charts[id];
    }
  }

  function showEmpty(id, message) {
    destroyChart(id);
    setEmpty(id, message);
  }

  const percentLabels = {
    id: 'pdPercentLabels',
    afterDatasetsDraw(chart) {
      if (!chart.options.pdPercent || chart.options.indexAxis !== 'y') return;
      const ctx = chart.ctx;
      ctx.save();
      ctx.font = '700 10px Inter, Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        meta.data.forEach((bar, index) => {
          const value = Number(dataset.data[index]);
          if (!Number.isFinite(value) || value < 8) return;
          const start = bar.base ?? bar.x;
          const width = Math.abs(bar.x - start);
          if (width < 30) return;
          ctx.fillStyle = dataset.pdTextColor || '#fff';
          ctx.fillText(Math.round(value) + '%', (bar.x + start) / 2, bar.y);
        });
      });
      ctx.restore();
    }
  };

  const valueLabels = {
    id: 'pdValueLabels',
    afterDatasetsDraw(chart) {
      const config = chart.$pdValueLabels;
      if (!config) return;
      const format = typeof config === 'function'
        ? config
        : (config.format || ((value) => fmt(value)));
      const horizontal = chart.options.indexAxis === 'y';
      const ctx = chart.ctx;
      ctx.save();
      ctx.font = '700 10.5px Inter, Segoe UI, sans-serif';
      ctx.fillStyle = C.inkSoft;
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        chart.getDatasetMeta(datasetIndex).data.forEach((bar, index) => {
          const value = dataset.data[index];
          if (value == null || !Number.isFinite(value)) return;
          const text = format(value);
          if (horizontal) {
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, Math.max(bar.x, bar.base ?? bar.x) + 6, bar.y);
          } else {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(text, bar.x, bar.y - 5);
          }
        });
      });
      ctx.restore();
    }
  };

  const medianLines = {
    id: 'pdMedianLines',
    afterDatasetsDraw(chart) {
      const medians = chart.options.pdMedians;
      if (!medians || !medians.length) return;
      const { ctx } = chart;
      const xScale = chart.scales.x;
      const yScale = chart.scales.y;
      if (!xScale || !yScale) return;
      ctx.save();
      medians.forEach((median) => {
        const x = xScale.getPixelForValue(median.value);
        const y = yScale.getPixelForValue(median.y);
        ctx.strokeStyle = C.forestDark;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y - 11);
        ctx.lineTo(x, y + 11);
        ctx.stroke();
        ctx.fillStyle = C.forestDark;
        ctx.font = '700 10px Inter, Segoe UI, sans-serif';
        ctx.textAlign = x < 46 ? 'left' : x > chart.width - 46 ? 'right' : 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(median.label, x, y - 14);
      });
      ctx.restore();
    }
  };

  if (typeof Chart !== 'undefined') {
    const family = typeof window !== 'undefined' && document.body
      ? getComputedStyle(document.body).fontFamily
      : 'Segoe UI, sans-serif';
    Chart.defaults.font.family = family;
    Chart.defaults.font.size = 11;
    Chart.defaults.color = C.muted;
    Chart.defaults.borderColor = C.line;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.boxWidth = 8;
    Chart.defaults.plugins.legend.labels.boxHeight = 8;
    Chart.defaults.plugins.legend.labels.padding = 14;
    Chart.defaults.plugins.legend.labels.font = { size: 10.5, weight: '600' };
    Chart.defaults.plugins.tooltip.backgroundColor = C.forestDark;
    Chart.defaults.plugins.tooltip.titleFont = { size: 11, weight: '700' };
    Chart.defaults.plugins.tooltip.bodyFont = { size: 11 };
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.displayColors = true;
    Chart.defaults.plugins.tooltip.boxPadding = 4;
    Chart.defaults.animation = reduced ? false : { duration: 420, easing: 'easeOutQuart' };
    Chart.register(percentLabels, valueLabels, medianLines);
  }

  function chart(id, type, data, options = {}) {
    const canvas = el(id);
    if (!canvas) return;
    if (typeof Chart === 'undefined') {
      showEmpty(id, 'No se pudo cargar el motor de gráficos. Revisa vendor/.');
      return;
    }
    destroyChart(id);
    setEmpty(id, '');
    charts[id] = new Chart(canvas, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...options
      }
    });
  }

  function jitter(index) {
    return ((((index * 37) % 101) / 100) - 0.5) * 0.44;
  }

  function renderSummary(rows, allRows) {
    const wrap = el('profile-table');
    const meta = el('profile-meta');
    const footnote = el('profile-note');
    if (!wrap) return;
    const coops = groupsPresent(rows, allRows);
    if (!rows.length || !coops.length) {
      wrap.innerHTML = '<div class="empty-state"><strong>Sin datos para mostrar</strong><span>Carga una base o ajusta los filtros.</span></div>';
      if (meta) meta.textContent = 'Sin datos';
      if (footnote) footnote.textContent = '';
      return;
    }

    const metrics = [
      { key: 'age', label: 'Edad típica', unit: 'años', decimals: 0 },
      { key: 'years', label: 'Años en la cooperativa', unit: 'años', decimals: 0 },
      { key: 'family', label: 'Personas en el hogar', unit: 'personas', decimals: 0 },
      { key: 'area', label: 'Área de café', unit: 'ha', decimals: 1 },
      { key: 'qq', label: 'Acopio 2025', unit: 'qq', decimals: 0 },
      { key: 'income', label: 'Ingreso anual declarado', unit: '', decimals: 0, prefix: 'S/ ' }
    ];

    const columns = coops.length > 1
      ? [
          { key: '__all', label: 'Todas', rows },
          ...coops.map((coop) => ({ key: coop, label: groupLabel(coop), rows: rows.filter((row) => row.coop === coop) }))
        ]
      : coops.map((coop) => ({ key: coop, label: groupLabel(coop), rows: rows.filter((row) => row.coop === coop) }));

    const valueText = (metric, value) => value == null
      ? 'Sin dato'
      : `${metric.prefix || ''}${fmt(value, metric.decimals)}${metric.unit ? ' ' + metric.unit : ''}`;

    const body = metrics.map((metric) => {
      const values = columns.map((column) => ({
        ...column,
        value: medianOf(column.rows, metric.key),
        n: column.rows.filter((row) => D.finite(row[metric.key])).length
      }));
      const max = Math.max(...values.map((item) => item.value ?? 0), 0);
      const cells = values.map((item) => {
        const width = max > 0 && item.value != null && item.value > 0
          ? Math.max(2, Math.min(100, 100 * item.value / max))
          : 0;
        const text = valueText(metric, item.value);
        const title = `${metric.label}: ${text}${item.n ? ` (${item.n} productoras con dato)` : ''}`;
        return `<td title="${esc(title)}"><div class="profile-cell"><span class="profile-val${item.value == null ? ' is-empty' : ''}">${esc(text)}</span>${width ? `<span class="profile-bar" aria-hidden="true"><i style="width:${width.toFixed(1)}%"></i></span>` : ''}</div></td>`;
      }).join('');
      return `<tr><th scope="row">${esc(metric.label)}</th>${cells}</tr>`;
    }).join('');

    wrap.innerHTML = `<table class="profile-table"><thead><tr><th scope="col">Indicador</th>${columns.map((column) => `<th scope="col">${esc(column.label)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>`;
    if (meta) meta.textContent = `${rows.length} productoras · valores típicos`;
    if (footnote) footnote.textContent = 'La mediana describe a la productora típica y no se ve afectada por casos extremos.';
  }

  function renderProduction(rows, allRows) {
    const meta = el('acopio-meta');
    const stats = el('acopio-stats');
    const data = rows.filter((row) => D.finite(row.qq) && row.qq >= 0);
    const coops = groupsPresent(data, allRows);
    if (!data.length || !coops.length) {
      showEmpty('chart-acopio', 'Carga una base con acopio reportado para ver esta distribución.');
      if (meta) meta.textContent = 'Sin datos';
      if (stats) stats.innerHTML = '';
      return;
    }

    const groups = coops.map((coop) => {
      const list = data.filter((row) => row.coop === coop);
      return {
        coop,
        list,
        median: D.median(list.map((row) => row.qq))
      };
    });

    const datasets = groups.map((group, groupIndex) => {
      const color = coopColor(group.coop, coops.indexOf(group.coop));
      return {
        label: groupLabel(group.coop),
        data: group.list.map((row, index) => ({
          x: row.qq,
          y: groupIndex + jitter(index),
          code: row.code
        })),
        backgroundColor: color + 'B8',
        borderColor: color,
        borderWidth: 0,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointStyle: 'circle'
      };
    });

    chart('chart-acopio', 'scatter', { datasets }, {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.raw.code}: ${fmt(context.raw.x)} qq`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: C.line },
          ticks: { maxTicksLimit: 8, callback: (value) => fmt(value) },
          title: { display: true, text: 'Quintales acopiados en 2025', color: C.muted, font: { size: 10, weight: '600' } }
        },
        y: {
          min: -0.55,
          max: groups.length - 0.45,
          grid: { display: false },
          ticks: {
            stepSize: 1,
            callback: (value) => {
              const group = groups[Math.round(value)];
              return group ? groupLabel(group.coop) : '';
            }
          }
        }
      },
      pdMedians: groups.map((group, index) => ({
        y: index,
        value: group.median,
        label: `típico ${fmt(group.median)} qq`
      }))
    });

    const total = data.reduce((sum, row) => sum + row.qq, 0);
    const overall = D.median(data.map((row) => row.qq));
    if (stats) {
      stats.innerHTML = `
        <div class="stat"><span class="stat-label">Con acopio</span><strong>${data.length} de ${rows.length}</strong></div>
        <div class="stat"><span class="stat-label">Acopio total</span><strong>${fmt(total)} qq</strong></div>
        <div class="stat"><span class="stat-label">Productora típica</span><strong>${fmt(overall)} qq</strong></div>`;
    }
    if (meta) meta.textContent = `${data.length} productoras`;
  }

  function stacked100(id, rows, allRows, config) {
    const coops = groupsPresent(rows, allRows);
    if (!rows.length || !coops.length) return;
    const groups = coops.map((coop) => ({ coop, list: rows.filter((row) => row.coop === coop) }));
    const counts = config.categories.map((category) => groups.map((group) => group.list.filter((row) => config.value(row) === category.value).length));
    const totals = groups.map((group) => group.list.length);
    const datasets = config.categories.map((category, index) => ({
      label: category.label,
      data: counts[index].map((count, groupIndex) => totals[groupIndex] ? 100 * count / totals[groupIndex] : 0),
      backgroundColor: category.color,
      pdTextColor: category.textColor || '#fff',
      borderRadius: 3,
      borderSkipped: false
    }));

    chart(id, 'bar', {
      labels: groups.map((group) => `${groupLabel(group.coop)} · ${group.list.length}`),
      datasets
    }, {
      indexAxis: 'y',
      pdPercent: true,
      plugins: {
        legend: { display: true, position: 'bottom', labels: { boxWidth: 8, boxHeight: 8 } },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${fmt(context.raw, 1)}% (${counts[context.datasetIndex][context.dataIndex]}/${totals[context.dataIndex]})`
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          min: 0,
          max: 100,
          grid: { display: false },
          ticks: { callback: (value) => value + '%' }
        },
        y: {
          stacked: true,
          grid: { display: false },
          ticks: { color: C.ink, font: { size: 10.5, weight: '600' } }
        }
      }
    });
  }

  function renderInclusion(rows, allRows) {
    const phoneMeta = el('phone-meta');
    const literacyMeta = el('literacy-meta');
    const hasPhone = rows.some((row) => row.phone);
    const hasLiteracy = rows.some((row) => row.literacy);
    const coops = groupsPresent(rows, allRows);

    if (!rows.length || !coops.length) {
      showEmpty('chart-phone', 'Carga una base para comparar el acceso.');
      showEmpty('chart-literacy', 'Carga una base para comparar la lectoescritura.');
      if (phoneMeta) phoneMeta.textContent = 'Sin datos';
      if (literacyMeta) literacyMeta.textContent = 'Sin datos';
      return;
    }

    if (hasPhone) {
      const categories = [
        { value: 'SMARTPHONE', label: 'Smartphone', color: C.forest, textColor: '#fff' },
        { value: 'BASICO', label: 'Celular básico', color: C.gold, textColor: '#2C220B' },
        { value: 'NINGUNO', label: 'Sin celular', color: C.clay, textColor: '#fff' },
        { value: 'OTRO / REVISAR', label: 'Otra respuesta', color: C.plum, textColor: '#fff' },
        { value: 'SIN DATO', label: 'Sin dato', color: C.sageLight, textColor: C.inkSoft }
      ];
      stacked100('chart-phone', rows, allRows, {
        categories,
        value: (row) => row.phone || 'SIN DATO'
      });
      if (phoneMeta) phoneMeta.textContent = `${rows.length} productoras`;
    } else {
      showEmpty('chart-phone', 'Esta base no trae el tipo de celular.');
      if (phoneMeta) phoneMeta.textContent = 'Sin dato';
    }

    if (hasLiteracy) {
      const categories = [
        { value: 'NINGUNA', label: 'Sin dificultad', color: C.forest, textColor: '#fff' },
        { value: 'ALGUNA', label: 'Con alguna dificultad', color: C.clay, textColor: '#fff' },
        { value: 'SIN DATO', label: 'Sin dato', color: C.sageLight, textColor: C.inkSoft }
      ];
      stacked100('chart-literacy', rows, allRows, {
        categories,
        value: (row) => row.literacy ? (row.literacy === 'NINGUNA' ? 'NINGUNA' : 'ALGUNA') : 'SIN DATO'
      });
      if (literacyMeta) literacyMeta.textContent = `${rows.length} productoras`;
    } else {
      showEmpty('chart-literacy', 'Esta base no trae la pregunta de lectoescritura.');
      if (literacyMeta) literacyMeta.textContent = 'Sin dato';
    }
  }

  function renderCredit(rows, allRows) {
    const activitiesMeta = el('activities-meta');
    const amountsMeta = el('amounts-meta');
    const amountStats = el('amount-stats');
    const coops = groupsPresent(rows, allRows);

    if (!rows.length || !coops.length) {
      showEmpty('chart-activities', 'Carga una base para ver el destino de las solicitudes.');
      showEmpty('chart-amounts', 'Carga una base para ver los montos solicitados.');
      if (activitiesMeta) activitiesMeta.textContent = 'Sin datos';
      if (amountsMeta) amountsMeta.textContent = 'Sin datos';
      if (amountStats) amountStats.innerHTML = '';
      return;
    }

    const activityCounts = new Map();
    rows.forEach((row) => {
      if (row.activity) activityCounts.set(row.activity, (activityCounts.get(row.activity) || 0) + 1);
    });
    const topActivities = [...activityCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([value]) => value);
    const hasOtherActivities = [...activityCounts.keys()].some((value) => !topActivities.includes(value));
    const hasMissingActivity = rows.some((row) => !row.activity);

    if (!activityCounts.size) {
      showEmpty('chart-activities', 'Esta base no trae la actividad a financiar.');
      if (activitiesMeta) activitiesMeta.textContent = 'Sin dato';
    } else {
      const activityColors = [C.forest, C.clay, C.gold, C.sky, C.plum, C.sage];
      const categories = topActivities.map((value, index) => ({
        value,
        label: prettyLabel(value),
        color: activityColors[index % activityColors.length],
        textColor: index === 2 ? '#2C220B' : '#fff'
      }));
      if (hasOtherActivities) categories.push({ value: 'OTROS', label: 'Otros', color: C.sage, textColor: '#fff' });
      if (hasMissingActivity) categories.push({ value: 'SIN DATO', label: 'Sin dato', color: C.sageLight, textColor: C.inkSoft });

      stacked100('chart-activities', rows, allRows, {
        categories,
        value: (row) => {
          if (!row.activity) return 'SIN DATO';
          return topActivities.includes(row.activity) ? row.activity : 'OTROS';
        }
      });
      if (activitiesMeta) activitiesMeta.textContent = `${rows.filter((row) => row.activity).length} solicitudes`;
    }

    const amounts = rows.map((row) => row.amount).filter(D.finite);
    if (!amounts.length) {
      showEmpty('chart-amounts', 'Esta base no trae montos solicitados.');
      if (amountsMeta) amountsMeta.textContent = 'Sin dato';
      if (amountStats) amountStats.innerHTML = '';
      return;
    }

    const bins = [
      { label: 'Hasta S/ 1,000', test: (value) => value < 1000 },
      { label: 'S/ 1,001–1,500', test: (value) => value >= 1000 && value < 1500 },
      { label: 'S/ 1,501–2,000', test: (value) => value >= 1500 && value < 2000 },
      { label: 'Más de S/ 2,000', test: (value) => value >= 2000 }
    ];
    const counts = bins.map((bin) => amounts.filter(bin.test).length);
    const maxIndex = counts.indexOf(Math.max(...counts));

    chart('chart-amounts', 'bar', {
      labels: bins.map((bin) => bin.label),
      datasets: [{
        data: counts,
        backgroundColor: counts.map((_, index) => index === maxIndex ? C.forest : C.sageLight),
        borderRadius: 6,
        barPercentage: 0.68,
        categoryPercentage: 0.8
      }]
    }, {
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (context) => `${context.raw} productoras` } }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: C.muted, font: { size: 10 } }
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
          grid: { color: C.line },
          title: { display: true, text: 'Productoras', color: C.muted, font: { size: 10, weight: '600' } }
        }
      },
      pdValueLabels: { format: (value) => fmt(value) }
    });

    const medianAmount = D.median(amounts);
    const totalAmount = amounts.reduce((sum, value) => sum + value, 0);
    if (amountStats) {
      amountStats.innerHTML = `
        <div class="stat"><span class="stat-label">Solicitud típica</span><strong>S/ ${fmt(medianAmount)}</strong></div>
        <div class="stat"><span class="stat-label">Total solicitado</span><strong>S/ ${fmt(totalAmount)}</strong></div>`;
    }
    if (amountsMeta) amountsMeta.textContent = `${amounts.length} solicitudes`;
  }

  const SHORT = {
    area: 'Área de café',
    qq: 'Acopio 2025',
    income: 'Ingreso anual',
    amount: 'Monto solicitado',
    age: 'Edad',
    years: 'Antigüedad',
    family: 'Personas en el hogar'
  };
  const shortLabel = (key) => SHORT[key] || D.label(key);

  function strengthLabel(value) {
    if (value == null) return 'Sin dato';
    const abs = Math.abs(value);
    if (abs < 0.1) return 'Sin relación clara';
    if (abs < 0.3) return 'Relación débil';
    if (abs < 0.6) return 'Relación moderada';
    return 'Relación fuerte';
  }

  function renderRelations(rows, allRows) {
    const x = el('rel-x') ? el('rel-x').value : 'area';
    const y = el('rel-y') ? el('rel-y').value : 'qq';
    const coops = groupsPresent(rows, allRows);
    const pairs = rows.filter((row) => D.finite(row[x]) && D.finite(row[y]));
    const relationTitle = el('relation-title');
    const relationMeta = el('relation-meta');
    const relationInsight = el('relation-insight');
    const relationGroups = el('relation-groups');
    const insights = el('relations-insights');

    if (relationTitle) relationTitle.textContent = `${shortLabel(x)} y ${shortLabel(y)}`;
    if (relationMeta) relationMeta.textContent = `${pairs.length} de ${rows.length} con ambos datos`;

    if (!rows.length || !coops.length || !pairs.length) {
      showEmpty('chart-relation', 'No hay productoras con ambos datos en la selección.');
      if (relationInsight) relationInsight.innerHTML = '<strong>Sin datos suficientes.</strong><div>Prueba con otra selección o con otras variables.</div>';
      if (relationGroups) relationGroups.innerHTML = '';
      if (insights) insights.innerHTML = '<div class="insight insight--accent"><span class="insight-label">Lectura</span><strong>Sin datos</strong><small>Ajusta los filtros o carga otra base.</small></div>';
      const matrix = el('correlation-matrix');
      if (matrix) matrix.innerHTML = '<p class="cx-empty">No hay datos para construir el mapa de relaciones.</p>';
      return;
    }

    const datasets = coops.map((coop) => {
      const color = coopColor(coop, coops.indexOf(coop));
      return {
        label: groupLabel(coop),
        data: pairs.filter((row) => row.coop === coop).map((row) => ({ x: row[x], y: row[y], code: row.code })),
        backgroundColor: color + 'C4',
        borderColor: color,
        borderWidth: 0,
        pointRadius: 4.5,
        pointHoverRadius: 7,
        pointStyle: 'circle'
      };
    });

    chart('chart-relation', 'scatter', { datasets }, {
      plugins: {
        legend: { display: coops.length > 1, position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (context) => `${context.raw.code}: ${fmt(context.raw.x)}; ${fmt(context.raw.y)}`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: C.line },
          title: { display: true, text: shortLabel(x), color: C.muted, font: { size: 10, weight: '600' } }
        },
        y: {
          beginAtZero: true,
          grid: { color: C.line },
          title: { display: true, text: shortLabel(y), color: C.muted, font: { size: 10, weight: '600' } }
        }
      }
    });

    const correlation = D.correlation(rows, x, y, 'spearman');
    const strength = strengthLabel(correlation.value);
    const direction = correlation.value == null
      ? ''
      : correlation.value > 0
        ? 'Cuando una sube, la otra tiende a subir.'
        : 'Cuando una sube, la otra tiende a bajar.';

    if (relationInsight) {
      relationInsight.innerHTML = correlation.value == null
        ? '<strong>No se puede medir.</strong><div>Hacen falta al menos 3 productoras con ambos datos y valores distintos.</div>'
        : `<strong>${esc(strength)}.</strong><div>${esc(direction)}</div><div class="card-footnote">${pairs.length} productoras con ambos datos.</div>`;
    }

    const byCoop = coops.map((coop) => ({
      coop,
      ...D.correlation(rows.filter((row) => row.coop === coop), x, y, 'spearman')
    }));
    if (relationGroups) {
      relationGroups.innerHTML = byCoop.map((group) => `
        <div class="mini-row">
          <span>${esc(groupLabel(group.coop))} <small>(${group.n})</small></span>
          <strong>${esc(strengthLabel(group.value))}</strong>
        </div>`).join('');
    }

    if (insights) {
      insights.innerHTML = correlation.value == null
        ? '<div class="insight insight--accent"><span class="insight-label">Lectura</span><strong>Sin relación calculable</strong><small>Faltan pares de datos.</small></div>'
        : `<div class="insight insight--accent"><span class="insight-label">Relación</span><strong>${esc(strength)}</strong><small>${esc(shortLabel(x))} y ${esc(shortLabel(y))}</small></div>
           <div class="insight"><span class="insight-label">Productoras</span><strong>${pairs.length}</strong><small>con ambos datos</small></div>
           <div class="insight"><span class="insight-label">Dirección</span><strong>${correlation.value > 0 ? 'Suben juntas' : 'Una sube, la otra baja'}</strong><small>No implica causalidad</small></div>`;
    }

    const vars = [
      ['area', 'Área'],
      ['qq', 'Acopio'],
      ['income', 'Ingreso'],
      ['amount', 'Monto'],
      ['age', 'Edad'],
      ['years', 'Antigüedad'],
      ['family', 'Hogar']
    ];
    let html = '<p class="cx-note">Pulsa una casilla para ver ese par en el gráfico. Cada valor usa solo las productoras con ambos datos.</p>';
    html += '<table class="heat corr"><thead><tr><th></th>' + vars.map(([, label]) => `<th><div class="rot">${esc(label)}</div></th>`).join('') + '</tr></thead><tbody>';
    vars.forEach(([a, aLabel]) => {
      html += `<tr><th scope="row">${esc(aLabel)}</th>`;
      vars.forEach(([b]) => {
        const cell = D.correlation(rows, a, b, 'spearman');
        const value = cell.value;
        const abs = value == null ? 0 : Math.min(1, Math.abs(value));
        const base = value != null && value < 0 ? [184, 92, 56] : [31, 81, 56];
        const alpha = 0.06 + 0.82 * abs;
        const color = value == null
          ? ''
          : `rgba(${base[0]},${base[1]},${base[2]},${alpha.toFixed(2)})`;
        const textColor = abs > 0.58 ? '#fff' : C.ink;
        const isDiagonal = a === b;
        html += `<td><button class="matrix-cell" data-x="${a}" data-y="${b}" ${isDiagonal ? 'disabled' : ''} style="${color ? `background:${color};` : ''}color:${textColor}" aria-label="${esc(shortLabel(a))} con ${esc(shortLabel(b))}: ${value == null ? 'no calculable' : fmt(value, 2)}, ${cell.n} productoras">${value == null ? 'N/C' : fmt(value, 2)}<small>${cell.n} prod.</small></button></td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    const matrix = el('correlation-matrix');
    if (matrix) matrix.innerHTML = html;
  }

  function safeRender(fn, id, label) {
    try { fn(); } catch (error) {
      console.error(`Error renderizando ${label}:`, error);
      if (id) showEmpty(id, 'No se pudo renderizar este gráfico. Revisa que la base tenga el campo correspondiente.');
    }
  }

  function render(rows, allRows) {
    safeRender(() => renderSummary(rows, allRows), null, 'resumen');
    safeRender(() => renderProduction(rows, allRows), 'chart-acopio', 'acopio');
    safeRender(() => renderInclusion(rows, allRows), 'chart-phone', 'acceso');
    safeRender(() => renderCredit(rows, allRows), 'chart-activities', 'crédito');
    safeRender(() => renderRelations(rows, allRows), 'chart-relation', 'relaciones');
  }

  return {
    render,
    renderSummary,
    renderProduction,
    renderInclusion,
    renderCredit,
    renderRelations,
    resize: () => Object.values(charts).forEach((chartInstance) => chartInstance.resize()),
    table,
    esc,
    fmt,
    pct,
    strengthLabel,
    charts
  };
})();
