// Ejecutar desde la raíz: node tests/seguimiento.test.cjs. Casos sintéticos, sin datos personales.
const assert = require('node:assert/strict');
const S = require('../js/seguimiento_core.js');

const base = new Map([
  ['N-01', { code: 'N-01', coop: 'NORANDINO' }],
  ['N-02', { code: 'N-02', coop: 'NORANDINO' }],
  ['N-03', { code: 'N-03', coop: 'NORANDINO' }],
  ['B-01', { code: 'B-01', coop: 'BAGUA GRANDE' }],
  ['B-02', { code: 'B-02', coop: 'BAGUA GRANDE' }]
]);
const sheet = (matrix, name = 'Registros') => [{ name, matrix }];

// ---------- números y Sí/No ----------
assert.deepEqual(S.number('20'), { value: 20 });
assert.deepEqual(S.number('69.9'), { value: 69.9 });
assert.deepEqual(S.number('0.502'), { value: 0.502 });
assert.deepEqual(S.number(''), { value: null });
assert.equal(S.number('1,500').value, 1500);           // ambiguo: no se adivina
assert.ok(S.number('1,5').error);
assert.equal(S.number('abc').value, null);
assert.equal(S.number(-3).value, null);
assert.deepEqual(S.yesNo('Sí'), { value: 1 });
assert.deepEqual(S.yesNo(' no '), { value: 0 });
assert.deepEqual(S.yesNo(null), { value: null });
assert.ok(S.yesNo('Tal vez').error);
assert.equal(S.monthIn('Cantidad total vendida kg/unidades agosto'), 'AGOSTO');
assert.equal(S.monthIn('Cantidad total cosechada qq'), null);

// ---------- formulario de café: enero sin mes, encabezados repetidos ----------
const cafeHeaders = [
  'Código ',
  '¿Ya utilizó el fertilizante que le fue entregado en forma de crédito?',
  'En caso de no ¿por qué no aplico?',
  '¿Ha llevado su café a la cooperativa?',
  'En caso de no, ¿cuál es el motivo de no haber llevado el café a la cooperativa?',
  'En caso de no, ¿llevará pronto su café a la cooperativa?',
  '¿Usa su cuaderno de registros para anotar sus ingresos y gastos?',
  '¿Vendió café en Enero?', 'Cantidad total cosechada qq', 'Cantidad total vendida qq', 'Ganancia total de la venta (en soles)',
  '¿Vendió café en junio?', 'Cantidad total cosechada qq junio', 'Cantidad total vendida qq junio', 'Ganancia total de la venta (en soles) vendio productos junio',
  '¿Genero gastos en enero?', '¿Cuánto gastó en total en la finca? Monto total en soles', '¿Qué gastos familiares tuvo?', '¿Cuánto gastó en total en la familia?',
  '¿Genero gastos en junio?', '¿Cuánto gastó en total en la finca? Monto total en soles', '¿Qué gastos familiares tuvo?', '¿Cuánto gastó en total en la familia?',
  'Cambios en el clima según los meses seleccionados'
];
const cafe = S.readFile('cafe.xlsx', sheet([
  cafeHeaders,
  ['N-01', 'Sí', null, 'Sí', null, null, 'Sí', 'No', null, null, null, 'Sí', '7', '6510', '6510', 'Sí', '100', 'Luz', '50', 'Sí', '200', 'Agua', '60', 'Ninguna'],
  ['N-02', 'No', 'No tenía tiempo', 'No', 'El precio está muy bajo', 'Sí', 'Sí', 'No', null, null, null, 'Sí', '3', '0', '3150', 'No', null, null, null, 'Sí', '80', null, '40', 'Ninguna'],
  ['N-03', 'Sí', null, 'No', 'No tengo transporte', 'No', 'No', 'No', null, null, null, 'Sí', '10', '12', '12000', 'Sí', '90', 'Luz', '30', 'No', null, null, null, null],
  ['X-99', 'Sí', null, 'Sí', null, null, 'Sí', 'No', null, null, null, 'No', null, null, null, 'No', null, null, null, 'No', null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]
]), base);

