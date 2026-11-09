// Ejecutar desde la raíz: node tests/filtros.test.cjs. Casos sintéticos, sin datos personales.
// Nombres de lugares uniformes (B5): espacios y guiones, y variantes de mayúsculas juntas.
const assert = require('node:assert/strict');
const D = require('../js/data_core.js');

assert.equal(D.cleanPlace('Bosques Del Santuario -guayabal'), 'Bosques Del Santuario - guayabal');
assert.equal(D.cleanPlace('  Los  Laureles-Naranjos '), 'Los Laureles - Naranjos');

const p = D.sheetProfile('Carga', [
  ['codigo_productora', 'cooperativa', 'base_sector', 'distrito'],
  ['A1', 'X', 'Los Laureles - Naranjos', 'Tabaconas - San Ignacio'],
  ['A2', 'X', 'LOS LAURELES -NARANJOS', 'Tabaconas-San Ignacio'],
  ['A3', 'X', 'Los Laureles - Naranjos', 'TABACONAS - SAN IGNACIO'],
  ['A4', 'X', 'La Florida', null]
]);
const { records } = D.importProfiles([p]);
assert.deepEqual([...new Set(records.map((r) => r.base))], ['Los Laureles - Naranjos', 'La Florida'], 'se junta bajo la variante más frecuente');
assert.equal(new Set(records.map((r) => r.territory).filter(Boolean)).size, 1);
assert.equal(records[1].baseRaw, 'LOS LAURELES -NARANJOS', 'el original se conserva');
assert.equal(records[3].territory, null, 'un vacío sigue siendo vacío');

console.log('OK: nombres de lugares uniformes sin perder el original.');
