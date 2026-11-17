/* Gráficos con denominadores explícitos. Se recalculan con la selección. */
const PDCharts=(()=>{
 const D=PDData,charts={},palette=[...VIZ.cat,VIZ.gray],marks=['circle','triangle','rect','rectRot','crossRot'];
 const fmt=(v,d=2)=>v==null?'No calculable':v.toLocaleString('es-PE',{maximumFractionDigits:d,minimumFractionDigits:d});
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&','<':'<','>':'>','"':'"',"'":'''}[c]));
 const table=(headers,rows)=>`<table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
 const el=id=>document.getElementById(id);
 const measure=k=>k==='area'?'Área de café (hectáreas)':D.label(k);
 function chart(id,type,data,options={}){if(typeof Chart==='undefined')return;
  charts[id]=new Chart(el(id),{type,data,options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:false}},...options}});
 }
 const lineLabels={id:'percentLabels',afterDatasetsDraw(c){
  if(!c.options.pdPercent)return;
  const ctx=c.ctx;ctx.save();ctx.font="600 12px 'Segoe UI', sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';
  c.data.datasets.forEach((d,i)=>c.isDatasetVisible(i)&&c.getDatasetMeta(i).data.forEach((bar,j)=>{
   const width=Math.abs(bar.x-bar.base), x=(bar.x+bar.base)/2;
   let label=Math.round(d.data[j])+'%';
   const labelWidth=ctx.measureText(label).width+8;
   if(d.data[j]>=9 && width>=labelWidth+2){
    ctx.fillStyle='#fff';ctx.fillText(label,x,bar.y);
   }
  }));ctx.restore();
 }};
 if(typeof Chart!=='undefined'){Chart.defaults.font.family='Segoe UI, sans-serif';Chart.defaults.font.size=12;Chart.defaults.color='#46534A';Chart.register(lineLabels);}
 function scatter(id,rows,x,y,coops,opts={}){
  const datasets=coops.map(coop=>({label:groupLabel(coop),data:rows.filter(r=>r.coop===coop&&D.finite(r[x])&&D.finite(r[y])).map(r=>({x:r[x],y:r[y],code:r.code,ref:r})),backgroundColor:coopColor(coop),pointStyle:marks[Math.max(0,coops.indexOf(coop))%marks.length],pointRadius:4,pointHoverRadius:6})).filter(d=>d.data.length);
  // Group points by coordinates to handle overlapping points
  const allPoints = datasets.flatMap(d => d.data);
  const pointsByCoord = new Map();
  allPoints.forEach(p => {
    const key = `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    if (!pointsByCoord.has(key)) pointsByCoord.set(key, []);
    pointsByCoord.get(key).push(p);
  });
  const chartObj = chart(id,'scatter',{datasets},{
    plugins:{
      legend:{display:true,position:'top',labels:{usePointStyle:true}},
      tooltip:{
        callbacks:{
          label: c => {
            const raw = c.raw;
            const key = `${raw.x.toFixed(2)},${raw.y.toFixed(2)}`;
            const producers = pointsByCoord.get(key) || [raw];
            if (producers.length === 1) {
              return `${raw.code}: ${opts.xLabel||measure(x)} ${fmt(raw.x)}, ${opts.yLabel||measure(y)} ${fmt(raw.y)}${raw.ref?.coop?', '+groupLabel(raw.ref.coop):''}`;
            } else {
              const codes = producers.map(p => p.code).join(', ');
              return `${producers.length} productoras en esta posición: ${codes} — ${opts.xLabel||measure(x)} ${fmt(raw.x)}, ${opts.yLabel||measure(y)} ${fmt(raw.y)}`;
            }
          }
        }
      }
    },
    scales:{x:{title:{display:true,text:opts.xLabel||measure(x)}},y:{title:{display:true,text:opts.yLabel||measure(y)}}},
    onClick: (e, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const dataset = chartObj.data.datasets[element.datasetIndex];
        const point = dataset.data[element.index];
        const key = `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
        const producers = pointsByCoord.get(key) || [point];
        showProducerList(producers, opts.xLabel||measure(x), opts.yLabel||measure(y), point.x, point.y);
      }
    }
  });
 }
 function renderOverview(rows){
  const model=PDResumen.overview(rows),level={territory:'distrito',base:'grupo local',coop:'cooperativa',selection:'selección'}[model.level];
  const metrics=[
   {key:'amount',suffix:'amount',label:'Monto solicitado',unit:'S/',digits:2,color:VIZ.cat[0]},
   {key:'area',suffix:'area',label:'Área de café',unit:'hectáreas',digits:2,color:VIZ.cat[2]},
   {key:'qq',suffix:'qq',label:'Café entregado',unit:'quintales',digits:2,color:VIZ.cat[1]}
  ];
  let visible=false;
  metrics.forEach(metric=>{
   const id='overview-'+metric.suffix+'-chart',canvas=el(id),article=canvas.closest('article');
   const groups=PDResumen.metricGroups(rows,metric.key);
   article.hidden=!groups.length;
   if(!groups.length)return;
   visible=true;
   const title=model.level==='selection'?`${metric.label} en la selección`:`${metric.label} por ${level}`;
   el('overview-'+metric.suffix+'-title').textContent=title;
   canvas.setAttribute('aria-label',title);
   const plotted=groups.length>10
    ? [...groups.slice(0,9),groups.slice(9).reduce((other,group)=>({
       name:'Otros grupos',records:other.records+group.records,answered:other.answered+group.answered,total:other.total+group.total
     }),{name:'Otros grupos',records:0,answered:0,total:0})]
    : groups;
   el('overview-'+metric.suffix+'-note').textContent=`Suma de los valores disponibles; cada barra incluye ${metric.label.toLowerCase()} con dato.`
    +(groups.length>10?' Los grupos restantes se reúnen en «Otros grupos».':'');
   const formatTotal=total=>(metric.unit==='S/'?'S/ ':'')+fmt(total,metric.digits)+(metric.unit==='S/'?'':' '+metric.unit);
   el('overview-'+metric.suffix+'-table').innerHTML=table(
    ['Grupo','Con dato','Total'],
    groups.map(group=>[groupLabel(group.name),`${group.answered} de ${group.records}`,formatTotal(group.total)])
   );
   const chartBox=canvas.closest('.chart-box');
   chartBox.style.height=`${Math.max(240,plotted.length*46+76)}px`;
   chart(id,'bar',{labels:plotted.map(group=>{const n=groupLabel(group.name),i=n.indexOf(' - ');return i>0?[n.slice(0,i),n.slice(i+3)]:n;}),
    datasets:[{label:metric.label,data:plotted.map(group=>group.total),backgroundColor:metric.color,borderRadius:4,maxBarThickness:30}]},{
    indexAxis:'y',
    plugins:{
     legend:{display:false},
     tooltip:{callbacks:{label:context=>{
      const group=plotted[context.dataIndex];
      return `${formatTotal(group.total)} · ${group.answered} de ${group.records} con dato`;
     }}}
    },
    scales:{x:{beginAtZero:true,title:{display:true,text:metric.unit==='S/'?'Soles':metric.unit},ticks:{callback:value=>metric.unit==='S/'?'S/ '+Number(value).toLocaleString('es-PE'):Number(value).toLocaleString('es-PE')}}}
   });
  });
  el('overview-charts').hidden=!visible;
 }
 const NICE={SMARTPHONE:'Smartphone',BASICO:'Celular de teclas','SIN DATO':'Vacío','OTRO / REVISAR':'Otra respuesta',LECTURA:'Dificultad para leer',ESCRITURA:'Dificultad para escribir',AMBAS:'Dificultad para leer y escribir','FERTILIZACIÓN':'Fertilización','CRIANZA DE ANIMALES':'Crianza de animales','EMPRENDIMIENTO / OTROS':'Emprendimiento u otros',TITULAR:'Ella es la socia titular',CONYUGE:'Su cónyuge es el socio titular',PADRE:'Su padre es el socio titular'};
 const nice=(cat,key)=>cat==='NINGUNO'&&key==='phone'?'Sin celular':cat==='NINGUNA'?'Sin dificultad':NICE[cat]||prettyLabel(cat);
 function stacked(id,rows,key,coops,allRows){
  const visible=showChart(id,rows.some(r=>r[key]!=null)&&coops.some(c=>rows.filter(r=>r.coop===c&&r[key]!=null).length>=MIN_N));
  if(!visible)return false;
  const domain=[...new Set(allRows.map(r=>r[key]).filter(v=>v!=null))].sort();
  const groups=coops.map(coop=>{
   const group=rows.filter(r=>r.coop===coop);
   return {coop, total:group.length, answers:group.filter(r=>r[key]!=null)};
  }).filter(g=>g.answers.length>=MIN_N);
  const categories=domain.filter(cat=>groups.some(g=>g.answers.some(r=>r[key]===cat)));
  const ns=groups.map(g=>g.answers.length);
  const counts=categories.map(cat=>groups.map(g=>g.answers.filter(r=>r[key]===cat).length));
  const index=cat=>domain.indexOf(cat)%palette.length;
  const useChart=groups.length<=8 && new Set(categories.map(index)).size===categories.length;
  const wrapper=el(id).closest('.chart-box'), detail=el(id+'-table').closest('details');
  if(!useChart || wrapper.hidden) detail.open=!useChart;
  wrapper.hidden=!useChart;
  if(useChart){
   const datasets=categories.map((cat,k)=>({
    label:nice(cat,key),counts:counts[k],data:counts[k].map((n,j)=>100*n/ns[j]),
    backgroundColor:palette[index(cat)],borderWidth:0,barThickness:'flex',maxBarThickness:46
   }));
   chart(id,'bar',{labels:groups.map(g=>groupLabel(g.coop)),datasets},{
    indexAxis:'y',pdPercent:true,
    plugins:{legend:{display:true,position:'bottom',onClick:()=>{},labels:{boxWidth:12,padding:14}},
     tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.raw,1)}% (${counts[c.datasetIndex][c.dataIndex]} de ${ns[c.dataIndex]})`}}},
    scales:{x:{stacked:true,min:0,max:100,grid:{color:'#E8EEE9'},ticks:{callback:v=>v+'%',stepSize:25}},y:{stacked:true,grid:{display:false}}}
   });
  }
  el(id+'-table').innerHTML=groups.map((g,j)=>`<h4>${esc(groupLabel(g.coop))} · ${ns[j]} de ${g.total} respondieron</h4>`+
   table(['Respuesta','Productoras','%'],categories.map((cat,k)=>[nice(cat,key),counts[k][j]+' de '+ns[j],fmt(100*counts[k][j]/ns[j],1)+' %']))).join('');
  return true;
 }
 function showChart(id,visible){
  el(id).closest('article').hidden=!visible;
  return !!visible;
 }

 /* ---------- Boxplot renderer ---------- */
 function renderBoxplot(id, rows, coops, key, label, unit, digits, allRows) {
  const groups = coops.map(coop => ({
    coop,
    values: rows.filter(r => r.coop === coop && D.finite(r[key])).map(r => r[key])
  })).filter(g => g.values.length >= MIN_N);

  if (!groups.length) {
    el(id).closest('article').hidden = true;
    return false;
  }
  el(id).closest('article').hidden = false;

  // Calculate quartiles, median, mean, whiskers
  const stats = groups.map(g => {
    const sorted = [...g.values].sort((a,b)=>a-b);
    const q1 = quantile(sorted, 0.25);
    const q3 = quantile(sorted, 0.75);
    const med = D.median(sorted);
    const mean = D.mean(sorted);
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    const min = sorted.find(v => v >= lower) ?? sorted[0];
    const max = sorted.slice().reverse().find(v => v <= upper) ?? sorted[sorted.length-1];
    return { ...g, q1, q3, median: med, mean, min, max, lower, upper, iqr };
  });

  const formatV = v => (unit === 'S/' ? 'S/ ' : '') + fmt(v, digits) + (unit === 'S/' ? '' : ' ' + unit);

  // Build datasets for boxplot
  const datasets = stats.map((s, i) => ({
    label: groupLabel(s.coop),
    data: [{
      min: s.min,
      q1: s.q1,
      median: s.median,
      q3: s.q3,
      max: s.max,
      mean: s.mean
    }],
    backgroundColor: coopColor(s.coop) + '40',
    borderColor: coopColor(s.coop),
    borderWidth: 2,
    outlierColor: coopColor(s.coop),
    outlierRadius: 3,
    pointStyle: 'rect',
    width: 0.5
  }));

  chart(id, 'boxplot', { labels: stats.map(s => groupLabel(s.coop)), datasets }, {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => {
            const s = stats[ctx.dataIndex];
            return [
              `${groupLabel(s.coop)}`,
              `Total: ${formatV(s.values.reduce((a,b)=>a+b,0))}`,
              `Productoras: ${s.values.length}`,
              `Mediana: ${formatV(s.median)}`,
              `Media: ${formatV(s.mean)}`,
              `Q1: ${formatV(s.q1)}`,
              `Q3: ${formatV(s.q3)}`,
              `Mín: ${formatV(s.min)}`,
              `Máx: ${formatV(s.max)}`
            ];
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: unit === 'S/' ? 'Soles' : unit } }
    }
  });

  // Table
  el(id+'-table').innerHTML = table(
    ['Cooperativa', 'Productoras', 'Total ' + unit, 'Media', 'Mediana', 'Q1', 'Q3', 'Mín', 'Máx'],
    stats.map(s => [
      groupLabel(s.coop),
      s.values.length,
      formatV(s.values.reduce((a,b)=>a+b,0)),
      formatV(s.mean),
      formatV(s.median),
      formatV(s.q1),
      formatV(s.q3),
      formatV(s.min),
      formatV(s.max)
    ])
  );

  return true;
 }

 function quantile(sorted, q) {
  if (!sorted.length) return null;
  const i = (sorted.length - 1) * q;
  const j = Math.floor(i);
  return sorted[j] + (sorted[Math.ceil(i)] - sorted[j]) * (i - j);
 }

 /* ---------- Producer list for overlapping points ---------- */
 let producerListOverlay = null;

 function showProducerList(producers, xLabel, yLabel, xVal, yVal) {
  // Remove existing overlay
  if (producerListOverlay) {
    producerListOverlay.remove();
  }

  const overlay = document.createElement('div');
  overlay.className = 'producer-list-overlay';
  overlay.innerHTML = `
    <div class="producer-list-panel">
      <div class="producer-list-header">
        <h4>Productoras en esta posición</h4>
        <button type="button" class="producer-list-close" aria-label="Cerrar">✕</button>
      </div>
      <p class="producer-list-coords">${xLabel}: ${fmt(xVal,2)} | ${yLabel}: ${fmt(yVal,1)}</p>
      <div class="producer-list-items">
        ${producers.map((p, i) => `
          <div class="producer-list-item" data-index="${i}">
            <strong>${p.code}</strong>
            <span>${p.ref?.coop ? groupLabel(p.ref.coop) : ''}</span>
          </div>
        `).join('')}
      </div>
      ${producers.length > 1 ? `<p class="producer-list-count">${producers.length} productoras comparten estas coordenadas</p>` : ''}
    </div>
  `;

  document.body.appendChild(overlay);
  producerListOverlay = overlay;

  // Close on click outside or close button
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.classList.contains('producer-list-close')) {
      overlay.remove();
      producerListOverlay = null;
    }
  });

  // Close on Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape' && producerListOverlay) {
      producerListOverlay.remove();
      producerListOverlay = null;
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  // Focus trap
  const closeBtn = overlay.querySelector('.producer-list-close');
  closeBtn.focus();
 }

 function render(rows,allRows){
  Object.values(charts).forEach(c=>c.destroy());for(const k of Object.keys(charts))delete charts[k];
  renderOverview(rows);
  const coops=[...new Set(rows.map(r=>r.coop))].sort(),groups=groupRows(rows,'coop');

  // Production: Boxplot for café entregado instead of median bars
  const coffee = renderBoxplot('chart-qq-coop', rows, coops, 'qq', 'Café entregado', 'quintales', 1, allRows);
  if (coffee) {
    const stats = groups.map(([c,rs])=>{const vals=rs.map(r=>r.qq).filter(D.finite);return {c,n:vals.length,median:D.median(vals)};}).filter(s=>s.n>=MIN_N);
    // Update the note and title
    const article = el('chart-qq-coop').closest('article');
    const h3 = article.querySelector('h3');
    h3.textContent = 'Distribución del café entregado por cooperativa';
    const note = article.querySelector('.chart-note');
    if (note) note.textContent = 'Cada caja va del primer al tercer cuartil; la línea central es la mediana. El rombo marca la media. Los bigotes llegan a 1,5 × IQR.';
  }

  const pairGroups=groupRows(rows.filter(r=>D.finite(r.area)&&D.finite(r.qq)),'coop').filter(([,r])=>r.length>=MIN_N);
  const pairs=pairGroups.flatMap(([,r])=>r);
  const yieldPlot=showChart('chart-yield',pairs.length);
  if(yieldPlot){
   scatter('chart-yield',pairs,'area','qq',coops,{tooltip:p=>[fmt(p.x,2)+' hectáreas',fmt(p.y,1)+' quintales', 'Código: '+p.code, 'Cooperativa: '+groupLabel(p.ref.coop)]});
   el('chart-yield-table').innerHTML=table(['Cooperativa','Registros con ambos datos'],groupRows(pairs,'coop').map(([g,r])=>[groupLabel(g),r.length]));
  }
  const activities=stacked('chart-activities',rows,'activity',coops,allRows);
  const phone=stacked('chart-phone',rows,'phone',coops,allRows),literacy=stacked('chart-literacy',rows,'literacy',coops,allRows);
  const kinship=stacked('chart-kinship',rows,'kinship',coops,allRows);
  if(kinship){
   const zones=new Map();
   rows.filter(r=>r.kinship!=null).forEach(r=>{const z=PDResumen.place(r)||'Ubicación vacía';if(!zones.has(z))zones.set(z,[]);zones.get(z).push(r);});
   el('chart-kinship-table').insertAdjacentHTML('beforeend','<h4>Por distrito y provincia</h4>'+table(['Distrito y provincia','Productoras','Socias titulares'],
    [...zones].sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0],'es')).map(([z,g])=>[z,g.length,g.filter(r=>r.kinship==='TITULAR').length+' de '+g.length])));
  }
  const frequent = new Map(D.commonAmounts(rows,{top:Infinity,minN:MIN_N}).map(g=>[g.coop,g]));
  const amountGroups=groups.map(([coop,group])=>[coop,group.map(r=>r.amount).filter(D.finite)]).filter(([,v])=>v.length>=MIN_N);
  const amounts=!!amountGroups.length;
  el('amount-pattern').hidden=!amounts;
  const pen=v=>'S/ '+v.toLocaleString('es-PE',{maximumFractionDigits:2});
  el('chart-amounts-table').innerHTML=table(['Cooperativa','Con monto','Mediana','Monto más repetido'],amountGroups.map(([coop,values])=>{
   const top=frequent.get(coop).top, first=top[0], tied=top.filter(item=>item.count===first.count);
   const modes=tied.slice(0,2).map(item=>pen(item.amount)).join(' / ')+(tied.length>2?' y '+(tied.length-2)+' más':'');
   const most=first.count<2?'Sin repetición':modes+' · '+first.count+' de '+values.length+(tied.length>1?' cada uno':'');
   return [groupLabel(coop),values.length,pen(D.median(values)),most];
  }));
  if (amounts) {
   const scale=D.amountScale(allRows.map(r=>r.amount));
   const format=v=>v.toLocaleString('es-PE',{maximumFractionDigits:2});
   const labels=scale.bins.map(([lo,hi])=>scale.exact?format(lo):format(lo)+'–<'+format(hi));
   const counts=amountGroup=>{
    const data=Array(labels.length).fill(0);
    amountGroup.forEach(v=>data[scale.indexOf(v)]++);
    return data;
   };
   const by=amountGroups.map(([coop,values])=>({name:groupLabel(coop),values:counts(values),color:coopColor(coop),n:values.length}));
   // Una sola serie si comparar muchos grupos ya no resulta legible.
   const visible=by.length<=4&&new Set(by.map(g=>g.color)).size===by.length?by:[{name:'Total',values:counts(amountGroups.flatMap(([,values])=>values)),color:VIZ.cat[0]}];
   chart('chart-amounts','bar',{labels,datasets:visible.map(g=>({label:g.name,data:g.values.map(n=>n||null),skipNull:true,backgroundColor:g.color,maxBarThickness:36,borderRadius:3}))},{
    interaction:{mode:'index',intersect:false},
    plugins:{legend:{display:true,position:'top',onClick:()=>{},labels:{boxWidth:12,
    }}},
    scales:{x:{title:{display:true,text:scale.exact?'Monto exacto (S/)':'Rango de monto (S/)'},grid:{display:false},ticks:{maxRotation:45}},
     y:{beginAtZero:true,title:{display:true,text:'Solicitudes'},ticks:{precision:0}}}
   });
   el('chart-amounts-frequency').innerHTML=table(
    [scale.exact?'Monto (S/)':'Rango (S/)',...by.map(g=>g.name)],
    labels.map((label,i)=>[label,...by.map(g=>g.values[i])]));
  }
  requestAnimationFrame(()=>Object.values(charts).forEach(c=>c.resize()));
  return {production:coffee||yieldPlot,inclusion:phone||literacy||kinship,credit:activities||amounts};
 }
 return {render,resize:()=>Object.values(charts).forEach(c=>c.resize()),table,esc,fmt,charts};
})();