const fallbackData = [
  { code:'PD-FR-001-FF-NOR', coop:'NORANDINO', territory:'Tabaconas', base:'Rico Aroma - Churuyacu', area:2.5, qq:23, amount:1375, income:30000, age:31, family:5, years:5, activity:'FERTILIZACIÓN', phone:'SMARTPHONE', literacy:'NINGUNA', pc1:-0.51, pc2:-1.20 },
  { code:'PD-FR-003-FF-BG', coop:'BAGUA GRANDE', territory:'Aramango', base:'Sector Central', area:1.5, qq:18, amount:2500, income:18000, age:52, family:3, years:18, activity:'CRIANZA DE ANIMALES', phone:'BASICO', literacy:'LECTURA', pc1:-0.85, pc2:1.45 },
  { code:'PD-FR-004-FF-BG', coop:'BAGUA GRANDE', territory:'Cajaruro', base:'El Triunfo', area:4.0, qq:65, amount:3000, income:65000, age:38, family:6, years:12, activity:'EMPRENDIMIENTO / OTROS', phone:'SMARTPHONE', literacy:'NINGUNA', pc1:1.80, pc2:0.85 }
];

let rawData = [...fallbackData];
let filteredData = [...rawData];

const $ = id => document.getElementById(id);

// Navegación UI
document.querySelectorAll('.nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.page + '-page').classList.add('active');
  });
});

function populateSelects() {
  const coops = [...new Set(rawData.map(r => r.coop))].sort();
  const terrs = [...new Set(rawData.map(r => r.territory))].sort();
  const bases = [...new Set(rawData.map(r => r.base))].sort();

  $('filter-coop').innerHTML = '<option value="all">Todas las cooperativas</option>' + coops.map(c => `<option value="${c}">${c}</option>`).join('');
  $('filter-territory').innerHTML = '<option value="all">Todos los territorios</option>' + terrs.map(t => `<option value="${t}">${t}</option>`).join('');
  $('filter-base').innerHTML = '<option value="all">Todas las bases</option>' + bases.map(b => `<option value="${b}">${b}</option>`).join('');
  $('filter-producer').innerHTML = '<option value="">Seleccionar Productora...</option>' + rawData.map(r => `<option value="${r.code}">${r.code} (${r.coop})</option>`).join('');
}

function applyFilters() {
  const coop = $('filter-coop').value;
  const terr = $('filter-territory').value;
  const base = $('filter-base').value;

  filteredData = rawData.filter(r => {
    return (coop === 'all' || r.coop === coop) &&
           (terr === 'all' || r.territory === terr) &&
           (base === 'all' || r.base === base);
  });

  $('kpi-n').textContent = filteredData.length;
  $('kpi-amount').textContent = 'S/ ' + filteredData.reduce((t, r) => t + (r.amount || 0), 0).toLocaleString('es-PE');
  $('kpi-area').textContent = filteredData.reduce((t, r) => t + (r.area || 0), 0).toFixed(1) + ' ha';
  $('kpi-qq').textContent = filteredData.reduce((t, r) => t + (r.qq || 0), 0).toLocaleString('es-PE') + ' qq';

  if (typeof renderCharts === "function") renderCharts(filteredData);
}

['filter-coop', 'filter-territory', 'filter-base'].forEach(id => $(id).addEventListener('change', applyFilters));

$('filter-producer').addEventListener('change', e => {
  if (e.target.value) {
    document.querySelector('[data-page="producer"]').click();
    const r = rawData.find(x => x.code === e.target.value);
    if (!r) return;
    $('rep-code-coop').textContent = `Código: ${r.code} | Cooperativa: ${r.coop} (${r.territory})`;
    $('rep-act-val').textContent = r.activity || 'Sin Dato';
    $('rep-amount-val').textContent = 'S/ ' + (r.amount || 0).toLocaleString('es-PE');
    $('rep-qq-val').textContent = (r.qq || 0) + ' quintales';
    $('rep-area-val').textContent = `Área: ${r.area || 0} ha`;
    $('rep-income-val').textContent = 'S/ ' + (r.income || 0).toLocaleString('es-PE');
  }
});
$('btn-print-action').addEventListener('click', () => { document.querySelector('[data-page="producer"]').click(); window.print(); });

