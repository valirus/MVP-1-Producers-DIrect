// Configuración por cooperativa y utilidades de análisis cruzado.
// Cada cooperativa tiene su propio formulario: lo que cambia entre ellas se declara aquí,
// no en el código de los gráficos.

const MIN_N = 1; // agregados descriptivos sobre las respuestas disponibles

// Gráficos disponibles en la página "Análisis cruzado" (ids definidos en cross.js)
const COOP_CONFIG = {
  GLOBAL: {
    label: 'Producers Direct (global)',
    groupBy: 'coop',
    focus: 'Comparación entre cooperativas',
    cross: ['radar', 'edu', 'services', 'heat', 'gaps', 'bubble', 'age', 'corr']
  },
  'NORANDINO': {
    label: 'Norandino',
    groupBy: 'territory',
    focus: 'Café entregado, capacitación y acceso digital por distrito',
    cross: ['radar', 'services', 'channels', 'heat', 'gaps', 'bubble', 'edu', 'age']
  },
  'BAGUA GRANDE': {
    label: 'Bagua Grande',
    groupBy: 'territory',
    focus: 'Entender el territorio: acceso, producción y riesgo por distrito',
    cross: ['heat', 'radar', 'edu', 'gaps', 'bubble', 'services', 'corr', 'age']
  },
  DEFAULT: {
    label: 'Cooperativa',
    groupBy: 'territory',
    focus: 'Perfil de las productoras por territorio',
    cross: ['radar', 'heat', 'gaps', 'bubble', 'edu', 'age']
  }
};

function coopConfig(view) {
  return COOP_CONFIG[view] || { ...COOP_CONFIG.DEFAULT, label: view };
}

// Indicadores binarios (1 / 0 / null). "good" indica si 1 es el sentido positivo.
// ---------- Paleta accesible (AC2) ----------
// Tonos oscuros con texto blanco. Las series de puntos también se distinguen por forma.
const VIZ = {
  cat: ['#2D609A', '#934825', '#16594A', '#63406C'],
  gray: '#53636E',
  seq: ['#cde2fb', '#86b6ef', '#3987e5', '#1c5cab', '#0d366b'], // un solo tono, de claro a oscuro
  divPos: [42, 120, 214], divNeg: [227, 73, 72], divMid: [240, 239, 236] // azul ↔ rojo con gris al centro
};
// El color sigue a la cooperativa en todas las pantallas, aunque un filtro cambie cuántas se ven.
const COOP_ORDER = [];
function setCoopColors(rows) {
  const names=new Set(rows.map(r=>r.coop));
  const familiar=['NORANDINO','BAGUA GRANDE'].filter(name=>names.delete(name));
  COOP_ORDER.splice(0,COOP_ORDER.length,...familiar,...[...names].sort((a,b)=>a.localeCompare(b,'es')));
}
function coopColor(coop) {
  const i=COOP_ORDER.indexOf(coop);
  return VIZ.cat[i]||VIZ.gray;
}
// Series que no son cooperativas (por ejemplo, zonas): orden fijo y gris desde la quinta.
const seriesColor = (key, group, i) => (key === 'coop' ? coopColor(group) : i < VIZ.cat.length ? VIZ.cat[i] : VIZ.gray);

// Temas para agrupar indicadores (CC1, CC2) y opciones múltiples que pueden sumar más de 100 %.
const INDICATOR_THEMES = { smart: 'Acceso digital', net: 'Acceso digital', yape: 'Acceso digital', lit: 'Lectoescritura', sewer: 'Hogar', wa: 'Comunicación', call: 'Comunicación', train: 'Vínculo con la cooperativa', save: 'Vínculo con la cooperativa', coopcred: 'Vínculo con la cooperativa' };
const THEME_ORDER = ['Acceso digital', 'Lectoescritura', 'Hogar', 'Vínculo con la cooperativa', 'Comunicación'];
const MULTI_INDICATORS = ['wa', 'call'];

// Nivel educativo en 5 grupos (AC1): ocho niveles en tonos casi iguales no se podían distinguir.
const EDU_GROUPS = ['Sin estudios', 'Primaria incompleta', 'Primaria completa', 'Secundaria (completa o no)', 'Técnico o superior'];
function educationGroup(v) {
  if (!v) return null;
  const s = String(v).toUpperCase();
  if (s === 'NINGUNO' || s === 'SIN_ESTUDIOS') return EDU_GROUPS[0];
  if (s === 'PRIMARIA_INCOMPLETA') return EDU_GROUPS[1];
  if (s === 'PRIMARIA_COMPLETA') return EDU_GROUPS[2];
  if (s.startsWith('SECUNDARIA')) return EDU_GROUPS[3];
  if (s.startsWith('TECNICO') || s.startsWith('SUPERIOR') || s.startsWith('UNIVERSIT')) return EDU_GROUPS[4];
  return 'Otro';
}

