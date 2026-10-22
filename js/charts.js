let chartInstances = {};

function renderCharts(filteredData) {
  // Destruir gráficos previos para evitar sobreposición al filtrar
  Object.values(chartInstances).forEach(c => c.destroy());

  if (filteredData.length === 0) return;

  // ==========================================
  // PESTAÑA 1: RESUMEN Y PCA
  // ==========================================
  const pcaCtx = document.getElementById('chart-pca').getContext('2d');
  const norData = filteredData.filter(r => r.coop === 'NORANDINO').map(r => ({ x: r.pc1, y: r.pc2 }));
  const bgData = filteredData.filter(r => r.coop === 'BAGUA GRANDE').map(r => ({ x: r.pc1, y: r.pc2 }));

  chartInstances.pca = new Chart(pcaCtx, {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'Norandino', data: norData, backgroundColor: '#123F24' },
        { label: 'Bagua Grande', data: bgData, backgroundColor: '#8A5424' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'PC1: Escala Productiva' } },
        y: { title: { display: true, text: 'PC2: Perfil Demográfico' } }
      }
    }
  });

  // ==========================================
  // PESTAÑA 2: PRODUCCIÓN Y ACOPIO
  // ==========================================
  const qqCtx = document.getElementById('chart-qq-coop').getContext('2d');
  const coops = [...new Set(filteredData.map(r => r.coop))];
  const qqByCoop = coops.map(c => filteredData.filter(r => r.coop === c).reduce((t, r) => t + r.qq, 0));

  chartInstances.qqCoop = new Chart(qqCtx, {
    type: 'bar',
    data: {
      labels: coops,
      datasets: [{ label: 'Quintales Totales', data: qqByCoop, backgroundColor: ['#123F24', '#8A5424'] }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const yieldCtx = document.getElementById('chart-yield').getContext('2d');
  const yieldData = filteredData.map(r => ({
    x: r.area,
    y: r.area > 0 ? Number((r.qq / r.area).toFixed(2)) : 0
  }));

  chartInstances.yield = new Chart(yieldCtx, {
    type: 'scatter',
    data: {
      datasets: [{ label: 'Rendimiento qq/ha', data: yieldData, backgroundColor: '#729267' }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'Área Reportada (ha)' } },
        y: { title: { display: true, text: 'Rendimiento (qq/ha)' } }
      }
    }
  });

  // ==========================================
  // PESTAÑA 3: DEMANDA DE CRÉDITO
  // ==========================================
  const actCtx = document.getElementById('chart-activities').getContext('2d');
  const activities = [...new Set(filteredData.map(r => r.activity))];
  const actCounts = activities.map(a => filteredData.filter(r => r.activity === a).length);

  chartInstances.activities = new Chart(actCtx, {
    type: 'doughnut',
    data: {
      labels: activities,
      datasets: [{ data: actCounts, backgroundColor: ['#123F24', '#8A5424', '#DEC199', '#729267'] }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const amtCtx = document.getElementById('chart-amounts').getContext('2d');
  const bins = {'< S/1000': 0, 'S/1000 - S/2000': 0, 'S/2000 - S/3000': 0, '> S/3000': 0};
  filteredData.forEach(r => {
    if(r.amount < 1000) bins['< S/1000']++;
    else if(r.amount <= 2000) bins['S/1000 - S/2000']++;
    else if(r.amount <= 3000) bins['S/2000 - S/3000']++;
    else bins['> S/3000']++;
  });

  chartInstances.amounts = new Chart(amtCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(bins),
      datasets: [{ label: 'N° de Solicitudes', data: Object.values(bins), backgroundColor: '#315F2D' }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // ==========================================
  // PESTAÑA 4: INCLUSIÓN Y DIGITAL
  // ==========================================
  const phoneCtx = document.getElementById('chart-phone').getContext('2d');
  const phones = [...new Set(filteredData.map(r => r.phone))];
  const phoneCounts = phones.map(p => filteredData.filter(r => r.phone === p).length);

  chartInstances.phone = new Chart(phoneCtx, {
    type: 'pie',
    data: {
      labels: phones,
      datasets: [{ data: phoneCounts, backgroundColor: ['#123F24', '#DEC199', '#8A5424'] }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const litCtx = document.getElementById('chart-literacy').getContext('2d');
  const lits = [...new Set(filteredData.map(r => r.literacy))];
  const litCounts = lits.map(l => filteredData.filter(r => r.literacy === l).length);

  chartInstances.literacy = new Chart(litCtx, {
    type: 'bar',
    data: {
      labels: lits,
      datasets: [{ label: 'Frecuencia', data: litCounts, backgroundColor: '#8A5424' }]
    },
    options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' }
  });
}