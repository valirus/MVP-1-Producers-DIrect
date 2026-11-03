// Ejecutar desde la raíz: node tests/filters.test.cjs. Casos sintéticos, sin datos personales.
const assert = require('node:assert/strict');
const F = require('../js/filters.js');

const rows = [
  { code: 'N-01', coop: 'NORANDINO', territory: 'Tabaconas', base: 'Tabaconas Centro' },
  { code: 'N-02', coop: 'NORANDINO', territory: 'Tabaconas', base: 'La Laguna' },
  { code: 'N-03', coop: 'NORANDINO', territory: 'San Ignacio', base: 'San Ignacio' },
  { code: 'B-01', coop: 'BAGUA GRANDE', territory: 'Bagua Grande', base: 'Centro' },
  { code: 'B-02', coop: 'BAGUA GRANDE', territory: 'La Peca', base: null }
];

// Al elegir Bagua Grande, Tabaconas deja de ser una opción.
let state = F.cascade(rows, { coop: 'BAGUA GRANDE' });
assert.deepEqual(state.options.territory, ['Bagua Grande', 'La Peca']);
assert.ok(!state.options.territory.includes('Tabaconas'));

// La base se reduce al distrito elegido.
state = F.cascade(rows, { coop: 'BAGUA GRANDE', territory: 'La Peca' });
assert.deepEqual(state.options.base, [F.NULL]);

// La productora también se reduce y conserva el índice real de la fila.
state = F.cascade(rows, { coop: 'BAGUA GRANDE', territory: 'Bagua Grande' });
assert.deepEqual(state.options.producer.map((p) => p.code), ['B-01']);
assert.equal(state.options.producer[0].value, '3');

// Un valor que ya no existe se limpia en vez de dejar una selección imposible.
state = F.cascade(rows, { coop: 'BAGUA GRANDE', territory: 'Tabaconas' });
assert.equal(state.filters.coop, F.ALL);
assert.equal(state.filters.territory, 'Tabaconas');

// Los valores ausentes se pueden filtrar de forma explícita.
state = F.cascade(rows, { base: F.NULL });
assert.equal(state.filters.base, F.NULL);
assert.deepEqual(F.filterRows(rows, { base: F.NULL }).map((r) => r.code), ['B-02']);

// La productora seleccionada no altera los totales del tablero.
const selected = F.filterRows(rows, { coop: 'NORANDINO', producer: '0' });
assert.equal(selected.length, 3);

console.log('OK: filtros encadenados, opciones dependientes, valores ausentes y limpieza de selecciones.');
