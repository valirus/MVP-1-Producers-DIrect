// Páginas "Análisis cruzado" y "Territorio y alertas".
// Dependen de coops.js (configuración y utilidades) y Chart.js.

const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#6250d6'];
const BRAND = '#123F24';
const GREY = '#E5E2DC';

let crossCharts = {};

function newChart(el, cfg) {
  cfg.options = { animation: false, ...(cfg.options || {}) };
  return new Chart(el, cfg);
}
let currentView = 'GLOBAL';

function destroyCross() {
  Object.values(crossCharts).forEach(c => c.destroy());
  crossCharts = {};
}

const fmtPct = v => v === null || v === undefined ? '<' + MIN_N : v.toFixed(0) + '%';

function groupsFor(data, view) {
  // Vista global: se compara por cooperativa. Vista de cooperativa: por territorio (n >= MIN_N)
  const key = view === 'GLOBAL' ? 'coop' : coopConfig(view).groupBy;
  const all = groupRows(data, key);
  const kept = all.filter(([, rows]) => rows.length >= MIN_N);
  return { key, kept, hidden: all.length - kept.length };
}

function card(id, title, note, span = 6, height = 300) {
  return `<div class="card-panel col-${span}" id="cx-${id}">
    <h3>${title}</h3>
    <div class="cx-body" style="height:${height}px"><canvas id="cv-${id}"></canvas></div>
    <p class="cx-note" id="note-${id}">${note || ''}</p>
  </div>`;
}

function tableCard(id, title, span = 12) {
  return `<div class="card-panel col-${span}" id="cx-${id}"><h3>${title}</h3><div class="cx-table" id="tb-${id}"></div><p class="cx-note" id="note-${id}"></p></div>`;
}

function emptyCard(id, title, why, span = 6) {
  return `<div class="card-panel col-${span}"><h3>${title}</h3><p class="cx-empty">${why}</p></div>`;
}

// Ejes del radar con respuestas suficientes en al menos un grupo
function radarAxes(data, view) {
  const { kept } = groupsFor(data, view);
  return INDICATORS.filter(i => ['smart', 'net', 'lit', 'train', 'save', 'wa'].includes(i.id))
    .filter(a => kept.some(([, rows]) => share(rows, a.f).pct !== null));
}

// ---------- registro de gráficos ----------

