// Ejecutar desde la raíz: node tests/ficha.test.cjs. Casos sintéticos, sin datos personales.
// Ficha de visita: datos que faltan por productora y CSV de visitas para la base de Producers Direct.
const assert = require('node:assert/strict');
const D = require('../js/data_core.js');

const full = { activity: 'FERTILIZACIÓN', amount: 1375, area: 2, qq: 40, income: 8000, phone: 'SMARTPHONE', literacy: 'NINGUNA', age: 40, family: 4, years: 10, territory: 'Tabaconas' };
assert.deepEqual(D.missingVisitFields(full), []);
const partial = { ...full, qq: null, phone: null, area: 0 };
assert.deepEqual(D.missingVisitFields(partial).map((m) => m.key), ['qq', 'phone'], 'un cero es un dato, no un faltante');
assert.equal(D.missingVisitFields(partial)[0].label, 'Café entregado 2025 (quintales, qq)');

const csv = D.visitsCsv([{
  code: 'PD-001', coop: 'NORANDINO', stage: 'Solicitud', who: 'Técnico A', date: '2026-11-10', formVersion: 'ROTA 2026-1', savedAt: '2026-11-10T10:00',
  steps: [{ text: 'Confirmar el monto', done: true, date: '2026-11-10', evidence: 'Dijo "sí"' }, { text: 'Completar datos', done: false, date: '', evidence: '=HACK()' }]
}]);
const lines = csv.replace('\ufeff', '').split('\r\n');
assert.equal(lines.length, 3, 'encabezado + una fila por paso');
assert.ok(lines[0].startsWith('"codigo_productora","cooperativa","etapa"'));
assert.ok(lines[1].includes('"SI"') && lines[1].includes('"Dijo ""sí"""'), 'comillas escapadas');
assert.ok(lines[2].includes('"NO"') && lines[2].includes(`"'=HACK()"`), 'una fórmula no se ejecuta al abrir en Excel');
assert.ok(csv.startsWith('\ufeff'), 'BOM para que Excel lea tildes');

console.log('OK: datos que faltan por productora y CSV de visitas.');
