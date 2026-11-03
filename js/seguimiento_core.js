/*
 * Seguimiento del crédito: lectura de los Excel de ingresos y egresos.
 * Formato ancho, una fila por productora, una hoja "Registros".
 * Se mapea por el texto de cada encabezado, nunca por su posición, porque los
 * formularios repiten encabezados y cambian el orden de columnas entre meses.
 * Ausente es null: no se imputa ni se completa nada. Ver data/contrato_seguimiento.md.
 */
(function (root) {
  'use strict';

  const MONTHS = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SETIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
  const MONTH_ALIASES = { SEPTIEMBRE: 'SETIEMBRE' };

  // Por encima de este valor, unos quintales vendidos en un solo mes no son creíbles
  // para una productora del fondo: se apartan del cálculo (las ventas en soles se conservan).
  const MAX_QQ_MONTH = 200;

  const KINDS = {
    cafe: { label: 'Venta de café', unit: 'qq', unitLabel: 'quintales' },
    emprendimiento: { label: 'Emprendimiento', unit: 'kg/unid.', unitLabel: 'kg o unidades' }
  };

  const norm = (value) => String(value ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase().replace(/[¿?¡!]/g, ' ').replace(/\s+/g, ' ').trim();

  const isBlank = (value) => value == null || String(value).trim() === '';

  function monthIn(text) {
    const words = norm(text).split(/[^A-Z]+/);
    for (const word of words) {
      const month = MONTH_ALIASES[word] || word;
      if (MONTHS.includes(month)) return month;
    }
    return null;
  }

  function yesNo(value) {
    if (isBlank(value)) return { value: null };
    const text = norm(value);
    if (text === 'SI' || text === '1') return { value: 1 };
    if (text === 'NO' || text === '0') return { value: 0 };
    return { value: null, error: `Se esperaba Sí o No y se encontró «${String(value).trim()}»` };
  }

  // Igual que el resto del tablero: un número de texto ambiguo («1,234») no se adivina.
  function number(value) {
    if (isBlank(value)) return { value: null };
    if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? { value } : { value: null, error: 'Número no válido' };
    let text = String(value).trim().replace(/^(S\/|PEN)\s*/i, '').replace(/\s/g, '');
    if (!/^\d+(?:[.,]\d+)?$/.test(text)) return { value: null, error: `Número no reconocido: «${String(value).trim()}»` };
    // «1.500» o «1,500» puede ser mil quinientos o uno y medio; «0.502» no es ambiguo.
    if (/^[1-9]\d{0,2}[.,]\d{3}$/.test(text)) return { value: null, error: `No se sabe si «${String(value).trim()}» lleva coma de miles o decimal` };
    const parsed = Number(text.replace(',', '.'));
    return Number.isFinite(parsed) ? { value: parsed } : { value: null, error: 'Número no válido' };
  }

  const text = (value) => isBlank(value) ? null : String(value).trim().replace(/\s+/g, ' ');

  // Preguntas que no dependen del mes.
  const STATIC_RULES = [
    { key: 'fertUsed', type: 'yesno', label: 'Ya aplicó el fertilizante', re: /^YA UTILIZO EL FERTILIZANTE/ },
    { key: 'fertWhyNot', type: 'text', label: 'Por qué no aplicó el fertilizante', re: /POR QUE NO APLICO/ },
    { key: 'coopDelivered', type: 'yesno', label: 'Llevó café a la cooperativa', re: /^HA LLEVADO SU CAFE A LA COOPERATIVA/ },
    { key: 'coopWhyNot', type: 'text', label: 'Por qué no llevó café a la cooperativa', re: /MOTIVO DE NO HABER LLEVADO EL CAFE/ },
    { key: 'coopSoon', type: 'yesno', label: 'Llevará pronto café a la cooperativa', re: /LLEVARA PRONTO SU CAFE/ },
    { key: 'bookUse', type: 'yesno', label: 'Usa el cuaderno de registros', re: /USA SU CUADERNO DE REGISTROS/ },
    { key: 'bookUseful', type: 'text', label: 'Utilidad del cuaderno de registros', re: /CUADERNO DE REGISTROS ES UTIL/ },
    { key: 'activity', type: 'text', label: 'Actividad financiada', re: /ACTIVIDAD QUE FUE FINANCIADA/ }
  ];

  // Preguntas reconocidas que esta versión del tablero no usa.
  const IGNORED_RULES = [
    { label: 'Detalle de aplicación del fertilizante (parcelas, meses, veces, dosis)', re: /^EN CASO DE,? SI,? .*(PARCELAS|MESES APLICO|VECES HA APLICADO|DOSIS)/ },
    { label: 'Fechas y veces de entrega de café a la cooperativa', re: /(CUANDO LLEVO SU CAFE|CUANTAS VECES YA LLEVO SU CAFE|EN QUE FECHA LLEVARA SU CAFE)/ },
    { label: 'Tipos de gasto de la finca, del emprendimiento y de la familia', re: /^(TUVO GASTOS DE FINCA|QUE GASTOS TUVO DEL EMPRENDIMIENTO|QUE GASTOS FAMILIARES TUVO)/ },
    { label: 'Clima, plagas y enfermedades', re: /(CAMBIO CLIMATICO|CAMBIOS EN EL CLIMA|PLAGAS|ENFERMEDADES)/ }
  ];

  // Preguntas por mes. "context" indica de qué pregunta toma el mes si el encabezado no lo dice.
  const MONTH_RULES = [
    { key: 'sold', type: 'yesno', context: 'sale', opens: 'sale', label: 'Vendió en el mes', re: /^VENDIO (CAFE|PRODUCTOS DE SU EMPRENDIMIENTO) EN/ },
    { key: 'harvest', type: 'number', context: 'sale', label: 'Cantidad cosechada', re: /^CANTIDAD TOTAL COSECHADA/ },
    { key: 'consumed', type: 'number', context: 'sale', label: 'Cantidad consumida o regalada', re: /^CANTIDAD CONSUMIDA O REGALADA/ },
    { key: 'lost', type: 'number', context: 'sale', label: 'Cantidad perdida', re: /^CANTIDAD PERDIDA/ },
    { key: 'qtySold', type: 'number', context: 'sale', label: 'Cantidad vendida', re: /^CANTIDAD TOTAL VENDIDA/ },
    { key: 'sales', type: 'number', context: 'sale', label: 'Ventas (S/)', re: /^GANANCIA TOTAL DE LA VENTA/ },
    { key: 'spent', type: 'yesno', context: 'exp', opens: 'exp', label: 'Tuvo gastos en el mes', re: /^GENERO GASTOS EN/ },
    { key: 'workExp', type: 'number', context: 'exp', label: 'Gasto de la finca o del emprendimiento (S/)', re: /^(CUANTO GASTO EN TOTAL EN (LA FINCA|EL EMPRENDIMIENTO)|GASTO TOTAL DEL EMPRENDIMIENTO)/ },
    { key: 'famExp', type: 'number', context: 'exp', label: 'Gasto de la familia (S/)', re: /^CUANTO GASTO EN TOTAL EN LA FAMILIA/ }
  ];

  const isCodeHeader = (header) => norm(header) === 'CODIGO' || norm(header) === 'CODIGO PRODUCTORA' || norm(header) === 'CODIGO_PRODUCTORA';

  /* Mapea los encabezados de una hoja. Devuelve columnas por pregunta y por mes. */
  function mapHeaders(headers) {
    const map = { code: null, statics: {}, months: {}, ignored: new Set(), unknown: [], duplicates: [] };
    let kind = null;
    const current = { sale: null, exp: null };

    headers.forEach((header, index) => {
      if (isBlank(header)) return;
      const h = norm(header);
      if (isCodeHeader(header)) {
        if (map.code != null) map.duplicates.push('Código');
        else map.code = index;
        return;
      }
      if (/^VENDIO CAFE EN/.test(h)) kind = kind || 'cafe';
      if (/^VENDIO PRODUCTOS DE SU EMPRENDIMIENTO EN/.test(h)) kind = kind || 'emprendimiento';

      const monthRule = MONTH_RULES.find((rule) => rule.re.test(h));
      if (monthRule) {
        // El primer mes del formulario (enero) no lleva el mes en sus encabezados:
        // se toma de la última pregunta «¿Vendió … en <mes>?» o «¿Generó gastos en <mes>?».
        const named = monthIn(header);
        if (monthRule.opens) current[monthRule.opens] = named;
        const month = named || current[monthRule.context];
        if (!month) { map.unknown.push(String(header).trim()); return; }
        const slot = (map.months[month] = map.months[month] || {});
        if (slot[monthRule.key] != null) map.duplicates.push(`${monthRule.label} (${month.toLowerCase()})`);
        else slot[monthRule.key] = index;
        return;
      }

      const staticRule = STATIC_RULES.find((rule) => rule.re.test(h));
      if (staticRule) {
        if (map.statics[staticRule.key] != null) map.duplicates.push(staticRule.label);
        else map.statics[staticRule.key] = index;
        return;
      }

      const ignoredRule = IGNORED_RULES.find((rule) => rule.re.test(h));
      if (ignoredRule) { map.ignored.add(ignoredRule.label); return; }

      map.unknown.push(String(header).trim());
    });

    return { map, kind };
  }

  function findHeaderRow(matrix) {
    for (let i = 0; i < Math.min(matrix.length, 10); i += 1) {
      if ((matrix[i] || []).some(isCodeHeader)) return i;
    }
    return -1;
  }

  /*
   * Lee una hoja y devuelve un perfil para revisar antes de confirmar.
   * sheets: [{ name, matrix }] (matrix = filas como arreglos).
   * baseIndex: Map código normalizado -> { code, coop } de la base de productoras.
   */
  function readFile(fileName, sheets, baseIndex) {
    const profile = {
      fileName, sheet: null, kind: null, kindLabel: null, months: [], rows: 0,
      matched: 0, unmatched: [], coops: {}, used: [], ignored: [], unknown: [],
      records: [], observations: [], error: null
    };

    const sheet = sheets.find((s) => norm(s.name) === 'REGISTROS') || (sheets.length === 1 ? sheets[0] : null);
    if (!sheet) {
      profile.error = 'No tiene una hoja «Registros». Carga el archivo de seguimiento tal como sale del formulario.';
      return profile;
    }
    profile.sheet = sheet.name;

    const headerRow = findHeaderRow(sheet.matrix);
    if (headerRow < 0) {
      profile.error = 'No se encontró la columna «Código».';
      return profile;
    }

    const { map, kind } = mapHeaders(sheet.matrix[headerRow] || []);
    if (!kind) {
      profile.error = 'No se reconocen las preguntas de venta por mes («¿Vendió … en …?»). No parece un archivo de seguimiento.';
      return profile;
    }
    if (map.duplicates.length) {
      profile.error = 'Hay dos columnas para el mismo dato: ' + [...new Set(map.duplicates)].join('; ') + '. Revisa el archivo antes de cargarlo.';
      return profile;
    }

    profile.kind = kind;
    profile.kindLabel = KINDS[kind].label;
    profile.months = MONTHS.filter((month) => map.months[month]);
    profile.ignored = [...map.ignored];
    profile.unknown = map.unknown;
    const usedLabels = new Set();
    STATIC_RULES.forEach((rule) => { if (map.statics[rule.key] != null) usedLabels.add(rule.label); });
    MONTH_RULES.forEach((rule) => { if (profile.months.some((month) => map.months[month][rule.key] != null)) usedLabels.add(rule.label); });
    profile.used = [...usedLabels];

    const seen = new Map();
    for (let i = headerRow + 1; i < sheet.matrix.length; i += 1) {
      const cells = sheet.matrix[i] || [];
      if (!cells.some((value) => !isBlank(value))) continue;
      const excelRow = i + 1;
      const code = text(cells[map.code]);
      const where = { file: fileName, row: excelRow };
      const observe = (month, field, finding, action) => profile.observations.push({ code: code || `(fila ${excelRow})`, ...where, month, field, finding, action });

      profile.rows += 1;
      if (!code) { observe(null, 'Código', 'Fila sin código de productora', 'No se incluyó'); continue; }
      const key = norm(code);
      if (seen.has(key)) {
        seen.get(key).duplicate = true;
        observe(null, 'Código', 'Código repetido en el mismo archivo', 'No se incluyó ninguna de las filas repetidas');
        continue;
      }

      const record = { code, key, kind, source: where, statics: {}, months: {} };
      seen.set(key, record);

      for (const rule of STATIC_RULES) {
        const column = map.statics[rule.key];
        if (column == null) continue;
        const raw = cells[column];
        if (rule.type === 'yesno') {
          const parsed = yesNo(raw);
          if (parsed.error) observe(null, rule.label, parsed.error, 'Se dejó sin dato');
          record.statics[rule.key] = parsed.value;
        } else {
          record.statics[rule.key] = text(raw);
        }
      }

      for (const month of profile.months) {
        const slot = map.months[month];
        const values = {};
        for (const rule of MONTH_RULES) {
          if (slot[rule.key] == null) continue;
          const raw = cells[slot[rule.key]];
          const parsed = rule.type === 'yesno' ? yesNo(raw) : number(raw);
          if (parsed.error) observe(month, rule.label, parsed.error, 'Se dejó sin dato');
          values[rule.key] = parsed.value;
        }
        checkMonth(values, kind, month, observe);
        record.months[month] = values;
      }

      const base = baseIndex ? baseIndex.get(key) : null;
      if (base) {
        record.coop = base.coop;
        record.code = base.code;
        profile.matched += 1;
        profile.coops[base.coop] = (profile.coops[base.coop] || 0) + 1;
      } else {
        profile.unmatched.push(code);
      }
    }

    profile.records = [...seen.values()].filter((record) => !record.duplicate && record.coop);
    return profile;
  }

  /* Reglas de calidad por mes. Nunca corrigen el valor: lo apartan o lo marcan. */
  function checkMonth(values, kind, month, observe) {
    const { qtySold, sales, sold } = values;
    if (kind === 'cafe' && qtySold != null && qtySold > MAX_QQ_MONTH) {
      const same = sales != null && sales === qtySold;
      observe(month, 'Cantidad vendida',
        `${fmtNum(qtySold)} qq vendidos en un mes${same ? `, igual a las ventas en soles (S/ ${fmtNum(sales)})` : ''}: parece que se anotaron soles en la casilla de quintales`,
        'Se apartan los quintales de ese mes; las ventas en soles se mantienen');
      values.qtySoldExcluded = qtySold;
      values.qtySold = null;
    }
    if (sales != null && sales > 0 && values.qtySoldExcluded == null && qtySold === 0) {
      observe(month, 'Cantidad vendida',
        `Ventas de S/ ${fmtNum(sales)} con 0 ${kind === 'cafe' ? 'qq' : 'kg o unidades'} vendidos`,
        'Se mantienen las ventas en soles; revisar la cantidad vendida con la productora');
    }
    if (sold === 0 && sales != null && sales > 0) {
      observe(month, 'Vendió en el mes',
        `Respondió que no vendió, pero anotó ventas de S/ ${fmtNum(sales)}`,
        'Se mantienen las ventas en soles; revisar con la productora');
    }
  }

  const fmtNum = (value) => Number(value).toLocaleString('es-PE', { maximumFractionDigits: 2 });

  /*
   * Une los perfiles confirmados por código. Un mismo dato en dos archivos con valores
   * distintos no se elige: queda sin dato y se marca.
   */
  function combine(profiles) {
    const byKey = new Map();
    const observations = [];
    for (const profile of profiles) {
      if (profile.error) continue;
      observations.push(...profile.observations);
      for (const record of profile.records) {
        if (!byKey.has(record.key)) {
          byKey.set(record.key, { code: record.code, key: record.key, coop: record.coop, kind: record.kind, sources: [], statics: {}, months: {} });
        }
        const target = byKey.get(record.key);
        target.sources.push(record.source);
        for (const [field, value] of Object.entries(record.statics)) {
          if (!(field in target.statics)) target.statics[field] = value;
          else if (target.statics[field] !== value && value != null) {
            if (target.statics[field] == null) target.statics[field] = value;
            else {
              observations.push({ code: record.code, file: record.source.file, row: record.source.row, month: null, field, finding: 'La misma pregunta tiene respuestas distintas en dos archivos', action: 'Se dejó sin dato' });
              target.statics[field] = null;
            }
          }
        }
        for (const [month, values] of Object.entries(record.months)) {
          if (target.months[month]) {
            observations.push({ code: record.code, file: record.source.file, row: record.source.row, month, field: 'Mes', finding: 'El mismo mes aparece en dos archivos', action: 'No se usó ese mes de esta productora' });
            target.months[month] = { conflict: true };
          } else {
            target.months[month] = values;
          }
        }
      }
    }
    return { records: [...byKey.values()], observations };
  }

  /* ---------- cálculos para la página ---------- */

  function count(list, predicate) {
    return list.reduce((total, item) => total + (predicate(item) ? 1 : 0), 0);
  }

  // Respuestas de una pregunta Sí/No entre las productoras que la respondieron.
  function yesNoSummary(records, field) {
    const answered = records.filter((record) => record.statics[field] === 0 || record.statics[field] === 1);
    return { answered: answered.length, yes: count(answered, (r) => r.statics[field] === 1), no: count(answered, (r) => r.statics[field] === 0) };
  }

  // Frecuencia de respuestas de texto (motivos, utilidad, actividad), sin agrupar por parecido.
  function tally(records, field, filter = () => true) {
    const counts = new Map();
    let answered = 0;
    for (const record of records) {
      if (!filter(record)) continue;
      const value = record.statics[field];
      if (value == null) continue;
      answered += 1;
      counts.set(value, (counts.get(value) || 0) + 1);
    }
    return { answered, items: [...counts.entries()].map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n || a.label.localeCompare(b.label, 'es')) };
  }

  const sumOrNull = (values) => values.length ? values.reduce((a, b) => a + b, 0) : null;

  /* Resumen de un mes para un grupo de productoras. */
  function monthSummary(records, month) {
    const rows = records.map((record) => record.months[month]).filter((values) => values && !values.conflict);
    const soldAnswered = rows.filter((v) => v.sold === 0 || v.sold === 1);
    const salesValues = rows.map((v) => v.sales).filter((v) => v != null);
    const qtyValues = rows.map((v) => v.qtySold).filter((v) => v != null);
    const spentAnswered = rows.filter((v) => v.spent === 0 || v.spent === 1);
    const workValues = rows.map((v) => v.workExp).filter((v) => v != null);
    const famValues = rows.map((v) => v.famExp).filter((v) => v != null);
    return {
      month,
      inFile: rows.length,
      saleAnswered: soldAnswered.length,
      soldYes: count(soldAnswered, (v) => v.sold === 1),
      sales: sumOrNull(salesValues),
      salesN: salesValues.length,
      qtySold: sumOrNull(qtyValues),
      qtyN: qtyValues.length,
      qtyExcluded: count(rows, (v) => v.qtySoldExcluded != null),
      expAnswered: spentAnswered.length,
      workExp: sumOrNull(workValues),
      workN: workValues.length,
      famExp: sumOrNull(famValues),
      famN: famValues.length
    };
  }

  function monthsPresent(records) {
    return MONTHS.filter((month) => records.some((record) => record.months[month]));
  }

  const api = {
    MONTHS, KINDS, MAX_QQ_MONTH, norm, monthIn, yesNo, number, mapHeaders, readFile, combine,
    yesNoSummary, tally, monthSummary, monthsPresent
  };
  root.PDSeguimiento = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
