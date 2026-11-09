// Ejecutar desde la raíz: node tests/graficos.test.cjs. Casos sintéticos, sin datos personales.
// Gráficos accesibles: color fijo por cooperativa, niveles educativos agrupados y temas de indicadores.
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/../js/coops.js', 'utf8') + ';this.api={VIZ,coopColor,seriesColor,educationGroup,EDU_GROUPS,INDICATORS,INDICATOR_THEMES,THEME_ORDER};', ctx);
const A = ctx.api;

// El color sigue a la cooperativa, no a su posición en la lista filtrada.
assert.equal(A.coopColor('BAGUA GRANDE'), A.VIZ.cat[1]);
assert.equal(A.coopColor('NORANDINO'), A.VIZ.cat[0]);
assert.equal(A.coopColor('COOP NUEVA'), A.VIZ.cat[2]);
assert.equal(A.coopColor('OTRA MAS'), A.VIZ.gray, 'desde la cuarta cooperativa, gris');
assert.equal(A.coopColor('COOP NUEVA'), A.VIZ.cat[2], 'estable entre llamadas');
assert.equal(A.seriesColor('territory', 'X', 1), A.VIZ.cat[1]);
assert.equal(A.seriesColor('territory', 'X', 7), A.VIZ.gray);

// Paleta secuencial: de claro a oscuro (luminancia estrictamente decreciente).
const lum = (h) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
A.VIZ.seq.reduce((prev, h) => { assert.ok(lum(h) < prev, 'secuencial ordenada'); return lum(h); }, 2);

// Nivel educativo en 5 grupos.
assert.equal(A.educationGroup('SIN_ESTUDIOS'), 'Sin estudios');
assert.equal(A.educationGroup('PRIMARIA_COMPLETA'), 'Primaria completa');
assert.equal(A.educationGroup('SECUNDARIA_INCOMPLETA'), A.educationGroup('SECUNDARIA_COMPLETA'));
assert.equal(A.educationGroup('TECNICO_COMPLETO'), 'Técnico o superior');
assert.equal(A.educationGroup('POSGRADO'), 'Otro');
assert.equal(A.educationGroup(null), null);
assert.equal(A.EDU_GROUPS.length, A.VIZ.seq.length, 'un tono por grupo');

// Todo indicador tiene un tema conocido.
A.INDICATORS.forEach((i) => assert.ok(A.THEME_ORDER.includes(A.INDICATOR_THEMES[i.id]), i.id));

console.log('OK: color por cooperativa, paleta secuencial, niveles educativos y temas de indicadores.');