assert.equal(cafe.error, null);
assert.equal(cafe.kind, 'cafe');
assert.deepEqual(cafe.months, ['ENERO', 'JUNIO']);
assert.equal(cafe.rows, 4);                      // la fila vacía no cuenta
assert.equal(cafe.matched, 3);
assert.deepEqual(cafe.unmatched, ['X-99']);      // no está en la base: no se incluye
assert.equal(cafe.records.length, 3);
assert.ok(cafe.ignored.includes('Clima, plagas y enfermedades'));
assert.ok(cafe.ignored.includes('Tipos de gasto de la finca, del emprendimiento y de la familia'));
assert.deepEqual(cafe.unknown, []);

const n1 = cafe.records.find((r) => r.code === 'N-01');
const n2 = cafe.records.find((r) => r.code === 'N-02');
// Los gastos repetidos se asignan al mes de su bloque, no al primero que aparece.
assert.equal(n1.months.ENERO.workExp, 100);
assert.equal(n1.months.ENERO.famExp, 50);
assert.equal(n1.months.JUNIO.workExp, 200);
assert.equal(n1.months.JUNIO.famExp, 60);
assert.equal(n1.coop, 'NORANDINO');

// Los números de origen se conservan, incluso si son grandes o requieren revisión de negocio.
assert.equal(n1.months.JUNIO.qtySold, 6510);
assert.equal(n1.months.JUNIO.sales, 6510);
assert.equal(n2.months.JUNIO.qtySold, 0);
assert.equal(n2.months.JUNIO.sales, 3150);
assert.equal(cafe.observations.length, 0);

// ---------- emprendimiento: orden de columnas alterado y "vendida agosto" al final ----------
const emp = S.readFile('emp.xlsx', sheet([
  ['Código', 'Seleccione la actividad que fue financiada con el crédito ',
    '¿Vendió productos de su emprendimiento en mayo?', 'Cantidad total cosechada kg/unidades mayo', 'Cantidad total vendida kg/unidades mayo', 'Cantidad perdida kg/unidades mayo', 'Ganancia total de la venta del producto (en soles) vendio productos mayo',
    '¿Vendió productos de su emprendimiento en agosto?', 'Ganancia total de la venta del producto (en soles) vendio productos agosto',
    '¿Generó gastos en agosto?', 'Gasto total del emprendimiento en soles agosto', '¿Cuánto gastó en total en la familia?',
    'Cantidad total vendida kg/unidades agosto'],
  ['B-01', 'Crianza de cuyes ', 'Sí', '10', '8', '1', '240', 'Sí', '300', 'Sí', '50', '20', '12'],
  ['B-02', 'Apiario', 'No', null, null, null, null, 'Sí', '150', 'No', null, null, '5']
]), base);
assert.equal(emp.error, null);
assert.equal(emp.kind, 'emprendimiento');
assert.deepEqual(emp.months, ['MAYO', 'AGOSTO']);
const b1 = emp.records.find((r) => r.code === 'B-01');
assert.equal(b1.statics.activity, 'Crianza de cuyes');
assert.equal(b1.months.MAYO.qtySold, 8);
assert.equal(b1.months.MAYO.lost, 1);
assert.equal(b1.months.AGOSTO.qtySold, 12);
assert.equal(b1.months.AGOSTO.workExp, 50);
assert.equal(b1.months.AGOSTO.famExp, 20);
assert.equal(emp.observations.length, 0);

// ---------- archivos no reconocidos ----------
assert.match(S.readFile('x.xlsx', sheet([['Nombre', 'Edad']]), base).error, /Código/);
assert.match(S.readFile('x.xlsx', sheet([['Código', 'Edad'], ['N-01', 40]]), base).error, /venta por mes/);
assert.match(S.readFile('x.xlsx', [{ name: 'Hoja1', matrix: [] }, { name: 'Hoja2', matrix: [] }], base).error, /Registros/);
const repeated = S.readFile('x.xlsx', sheet([['Código', '¿Vendió café en junio?', 'Cantidad total vendida qq junio', 'Cantidad total vendida qq junio'], ['N-01', 'Sí', '1', '2']]), base);
assert.match(repeated.error, /dos columnas para el mismo dato/);