// ========================================================
// PIPELINE DE DATOS CLIENT-SIDE Y AUDITORÍA
// ========================================================
$('excel-input').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;

  $('status-text').innerHTML = `⏳ Analizando y limpiando base de datos: ${file.name}...`;

  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const rawJson = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {defval: null});
  
  if (rawJson.length === 0) {
    alert("El Excel está vacío.");
    return;
  }

  // 1. Auditoría de Columnas Requeridas
  const requiredCols = ['codigo_productora', 'cooperativa', 'area_cafe_reportada', 'monto_solicitado_pen', 'actividad_a_financiar'];
  const excelCols = Object.keys(rawJson[0]);
  const missingCols = requiredCols.filter(col => !excelCols.includes(col));
  
  let auditHTML = "";
  if (missingCols.length > 0) {
    $('status-text').innerHTML = `❌ Error Crítico: Incumplimiento de Contrato de Datos. Faltan columnas.`;
    $('status-banner').classList.add('warning');
    auditHTML += `<tr><td>Columnas Obligatorias</td><td>Faltan: ${missingCols.join(', ')}</td><td><span style="color:red; font-weight:700;">✗ Rechazado</span></td></tr>`;
    $('quality-table-body').innerHTML = auditHTML;
    return; // Detiene la ejecución si la base no sirve
  } else {
    auditHTML += `<tr><td>Columnas Obligatorias</td><td>100% completas</td><td><span style="color:green; font-weight:700;">✓ Aprobado</span></td></tr>`;
  }

  // 2. Limpieza, Padronización y Detección de Duplicados
  const uniqueCodes = new Set();
  let duplicates = 0;
  let nullIncomes = 0;

  const parsed = [];
  rawJson.forEach((r, i) => {
    // Check duplicados
    const code = r.codigo_productora || `REG-${i+1}`;
    if (uniqueCodes.has(code)) {
      duplicates++;
      return; // Saltar duplicados
    }
    uniqueCodes.add(code);

    // Regla de Transformación: Agrupación de Actividades
    let rawAct = String(r.actividad_a_financiar || 'NO ESPECIFICADO').toUpperCase();
    let cleanAct = rawAct;
    if (rawAct.includes('CUY') || rawAct.includes('GALLINA') || rawAct.includes('CERDO') || rawAct.includes('CRIANZA')) {
      cleanAct = 'CRIANZA DE ANIMALES';
    } else if (rawAct.includes('BODEGA') || rawAct.includes('APICULTURA') || rawAct.includes('CAFE') || rawAct.includes('CAFÉ')) {
      cleanAct = 'EMPRENDIMIENTO / OTROS';
    } else if (rawAct.includes('FERTILIZA')) {
      cleanAct = 'FERTILIZACIÓN';
    } else if (rawAct.includes('DIVERSIFICA')) {
      cleanAct = 'DIVERSIFICACIÓN';
    }

    if (!r.ingreso_principal_pen_2025) nullIncomes++;

    parsed.push({
      code: code,
      coop: String(r.cooperativa || 'NORANDINO').toUpperCase(),
      territory: r.distrito || r.provincia || 'General',
      base: r.base_sector || 'General',
      area: Number(r.area_cafe_reportada || 0),
      qq: Number(r.quintales_acopiados_2025 || 0),
      amount: Number(r.monto_solicitado_pen || 0),
      income: Number(r.ingreso_principal_pen_2025 || 0), // Si es nulo asume 0
      age: Number(r.edad_al_cierre_2025 || 40), // Imputación básica
      family: Number(r.n_familiares_convivientes || 3),
      years: Number(r.antiguedad_socio_titular_anios || 5),
      activity: cleanAct,
      phone: r.tipo_celular_beneficiaria || 'SMARTPHONE',
      literacy: r.dificultad_lectoescritura || 'NINGUNA'
    });
  });

  // Mostrar resultados de la auditoría en la pestaña 6
  auditHTML += `<tr><td>Registros Duplicados</td><td>${duplicates} encontrados y eliminados</td><td><span style="color:${duplicates>0?'orange':'green'}; font-weight:700;">${duplicates>0?'! Limpiado':'✓ Limpio'}</span></td></tr>`;
  auditHTML += `<tr><td>Consistencia (Ingresos Nulos)</td><td>${nullIncomes} nulos detectados (imputados a 0)</td><td><span style="color:${nullIncomes>0?'orange':'green'}; font-weight:700;">${nullIncomes>0?'! Mitigado':'✓ Limpio'}</span></td></tr>`;
  auditHTML += `<tr><td>Padronización Categorías</td><td>Actividades agrupadas exitosamente</td><td><span style="color:green; font-weight:700;">✓ Aprobado</span></td></tr>`;
  
  $('quality-table-body').innerHTML = auditHTML;
  $('status-text').innerHTML = `✅ <strong>Éxito:</strong> Base limpiada. ${parsed.length} registros cargados correctamente.`;
  $('status-banner').classList.remove('warning');

  rawData = typeof computePCAClientSide === "function" ? computePCAClientSide(parsed) : parsed;
  populateSelects();
  applyFilters();
  
  // Forzar actualización a la pestaña de auditoría visualmente
  document.querySelector('[data-page="quality"]').classList.add('pulse');
  setTimeout(() => document.querySelector('[data-page="quality"]').classList.remove('pulse'), 3000);
});

// Inicialización
populateSelects();
applyFilters();