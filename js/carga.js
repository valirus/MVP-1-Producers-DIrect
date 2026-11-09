/*
 * Carga guiada del Excel (evaluación C1–C6, B1–B3 y pedido de Producers Direct):
 *  - Explica qué hojas se cargan y qué cooperativas entrarán antes de importar.
 *  - Muestra cómo se leerán los números.
 *  - Sugiere columnas compatibles para cada dato y avisa si la elegida no encaja.
 *  - Vista previa con los datos del tablero primero.
 *  - Guardar / usar un mapeo de columnas para el siguiente ciclo del formulario.
 * Se carga antes de app.js; usa $, D, H, pending, currentProfile y download de app.js.
 */
'use strict';

const KNOWN_FORMS = ['Productoras Norandino', 'Productoras Bagua Grande'];
const KIND_LABELS = { id: 'código', coop: 'texto', num: 'número', date: 'fecha', cat: 'texto', multi: 'varias opciones', bin: 'sí / no' };
let importDictionary = new Map();

const isKnownMode = () => $('sheet-select').value === 'known';
const cut = (text, n) => (text.length > n ? text.slice(0, n - 1) + '…' : text);

/* ---------- Hojas del archivo ---------- */

function sheetLabel(p) {
  if (p.name === 'Productoras') return 'Base limpia: hoja «Productoras» (todas las cooperativas)';
  if (p.fixedCoop) return `Solo ${groupLabel(p.fixedCoop)}: hoja «${p.name}»`;
  return `Hoja «${p.name}»`;
}

// Diccionario del Excel (si existe): nombre de columna → descripción.
function buildDictionary(profiles) {
  const dict = new Map();
  const sheet = profiles.find((p) => D.norm(p.name).includes('DICCIONARIO'));
  if (!sheet) return dict;
  let header = 0;
  sheet.matrix.slice(0, 10).forEach((row, i) => { if ((row || []).filter((v) => typeof v === 'string' && v.trim()).length >= 2 && header === 0) header = i; });
  const heads = (sheet.matrix[header] || []).map((h) => D.norm(h));
  let nameCol = heads.findIndex((h) => /VARIABLE|CAMPO|COLUMNA|NOMBRE/.test(h));
  let descCol = heads.findIndex((h) => /DESCRIP|SIGNIFIC|DEFINI|PREGUNTA/.test(h));
  if (nameCol < 0) nameCol = 0;
  if (descCol < 0 || descCol === nameCol) descCol = nameCol === 0 ? 1 : 0;
  for (const row of sheet.matrix.slice(header + 1)) {
    const name = row?.[nameCol], desc = row?.[descCol];
    if (name != null && desc != null && String(desc).trim()) dict.set(D.norm(name), String(desc).trim());
  }
  return dict;
}

// Llena «Qué cargar» al elegir un archivo. Reemplaza el llenado que hacía app.js.
function fillSheetSelect(profiles) {
  const select = $('sheet-select');
  select.replaceChildren();
  profiles.forEach((p) => { p.autoHeader = p.header; p.autoCount = Object.keys(p.map).length; p.sheetCoop = p.fixedCoop || ''; });
  importDictionary = buildDictionary(profiles);
  const known = profiles.filter((p) => KNOWN_FORMS.includes(p.name) && p.map.code !== undefined);
  if (known.length === 2) select.add(new Option('Ambas cooperativas: formularios originales de Norandino y Bagua Grande', 'known'));
  const data = profiles.map((p, i) => [p, i]).filter(([p]) => p.map.code !== undefined);
  const other = profiles.map((p, i) => [p, i]).filter(([p]) => p.map.code === undefined);
  data.forEach(([p, i]) => select.add(new Option(sheetLabel(p), String(i))));
  if (other.length) {
    const group = document.createElement('optgroup');
    group.label = 'Otras hojas (no parecen de productoras)';
    other.forEach(([p, i]) => group.append(new Option(`Hoja «${p.name}»`, String(i))));
    select.append(group);
  }
  const preferred = profiles.findIndex((p) => p.name === 'Productoras' && p.map.code !== undefined);
  select.value = preferred >= 0 ? String(preferred) : known.length === 2 ? 'known' : String(data[0]?.[1] ?? 0);
  $('mapping-status').innerHTML = '';
}