const CROSS = {
  radar: {
    span: 6,
    build: (data, view) => radarAxes(data, view).length >= 3
      ? card('radar', 'Perfil de inclusión y acceso', '')
      : emptyCard('radar', 'Perfil de inclusión y acceso', `La carga no trae suficientes preguntas de acceso con ${MIN_N} o más respuestas por grupo.`),
    draw: (data, view) => {
      const axes = radarAxes(data, view);
      const { kept } = groupsFor(data, view);
      if (axes.length < 3) return;
      const sets = kept.slice(0, 4).map(([g, rows], i) => ({
        label: `${groupLabel(g)} (${rows.length} productoras)`,
        data: axes.map(a => { const s = share(rows, a.f); return s.pct === null ? null : +s.pct.toFixed(1); }),
        borderColor: SERIES[i], backgroundColor: SERIES[i] + '26', pointBackgroundColor: SERIES[i], borderWidth: 2, pointRadius: 3, spanGaps: true
      }));
      crossCharts.radar = newChart($('cv-radar'), {
        type: 'radar',
        data: { labels: axes.map(a => a.label), datasets: sets },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: true, position: 'bottom' }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.r}%` } } },
          scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, callback: v => v + '%', backdropColor: 'transparent' }, pointLabels: { font: { size: 11 } } } }
        }
      });
      let note = 'Cada eje es el % de productoras con ese rasgo. Más área cubierta = mayor acceso.';
      if (kept.length > 1) {
        const first = kept[0], last = kept[kept.length - 1];
        const best = axes.map(a => ({ a, d: (share(first[1], a.f).pct ?? 0) - (share(last[1], a.f).pct ?? 0) })).sort((x, y) => Math.abs(y.d) - Math.abs(x.d))[0];
        note = `La mayor diferencia entre ${groupLabel(first[0])} y ${groupLabel(last[0])} está en «${best.a.label}» (${Math.abs(best.d).toFixed(0)} puntos). ` + note;
      }
      $('note-radar').textContent = note;
    }
  },

  edu: {
    span: 6,
    build: (data, view) => {
      const { kept } = groupsFor(data, view);
      if (!kept.length || !data.some(r => r.education)) return emptyCard('edu', 'Nivel educativo por grupo', 'No hay datos de nivel educativo para esta selección.');
      return card('edu', 'Nivel educativo por grupo (% de cada grupo)', '');
    },
    draw: (data, view) => {
      const { kept } = groupsFor(data, view);
      if (!kept.length || !data.some(r => r.education)) return;
      const levels = ['NINGUNO', 'SIN_ESTUDIOS', 'PRIMARIA_INCOMPLETA', 'PRIMARIA_COMPLETA', 'SECUNDARIA_INCOMPLETA', 'SECUNDARIA_COMPLETA', 'TECNICO_INCOMPLETO', 'TECNICO_COMPLETO', 'SUPERIOR'];
      const present = levels.filter(l => data.some(r => r.education === l));
      const extra = [...new Set(data.map(r => r.education).filter(Boolean))].filter(l => !levels.includes(l));
      const cats = [...present, ...extra];
      const ramp = ['#e4efe7', '#cfe3d4', '#a9cdb3', '#7db08c', '#4f9163', '#2a6b40', '#123F24', '#0a2916'];
      crossCharts.edu = newChart($('cv-edu'), {
        type: 'bar',
        data: {
          labels: kept.map(([g, r]) => `${groupLabel(g)} (${r.length} productoras)`),
          datasets: cats.map((c, i) => ({
            label: prettyLabel(c),
            data: kept.map(([, rows]) => +(100 * rows.filter(r => r.education === c).length / rows.filter(r => r.education).length || 0).toFixed(1)),
            backgroundColor: ramp[Math.min(i, ramp.length - 1)], borderColor: '#fff', borderWidth: 2
          }))
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 12 } }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.x}%` } } },
          scales: { x: { stacked: true, max: 100, ticks: { callback: v => v + '%' }, grid: { display: false } }, y: { stacked: true, grid: { display: false } } }
        }
      });
      const all = data.filter(r => r.education);
      const top = cats.map(c => [c, all.filter(r => r.education === c).length]).sort((a, b) => b[1] - a[1])[0];
      $('note-edu').textContent = top ? `El nivel más frecuente es «${prettyLabel(top[0])}» (${(100 * top[1] / all.length).toFixed(0)}% de las respuestas).` : '';
    }
  },

  services: {
    span: 6,
    build: (data) => data.some(r => Array.isArray(r.services))
      ? card('services', 'Servicios financieros que usan (podían marcar varios)', '')
      : emptyCard('services', 'Servicios financieros que usan', 'Esta base no trae la pregunta de servicios financieros.'),
    draw: (data) => {
      const { items, n } = multiShare(data, 'services');
      if (!n) return;
      crossCharts.services = newChart($('cv-services'), {
        type: 'bar',
        data: { labels: items.map(i => prettyLabel(i.option)), datasets: [{ data: items.map(i => +i.pct.toFixed(1)), backgroundColor: items.map((_, i) => i === 0 ? BRAND : GREY), borderRadius: 4 }] },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.parsed.x}% de las productoras (${items[c.dataIndex].count} de ${n})` } } },
          scales: { x: { max: 100, ticks: { callback: v => v + '%' }, grid: { display: false } }, y: { grid: { display: false } } }
        }
      });
      $('note-services').textContent = `Cada productora pudo marcar varias opciones, por eso los porcentajes no suman 100 %. Respondieron ${n} productoras.`;
    }
  },

  channels: {
    span: 6,
    build: (data) => data.some(r => Array.isArray(r.channels))
      ? card('channels', 'Canales de contacto preferidos (podían marcar varios)', '')
      : emptyCard('channels', 'Canales de contacto preferidos', 'Esta base no trae la pregunta de canales.'),
    draw: (data) => {
      const { items, n } = multiShare(data, 'channels');
      if (!n) return;
      crossCharts.channels = newChart($('cv-channels'), {
        type: 'bar',
        data: { labels: items.map(i => prettyLabel(i.option)), datasets: [{ data: items.map(i => +i.pct.toFixed(1)), backgroundColor: items.map((_, i) => i === 0 ? BRAND : GREY), borderRadius: 4 }] },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.parsed.x}% (${items[c.dataIndex].count} de ${n})` } } },
          scales: { x: { max: 100, ticks: { callback: v => v + '%' }, grid: { display: false } }, y: { grid: { display: false } } }
        }
      });
      $('note-channels').textContent = items.length ? `«${prettyLabel(items[0].option)}» es el canal más elegido (${items[0].pct.toFixed(0)}%). Se podía marcar más de una, por eso no suma 100 %.` : '';
    }
  },

  heat: {
    span: 12,
    build: () => tableCard('heat', 'Comparación por grupo: % de productoras con cada característica'),
    draw: (data, view) => {
      const { kept, hidden } = groupsFor(data, view);
      const el = $('tb-heat');
      if (!kept.length) { el.innerHTML = `<p class="cx-empty">Ningún grupo alcanza ${MIN_N} productoras.</p>`; return; }
      const cols = INDICATORS;
      let h = '<table class="heat"><thead><tr><th>Grupo</th><th>Productoras</th>' + cols.map(c => `<th><div class="rot">${c.label}</div></th>`).join('') + '</tr></thead><tbody>';
      kept.forEach(([g, rows]) => {
        h += `<tr><th>${groupLabel(g)}</th><td>${rows.length}</td>` + cols.map(c => {
          const s = share(rows, c.f);
          if (s.pct === null) return `<td class="na" title="Menos de ${MIN_N} respuestas">&lt;${MIN_N}</td>`;
          const a = (s.pct / 100).toFixed(2);
          const dark = s.pct > 55;
          return `<td style="background:rgba(18,63,36,${(0.08 + 0.85 * a).toFixed(2)});color:${dark ? '#fff' : '#172019'}" title="${c.label}: ${s.pct.toFixed(1)}% (${s.n} productoras)">${s.pct.toFixed(0)}%</td>`;
        }).join('') + '</tr>';
      });
      el.innerHTML = h + '</tbody></table>';
      $('note-heat').textContent = `Cuanto más oscuro, mayor el porcentaje. Se omiten las casillas con menos de ${MIN_N} respuestas${hidden ? ` y ${hidden} grupo(s) con menos de ${MIN_N} productoras` : ''}.`;
    }
  },

  gaps: {
    span: 6,
    build: () => card('gaps', 'Principales brechas (% de productoras afectadas)', ''),
    draw: (data) => {
      const rows = GAPS.map(g => ({ label: g.label, s: share(data, g.f) })).filter(x => x.s.pct !== null).sort((a, b) => b.s.pct - a.s.pct);
      if (!rows.length) { $('note-gaps').textContent = `Menos de ${MIN_N} respuestas por indicador.`; return; }
      crossCharts.gaps = newChart($('cv-gaps'), {
        type: 'bar',
        data: { labels: rows.map(r => r.label), datasets: [{ data: rows.map(r => +r.s.pct.toFixed(1)), backgroundColor: rows.map((_, i) => i < 2 ? BRAND : GREY), borderRadius: 4 }] },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.parsed.x}% (${rows[c.dataIndex].s.n} productoras)` } } },
          scales: { x: { max: 100, ticks: { callback: v => v + '%' }, grid: { display: false } }, y: { grid: { display: false } } }
        }
      });
      $('note-gaps').textContent = `La brecha más amplia es «${rows[0].label.toLowerCase()}» (${rows[0].s.pct.toFixed(0)}%).`;
    }
  },

  bubble: {
    span: 6,
    build: () => card('bubble', 'Área, acopio y tamaño del crédito', ''),
    draw: (data, view) => {
      const rows = data.filter(r => r.area > 0 && r.qq >= 0);
      if (!rows.length) return;
      const maxAmt = Math.max(...rows.map(r => r.amount || 0), 1);
      const { kept } = groupsFor(rows, view);
      const groups = kept.length ? kept : [['Todas', rows]];
      crossCharts.bubble = newChart($('cv-bubble'), {
        type: 'bubble',
        data: {
          datasets: groups.slice(0, 4).map(([g, rs], i) => ({
            label: groupLabel(g),
            data: rs.map(r => ({ x: r.area, y: r.qq, r: 3 + 9 * Math.sqrt((r.amount || 0) / maxAmt), code: r.code, amount: r.amount })),
            backgroundColor: SERIES[i] + '99', borderColor: SERIES[i], borderWidth: 1
          }))
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: true, position: 'bottom' }, tooltip: { callbacks: { label: c => `${c.raw.code}: ${c.raw.x} ha, ${c.raw.y} qq, solicitó S/ ${(c.raw.amount || 0).toLocaleString('es-PE')}` } } },
          scales: { x: { title: { display: true, text: 'Área de café (ha)' }, grid: { display: false } }, y: { title: { display: true, text: 'Quintales acopiados 2025' }, grid: { color: '#f0eee9' } } }
        }
      });
      $('note-bubble').textContent = 'El tamaño de la burbuja es el monto solicitado. Permite ver si quienes piden más crédito son también quienes tienen más área o acopio.';
    }
  },

  corr: {
    span: 12,
    build: () => tableCard('corr', 'Qué variables suben o bajan juntas', 8),
    draw: (data) => {
      const vars = [['area', 'Área (ha)'], ['qq', 'Quintales'], ['income', 'Ingreso principal'], ['amount', 'Monto solicitado'], ['age', 'Edad'], ['years', 'Antigüedad'], ['family', 'Familiares']];
      const el = $('tb-corr');
      const rows = data.filter(r => vars.every(([k]) => Number.isFinite(r[k])));
      if (rows.length < 10) { el.innerHTML = '<p class="cx-empty">Se necesitan al menos 10 productoras con todos los datos numéricos.</p>'; return; }
      const cols = vars.map(([k]) => rows.map(r => r[k]));
      let h = '<table class="heat corr"><thead><tr><th></th>' + vars.map(v => `<th><div class="rot">${v[1]}</div></th>`).join('') + '</tr></thead><tbody>';
      vars.forEach((v, i) => {
        h += `<tr><th>${v[1]}</th>` + vars.map((w, j) => {
          const r = i === j ? 1 : spearman(cols[i], cols[j]);
          const a = Math.min(1, Math.abs(r));
          const bg = r >= 0 ? `rgba(18,63,36,${(0.06 + 0.85 * a).toFixed(2)})` : `rgba(138,84,36,${(0.06 + 0.85 * a).toFixed(2)})`;
          return `<td style="background:${bg};color:${a > 0.5 ? '#fff' : '#172019'}">${r.toFixed(2)}</td>`;
        }).join('') + '</tr>';
      });
      el.innerHTML = h + '</tbody></table>';
      $('note-corr').textContent = `Verde: suben juntas. Marrón: una sube y la otra baja. Que vayan juntas no significa que una cause la otra. Productoras: ${rows.length}.`;
    }
  },

  age: {
    span: 6,
    build: () => card('age', '¿Cómo son las entrevistadas? Edad', ''),
    draw: (data) => {
      const ages = data.map(r => r.age).filter(a => Number.isFinite(a) && a > 0);
      if (ages.length < MIN_N) return;
      const bins = [['< 30', a => a < 30], ['30–39', a => a >= 30 && a < 40], ['40–49', a => a >= 40 && a < 50], ['50–59', a => a >= 50 && a < 60], ['60+', a => a >= 60]];
      const counts = bins.map(([, f]) => ages.filter(f).length);
      const max = counts.indexOf(Math.max(...counts));
      crossCharts.age = newChart($('cv-age'), {
        type: 'bar',
        data: { labels: bins.map(b => b[0]), datasets: [{ data: counts, backgroundColor: counts.map((_, i) => i === max ? BRAND : GREY), borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, title: { display: true, text: 'Edad al cierre 2025 (años)' } }, y: { grid: { display: false }, title: { display: true, text: 'Productoras' } } } }
      });
      $('note-age').textContent = `Edad central: ${median(ages)} años (la mitad es menor y la mitad mayor). El grupo más numeroso es el de ${bins[max][0]} años.`;
    }
  }
};

// ---------- página Análisis cruzado ----------

function renderCross(data, view) {
  currentView = view;
  destroyCross();
  const cfg = coopConfig(view);
  const root = $('cross-grid');
  if (!root) return;
  $('cross-focus').textContent = `${cfg.label}: ${cfg.focus}.`;
  if (!data.length) { root.innerHTML = '<p class="cx-empty">No hay productoras con los filtros actuales.</p>'; return; }
  const ids = cfg.cross.filter(id => CROSS[id]);
  root.innerHTML = ids.map(id => CROSS[id].build(data, view)).join('');
  ids.forEach(id => { try { CROSS[id].draw(data, view); } catch (e) { console.error('Gráfico ' + id, e); } });
}

// ---------- página Territorio y alertas ----------

const ALERT_DEFAULTS = { net: 30, lit: 25, yieldDrop: 25 };

function renderTerritory(data, view) {
  const root = $('territory-body');
  if (!root) return;
  const by = $('terr-group') ? $('terr-group').value : 'territory';
  const th = {
    net: +($('th-net')?.value || ALERT_DEFAULTS.net),
    lit: +($('th-lit')?.value || ALERT_DEFAULTS.lit),
    yd: +($('th-yield')?.value || ALERT_DEFAULTS.yieldDrop)
  };
  const groups = groupRows(data, by);
  if (!groups.length) { root.innerHTML = '<p class="cx-empty">No hay datos de este nivel territorial en la base cargada.</p>'; return; }
  const withYield = data.filter(r => r.area > 0).map(r => r.qq / r.area);
  const refYield = median(withYield);
  let rowsHtml = '', nAlert = 0, nOk = 0, nIns = 0;
  groups.forEach(([g, rows]) => {
    const n = rows.length;
    const area = rows.reduce((t, r) => t + (r.area || 0), 0);
    const qq = rows.reduce((t, r) => t + (r.qq || 0), 0);
    const yld = area > 0 ? qq / area : null;
    if (n < MIN_N) {
      nIns++;
      rowsHtml += `<tr class="ins"><td>${g}</td><td>${n}</td><td colspan="5">Datos insuficientes (menos de ${MIN_N} productoras)</td><td><span class="sem sem-na">Sin evaluar</span></td></tr>`;
      return;
    }
    const net = share(rows, GAPS[0].f).pct, lit = share(rows, GAPS[2].f).pct;
    const link = share(rows, r => r.savingsCoop == null && r.coopCredit == null ? null : +!!(r.savingsCoop || r.coopCredit)).pct;
    const flags = [];
    if (net !== null && net >= th.net) flags.push(`Sin internet en casa ${net.toFixed(0)}%`);
    if (lit !== null && lit >= th.lit) flags.push(`Dificultad lectura/escritura ${lit.toFixed(0)}%`);
    if (yld !== null && refYield && yld < refYield * (1 - th.yd / 100)) flags.push(`Rendimiento ${yld.toFixed(1)} qq/ha`);
    const level = flags.length === 0 ? 'ok' : flags.length === 1 ? 'warn' : 'bad';
    if (level === 'ok') nOk++; else nAlert++;
    const label = { ok: 'Sin alertas', warn: '1 alerta', bad: flags.length + ' alertas' }[level];
    rowsHtml += `<tr><td><b>${g}</b></td><td>${n}</td><td>${area.toFixed(1)}</td><td>${yld === null ? '—' : yld.toFixed(1)}</td><td>${fmtPct(net)}</td><td>${fmtPct(lit)}</td><td>${link === null ? '—' : fmtPct(link)}</td><td><span class="sem sem-${level}" title="${flags.join(' · ') || 'Dentro de los umbrales'}">${label}</span>${flags.length ? `<div class="flags">${flags.join(' · ')}</div>` : ''}</td></tr>`;
  });
  root.innerHTML = `<div class="kpis-grid kpis-3">
      <div class="kpi-card"><div class="kpi-title">Zonas evaluadas</div><div class="kpi-val">${nOk + nAlert}</div><div class="kpi-sub">con ${MIN_N} o más productoras</div></div>
      <div class="kpi-card"><div class="kpi-title">Zonas con alerta</div><div class="kpi-val">${nAlert}</div><div class="kpi-sub">según los umbrales de arriba</div></div>
      <div class="kpi-card"><div class="kpi-title">Zonas sin evaluar</div><div class="kpi-val">${nIns}</div><div class="kpi-sub">datos insuficientes</div></div>
    </div>
    <div class="card-panel col-12"><table class="terr"><thead><tr><th>Zona</th><th>Productoras</th><th>Área (ha)</th><th>Rend. (qq/ha)</th><th>Sin internet en casa</th><th>Dificultad lectura/escritura</th><th>Con ahorro o crédito en la cooperativa</th><th>Estado</th></tr></thead><tbody>${rowsHtml}</tbody></table>
    <p class="cx-note">Reglas: alerta si ≥ ${th.net}% sin internet en casa, si ≥ ${th.lit}% con dificultad de lectoescritura, o si el rendimiento está más de ${th.yd} % por debajo del rendimiento típico (${refYield ? refYield.toFixed(1) : '—'} qq/ha).</p>
    <p class="cx-note"><span class="pill-pending">Pendiente</span> Pagos y mora por zona: se podrán medir cuando haya cuotas pagadas del primer ciclo de créditos. Tampoco hay datos de cuánto café se vende a otros compradores, que es lo que más afecta el acopio cuando el precio fluctúa. La columna de ahorro o crédito en la cooperativa es informativa: Producers Direct la considera más útil que el historial de Infocorp para anticipar el repago.</p></div>`;
}
