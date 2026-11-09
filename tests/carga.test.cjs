// Ejecutar desde la raíz: node tests/carga.test.cjs. Casos sintéticos, sin datos personales.
// Carga guiada: perfil de columnas, compatibilidad, sugerencias, alcance y mapeo guardado.
const assert = require('node:assert/strict');
const D = require('../js/data_core.js');

const headers = ['codigo_productora', 'cooperativa', 'Área de café (ha)', 'Actividad principal', 'Monto pedido S/', 'Fecha nac.', '¿Usa Yape?'];
const rows = [
  ['A1', 'NORANDINO', 2.5, 'Café', 1375, new Date('1980-01-01'), 'SI'],
  ['A2', 'NORANDINO', '1,5', 'Café', 1375, new Date('1990-05-01'), 'NO'],
  ['A3', 'BAGUA GRANDE', 3, 'Cuyes', 1500, new Date('1975-03-01'), 'SI'],
  ['A4', 'BAGUA GRANDE', 1, 'Cuyes', 1200, new Date('1985-03-01'), 'NO'],
  ['A5', 'NORANDINO', 4, 'Café', 1375, new Date('1970-03-01'), 'SI'],
  ['', 'NORANDINO', 4, 'Café', 1375, null, null]
];
const matrix = [headers, ...rows];
const cols = D.columnProfiles(matrix, 0);

// Perfil de columnas
assert.equal(cols.length, headers.length);
assert.equal(cols[2].numeric, 6, 'texto "1,5" también cuenta como número');
assert.equal(cols[5].dates, 5);
assert.deepEqual(cols[3].samples, ['Café', 'Cuyes']);

// Compatibilidad: cada campo con su tipo esperado
assert.ok(D.columnCompat('area', cols[2]).ok);
assert.ok(!D.columnCompat('amount', cols[3]).ok, 'texto no sirve para un monto');
assert.match(D.columnCompat('amount', cols[3]).reason, /números/);
assert.ok(!D.columnCompat('code', cols[1]).ok, 'la cooperativa se repite: no sirve como código');
assert.ok(D.columnCompat('code', cols[0]).ok);
assert.ok(D.columnCompat('coop', cols[1]).ok);
assert.ok(!D.columnCompat('activity', cols[4]).ok, 'una actividad no debería ser solo números');
assert.ok(D.columnCompat('birth', cols[5]).ok);
assert.ok(D.columnCompat('yape', cols[6]).ok);
assert.ok(!D.columnCompat('yape', cols[3]).ok);
assert.ok(!D.columnCompat('area', { filled: 0 }).ok, 'columna vacía');

// Sugerencias: compatibles y con nombre parecido; la asignada siempre aparece primero
assert.deepEqual(D.suggestedColumns('area', cols), [2]);
assert.ok(D.suggestedColumns('amount', cols).includes(4));
assert.ok(!D.suggestedColumns('amount', cols).includes(3), 'no sugiere una columna de texto para un monto');
assert.equal(D.suggestedColumns('amount', cols, 3)[0], 3, 'la columna ya elegida se mantiene visible');

// Alcance antes de importar
const p = D.sheetProfile('Carga', matrix);
assert.deepEqual(D.scopePreview([p]), [{ coop: 'NORANDINO', rows: 3 }, { coop: 'BAGUA GRANDE', rows: 2 }]);
const solo = D.sheetProfile('Productoras Norandino', [['codigo_productora'], ['X1'], ['X2']]);
assert.deepEqual(D.scopePreview([solo]), [{ coop: 'NORANDINO', rows: 2 }], 'la cooperativa sale del nombre de la hoja');

// Mapeo guardado: se aplica por texto del encabezado aunque las columnas cambien de lugar
p.map.area = 2; p.map.amount = 4;
const saved = D.exportMapping([p], { formVersion: 'ROTA 2026-1', fileName: 'base.xlsx' });
assert.equal(saved.tipo, 'pd-mapeo-productoras');
assert.equal(saved.formulario, 'ROTA 2026-1');
assert.equal(saved.hojas[0].campos.area, 'Área de café (ha)');

const moved = D.sheetProfile('Carga', [['Monto pedido S/', 'cooperativa', 'codigo_productora', 'Área de café (ha)'], [1375, 'NORANDINO', 'B1', 2]]);
let r = D.applyMapping(moved, saved);
assert.equal(moved.map.area, 3);
assert.equal(moved.map.amount, 0);
assert.equal(moved.map.code, 2);
assert.equal(r.formVersion, 'ROTA 2026-1');

// Si una pregunta cambió de nombre, se informa cuál falta
const renamed = D.sheetProfile('Carga', [['codigo_productora', 'cooperativa', 'Hectáreas de café', 'Monto pedido S/'], ['C1', 'NORANDINO', 2, 1375]]);
r = D.applyMapping(renamed, saved);
assert.deepEqual(r.missing.map((m) => m.header), ['Área de café (ha)']);
assert.equal(renamed.map.area, undefined);

// Fila de títulos guardada: se usa si encaja mejor
const shifted = D.sheetProfile('Carga', [['Formulario ROTA'], [], ['codigo_productora', 'cooperativa', 'Área de café (ha)', 'Monto pedido S/'], ['D1', 'NORANDINO', 2, 1375]]);
const savedRow3 = { ...saved, hojas: [{ ...saved.hojas[0], filaTitulos: 3 }] };
D.applyMapping(shifted, savedRow3);
assert.equal(shifted.header, 2);
assert.equal(shifted.map.area, 2);

assert.throws(() => D.applyMapping(p, { tipo: 'otro' }), /no es un mapeo/);

console.log('OK: perfil de columnas, compatibilidad, sugerencias, alcance y mapeo guardado.');
