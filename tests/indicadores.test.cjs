// Ejecutar desde la raíz: node tests/indicadores.test.cjs. Casos sintéticos, sin datos personales.
// Comprensión de indicadores: montos más frecuentes (CO9) y brecha «ningún servicio financiero» (CO10).
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const D = require('../js/data_core.js');

const rows = [
  ...Array.from({ length: 6 }, (_, i) => ({ coop: 'NORANDINO', amount: 1375 })),
  { coop: 'NORANDINO', amount: 1500 },
  { coop: 'BAGUA GRANDE', amount: 1500 }, { coop: 'BAGUA GRANDE', amount: 1500 }, { coop: 'BAGUA GRANDE', amount: 1200 },
  { coop: 'BAGUA GRANDE', amount: 2000 }, { coop: 'BAGUA GRANDE', amount: null },
  { coop: 'CHICA', amount: 900 }
];
const g = D.commonAmounts(rows, { minN: 4, top: 2 });
assert.equal(g.length, 2, 'una cooperativa con menos montos que el mínimo no se muestra');
assert.equal(g[0].coop, 'NORANDINO');
assert.deepEqual(g[0].top[0], { amount: 1375, count: 6, pct: 600 / 7 });
assert.equal(g[1].n, 4, 'los montos vacíos no cuentan');
assert.deepEqual(g[1].top.map((t) => t.amount), [1500, 1200], 'empates: primero el monto menor');

const exact = D.amountScale([0, 99.9, 99.9, 250, null]);
assert.deepEqual(exact.bins, [[0, 0], [99.9, 99.9], [250, 250]]);
assert.equal(exact.indexOf(99.9), 1);
const input = Array.from({length: 21}, (_, i) => 300 + i * 25);
const ranges = D.amountScale(input);
assert.equal(ranges.exact, false);
assert.ok(ranges.bins.length <= 10);
for (const amount of input) {
  const [lo, hi] = ranges.bins[ranges.indexOf(amount)];
  assert.ok(lo <= amount && amount < hi, `intervalo inválido para ${amount}`);
}
assert.equal(ranges.indexOf(ranges.bins[0][1]), 1, 'los límites no se cuentan dos veces');

const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/../js/coops.js', 'utf8') + ';this.api={GAPS,share};', ctx);
const none = ctx.api.GAPS.find((x) => x.label === 'No usa ningún servicio financiero');
assert.ok(none, 'la brecha existe');
const svc = [['NINGUNO'], ['YAPE'], ['NINGUNO'], ['PLIN', 'YAPE'], ['NINGUNO'], null].map((s) => ({ services: s }));
const s = ctx.api.share(svc, none.f);
assert.equal(s.n, 5);
assert.equal(s.pct, 60);

console.log('OK: montos más frecuentes por cooperativa y brecha de servicios financieros.');

// D1: valores extremos con la misma regla para todos los campos; no se quitan.
const ages = [30, 32, 35, 36, 38, 40, 41, 42, 44, 45, 89].map((age, i) => ({ code: 'E' + i, coop: 'X', age, family: 4 }));
const ext = D.flagOutliers(ages);
assert.deepEqual(ext.map((e) => [e.code, e.field, e.value]), [['E10', 'age', 89]]);
assert.deepEqual(D.flagOutliers(ages.slice(0, 4)), [], 'con menos de cinco datos no se marca nada');
const r2 = D.importProfiles([D.sheetProfile('C', [['codigo_productora', 'cooperativa', 'edad_al_cierre_2025'], ...ages.map((a) => [a.code, 'X', a.age])])]);
assert.equal(r2.records.length, 11, 'el valor extremo sigue en la base');
assert.equal(r2.audit.outliers, undefined, 'la carga web no calcula atípicos');
console.log('OK: valores extremos marcados sin quitarlos.');
