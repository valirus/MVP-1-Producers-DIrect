/*
 * Respuesta a los comentarios de Producers Direct:
 *  - Recuadro "Cómo cuidamos los datos" en el Panorama.
 *  - Avisos de carga: columnas no reconocidas y columnas con datos personales.
 *  - Nota de privacidad y fecha en la ficha de visita.
 *  - Hoja "Mi finca" para la productora: solo datos del Excel cargado, imprimible y en lenguaje sencillo.
 * Se carga antes de app.js; usa $, D, H, rawData y audit de app.js cuando se llama.
 */
'use strict';

/* ---------- Avisos de carga ---------- */

function noticeHtml(kind, icon, html) {
  return `<div class="notice notice-${kind}" role="note"><span class="notice-icon" aria-hidden="true">${icon}</span><p>${html}</p></div>`;
}

function alertsHtml(unmapped, sensitive, beforeImport) {
  const blocks = [];
  (unmapped || []).forEach((sheet) => {
    const names = sheet.fields.map((field) => `<strong>${H.esc(field.label)}</strong>`).join(', ');
    blocks.push(noticeHtml('warn', '⚠️', beforeImport
      ? `En la hoja <em>${H.esc(sheet.sheet)}</em> no reconocimos estas preguntas: ${names}. Si existen con otro nombre (por ejemplo, porque cambió el formulario), elige su columna abajo. Si no, quedarán sin dato y sus gráficos saldrán vacíos.`
      : `En la hoja <em>${H.esc(sheet.sheet)}</em> no se encontraron estas preguntas: ${names}. Sus gráficos salen vacíos porque la columna no se reconoció, no porque nadie haya respondido. Si cambió el nombre en el formulario, hay que actualizar el mapeo.`));
  });
  if (sensitive && sensitive.length) {
    const kinds = [...new Set(sensitive.map((item) => item.kind))].join(', ');
    const headers = sensitive.map((item) => `«${H.esc(item.header)}»`).join(', ');
    blocks.push(noticeHtml('private', '🔒', `Este archivo contiene columnas con datos personales (${H.esc(kinds)}): ${headers}. <strong>El tablero no las lee ni las muestra</strong>, y el archivo no sale de tu computadora. Para compartirlo, envía una copia sin esas columnas.`));
  }
  return blocks.join('');
}

// Hojas que se importarían con la selección actual del panel "Revisar la carga".
function currentImportProfiles() {
  if (!pending) return [];
  if ($('sheet-select').value === 'known') {
    return pending.profiles.filter((p) => ['Productoras Norandino', 'Productoras Bagua Grande'].includes(p.name) && p.map.code !== undefined);
  }
  return [currentProfile()];
}

function renderMappingAlerts(profiles) {
  const wrap = $('mapping-alerts');
  if (wrap) wrap.innerHTML = alertsHtml(D.unmappedFields(profiles), D.sensitiveHeaders(profiles), true);
}

function renderQualityAlerts() {
  const wrap = $('quality-alerts');
  if (wrap) wrap.innerHTML = audit ? alertsHtml(audit.unmapped, audit.sensitive, false) : '';
}

/* ---------- Cómo cuidamos los datos ---------- */

function renderDataCare() {
  const list = $('data-care-list');
  if (!list) return;
  const n = (value) => H.fmt(value, 0);
  let noImpute = 'Si una pregunta no tiene respuesta, queda vacía. Nunca la rellenamos con un cero ni con un promedio.';
  let quarantine = 'Las filas sin código, sin cooperativa o con código repetido se apartan hasta que alguien las revise.';
  if (audit) {
    const repeated = audit.quarantine.filter((row) => row.reason.startsWith('Código repetido')).length;
    const noId = audit.quarantine.length - repeated;
    noImpute = `<strong>${n(audit.imputed)} ${audit.imputed === 1 ? 'valor rellenado' : 'valores rellenados'}.</strong> Si falta un dato, queda vacío.`
      + (audit.issues.length ? ` ${n(audit.issues.length)} ${audit.issues.length === 1 ? 'valor no válido se dejó' : 'valores no válidos se dejaron'} sin dato, con su fila anotada en Revisión de datos.` : '');
    quarantine = audit.quarantine.length
      ? `<strong>${n(audit.quarantine.length)} ${audit.quarantine.length === 1 ? 'fila apartada' : 'filas apartadas'}</strong> (${[repeated ? `${n(repeated)} con código repetido` : '', noId ? `${n(noId)} sin código o cooperativa` : ''].filter(Boolean).join(', ')}). No entran a los gráficos hasta resolverlas.`
      : '<strong>Ninguna fila apartada.</strong> Todas tienen código y cooperativa, sin códigos repetidos.';
  }
  const items = [
    ['🚫', 'No rellenamos datos', noImpute],
    ['🗂️', 'Apartamos registros dudosos', quarantine],
    ['🛡️', 'Protegemos los grupos pequeños', `No mostramos porcentajes de grupos con menos de ${MIN_N} productoras, para que nadie pueda ser identificada.`],
    ['🔢', 'Cada gráfico dice sobre cuántas', 'Cada gráfico indica cuántas productoras tienen el dato, para no leer 20 respuestas como si fueran todas.']
  ];
  list.innerHTML = items.map(([icon, title, text]) => `<li><span class="care-icon" aria-hidden="true">${icon}</span><div><h3>${H.esc(title)}</h3><p>${text}</p></div></li>`).join('');
}

