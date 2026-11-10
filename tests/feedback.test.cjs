// Ejecutar desde la raíz: node tests/feedback.test.cjs. Casos sintéticos, sin datos personales.
// Cubre los avisos de carga (columnas no reconocidas y datos personales) y la comparación de "Mi finca".
const assert = require('node:assert/strict');
const D = require('../js/data_core.js');
const sheet = (name, headers, rows) => D.sheetProfile(name, [headers, ...rows]);

// Columnas no reconocidas: una pregunta renombrada en el formulario.
const renamed = sheet('Productoras Norandino',
  ['1. CODIGO/PRODUCTORA', '3. FECHA DE NACIMIENTO DE LA BENEFICIARIA', '9. AREA DE CULTIVO DE CAFE', 'Volumen de café', 'periodo'],
  [['A1', 30000, 2, 40, 2025]]);
let r = D.importProfiles([renamed]);
const missingKeys = r.audit.unmapped[0].fields.map((f) => f.key);
assert.ok(missingKeys.includes('qq'), 'debe avisar que no se encontró acopio');
assert.ok(!missingKeys.includes('age'), 'la edad se deriva de la fecha de nacimiento');
assert.ok(!missingKeys.includes('area'));
assert.equal(r.audit.unmapped[0].sheet, 'Productoras Norandino');

const complete = sheet('Productoras', D.fields.filter((f) => f[0] !== 'birth').map((f) => f[1]), [['A', 'X']]);
assert.deepEqual(D.unmappedFields([complete]), []);

// Datos personales: se detectan, no se leen y no hay falsos positivos con preguntas del formulario.
const personal = sheet('Productoras',
  ['codigo_productora', 'cooperativa', 'Nombres y apellidos', 'DNI', 'Teléfono de contacto', 'Correo electrónico',
    'Nombre de la cooperativa', '¿Tiene teléfono inteligente?', 'tipo_celular_beneficiaria', 'distrito'],
  [['A', 'X', 'Persona Ejemplo', '00000000', '900000000', 'a@b.c', 'X', 'SI', 'SMARTPHONE', 'D']]);
r = D.importProfiles([personal]);
const kinds = r.audit.sensitive.map((s) => s.kind).sort();
assert.deepEqual(kinds, ['Correo', 'DNI / documento', 'Nombre', 'Teléfono']);
assert.ok(r.audit.sensitive.every((s) => s.header !== 'Nombre de la cooperativa' && s.header !== '¿Tiene teléfono inteligente?'));
const rec = r.records[0];
assert.ok(!Object.values(rec).includes('00000000') && !Object.values(rec).includes('Persona Ejemplo'), 'los datos personales no se cargan');
assert.deepEqual(D.sensitiveHeaders([complete]), []);

// Mediana de la cooperativa: solo con 5 o más productoras con dato, y solo de la misma cooperativa.
const rows = [1, 2, 3, 4, 5].map((v, i) => ({ code: 'N' + i, coop: 'NORANDINO', area: v }))
  .concat([{ code: 'N9', coop: 'NORANDINO', area: null }, { code: 'B0', coop: 'BAGUA GRANDE', area: 100 }]);
assert.deepEqual(D.peerMedian(rows, rows[0], 'area'), { median: 3, n: 5 });
assert.equal(D.peerMedian(rows, rows[6], 'area'), null, 'un grupo con menos de 5 no se compara');
assert.equal(D.peerMedian(rows.slice(1), rows[1], 'area'), null);

console.log('OK: columnas no reconocidas, datos personales sin leer y mediana de cooperativa con mínimo de 5.');