// Código repetido en el mismo archivo: ninguna de las filas se incluye.
const dup = S.readFile('d.xlsx', sheet([['Código', '¿Vendió café en junio?'], ['N-01', 'Sí'], ['N-01', 'No'], ['N-02', 'Sí']]), base);
assert.deepEqual(dup.records.map((r) => r.code), ['N-02']);
assert.ok(dup.observations.some((o) => /repetido/.test(o.finding)));

// Respuesta Sí/No no reconocida: sin dato y observación.
const odd = S.readFile('o.xlsx', sheet([['Código', '¿Vendió café en junio?'], ['N-01', 'Quizás']]), base);
assert.equal(odd.records[0].months.JUNIO.sold, null);
assert.equal(odd.observations.length, 1);

// ---------- unión de archivos y resúmenes ----------
const later = S.readFile('cafe2.xlsx', sheet([
  ['Código', '¿Vendió café en Julio?', 'Cantidad total vendida qq julio', 'Ganancia total de la venta (en soles) julio'],
  ['N-01', 'Sí', '2', '2000'],
  ['N-02', 'No', null, null]
]), base);
const { records, observations } = S.combine([cafe, later, emp]);
assert.equal(records.length, 5);
assert.equal(observations.length, 0);
const joined = records.find((r) => r.code === 'N-01');
assert.deepEqual(Object.keys(joined.months), ['ENERO', 'JUNIO', 'JULIO']);
assert.equal(joined.sources.length, 2);

// El mismo mes en dos archivos no se elige: se deja sin usar y se marca.
const clash = S.combine([later, S.readFile('cafe3.xlsx', sheet([['Código', '¿Vendió café en Julio?'], ['N-01', 'No']]), base)]);
assert.equal(clash.records.find((r) => r.code === 'N-01').months.JULIO.conflict, true);
assert.ok(clash.observations.some((o) => /dos archivos/.test(o.finding)));

const nor = records.filter((r) => r.coop === 'NORANDINO');
assert.deepEqual(S.yesNoSummary(nor, 'fertUsed'), { answered: 3, yes: 2, no: 1 });
assert.deepEqual(S.yesNoSummary(nor, 'coopDelivered'), { answered: 3, yes: 1, no: 2 });
const reasons = S.tally(nor, 'coopWhyNot', (r) => r.statics.coopDelivered === 0);
assert.equal(reasons.answered, 2);
assert.deepEqual(reasons.items.map((i) => i.label), ['El precio está muy bajo', 'No tengo transporte']);

const june = S.monthSummary(nor, 'JUNIO');
assert.equal(june.saleAnswered, 3);
assert.equal(june.soldYes, 3);
assert.equal(june.sales, 6510 + 3150 + 12000);   // los soles apartados no se pierden
assert.equal(june.qtySold, 6510 + 0 + 12);              // sin los 6510 qq apartados
assert.equal(june.qtyExcluded, 0);
assert.equal(june.expAnswered, 3);           // N-03 respondió «No» a gastos: cuenta como respuesta
assert.equal(june.workExp, 280);
assert.equal(june.famExp, 100);

const july = S.monthSummary(nor, 'JULIO');
assert.equal(july.inFile, 2);                   // cobertura parcial: solo 2 de 3 tienen julio
assert.equal(july.saleAnswered, 2);
assert.equal(july.soldYes, 1);

// Sin ventas declaradas el total es null (no se inventa un cero); la página muestra S/ 0 solo si respondieron «No».
const january = S.monthSummary(nor, 'ENERO');
assert.equal(january.sales, null);
assert.equal(january.soldYes, 0);
assert.deepEqual(S.monthsPresent(records), ['ENERO', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO']);

console.log('OK: seguimiento — mapeo por encabezado, meses, apartados, observaciones, unión y resúmenes.');
