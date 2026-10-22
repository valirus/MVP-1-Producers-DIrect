let chartInstances = {};

function renderCharts(filteredData) {
  Object.values(chartInstances).forEach(c => c.destroy());

  // Scatter PCA
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
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'PC1: Escala Productivo-Económica' } },
        y: { title: { display: true, text: 'PC2: Perfil Demográfico & Antigüedad' } }
      }
    }
  });

  // Quintales por Coop
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
}