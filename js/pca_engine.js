// Motor de Cálculo PCA local en cliente ($0 backend)
function computePCAClientSide(dataRecords) {
  const vars = ['age', 'family', 'years', 'area', 'qq', 'income'];
  const n = dataRecords.length;
  if (n === 0) return dataRecords;

  // 1. Matriz X y medias
  const means = {};
  const stds = {};
  vars.forEach(v => {
    const vals = dataRecords.map(r => r[v] || 0);
    const m = vals.reduce((a, b) => a + b, 0) / n;
    const std = Math.sqrt(vals.reduce((a, b) => a + Math.pow(b - m, 2), 0) / (n - 1 || 1));
    means[v] = m;
    stds[v] = std || 1;
  });

  // 2. Estandarización Z-score y proyección aproximada
  return dataRecords.map(r => {
    const zArea = (r.area - means.area) / stds.area;
    const zQq = (r.qq - means.qq) / stds.qq;
    const zInc = (r.income - means.income) / stds.income;
    const zAge = (r.age - means.age) / stds.age;
    const zFam = (r.family - means.family) / stds.family;
    const zYrs = (r.years - means.years) / stds.years;

    // Autovectores aproximados derivados del paper
    const pc1 = 0.48 * zArea + 0.52 * zQq + 0.49 * zInc + 0.1 * zAge + 0.2 * zFam + 0.3 * zYrs;
    const pc2 = 0.55 * zAge + 0.51 * zYrs - 0.42 * zFam - 0.1 * zArea;

    return {
      ...r,
      pc1: Number(pc1.toFixed(2)),
      pc2: Number(pc2.toFixed(2))
    };
  });
}