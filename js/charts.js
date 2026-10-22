let chartInstances = {};

// Definición de paleta de colores del curso (CYAN/NAVY/GRAY/GREEN/RED/AMBER) adaptada a la marca PD
const colors = {
  primary: '#123F24', // Verde oscuro de PD
  secondary: '#E5E2DC', // Gris para el resto de categorías ("un color, el resto gris")
  highlight: '#729267' // Verde claro para acentos
};

function renderCharts(filteredData) {
  Object.values(chartInstances).forEach(c => c.destroy());
  if (filteredData.length === 0) return;

  // Configuración global para limpiar gráficos (reducir "ruido visual" según el curso)
  Chart.defaults.plugins.legend.display = false;
  const hideGridOptions = {
    x: { grid: { display: false, drawBorder: false } },
    y: { grid: { display: false, drawBorder: false } }
  };

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
        { label: 'Norandino', data: norData, backgroundColor: colors.primary, pointRadius: 4 },
        { label: 'Bagua Grande', data: bgData, backgroundColor: '#8A5424', pointRadius: 4 } // Color marca PD
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' },
        title: { display: true, text: 'Mayor Escala Productiva (Derecha) se asocia con Mayor Edad (Arriba)', font: { size: 14 } } // Título Narrativo
      },
      scales: {
        x: { title: { display: true, text: 'PC1: Escala Productiva' } },
        y: { title: { display: true, text: 'PC2: Perfil Demográfico (Edad)' } }
      }
    }
  });

  // ==========================================
  // PESTAÑA 2: PRODUCCIÓN Y ACOPIO
  // ==========================================
  const yieldCtx = document.getElementById('chart-yield').getContext('2d');
  const yieldData = filteredData.map(r => ({
    x: r.area,
    y: r.area > 0 ? Number((r.qq / r.area).toFixed(2)) : 0
  }));

  chartInstances.yield = new Chart(yieldCtx, {
    type: 'scatter',
    data: {
      datasets: [{ label: 'Rendimiento', data: yieldData, backgroundColor: colors.primary, pointRadius: 5 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'Concentración de bajos rendimientos en parcelas menores a 3ha', font: { size: 14 } }
      },
      scales: {
        x: { title: { display: true, text: 'Área Reportada (ha)' }, grid: { display: false } },
        y: { title: { display: true, text: 'Rendimiento (qq/ha)' } }
      }
    }
  });

  const qqCtx = document.getElementById('chart-qq-coop').getContext('2d');
  const coops = [...new Set(filteredData.map(r => r.coop))];
  const qqByCoop = coops.map(c => filteredData.filter(r => r.coop === c).reduce((t, r) => t + r.qq, 0));
  
  // Encontrar el índice de la barra más grande
  const maxQqIndex = qqByCoop.indexOf(Math.max(...qqByCoop));
  const qqBgColors = qqByCoop.map((_, i) => i === maxQqIndex ? colors.primary : colors.secondary);

  chartInstances.qqCoop = new Chart(qqCtx, {
    type: 'bar', // Comparamos volúmenes
    data: {
      labels: coops,
      datasets: [{ data: qqByCoop, backgroundColor: qqBgColors }] // Regla: un color, el resto gris
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: `${coops[maxQqIndex]} lidera el volumen de acopio reportado`, font: { size: 14 } }
      },
      scales: hideGridOptions
    }
  });

  // ==========================================
  // PESTAÑA 3: DEMANDA DE CRÉDITO
  // ==========================================
  const actCtx = document.getElementById('chart-activities').getContext('2d');
  const activities = [...new Set(filteredData.map(r => r.activity))];
  const actCounts = activities.map(a => filteredData.filter(r => r.activity === a).length);
  
  // Regla: Barras horizontales para comparar categorías largas. "Un color, el resto gris"
  const maxActIndex = actCounts.indexOf(Math.max(...actCounts));
  const actBgColors = actCounts.map((_, i) => i === maxActIndex ? colors.primary : colors.secondary);

  chartInstances.activities = new Chart(actCtx, {
    type: 'bar',
    data: {
      labels: activities,
      datasets: [{ data: actCounts, backgroundColor: actBgColors }]
    },
    options: { 
      responsive: true, maintainAspectRatio: false, indexAxis: 'y', // Convertir a barras horizontales
      plugins: {
        title: { display: true, text: `La mayor demanda de crédito es para ${activities[maxActIndex]}`, font: { size: 14 } }
      },
      scales: hideGridOptions
    }
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
    type: 'bar', // Histograma
    data: {
      labels: Object.keys(bins),
      datasets: [{ data: Object.values(bins), backgroundColor: colors.primary }]
    },
    options: { 
      responsive: true, maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'Distribución de Montos Solicitados (S/)', font: { size: 14 } }
      },
      scales: { x: { grid: { display: false } }, y: { grid: { display: false } } }
    }
  });

  // ==========================================
  // PESTAÑA 4: INCLUSIÓN Y DIGITAL
  // ==========================================
  const phoneCtx = document.getElementById('chart-phone').getContext('2d');
  const phones = [...new Set(filteredData.map(r => r.phone))];
  const phoneCounts = phones.map(p => filteredData.filter(r => r.phone === p).length);
  
  // Cambiamos pie por barras para ver proporción clara
  const maxPhoneIndex = phoneCounts.indexOf(Math.max(...phoneCounts));
  const phoneBgColors = phoneCounts.map((_, i) => i === maxPhoneIndex ? colors.primary : colors.secondary);

  chartInstances.phone = new Chart(phoneCtx, {
    type: 'bar',
    data: {
      labels: phones,
      datasets: [{ data: phoneCounts, backgroundColor: phoneBgColors }]
    },
    options: { 
      responsive: true, maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: `Predomina el uso de celular tipo ${phones[maxPhoneIndex]}`, font: { size: 14 } }
      },
      scales: hideGridOptions
    }
  });

  const litCtx = document.getElementById('chart-literacy').getContext('2d');
  const lits = [...new Set(filteredData.map(r => r.literacy))];
  const litCounts = lits.map(l => filteredData.filter(r => r.literacy === l).length);
  const maxLitIndex = litCounts.indexOf(Math.max(...litCounts));
  const litBgColors = litCounts.map((_, i) => i === maxLitIndex ? colors.primary : colors.secondary);

  chartInstances.literacy = new Chart(litCtx, {
    type: 'bar',
    data: {
      labels: lits,
      datasets: [{ data: litCounts, backgroundColor: litBgColors }]
    },
    options: { 
      responsive: true, maintainAspectRatio: false, indexAxis: 'y', // Barras horizontales
      plugins: {
        title: { display: true, text: 'Nivel de dificultad de lectoescritura declarada', font: { size: 14 } }
      },
      scales: hideGridOptions
    }
  });
}