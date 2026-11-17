/* Boxplot implementation for Chart.js 4.x using custom draw */
(function() {
  'use strict';

  if (typeof Chart === 'undefined') return;

  // Custom boxplot controller that extends bar controller
  class BoxplotController extends Chart.controllers.bar {
    parsePrimitiveData(meta, data, start, count) {
      // Our data is objects with min, q1, median, q3, max, mean
      return data.map((d, i) => ({
        min: d.min,
        q1: d.q1,
        median: d.median,
        q3: d.q3,
        max: d.max,
        mean: d.mean,
        _custom: d
      }));
    }

    parseArrayData(meta, data, start, count) {
      return this.parsePrimitiveData(meta, data, start, count);
    }

    parseObjectData(meta, data, start, count) {
      return this.parsePrimitiveData(meta, data, start, count);
    }

    draw() {
      const meta = this._cachedMeta;
      const ctx = this.chart.ctx;
      const dataset = this.getDataset();
      const data = meta.data || [];
      const yScale = this.chart.scales.y;
      const xScale = this.chart.scales.x;

      data.forEach((element, index) => {
        if (element.hidden) return;

        const parsed = meta.parsed[index];
        if (!parsed || !parsed._custom) return;

        const custom = parsed._custom;
        const x = element.x;
        const y = element.y;
        const width = element.width;
        const halfWidth = width / 2;

        // Convert data values to pixels
        const min = yScale.getPixelForValue(custom.min);
        const q1 = yScale.getPixelForValue(custom.q1);
        const median = yScale.getPixelForValue(custom.median);
        const q3 = yScale.getPixelForValue(custom.q3);
        const max = yScale.getPixelForValue(custom.max);
        const mean = yScale.getPixelForValue(custom.mean);

        const borderColor = dataset.borderColor;
        const backgroundColor = dataset.backgroundColor;
        const borderWidth = dataset.borderWidth || 2;

        ctx.save();
        ctx.strokeStyle = borderColor;
        ctx.fillStyle = backgroundColor;
        ctx.lineWidth = borderWidth;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';

        // Draw whiskers (vertical lines from q1 to min and q3 to max)
        ctx.beginPath();
        // Lower whisker
        ctx.moveTo(x, q1);
        ctx.lineTo(x, min);
        // Upper whisker
        ctx.moveTo(x, q3);
        ctx.lineTo(x, max);
        ctx.stroke();

        // Draw whisker caps (horizontal lines at min and max)
        const capWidth = width * 0.5;
        ctx.beginPath();
        // Lower cap
        ctx.moveTo(x - capWidth/2, min);
        ctx.lineTo(x + capWidth/2, min);
        // Upper cap
        ctx.moveTo(x - capWidth/2, max);
        ctx.lineTo(x + capWidth/2, max);
        ctx.stroke();

        // Draw box (q1 to q3)
        const boxTop = Math.min(q1, q3);
        const boxBottom = Math.max(q1, q3);
        const boxHeight = boxBottom - boxTop;

        ctx.beginPath();
        ctx.rect(x - halfWidth, boxTop, width, boxHeight);
        ctx.fill();
        ctx.stroke();

        // Draw median line
        ctx.beginPath();
        ctx.moveTo(x - halfWidth, median);
        ctx.lineTo(x + halfWidth, median);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = Math.max(2, borderWidth);
        ctx.stroke();

        // Draw mean marker (diamond/rombo)
        if (custom.mean != null && !isNaN(custom.mean)) {
          const markerSize = 6;
          ctx.beginPath();
          ctx.moveTo(x, mean - markerSize);
          ctx.lineTo(x + markerSize, mean);
          ctx.lineTo(x, mean + markerSize);
          ctx.lineTo(x - markerSize, mean);
          ctx.closePath();
          ctx.fillStyle = borderColor;
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      });
    }
  }

  // Register the controller
  Chart.register(BoxplotController);

  // Add default config for boxplot
  Chart.defaults.boxplot = {
    ...Chart.defaults.bar,
    indexAxis: 'y',
    scales: {
      x: { type: 'category', offset: true },
      y: { type: 'linear', beginAtZero: true }
    },
    datasets: {
      type: 'boxplot'
    }
  };
})();