function sheetHelp() {
  if (isKnownMode()) return 'Se combinan solo las hojas «Productoras Norandino» y «Productoras Bagua Grande». La cooperativa sale del nombre de cada hoja. Úsalo con la exportación original del formulario.';
  const p = currentProfile();
  if (p.map.code === undefined) return 'Esta hoja no parece tener productoras (no encontramos una columna de código). Elige otra hoja o asigna la columna de código abajo.';
  if (p.name === 'Productoras') return 'Una sola hoja con todas las cooperativas. Se recomienda si tienes la base limpia de 77 columnas.';
  if (p.fixedCoop) return `Solo se cargarán las productoras de ${groupLabel(p.fixedCoop)}. Para comparar cooperativas, elige «Ambas cooperativas».`;
  return 'Se cargará solo esta hoja. Revisa abajo qué cooperativas incluye antes de importar.';
}

/* ---------- Panel de columnas ---------- */

function optionText(col) {
  const name = col.header || '(sin título)';
  const sample = col.samples.length ? ` — ej.: ${col.samples.join(' · ')}` : ' — vacía';
  return cut(`${col.index + 1} · ${name}${sample}`, 110);
}

function fieldSelect(key, p, cols) {
  const select = document.createElement('select');
  select.id = 'map-' + key;
  select.add(new Option('No disponible (quedará sin dato)', ''));
  const current = p.map[key];
  const suggested = D.suggestedColumns(key, cols, current);
  const addGroup = (label, list) => {
    if (!list.length) return;
    const group = document.createElement('optgroup');
    group.label = label;
    list.forEach((i) => group.append(new Option(optionText(cols[i]), String(i))));
    select.append(group);
  };
  addGroup('Sugeridas', suggested);
  addGroup('Otras columnas', cols.filter((c) => c.header && !suggested.includes(c.index)).map((c) => c.index));
  if (current !== undefined && !select.querySelector(`option[value="${current}"]`)) select.add(new Option(optionText(cols[current] || { index: current, header: '', samples: [] }), String(current)));
  select.value = current === undefined ? '' : String(current);
  select.addEventListener('change', () => {
    if (select.value === '') delete p.map[key]; else p.map[key] = Number(select.value);
    refreshDerived();
  });
  return select;
}

function renderImportPanel() {
  const known = isKnownMode();
  $('header-row').disabled = known;
  $('sheet-help').textContent = sheetHelp();
  $('mapping-fields').replaceChildren();
  $('import-preview').innerHTML = '';
  $('import-preview-all').innerHTML = '';
  if (known) {
    const profiles = currentImportProfiles();
    $('mapping-note').textContent = `Se usarán las columnas reconocidas en cada formulario (${profiles.map((p) => `${p.name}: ${Object.keys(p.map).length} datos`).join('; ')}). Para revisarlas una por una, elige cada hoja por separado.`;
    $('import-preview').innerHTML = profiles.map((p) => `<h4 class="preview-title">${H.esc(p.name)}</h4>${previewTable(p)}`).join('');
    refreshDerived();
    return;
  }
  const p = currentProfile();
  $('header-row').value = p.header + 1;
  p.cols = D.columnProfiles(p.matrix, p.header);
  for (const [key, , label] of D.fields) {
    const wrap = document.createElement('div');
    wrap.className = 'field map-field';
    wrap.id = 'mf-' + key;
    const lab = document.createElement('label');
    lab.htmlFor = 'map-' + key;
    lab.innerHTML = `${H.esc(label)} <span class="kind-chip">${KIND_LABELS[D.fieldKind(key)]}</span>`;
    const info = document.createElement('p');
    info.className = 'map-info';
    wrap.append(lab, fieldSelect(key, p, p.cols), info);
    $('mapping-fields').append(wrap);
  }
  $('import-preview').innerHTML = previewTable(p);
  $('import-preview-all').innerHTML = H.table((p.matrix[p.header] || []).map((v) => String(v ?? '')), p.matrix.slice(p.header + 1, p.header + 4).map((r) => (r || []).map((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v ?? ''))));
  refreshDerived();
}

