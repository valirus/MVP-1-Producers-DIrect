// Configuración por cooperativa y utilidades de análisis cruzado.
// Cada cooperativa tiene su propio formulario: lo que cambia entre ellas se declara aquí,
// no en el código de los gráficos.

const MIN_N = 5; // mínimo de productoras por celda para mostrar un porcentaje

// Gráficos disponibles en la página "Análisis cruzado" (ids definidos en cross.js)
const COOP_CONFIG = {
  GLOBAL: {
    label: 'Producers Direct (global)',
    groupBy: 'coop',
    focus: 'Comparación entre cooperativas',
    cross: ['radar', 'edu', 'services', 'heat', 'gaps', 'bubble', 'corr', 'age']
  },
  'NORANDINO': {
    label: 'Norandino',
    groupBy: 'territory',
    focus: 'Acopio, capacitación y acceso digital por distrito',
    cross: ['radar', 'services', 'channels', 'heat', 'gaps', 'bubble', 'edu', 'age']
  },
  'BAGUA GRANDE': {
    label: 'Bagua Grande',
    groupBy: 'territory',
    focus: 'Entender el territorio: acceso, producción y riesgo por distrito',
    cross: ['heat', 'radar', 'infocorp', 'gaps', 'bubble', 'services', 'corr', 'age']
  },
  DEFAULT: {
    label: 'Cooperativa',
    groupBy: 'territory',
    focus: 'Perfil de las socias por territorio',
    cross: ['radar', 'heat', 'gaps', 'bubble', 'edu', 'age']
  }
};

function coopConfig(view) {
  return COOP_CONFIG[view] || { ...COOP_CONFIG.DEFAULT, label: view };
}

// Indicadores binarios (1 / 0 / null). "good" indica si 1 es el sentido positivo.
const INDICATORS = [
  { id: 'smart', label: 'Smartphone propio', good: true, f: r => r.phone ? +(r.phone === 'SMARTPHONE') : null },
  { id: 'net', label: 'Internet en casa', good: true, f: r => r.internet ? +(r.internet === 'EN_CASA') : null },
  { id: 'lit', label: 'Sin dificultad de lectoescritura', good: true, f: r => r.literacy ? +(r.literacy === 'NINGUNA') : null },
  { id: 'train', label: 'Capacitación de la cooperativa', good: true, f: r => r.trainedCoop ?? null },
  { id: 'save', label: 'Ahorro en la cooperativa', good: true, f: r => r.savingsCoop ?? null },
  { id: 'wa', label: 'Prefiere WhatsApp', good: true, f: r => r.channels ? +r.channels.includes('WHATSAPP') : null },
  { id: 'call', label: 'Prefiere llamadas', good: true, f: r => r.channels ? +r.channels.includes('LLAMADAS') : null },
  { id: 'yape', label: 'Usa Yape', good: true, f: r => r.yape ?? null },
  { id: 'sewer', label: 'Tiene desagüe', good: true, f: r => r.water ? +['AMBOS', 'SOLO_DESAGUE'].includes(r.water) : null },
  { id: 'coopcred', label: 'Crédito vigente en la cooperativa', good: true, f: r => r.coopCredit ?? null }
];

// Brechas = lo contrario de un indicador positivo (para el ranking de brechas)
const GAPS = [
  { label: 'Sin internet en casa', f: r => r.internet ? +(r.internet !== 'EN_CASA') : null },
  { label: 'Sin smartphone propio', f: r => r.phone ? +(r.phone !== 'SMARTPHONE') : null },
  { label: 'Dificultad de lectoescritura', f: r => r.literacy ? +(r.literacy !== 'NINGUNA') : null },
  { label: 'Sin capacitación de la cooperativa', f: r => r.trainedCoop != null ? 1 - r.trainedCoop : null },
  { label: 'Sin ahorro en la cooperativa', f: r => r.savingsCoop != null ? 1 - r.savingsCoop : null },
  { label: 'Sin desagüe', f: r => r.water ? +!['AMBOS', 'SOLO_DESAGUE'].includes(r.water) : null },
  { label: 'Sin Yape', f: r => r.yape != null ? 1 - r.yape : null }
];

// ---------- utilidades ----------

function prettyLabel(s) {
  const t = String(s).toLowerCase().replace(/_/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Nombres de grupos (cooperativas, distritos): cada palabra con mayúscula inicial
function groupLabel(s) {
  return String(s).toLowerCase().replace(/_/g, ' ').replace(/(^|\s)(\S)/g, (m, a, c) => a + c.toUpperCase());
}

// Porcentaje de 1 entre valores no nulos. Devuelve {pct, n} o null si n < MIN_N.
function share(rows, f) {
  const vals = rows.map(f).filter(v => v !== null && v !== undefined);
  if (vals.length < MIN_N) return { pct: null, n: vals.length };
  return { pct: 100 * vals.reduce((a, b) => a + b, 0) / vals.length, n: vals.length };
}

// Opción múltiple: % de productoras que marcaron cada opción (no suma 100)
function multiShare(rows, key) {
  const answered = rows.filter(r => Array.isArray(r[key]));
  const m = {};
  answered.forEach(r => new Set(r[key]).forEach(o => { m[o] = (m[o] || 0) + 1; }));
  return {
    n: answered.length,
    items: Object.entries(m).map(([o, c]) => ({ option: o, count: c, pct: 100 * c / answered.length }))
      .sort((a, b) => b.pct - a.pct)
  };
}

function groupRows(rows, key) {
  const m = new Map();
  rows.forEach(r => {
    const g = r[key];
    if (!g) return;
    if (!m.has(g)) m.set(g, []);
    m.get(g).push(r);
  });
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
}

function ranks(arr) {
  const idx = arr.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const out = new Array(arr.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const rk = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) out[idx[k][1]] = rk;
    i = j + 1;
  }
  return out;
}

function pearson(a, b) {
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n, mb = b.reduce((s, x) => s + x, 0) / n;
  let sab = 0, saa = 0, sbb = 0;
  for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; }
  return saa && sbb ? sab / Math.sqrt(saa * sbb) : 0;
}

function spearman(a, b) {
  return pearson(ranks(a), ranks(b));
}

function median(arr) {
  const s = arr.filter(x => Number.isFinite(x)).sort((x, y) => x - y);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
