/* Gráficos con denominadores explícitos. Se recalculan con la selección. */
const PDCharts=(()=>{
 const D=PDData,charts={},palette=[...VIZ.cat,VIZ.gray];
 const fmt=(v,d=2)=>v==null?'No calculable':v.toLocaleString('es-PE',{maximumFractionDigits:d,minimumFractionDigits:d});
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const table=(headers,rows)=>`<table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
 const el=id=>document.getElementById(id);
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
 // Cajas sin bigotes ni nube de puntos. La media y la mediana se dibujan en la misma escala.
 const coffeeBoxes={id:'coffeeBoxes',afterDatasetsDraw(c){
  if(!c.options.pdCoffeeStats)return;
  const ctx=c.ctx,meta=c.getDatasetMeta(0);ctx.save();
  c.options.pdCoffeeStats.forEach((s,i)=>{
   if(!s.n)return;
   const bar=meta.data[i],x=bar.x,w=Math.min(bar.width,62),y=c.scales.y;
   const median=y.getPixelForValue(s.median),mean=y.getPixelForValue(s.mean);
   ctx.strokeStyle='#152F27';ctx.lineWidth=3;
   ctx.beginPath();ctx.moveTo(x-w/2,median);ctx.lineTo(x+w/2,median);ctx.stroke();
   ctx.beginPath();ctx.moveTo(x,mean-5);ctx.lineTo(x+5,mean);ctx.lineTo(x,mean+5);ctx.lineTo(x-5,mean);ctx.closePath();
   ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=1.5;ctx.stroke();
  });ctx.restore();
 }};
 if(typeof Chart!=='undefined')Chart.register(coffeeBoxes);
 function renderCoffee(rows){
  const stats=PDResumen.coffeeDistribution(rows);
  // Incluso un grupo sin entregas tiene un estado explícito, sin inventar un cero.
  el('chart-qq-coop').closest('article').hidden=false;
  el('coffee-group-totals').style.setProperty('--coffee-groups',Math.max(1,stats.length));
  el('coffee-group-totals').innerHTML=stats.length?stats.map(s=>`<div><strong>${esc(groupLabel(s.coop))}</strong><span>${s.n?fmt(s.total)+' quintales':'Sin entregas con dato'}</span><small>${s.n} productoras con entrega válida${s.missing?' · '+s.missing+' sin dato':''}</small></div>`).join(''):'<p class="empty-state">No hay productoras en esta selección.</p>';
  const wrap=el('chart-qq-coop').closest('.chart-box');wrap.hidden=!stats.some(s=>s.n);
  if(stats.some(s=>s.n))chart('chart-qq-coop','bar',{labels:stats.map(s=>groupLabel(s.coop)),datasets:[{
   label:'Cuartiles del café entregado',data:stats.map(s=>s.n?[s.q1,s.q3]:null),
   backgroundColor:stats.map(s=>coopColor(s.coop)+'B3'),borderColor:stats.map(s=>coopColor(s.coop)),borderWidth:2,maxBarThickness:62
  }]},{pdCoffeeStats:stats,layout:{padding:{top:10}},plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>{
   const s=stats[c.dataIndex];return ['Q1: '+fmt(s.q1)+' quintales','Mediana: '+fmt(s.median)+' quintales','Q3: '+fmt(s.q3)+' quintales','Media: '+fmt(s.mean)+' quintales',s.n+' productoras con dato'];
  }}}},scales:{y:{beginAtZero:true,title:{display:true,text:'Quintales por productora'},suggestedMax:Math.max(1,...stats.filter(s=>s.n).map(s=>Math.max(s.q3,s.mean)))*1.1},x:{grid:{display:false}}}});
  el('chart-qq-coop-table').innerHTML=table(['Cooperativa','Productoras con dato','Sin dato','Total (quintales)','Q1','Mediana','Q3','Media'],stats.map(s=>[groupLabel(s.coop),s.n,s.missing,...[s.total,s.q1,s.median,s.q3,s.mean].map(v=>v==null?'Sin dato':fmt(v))]));
  return stats.some(s=>s.n);
 }
 let pointBuckets=[],pinnedPoint=false,lastPointEvent=null,currentPoint=-1,dismissedPoint=-1;
 function pointDetail(index,focus=false){
  const point=pointBuckets[index];if(!point)return;currentPoint=index;
  const panel=el('yield-point-panel');panel.hidden=false;
  el('yield-point-title').textContent=point.records.length+' '+(point.records.length===1?'productora en este punto':'productoras coincidentes');
  // Sin redondear las coordenadas para no confundir puntos cercanos y coincidencias exactas.
  el('yield-point-values').textContent=point.x.toLocaleString('es-PE',{maximumFractionDigits:20})+' hectáreas · '+point.y.toLocaleString('es-PE',{maximumFractionDigits:20})+' quintales';
  el('yield-point-records').innerHTML=table(['Código','Cooperativa (símbolo)','Grupo local','Distrito y provincia'],point.records.map(r=>[
   r.code==null||String(r.code).trim()===''?'Código no disponible':String(r.code),
   coopMark(r.coop).symbol+' '+groupLabel(r.coop),r.base||'Sin dato',PDResumen.place(r)||'Sin dato'
  ]));
  if(focus)panel.focus({preventScroll:true});
 }
 function renderCoffeePoints(rows,coops){
  pointBuckets=PDResumen.coffeePoints(rows);pinnedPoint=false;lastPointEvent=null;currentPoint=-1;dismissedPoint=-1;el('yield-point-panel').hidden=true;
  const pairs=pointBuckets.flatMap(p=>p.records),visibleCoops=coops.filter(c=>pairs.some(r=>r.coop===c));
  const visible=showChart('chart-yield',pairs.length);
  if(!visible)return false;
  el('yield-legend').innerHTML=visibleCoops.map(coop=>`<span><b style="color:${coopColor(coop)}" aria-hidden="true">${coopMark(coop).symbol}</b> ${esc(groupLabel(coop))}</span>`).join('');
  const datasets=visibleCoops.map(coop=>({label:groupLabel(coop),data:pairs.filter(r=>r.coop===coop).map(r=>({x:r.area,y:r.qq})),backgroundColor:coopColor(coop),pointStyle:coopMark(coop).style,pointRadius:5,pointHoverRadius:7,pointHitRadius:5}));
  const inspect=(c,elements,focus=false)=>{
   if(!elements.length){dismissedPoint=-1;return;}
   const hit=elements[0],p=c.data.datasets[hit.datasetIndex].data[hit.index];
   const index=pointBuckets.findIndex(b=>b.x===p.x&&b.y===p.y);
   if(!focus&&index===dismissedPoint)return;
   dismissedPoint=-1;pointDetail(index,focus);
  };
  chart('chart-yield','scatter',{datasets},{
   interaction:{mode:'nearest',intersect:true},
   onHover:(event,elements,c)=>{if(event.native===lastPointEvent)return;lastPointEvent=event.native;if(!pinnedPoint)inspect(c,elements);},
   onClick:(_event,elements,c)=>{if(elements.length){pinnedPoint=true;inspect(c,elements,true);}},
   plugins:{legend:{display:false},tooltip:{enabled:false}},
   scales:{x:{title:{display:true,text:'Área de café (hectáreas)'}},y:{title:{display:true,text:'Café entregado (quintales)'}}}
  });
  el('yield-point-close').onclick=()=>{el('yield-point-panel').hidden=true;pinnedPoint=false;dismissedPoint=currentPoint;el('yield-point-list').closest('details').querySelector('summary').focus({preventScroll:true});};
  const list=el('yield-point-list');list.replaceChildren();
  pointBuckets.forEach((p,index)=>{
   const button=document.createElement('button');button.type='button';button.className='point-choice';
   button.textContent=p.x.toLocaleString('es-PE',{maximumFractionDigits:20})+' ha · '+p.y.toLocaleString('es-PE',{maximumFractionDigits:20})+' quintales · '+p.records.length+' '+(p.records.length===1?'productora':'productoras');
   button.onclick=()=>{pinnedPoint=true;pointDetail(index,true);};list.append(button);
  });
  el('chart-yield-table').innerHTML=table(['Código','Cooperativa','Área de café (hectáreas)','Café entregado (quintales)','Grupo local'],pairs.map(r=>[r.code==null||String(r.code).trim()===''?'Código no disponible':String(r.code),groupLabel(r.coop),r.area,r.qq,r.base||'Sin dato']));
  return true;
 }
 function renderOverview(rows){
  const model=PDResumen.overview(rows),level={territory:'distrito',base:'grupo local',coop:'cooperativa',selection:'selección'}[model.level];
  const metrics=[
   {key:'amount',suffix:'amount',label:'Monto solicitado',unit:'S/',digits:2,color:VIZ.cat[0]},
   {key:'area',suffix:'area',label:'Área de café',unit:'hectáreas',digits:2,color:VIZ.cat[2]},
   {key:'qq',suffix:'qq',label:'Café entregado',unit:'quintales',digits:2,color:VIZ.cat[1]}
  ];
  el('overview-note').textContent='Los totales suman solo valores disponibles; la tabla indica cuántas productoras tienen dato.'+(model.groups.length>10?' Las barras reúnen los grupos restantes en «Otros grupos».':'');
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
 function render(rows,allRows){
  Object.values(charts).forEach(c=>c.destroy());for(const k of Object.keys(charts))delete charts[k];
  renderOverview(rows);
  const coops=[...new Set(rows.map(r=>r.coop))].sort(),groups=groupRows(rows,'coop');
  const coffee=renderCoffee(rows),yieldPlot=renderCoffeePoints(rows,coops);
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