const INDICATORS = [
  { id: 'smart', label: 'Smartphone propio', good: true, f: r => ['SMARTPHONE','BASICO','NINGUNO'].includes(r.phone) ? +(r.phone === 'SMARTPHONE') : null },
  { id: 'net', label: 'Internet en casa', good: true, f: r => ['EN_CASA','FUERA_DE_CASA','SIN_SENAL_SECTOR'].includes(r.internet) ? +(r.internet === 'EN_CASA') : null },
  { id: 'lit', label: 'Sin dificultad de lectoescritura', good: true, f: r => ['NINGUNA','LECTURA','ESCRITURA','AMBAS'].includes(r.literacy) ? +(r.literacy === 'NINGUNA') : null },
  { id: 'train', label: 'Capacitación de la cooperativa', good: true, f: r => r.trainedCoop ?? null },
  { id: 'save', label: 'Ahorro en la cooperativa', good: true, f: r => r.savingsCoop ?? null },
  { id: 'wa', label: 'Prefiere WhatsApp', good: true, f: r => r.channels ? +r.channels.includes('WHATSAPP') : null },
  { id: 'call', label: 'Prefiere llamadas', good: true, f: r => r.channels ? +r.channels.includes('LLAMADAS') : null },
  { id: 'yape', label: 'Usa Yape', good: true, f: r => r.yape ?? null },
  { id: 'sewer', label: 'Tiene desagüe', good: true, f: r => ['AMBOS','SOLO_DESAGUE','SOLO_AGUA','NINGUNO'].includes(r.water) ? +['AMBOS', 'SOLO_DESAGUE'].includes(r.water) : null },
  { id: 'coopcred', label: 'Crédito vigente en la cooperativa (socia titular)', good: true, f: r => r.coopCredit ?? null }
];

// Brechas = lo contrario de un indicador positivo (para el ranking de brechas)
const GAPS = [
  { label: 'Sin internet en casa', f: r => ['EN_CASA','FUERA_DE_CASA','SIN_SENAL_SECTOR'].includes(r.internet) ? +(r.internet !== 'EN_CASA') : null },
  { label: 'Sin smartphone propio', f: r => ['SMARTPHONE','BASICO','NINGUNO'].includes(r.phone) ? +(r.phone !== 'SMARTPHONE') : null },
  { label: 'Dificultad de lectoescritura', f: r => ['NINGUNA','LECTURA','ESCRITURA','AMBAS'].includes(r.literacy) ? +(r.literacy !== 'NINGUNA') : null },
  { label: 'Sin capacitación de la cooperativa', f: r => r.trainedCoop != null ? 1 - r.trainedCoop : null },
  { label: 'Sin ahorro en la cooperativa', f: r => r.savingsCoop != null ? 1 - r.savingsCoop : null },
  { label: 'Sin desagüe', f: r => ['AMBOS','SOLO_DESAGUE','SOLO_AGUA','NINGUNO'].includes(r.water) ? +!['AMBOS', 'SOLO_DESAGUE'].includes(r.water) : null },
  { label: 'Sin Yape', f: r => r.yape != null ? 1 - r.yape : null },
  { label: 'No usa ningún servicio financiero', f: r => Array.isArray(r.services) ? (r.services.includes('NINGUNO') && r.services.length>1 ? null : +r.services.includes('NINGUNO')) : null }
];

// ---------- utilidades ----------

function prettyLabel(s) {
  const t = String(s).toLowerCase().replace(/_/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Nombres de grupos (cooperativas, distritos): cada palabra con mayúscula inicial
// Conectores en minúscula y guiones con espacios: "BOSQUES DEL SANTUARIO -GUAYABAL" -> "Bosques del Santuario - Guayabal".
const LABEL_CONNECTORS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'en']);
function groupLabel(s) {
  return String(s).toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').replace(/\s*-\s*/g, ' - ').trim()
    .split(' ').map((w, i, all) => (i > 0 && all[i - 1] !== '-' && LABEL_CONNECTORS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
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