// Todo lo que depende de las columnas elegidas: avisos por campo, conteos, alcance, números y avisos de carga.
function refreshDerived() {
  const known = isKnownMode();
  const profiles = currentImportProfiles();
  if (!known) {
    const p = currentProfile();
    const used = {};
    Object.entries(p.map).forEach(([k, i]) => { (used[i] = used[i] || []).push(k); });
    for (const [key] of D.fields) {
      const info = document.querySelector(`#mf-${key} .map-info`);
      if (!info) continue;
      const i = p.map[key];
      const field = info.parentElement;
      if (i === undefined) {
        field.classList.remove('is-warn');
        info.textContent = ['code', 'coop'].includes(key) ? (key === 'coop' ? 'Sin columna: indica abajo la cooperativa para todas las filas.' : 'Necesario: sin código no se puede importar.') : '';
        continue;
      }
      const col = p.cols[i];
      const notes = [];
      const compat = D.columnCompat(key, col);
      if (!compat.ok) notes.push(`⚠️ ${compat.reason}`);
      if (used[i].length > 1) notes.push(`⚠️ Esta columna también está asignada a: ${used[i].filter((k) => k !== key).map(D.label).join(', ')}.`);
      const dict = importDictionary.get(D.norm(col?.header));
      const extra = [col?.samples.length ? `Ej.: ${col.samples.join(' · ')}` : 'Columna vacía', dict ? `Diccionario: ${cut(dict, 140)}` : ''].filter(Boolean).join(' — ');
      field.classList.toggle('is-warn', notes.length > 0);
      info.innerHTML = [...notes.map((n) => `<span class="map-warn">${H.esc(n)}</span>`), `<span>${H.esc(extra)}</span>`].join('');
    }
    const titled = (p.matrix[p.header] || []).filter((h) => h != null && String(h).trim()).length;
    const mapped = Object.keys(p.map).length;
    $('mapping-note').textContent = `La hoja tiene ${titled} columnas con título. El tablero usa ${D.fields.length} datos: ${mapped} tienen una columna asignada (${p.autoCount} reconocidos automáticamente al abrir el archivo). Las otras ${Math.max(0, titled - mapped)} columnas no se usan en el tablero, pero siguen en tu archivo.`;
    const warn = $('header-warn');
    const lowHeader = mapped <= 1 && p.header !== p.autoHeader;
    warn.hidden = !lowHeader;
    warn.textContent = lowHeader ? `En la fila ${p.header + 1} casi no reconocemos títulos. Puede que sea una fila de datos; la fila sugerida es la ${p.autoHeader + 1}.` : '';
    // B1: la cooperativa manual solo aparece si el Excel no tiene esa columna.
    const noCoop = p.map.coop === undefined;
    const sheetCoop = p.sheetCoop || '';
    if (!noCoop && !sheetCoop) p.fixedCoop = '';
    $('fixed-coop-wrap').hidden = !noCoop;
    $('fixed-coop').value = p.fixedCoop || '';
    $('fixed-coop-help').textContent = sheetCoop && p.fixedCoop === sheetCoop
      ? `Tomado del nombre de la hoja «${p.name}». Todas las filas quedarán con este nombre.`
      : 'Aparece porque el Excel no tiene columna de cooperativa. Todas las filas quedarán con este nombre.';
  } else {
    $('fixed-coop-wrap').hidden = true;
    $('header-warn').hidden = true;
  }
  renderScope(profiles);
  renderNumberPreview(profiles);
  renderMappingAlerts(profiles);
}

function renderScope(profiles) {
  const scope = D.scopePreview(profiles);
  const line = $('scope-line');
  if (!scope.length) {
    line.className = 'scope-line is-warn';
    line.textContent = 'No se incluirá ninguna fila: asigna la columna de código de productora.';
    return;
  }
  const named = scope.filter((s) => s.coop !== 'SIN COOPERATIVA');
  const missing = scope.find((s) => s.coop === 'SIN COOPERATIVA');
  const list = named.map((s) => `${groupLabel(s.coop)} (${H.fmt(s.rows, 0)} ${s.rows === 1 ? 'fila' : 'filas'})`);
  const text = list.length ? `Se incluirán: ${list.length > 1 ? list.slice(0, -1).join(', ') + ' y ' + list[list.length - 1] : list[0]}.` : '';
  line.className = 'scope-line' + (missing ? ' is-warn' : '');
  line.textContent = [text, missing ? `${H.fmt(missing.rows, 0)} filas no tienen cooperativa y se apartarán al importar.` : ''].filter(Boolean).join(' ');
}

