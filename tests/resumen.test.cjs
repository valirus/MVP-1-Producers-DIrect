const assert = require('node:assert/strict');
const R = require('../js/resumen_core.js');

const rows = [
  { code: 'N-01', coop: 'NORANDINO', territory: 'DISTRITO A', province: 'PROVINCIA A', base: 'BASE 1', amount: 100, area: 2, qq: 4 },
  { code: 'N-02', coop: 'NORANDINO', territory: 'DISTRITO A', province: 'PROVINCIA A', base: 'BASE 1', amount: null, area: 1, qq: 0 },
  { code: 'B-01', coop: 'BAGUA GRANDE', territory: 'DISTRITO B', province: 'PROVINCIA B', base: 'BASE 2', amount: 250, area: null, qq: 6 }
];

const amounts = R.metricGroups(rows, 'amount');
assert.deepEqual(amounts.map(({ name, records, answered, total }) => ({ name, records, answered, total })), [
  { name: 'DISTRITO A - PROVINCIA A', records: 2, answered: 1, total: 100 },
  { name: 'DISTRITO B - PROVINCIA B', records: 1, answered: 1, total: 250 }
]);

const filtered = R.metricGroups(rows.filter((row) => row.coop === 'NORANDINO'), 'amount');
assert.equal(filtered.length, 1);
assert.equal(filtered[0].answered, 1);
assert.equal(filtered[0].records, 2);
assert.equal(filtered[0].total, 100);

assert.deepEqual(R.metricGroups(rows, 'income'), []);
const coffee = R.metricGroups(rows, 'qq');
assert.equal(coffee.find((group) => group.name.startsWith('DISTRITO A')).total, 4);

console.log('OK: métricas del panorama respetan el grupo, la cobertura y la selección filtrada.');
