/*
 * Ficha de visita (evaluación FA1, IE1, CP1 y pedido de Producers Direct):
 *  - Etapa del crédito: en «Solicitud» se confirman destino y monto y se piden los datos que faltan
 *    a ESA productora; en «Desembolsado» se verifican los 3 pasos de uso del crédito de siempre.
 *  - Cada paso guarda fecha y evidencia; la visita indica quién visitó y cuándo.
 *  - «Guardar visita» la suma a la lista de la sesión y «Descargar visitas (CSV)» la entrega
 *    para la base central de Producers Direct. Nada se guarda al cerrar la pestaña.
 * Se carga antes de app.js; las funciones usan $, D, H, rawData y audit de app.js cuando se llaman.
 */
'use strict';

const byIdV = (id) => document.getElementById(id);
const STAGES = { solicitud: 'Solicitud', desembolsado: 'Desembolsado' };
// Los 3 pasos que Producers Direct ya usa para verificar el uso del crédito (mismo texto).
const USE_STEPS = [
  'Comprobantes de la compra de insumos',
  'Visita personalizada: el insumo está en la finca o el emprendimiento',
  'Crecimiento del emprendimiento o mejora de la producción'
];
let visitRow = null;
let sessionVisits = [];
let pendingDownload = false;
// Fecha y hora locales (toISOString usa UTC y puede adelantar el día).
const localStamp = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();

function stepsFor(row, stage) {
  if (stage === 'desembolsado') return USE_STEPS;
  const activity = row.activity ? prettyLabel(row.activity).toLowerCase() : 'sin dato';
  const amount = D.finite(row.amount) ? `S/ ${H.fmt(row.amount, 0)}` : 'sin dato';
  const missing = D.missingVisitFields(row);
  return [
    `Confirmar el destino solicitado (en la base: ${activity})`,
    `Confirmar el monto solicitado (en la base: ${amount})`,
    missing.length
      ? `Completar los datos que faltan: ${missing.map((m) => m.label).join(', ')}`
      : 'Revisar que los datos sigan vigentes (no falta ningún dato clave)'
  ];
}

function renderVisit(row) {
  visitRow = row;
  byIdV('visit-record').hidden = false;
  if (!byIdV('visit-date').value) byIdV('visit-date').value = localStamp().slice(0, 10);
  renderSteps();
  updateVisitStatus();
}

function renderSteps() {
  if (!visitRow) return;
  const steps = stepsFor(visitRow, byIdV('visit-stage').value);
  byIdV('visit-steps').innerHTML = steps.map((text, i) => `<tr>
    <td class="step-text">${H.esc(text)}</td>
    <td class="step-done"><input type="checkbox" id="step-done-${i}" aria-label="Hecho: ${H.esc(text)}"></td>
    <td class="step-date"><input type="date" id="step-date-${i}" aria-label="Fecha del paso"></td>
    <td class="step-evidence"><input type="text" id="step-ev-${i}" placeholder="Ej.: boleta N.º 123" aria-label="Evidencia u observación"></td>
  </tr>`).join('');
}

// Al cambiar de productora se limpian los pasos; quién visita y la fecha se mantienen.
function resetVisit() {
  if (byIdV('visit-steps')) renderSteps();
}

function clearVisit() {
  visitRow = null;
  if (byIdV('visit-record')) byIdV('visit-record').hidden = true;
  if (byIdV('visit-steps')) byIdV('visit-steps').innerHTML = '';
}

function updateVisitStatus(message) {
  const n = new Set(sessionVisits.map((v) => v.key)).size;
  byIdV('visit-download').disabled = !sessionVisits.length;
  const base = n ? `${n} ${n === 1 ? 'visita registrada' : 'visitas registradas'} en esta sesión${pendingDownload ? ' (sin descargar)' : ' (descargadas)'}.` : 'Aún no hay visitas guardadas en esta sesión.';
  byIdV('visit-status').textContent = message ? `${message} ${base}` : base;
}

byIdV('visit-stage')?.addEventListener('change', renderSteps);

byIdV('visit-save')?.addEventListener('click', () => {
  if (!visitRow) return;
  const who = byIdV('visit-who').value.trim();
  const date = byIdV('visit-date').value;
  if (!who || !date) {
    updateVisitStatus('Completa «Quién visita» y «Fecha de la visita» antes de guardar.');
    (who ? byIdV('visit-date') : byIdV('visit-who')).focus();
    return;
  }
  const stageKey = byIdV('visit-stage').value;
  const steps = stepsFor(visitRow, stageKey).map((text, i) => ({
    text,
    done: byIdV(`step-done-${i}`).checked,
    date: byIdV(`step-date-${i}`).value,
    evidence: byIdV(`step-ev-${i}`).value.trim()
  }));
  const key = [visitRow.coop, visitRow.code, stageKey, date].join('|');
  // Guardar de nuevo la misma visita (productora, etapa y fecha) la reemplaza.
  sessionVisits = sessionVisits.filter((v) => v.key !== key);
  sessionVisits.push({ key, code: visitRow.code, coop: groupLabel(visitRow.coop), stage: STAGES[stageKey], who, date, steps, formVersion: audit?.formVersion || '', savedAt: localStamp().slice(0, 16).replace('T', ' ') });
  pendingDownload = true;
  updateVisitStatus(`Visita de ${visitRow.code} guardada.`);
});

byIdV('visit-download')?.addEventListener('click', () => {
  if (!sessionVisits.length) return;
  download(`visitas_pd_${localStamp().slice(0, 10)}.csv`, D.visitsCsv(sessionVisits), 'text/csv;charset=utf-8');
  pendingDownload = false;
  updateVisitStatus('Archivo descargado: súbelo a la base de Producers Direct.');
});

// Aviso al cerrar la pestaña si hay visitas guardadas que no se descargaron.
window.addEventListener('beforeunload', (event) => {
  if (!pendingDownload) return;
  event.preventDefault();
  event.returnValue = '';
});

// Al imprimir, los campos vacíos quedan como líneas en blanco para escribir a mano (sin «dd/mm/aaaa» ni ejemplos).
window.addEventListener('beforeprint', () => {
  document.querySelectorAll('#visit-record input[type="date"], #visit-record input[type="text"], #visit-who').forEach((input) => input.classList.toggle('print-empty', !input.value));
});
