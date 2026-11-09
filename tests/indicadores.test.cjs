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

const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/../js/coops.js', 'utf8') + ';this.api={GAPS,share};', ctx);
const none = ctx.api.GAPS.find((x) => x.label === 'No usa ningún servicio financiero');
assert.ok(none, 'la brecha existe');
const svc = [['NINGUNO'], ['YAPE'], ['NINGUNO'], ['PLIN', 'YAPE'], ['NINGUNO'], null].map((s) => ({ services: s }));
const s = ctx.api.share(svc, none.f);
assert.equal(s.n, 5);
assert.equal(s.pct, 60);

console.log('OK: montos más frecuentes por cooperativa y brecha de servicios financieros.');
