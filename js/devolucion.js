/* Fichas imprimibles para la visita y la productora. */
'use strict';

let reportView = 'visit';
const reportNumber = value => H.fmt(value,Number.isInteger(value)?0:2);

function farmerCard(icon, text, peer) {
  return `<div class="farmer-card"><p class="farmer-main">${text}</p>${peer ? `<p class="farmer-peer">${peer}</p>` : ''}</div>`;
}

// Compara con la productora típica (mediana) de su cooperativa, solo si hay MIN_N o más con dato.
function peerText(row, key, format) {
  const peer = D.peerMedian(rawData, row, key, Math.max(2,MIN_N));
  return peer ? `Mediana de la cooperativa: <strong>${format(peer.median)}</strong> (${H.fmt(peer.n, 0)} productoras).` : '';
}

function farmerSheet(row) {
  const cards = [];
  if (D.finite(row.area)) cards.push(farmerCard('🌱', `Área de café: <strong>${H.fmt(row.area, 2)} ha</strong>`, peerText(row, 'area', v=>H.fmt(v, 2)+' ha')));
  if (D.finite(row.qq)) cards.push(farmerCard('☕', `Café entregado: <strong>${reportNumber(row.qq)} quintales</strong>`, peerText(row, 'qq', v=>reportNumber(v)+' quintales')));
  if (D.finite(row.income)) cards.push(farmerCard('💰', `Ingreso principal: <strong>S/ ${reportNumber(row.income)}</strong>`, peerText(row, 'income', v=>'S/ '+reportNumber(v))));
  const activity=row.activity?H.esc(prettyLabel(row.activity)):'';
  const amount=D.finite(row.amount)?'S/ '+reportNumber(row.amount):'';
  const follow=segFactsFor(row);
  const sales=follow?.salesTotal!=null
    ? `<section class="farmer-section"><h3>Ventas registradas en seguimiento</h3><p class="farmer-line">S/ ${H.fmt(follow.salesTotal,2)} · ${follow.salesMonths} meses con ventas</p></section>`
    : '';
  return `<div class="farmer-sheet">
    <div class="farmer-head"><div><p class="farmer-kicker">Reporte para la cooperativa</p><h2>Cooperativa ${H.esc(groupLabel(row.coop))}</h2><p class="farmer-code">Código ${H.esc(row.code)}</p></div></div>
    ${cards.length?`<div class="farmer-cards">${cards.join('')}</div>`:''}
    ${sales}
    ${amount||activity?`<section class="farmer-section"><h3>Solicitud de crédito</h3><p class="farmer-line">${[amount,activity].filter(Boolean).join(' · ')}</p></section>`:''}
  </div>`;
}

function applyReportView(row) {
  const farmer = reportView === 'farmer' && !!row;
  document.querySelectorAll('.report-toggle [data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === reportView)));
  $('report-printable').hidden = farmer || !row;
  document.querySelector('.report-toggle').hidden = !row;
  $('btn-print-action').parentElement.hidden = !row;
  $('visit-record').hidden = farmer || !row;
  $('visit-actions').hidden = !sessionVisits.length;
  $('btn-print-action').textContent=farmer?'Imprimir reporte':'Imprimir ficha';
  $('farmer-sheet').hidden = !farmer;
  $('farmer-sheet').innerHTML = farmer ? farmerSheet(row) : '';
}

function updateProducerExtras(row) { applyReportView(row); }
function clearProducerExtras() { applyReportView(null); }

document.querySelector('.report-toggle')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-view]');
  if (!button) return;
  reportView = button.dataset.view;
  const row = selectedProducer();
  applyReportView(row && filteredData.includes(row) ? row : null);
});