function renderNumberPreview(profiles) {
  const mode = $('number-mode').value;
  const rows = [];
  for (const p of profiles) {
    for (const key of D.numeric) {
      const i = p.map[key];
      if (i === undefined) continue;
      const values = [];
      for (let r = p.header + 1; r < p.matrix.length && values.length < 3; r++) {
        const v = (p.matrix[r] || [])[i];
        if (v != null && String(v).trim() !== '' && !(v instanceof Date)) values.push(v);
      }
      values.forEach((v, n) => {
        const parsed = D.parseNumber(v, mode);
        const excel = typeof v === 'number' ? `${v} (número de Excel)` : `«${String(v).trim()}» (texto)`;
        const result = parsed.value === null ? `Sin dato: ${parsed.error || 'vacío'}` : H.fmt(parsed.value, Number.isInteger(parsed.value) ? 0 : 2);
        rows.push([n === 0 ? (profiles.length > 1 ? `${D.label(key)} · ${p.name}` : D.label(key)) : '', excel, result]);
      });
    }
  }
  $('number-preview').innerHTML = rows.length
    ? H.table(['Dato', 'En el Excel', 'Lo que usará el tablero'], rows)
    : '<p class="chart-note">No hay datos numéricos asignados todavía.</p>';
}

// C6: primero los datos que usa el tablero, con nombres claros.
function previewTable(p) {
  const keys = D.fields.map((f) => f[0]).filter((k) => p.map[k] !== undefined);
  if (!keys.length) return '<p class="chart-note">Todavía no hay columnas asignadas.</p>';
  const rows = p.matrix.slice(p.header + 1, p.header + 4).map((r) => keys.map((k) => {
    const v = (r || [])[p.map[k]];
    return v instanceof Date ? v.toISOString().slice(0, 10) : v ?? '';
  }));
  return H.table(keys.map(D.label), rows);
}

/* ---------- Guardar y usar un mapeo ---------- */
// Los listeners se registran al cargar este archivo, antes de que app.js defina $.
const byId = (id) => document.getElementById(id);


byId('save-mapping')?.addEventListener('click', () => {
  if (!pending) return;
  const saved = D.exportMapping(currentImportProfiles(), { formVersion: $('form-version').value.trim(), fileName: pending.fileName });
  download(`mapeo_productoras_${saved.creado}.json`, JSON.stringify(saved, null, 2), 'application/json');
  $('mapping-status').innerHTML = '<span class="mapping-ok">Mapeo descargado. En el próximo ciclo usa «Usar un mapeo guardado» con este archivo.</span>';
});

byId('use-mapping')?.addEventListener('click', () => $('mapping-input').click());

byId('mapping-input')?.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file || !pending) return;
  try {
    const saved = JSON.parse(await file.text());
    const missing = [];
    let applied = 0;
    let version = '';
    for (const p of currentImportProfiles()) {
      const result = D.applyMapping(p, saved);
      applied += result.applied;
      version = result.formVersion || version;
      missing.push(...result.missing.map((m) => ({ ...m, sheet: p.name })));
    }
    if (version && !$('form-version').value.trim()) $('form-version').value = version;
    renderImportPanel();
    const head = `<span class="mapping-ok">Mapeo${version ? ` «${H.esc(version)}»` : ''} aplicado: ${applied} datos asignados.</span>`;
    const lost = missing.length
      ? noticeHtml('warn', '⚠️', `No encontramos estas columnas del mapeo guardado: ${missing.map((m) => `«${H.esc(m.header)}» (${H.esc(m.label)})`).join(', ')}. Puede que la pregunta haya cambiado en el formulario: elige su nueva columna abajo y vuelve a guardar el mapeo.`)
      : '';
    $('mapping-status').innerHTML = head + lost;
  } catch (error) {
    $('mapping-status').innerHTML = noticeHtml('warn', '⚠️', `No se pudo usar el mapeo: ${H.esc(error.message)}`);
  } finally {
    event.target.value = '';
  }
});

byId('number-mode')?.addEventListener('change', () => { if (pending) renderNumberPreview(currentImportProfiles()); });
byId('fixed-coop')?.addEventListener('input', () => {
  if (!pending || isKnownMode()) return;
  currentProfile().fixedCoop = $('fixed-coop').value.trim();
  renderScope(currentImportProfiles());
});