/* ---------- Ficha: visita (técnico) u hoja para la productora ---------- */

let reportView = 'visit';

function todayText() {
  return new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function farmerCard(icon, text, peer) {
  return `<div class="farmer-card"><span class="farmer-icon" aria-hidden="true">${icon}</span><p class="farmer-main">${text}</p>${peer ? `<p class="farmer-peer">${peer}</p>` : ''}</div>`;
}

// Compara con la productora típica (mediana) de su cooperativa, solo si hay MIN_N o más con dato.
function peerText(row, key, format) {
  const peer = D.peerMedian(rawData, row, key, MIN_N);
  return peer ? `Una productora típica de tu cooperativa: <strong>${format(peer.median)}</strong> (según ${H.fmt(peer.n, 0)} productoras).` : '';
}

function farmerSheet(row) {
  const cards = [];
  if (D.finite(row.area)) {
    const unit = row.area === 1 ? 'hectárea' : 'hectáreas';
    cards.push(farmerCard('🌱', `Tienes <strong>${H.fmt(row.area, Number.isInteger(row.area) ? 0 : 1)} ${unit}</strong> de café.`, peerText(row, 'area', (v) => H.fmt(v, 1) + ' ha')));
  }
  if (D.finite(row.qq)) cards.push(farmerCard('☕', `Entregaste <strong>${H.fmt(row.qq, 0)} quintales</strong> a tu cooperativa en 2025.`, peerText(row, 'qq', (v) => H.fmt(v, 0) + ' quintales')));
  if (D.finite(row.income)) cards.push(farmerCard('💰', `Tu ingreso principal en 2025 fue <strong>S/ ${H.fmt(row.income, 0)}</strong>.`, peerText(row, 'income', (v) => 'S/ ' + H.fmt(v, 0))));
  const finca = cards.length ? `<div class="farmer-cards">${cards.join('')}</div>` : '<p class="farmer-empty">Todavía no tenemos estos datos de tu finca.</p>';

  const activity = row.activity ? prettyLabel(row.activity).toLowerCase() : null;
  const amount = D.finite(row.amount) ? `S/ ${H.fmt(row.amount, 0)}` : null;
  let request = 'No tenemos registrada tu solicitud.';
  if (amount && activity) request = `Pediste <strong>${amount}</strong> para <strong>${H.esc(activity)}</strong>.`;
  else if (amount) request = `Pediste <strong>${amount}</strong>.`;
  else if (activity) request = `Pediste un crédito para <strong>${H.esc(activity)}</strong>.`;


  return `<div class="farmer-sheet">
    <div class="farmer-head">
      <div><p class="farmer-kicker">Mi finca de café · 2025</p><h2>Cooperativa ${H.esc(groupLabel(row.coop))}</h2><p class="farmer-code">Código ${H.esc(row.code)}</p></div>
      <span class="farmer-stamp">Esta hoja es tuya</span>
    </div>
    <section class="farmer-section"><h3>Mi finca</h3>${finca}</section>
    <section class="farmer-section"><h3>Mi solicitud</h3><p class="farmer-line">📝 ${request}</p></section>
    <section class="farmer-section farmer-history"><h3>Mi historial con el fondo</h3>
      <p>Aún no hay pagos registrados. Cuando pagues tus cuotas, aquí verás tu historial. Con él puedes demostrar que eres buena pagadora, también ante un banco o una caja.</p>
      <p class="farmer-own">Esta hoja es tuya: <strong>tú decides a quién mostrarla.</strong></p>
    </section>
    <div class="farmer-footer"><p>Son los datos que diste en la encuesta 2025. Si algo no es correcto, avisa a tu técnico.</p><p>Impreso el ${H.esc(todayText())}.</p></div>
  </div>`;
}

function applyReportView(row) {
  const farmer = reportView === 'farmer' && !!row;
  document.querySelectorAll('.report-toggle [data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === reportView)));
  $('report-printable').hidden = farmer;
  // La guía y los botones del registro son de la ficha de visita, no de la hoja para la productora.
  document.getElementById('visit-guide').hidden = farmer;
  document.getElementById('visit-actions').hidden = farmer || !row;
  $('farmer-sheet').hidden = !farmer;
  $('farmer-sheet').innerHTML = farmer ? farmerSheet(row) : '';
}

function updateProducerExtras(row) {
  const note = $('rep-privacy');
  note.textContent = `Documento de uso interno, impreso el ${todayText()}. Contiene información de la productora: no lo compartas por WhatsApp ni redes sociales. Guárdalo o destrúyelo después de la visita.`;
  note.hidden = false;
  applyReportView(row);
}

function clearProducerExtras() {
  const note = $('rep-privacy');
  if (note) note.hidden = true;
  if ($('farmer-sheet')) applyReportView(null);
}

document.querySelector('.report-toggle')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-view]');
  if (!button) return;
  reportView = button.dataset.view;
  const key = $('filter-producer').value;
  const row = key === '' ? null : rawData[Number(key)];
  applyReportView(row && filteredData.includes(row) ? row : null);
});
