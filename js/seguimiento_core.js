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
    if(typeof value==='boolean')return {value:value?1:0};
    const text = norm(value);
    if (text === 'SI' || text === '1') return { value: 1 };
    if (text === 'NO' || text === '0') return { value: 0 };
    return { value: null, error: `Se esperaba Sí o No y se encontró «${String(value).trim()}»` };
  }

  // El contrato usa punto decimal y coma para agrupar miles.
  function number(value) {
    if (isBlank(value)) return {value:null};
    const data=root.PDData||(typeof require!=='undefined'?require('./data_core.js'):null);
    const result=data.parseNumber(value,'dot');
    if(result.value!=null&&result.value<0)return {value:null,error:'Se esperaba un número mayor o igual a cero'};
    return result;
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

  const cleanHeader = h => norm(h).replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  const isCodeHeader = header => ['CODIGO','CODIGO_PRODUCTORA','CODIGO_DE_PRODUCTORA','ID_PRODUCTORA'].includes(cleanHeader(header));
  function baseIndex(rows) {
    const index=new Map(), byCode=new Map();
    for(const row of rows){
      index.set(JSON.stringify([norm(row.code),norm(row.coop)]),row);
      const code=norm(row.code);byCode.set(code,[...(byCode.get(code)||[]),row]);
    }
    for(const [code,matches] of byCode)if(matches.length===1)index.set(code,matches[0]);
    return index;
  }

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
      if(['COOPERATIVA','PERIODO','ANO','ANIO'].includes(cleanHeader(header)))return;
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

  function periodFrom(headers,rows,fallback){
    const cols=headers.flatMap((h,i)=>['PERIODO','ANO','ANIO'].includes(cleanHeader(h))?[i]:[]);
    const values=new Set();
    for(const row of rows)for(const col of cols)if(!isBlank(row[col])){
      const y=String(row[col]).trim();
      if(!/^(19|20|21)\d{2}$/.test(y))return {error:'El periodo debe ser un año de cuatro dígitos.'};
      values.add(Number(y));
    }
    if(values.size>1)return {error:'Carga un solo año de seguimiento por sesión.'};
    const year=[...values][0]??fallback??null;
    if(fallback&&values.size&&year!==fallback)return {error:'El año del archivo no coincide con el año de seguimiento seleccionado.'};
    return {value:year};
  }
  function columnsFor(headers,map){
    return [
      {column:map.code,header:headers[map.code],field:'Código'},
      ...headers.flatMap((header,column)=>cleanHeader(header)==='COOPERATIVA'?[{column,header,field:'Cooperativa para el cruce'}]:['PERIODO','ANO','ANIO'].includes(cleanHeader(header))?[{column,header,field:'Año del seguimiento'}]:[]),
      ...STATIC_RULES.flatMap(r=>map.statics[r.key]!=null?[{column:map.statics[r.key],header:headers[map.statics[r.key]],field:r.label}]:[]),
      ...Object.entries(map.months).flatMap(([month,cols])=>MONTH_RULES.flatMap(r=>cols[r.key]!=null?[{column:cols[r.key],header:headers[cols[r.key]],field:r.label+' · '+month.toLowerCase()}]:[]))
    ];
  }
  function readLong(fileName,sheet,headerRow,index,options){
    const headers=sheet.matrix[headerRow],names=headers.map(cleanHeader),column=name=>names.indexOf(name);
    const aliases={sold:['VENDIO'],qtySold:['CANTIDAD_VENDIDA'],sales:['VENTAS_PEN'],workExp:['GASTO_ACTIVIDAD_PEN'],famExp:['GASTO_FAMILIAR_PEN'],spent:['TUVO_GASTOS']};
    const codeCol=headers.findIndex(isCodeHeader),monthCol=column('MES'),coopCol=column('COOPERATIVA'),unitCol=column('UNIDAD_CANTIDAD');
    const mapping=Object.fromEntries(Object.entries(aliases).flatMap(([k,values])=>{const hits=names.flatMap((n,i)=>values.includes(n)?[i]:[]);return hits.length?[[k,hits[0]]]:[];}));
    const p={fileName,sheet:sheet.name,kind:'mixto',kindLabel:'Registro mensual',months:[],rows:0,matched:0,unmatched:[],coops:{},used:Object.keys(mapping).map(k=>MONTH_RULES.find(r=>r.key===k).label),ignored:[],unknown:[],records:[],observations:[],error:null,headerRow:headerRow+1,columns:headers.length};
    const period=periodFrom(headers,sheet.matrix.slice(headerRow+1),options.period);
    if(period.error){p.error=period.error;return p;}p.period=period.value;
    if(!Object.keys(mapping).length){p.error='No hay campos mensuales reconocidos. Usa vendio, ventas_pen o los gastos del diccionario.';return p;}
    if(new Set(names.filter(Boolean)).size!==names.filter(Boolean).length){p.error='Hay encabezados repetidos. Deja una columna por campo.';return p;}
    p.fields=[{column:codeCol,header:headers[codeCol],field:'Código'},{column:monthCol,header:headers[monthCol],field:'Mes'},...Object.entries(mapping).map(([key,col])=>({column:col,header:headers[col],field:MONTH_RULES.find(r=>r.key===key).label}))];
    const recognized=new Set([codeCol,monthCol,coopCol,unitCol,column('PERIODO'),...Object.values(mapping)]);
    p.unknown=headers.filter((h,i)=>h&&!recognized.has(i));
    const seen=new Map(),duplicates=new Set();
    for(let i=headerRow+1;i<sheet.matrix.length;i++){
      const row=sheet.matrix[i]||[];if(!row.some(v=>!isBlank(v)))continue;p.rows++;
      const code=text(row[codeCol]),key=norm(code),m=norm(row[monthCol]);
      const month=/^\d{1,2}$/.test(m)?MONTHS[Number(m)-1]:monthIn(m);
      const coop=coopCol>=0?row[coopCol]:null,base=index?.get(coop?JSON.stringify([key,norm(coop)]):key);
      const observe=(field,finding)=>p.observations.push({code:code||'',file:fileName,row:i+1,month:month||'',field,finding,action:'No se usa el valor'});
      if(!code||!month){observe('Código / mes','Código vacío o mes no reconocido');continue;}
      if(!base){p.unmatched.push(code);continue;}
      const id=JSON.stringify([key,norm(base.coop),month]);
      if(seen.has(id)){duplicates.add(id);observe('Código / mes','Más de una fila para el mismo código, cooperativa y mes');continue;}
      const kind=unitCol>=0&&['QQ','QUINTAL','QUINTALES'].includes(norm(row[unitCol]))?'cafe':'emprendimiento';
      const values={};for(const [field,col] of Object.entries(mapping)){
        const parsed=['sold','spent'].includes(field)?yesNo(row[col]):number(row[col]);values[field]=parsed.value;if(parsed.error)observe(field,parsed.error);
      }
      seen.set(id,{code:base.code,key,coop:base.coop,kind,source:{file:fileName,row:i+1},statics:{},months:{[month]:values}});
    }
    p.records=[...seen].filter(([id])=>!duplicates.has(id)).map(([,r])=>r);
    p.months=MONTHS.filter(m=>p.records.some(r=>r.months[m]));
    p.matched=new Set(p.records.map(r=>JSON.stringify([r.key,r.coop]))).size;
    p.records.forEach(r=>{p.coops[r.coop]=(p.coops[r.coop]||0)+1;});
    return p;
  }

  /*
   * Lee una hoja y devuelve un perfil para revisar antes de confirmar.
   * sheets: [{ name, matrix }] (matrix = filas como arreglos).
   * baseIndex: Map código normalizado -> { code, coop } de la base de productoras.
   */
  function readFile(fileName, sheets, index, options={}) {
    const profile = {
      fileName, sheet: null, kind: null, kindLabel: null, months: [], rows: 0,
      matched: 0, unmatched: [], coops: {}, used: [], ignored: [], unknown: [],
      records: [], observations: [], error: null
    };

    const compatible=sheets.filter(s=>findHeaderRow(s.matrix)>=0);
    const sheet = sheets.find((s) => norm(s.name) === 'REGISTROS') || (compatible.length === 1 ? compatible[0] : null);
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

    const headers=sheet.matrix[headerRow]||[];
    if(headers.some(h=>cleanHeader(h)==='MES'))return readLong(fileName,sheet,headerRow,index,options);
    const { map, kind } = mapHeaders(headers);
    profile.headerRow=headerRow+1;profile.columns=headers.length;profile.period=periodFrom(headers,sheet.matrix.slice(headerRow+1),options.period);
    if(profile.period.error){profile.error=profile.period.error;return profile;}
    profile.period=profile.period.value;
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
      const coopColumn=headers.findIndex(h=>cleanHeader(h)==='COOPERATIVA');
      const sourceCoop=coopColumn>=0?cells[coopColumn]:null;
      const identity=sourceCoop?JSON.stringify([key,norm(sourceCoop)]):key;
      if (seen.has(identity)) {
        seen.get(identity).duplicate = true;
        observe(null, 'Código', 'Código repetido en el mismo archivo', 'No se incluyó ninguna de las filas repetidas');
        continue;
      }

      const record = { code, key, kind, source: where, statics: {}, months: {} };
      seen.set(identity, record);

      for (const rule of STATIC_RULES) {
        const column = map.statics[rule.key];
        if (column == null) continue;
        const raw = cells[column];
        if (rule.type === 'yesno') {
          const parsed = yesNo(raw);
          if (parsed.error) observe(null, rule.label, parsed.error, 'No se usa en los cálculos');
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
          if (parsed.error) observe(month, rule.label, parsed.error, 'No se usa en los cálculos');
          values[rule.key] = parsed.value;
        }
        record.months[month] = values;
      }

      const base = index?.get(sourceCoop?JSON.stringify([key,norm(sourceCoop)]):key);
      if (base) {
        record.coop = base.coop;
        record.code = base.code;
      } else {
        profile.unmatched.push(code);
      }
    }

    profile.records = [...seen.values()].filter((record) => !record.duplicate && record.coop);
    profile.matched=profile.records.length;
    profile.records.forEach(r=>{profile.coops[r.coop]=(profile.coops[r.coop]||0)+1;});
    profile.fields=columnsFor(headers,map);
    return profile;
  }

  /*
   * Une los perfiles confirmados por código. Un mismo dato en dos archivos con valores
   * distintos no se elige: queda sin dato y se marca.
   */
  function combine(profiles) {
    const years=new Set(profiles.filter(p=>!p.error&&p.period!=null).map(p=>p.period));
    if(years.size>1)throw Error('Carga un solo año de seguimiento por sesión.');
    const byKey=new Map(),observations=[];
    for(const profile of profiles){
      if(profile.error)continue;
      observations.push(...profile.observations);
      for(const record of profile.records){
        const id=JSON.stringify([record.key,norm(record.coop)]);
        if(!byKey.has(id))byKey.set(id,{code:record.code,key:record.key,coop:record.coop,kind:record.kind,sources:[],statics:{},months:{},staticConflicts:new Set()});
        const target=byKey.get(id);target.sources.push(record.source);
        for(const [field,value] of Object.entries(record.statics)){
          if(value==null||target.staticConflicts.has(field))continue;
          if(target.statics[field]==null)target.statics[field]=value;
          else if(target.statics[field]!==value){target.staticConflicts.add(field);target.statics[field]=null;observations.push({code:record.code,file:record.source.file,row:record.source.row,month:null,field,finding:'Respuestas distintas entre archivos',action:'Pendiente de corregir el origen'});}
        }
        for(const [month,values] of Object.entries(record.months)){
          const previous=target.months[month];
          if(!previous){target.months[month]={...values,kind:record.kind};continue;}
          if(previous.conflict)continue;
          const keys=new Set([...Object.keys(previous),...Object.keys(values)].filter(k=>k!=='kind'));
          const conflict=(previous.kind!==record.kind)||[...keys].some(k=>previous[k]!=null&&values[k]!=null&&previous[k]!==values[k]);
          if(conflict){target.months[month]={conflict:true};observations.push({code:record.code,file:record.source.file,row:record.source.row,month,field:'Mes',finding:'El mismo mes tiene respuestas distintas en dos archivos',action:'Mes excluido hasta corregir el origen'});}
          else for(const key of keys)if(previous[key]==null&&values[key]!=null)previous[key]=values[key];
        }
      }
    }
    return {records:[...byKey.values()],observations};
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
    const qtyValues = records.filter(r=>r.months[month]&&!r.months[month].conflict&&(r.months[month].kind||r.kind)==='cafe').map(r=>r.months[month].qtySold).filter(v=>v!=null);
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
      qtyExcluded: 0,
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
    MONTHS, KINDS, baseIndex, norm, monthIn, yesNo, number, mapHeaders, readFile, combine,
    yesNoSummary, tally, monthSummary, monthsPresent
  };
  root.PDSeguimiento = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
