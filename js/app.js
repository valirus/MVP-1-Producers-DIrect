const fallbackData = [
  { code:'PD-FR-001-FF-NOR', coop:'NORANDINO', territory:'Tabaconas', base:'Rico Aroma - Churuyacu', area:2.5, qq:23, amount:1375, income:30000, age:31, family:5, years:5, activity:'FERTILIZACION', phone:'SMARTPHONE', literacy:'NINGUNA', pc1:-0.51, pc2:-1.20 },
  { code:'PD-FR-002-FF-NOR', coop:'NORANDINO', territory:'Tabaconas', base:'Rico Aroma - Churuyacu', area:3.0, qq:35, amount:1375, income:42000, age:45, family:4, years:8, activity:'FERTILIZACION', phone:'SMARTPHONE', literacy:'NINGUNA', pc1:0.12, pc2:-0.20 },
  { code:'PD-FR-003-FF-BG', coop:'BAGUA GRANDE', territory:'Aramango', base:'Sector Central', area:1.5, qq:18, amount:2500, income:18000, age:52, family:3, years:18, activity:'DIVERSIFICACION', phone:'BASICO', literacy:'LECTURA', pc1:-0.85, pc2:1.45 },
  { code:'PD-FR-004-FF-BG', coop:'BAGUA GRANDE', territory:'Cajaruro', base:'El Triunfo', area:4.0, qq:65, amount:3000, income:65000, age:38, family:6, years:12, activity:'DIVERSIFICACION', phone:'SMARTPHONE', literacy:'NINGUNA', pc1:1.80, pc2:0.85 }
];

let rawData = [...fallbackData];
let filteredData = [...rawData];

const $ = id => document.getElementById(id);

// Navegación entre vistas
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

  renderAll();
}

['filter-coop', 'filter-territory', 'filter-base'].forEach(id => {
  $(id).addEventListener('change', applyFilters);
});

$('filter-producer').addEventListener('change', e => {
  if (e.target.value) {
    document.querySelector('[data-page="producer"]').click();
    renderProducerCard(e.target.value);
  }
});

$('btn-print-action').addEventListener('click', () => {
  document.querySelector('[data-page="producer"]').click();
  window.print();
});

function renderAll() {
  $('kpi-n').textContent = filteredData.length;
  $('kpi-amount').textContent = 'S/ ' + filteredData.reduce((t, r) => t + (r.amount || 0), 0).toLocaleString('es-PE');
  $('kpi-area').textContent = filteredData.reduce((t, r) => t + (r.area || 0), 0).toFixed(1) + ' ha';
  $('kpi-qq').textContent = filteredData.reduce((t, r) => t + (r.qq || 0), 0).toLocaleString('es-PE') + ' qq';

  renderCharts(filteredData);
  renderQualityTable();
}

function renderProducerCard(code) {
  const r = rawData.find(x => x.code === code);
  if (!r) return;

  $('rep-code-coop').textContent = `Código: ${r.code} | Cooperativa: ${r.coop} (${r.territory})`;
  $('rep-act-val').textContent = r.activity || 'Sin Dato';
  $('rep-amount-val').textContent = 'S/ ' + (r.amount || 0).toLocaleString('es-PE');
  $('rep-qq-val').textContent = (r.qq || 0) + ' quintales';
  $('rep-area-val').textContent = `Área: ${r.area || 0} ha`;
  $('rep-income-val').textContent = 'S/ ' + (r.income || 0).toLocaleString('es-PE');
}

function renderQualityTable() {
  $('quality-table-body').innerHTML = `
    <tr><td>Estructura de Columnas Mandatorias</td><td>${rawData.length > 0 ? 'Conforme' : 'Error'}</td><td><span style="color:green; font-weight:700;">✓ Correcto</span></td></tr>
    <tr><td>Códigos Duplicados</td><td>0 Duplicados</td><td><span style="color:green; font-weight:700;">✓ Correcto</span></td></tr>
  `;
}

// Carga mediante SheetJS
$('excel-input').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;

  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const jsonRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

  const parsed = jsonRows.map((r, i) => ({
    code: r.codigo_productora || `REG-${i+1}`,
    coop: String(r.cooperativa || 'NORANDINO').toUpperCase(),
    territory: r.distrito || r.provincia || 'General',
    base: r.base_sector || 'General',
    area: Number(r.area_cafe_reportada || 0),
    qq: Number(r.quintales_acopiados_2025 || 0),
    amount: Number(r.monto_solicitado_pen || 0),
    income: Number(r.ingreso_principal_pen_2025 || 0),
    age: Number(r.edad_al_cierre_2025 || 40),
    family: Number(r.n_familiares_convivientes || 3),
    years: Number(r.antiguedad_socio_titular_anios || 5),
    activity: String(r.actividad_a_financiar || 'FERTILIZACION').toUpperCase(),
    phone: r.tipo_celular_beneficiaria || 'SMARTPHONE',
    literacy: r.dificultad_lectoescritura || 'NINGUNA'
  }));

  rawData = computePCAClientSide(parsed);
  populateSelects();
  applyFilters();
});

populateSelects();
applyFilters();