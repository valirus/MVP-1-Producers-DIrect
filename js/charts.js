/* Gráficos con denominadores explícitos. Se recalculan con la selección. */
const PDCharts=(()=>{
 const D=PDData,charts={},palette=[...VIZ.cat,VIZ.gray],marks=['circle','triangle','rect','rectRot','crossRot'];
 const fmt=(v,d=2)=>v==null?'No calculable':v.toLocaleString('es-PE',{maximumFractionDigits:d,minimumFractionDigits:d});
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const table=(headers,rows)=>`<table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
 const el=id=>document.getElementById(id);
 const measure=k=>k==='area'?'Área de café (ha)':D.label(k);
 function chart(id,type,data,options={}){if(typeof Chart==='undefined')return;
  charts[id]=new Chart(el(id),{type,data,options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:false}},...options}});
 }
 const lineLabels={id:'percentLabels',afterDatasetsDraw(c){
  if(!c.options.pdPercent)return;
  const ctx=c.ctx;ctx.save();ctx.font="600 12px 'Segoe UI', sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';
  c.data.datasets.forEach((d,i)=>c.isDatasetVisible(i)&&c.getDatasetMeta(i).data.forEach((bar,j)=>{
   const width=Math.abs(bar.x-bar.base), x=(bar.x+bar.base)/2;
   let label=Math.round(d.data[j])+'%';
   const full=d.counts?label+' · '+d.counts[j]:label;
   if(ctx.measureText(full).width+8<=width)label=full;
   const labelWidth=ctx.measureText(label).width+8;
   if(d.data[j]>=9 && width>=labelWidth+2){
    ctx.fillStyle='#fff';ctx.fillText(label,x,bar.y);
   }
  }));ctx.restore();
 }};
 if(typeof Chart!=='undefined'){Chart.defaults.font.family='Segoe UI, sans-serif';Chart.defaults.font.size=12;Chart.defaults.color='#46534A';Chart.register(lineLabels);}
 function scatter(id,rows,x,y,coops,opts={}){
  const datasets=coops.map(coop=>({label:groupLabel(coop),data:rows.filter(r=>r.coop===coop&&D.finite(r[x])&&D.finite(r[y])).map(r=>({x:r[x],y:r[y],code:r.code,ref:r})),backgroundColor:coopColor(coop),pointStyle:marks[COOP_ORDER.indexOf(coop)%marks.length],pointRadius:4,pointHoverRadius:6})).filter(d=>d.data.length);
  chart(id,'scatter',{datasets},{plugins:{legend:{display:true,position:'top',labels:{usePointStyle:true}},tooltip:{callbacks:{label:c=>opts.tooltip?opts.tooltip(c.raw):`${c.raw.code}: ${fmt(c.raw.x)}; ${fmt(c.raw.y)}`}}},scales:{x:{title:{display:true,text:opts.xLabel||measure(x)}},y:{title:{display:true,text:opts.yLabel||measure(y)}}}});
 }
 const NICE={SMARTPHONE:'Smartphone',BASICO:'Celular de teclas','SIN DATO':'Sin dato','OTRO / REVISAR':'Otra respuesta',LECTURA:'Dificultad para leer',ESCRITURA:'Dificultad para escribir',AMBAS:'Dificultad para leer y escribir','FERTILIZACIÓN':'Fertilización','CRIANZA DE ANIMALES':'Crianza de animales','EMPRENDIMIENTO / OTROS':'Emprendimiento u otros'};
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
   chart(id,'bar',{labels:groups.map(g=>groupLabel(g.coop)+' · '+g.answers.length+'/'+g.total),datasets},{
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
  const coops=[...new Set(rows.map(r=>r.coop))].sort(),groups=groupRows(rows,'coop');
  const stats=groups.map(([c,rs])=>{const vals=rs.map(r=>r.qq).filter(D.finite);return {c,n:vals.length,median:D.median(vals)};}).filter(s=>s.n>=MIN_N);
  const coffee=showChart('chart-qq-coop',stats.length);
  if(coffee){
   chart('chart-qq-coop','bar',{labels:stats.map(s=>groupLabel(s.c)+' · '+s.n+' con dato'),datasets:[{data:stats.map(s=>s.median),backgroundColor:stats.map(s=>coopColor(s.c)),maxBarThickness:58,borderRadius:5}]},{scales:{y:{beginAtZero:true,title:{display:true,text:'Quintales'}}}});
   el('chart-qq-coop-table').innerHTML=table(['Cooperativa','Productoras con dato','Mediana (quintales)'],stats.map(s=>[groupLabel(s.c),s.n,fmt(s.median,1)]));
  }
  const pairGroups=groupRows(rows.filter(r=>D.finite(r.area)&&D.finite(r.qq)),'coop').filter(([,r])=>r.length>=MIN_N);
  const pairs=pairGroups.flatMap(([,r])=>r);
  const yieldPlot=showChart('chart-yield',pairs.length);
  if(yieldPlot){
   scatter('chart-yield',pairs,'area','qq',coops,{tooltip:p=>[fmt(p.x,2)+' ha',fmt(p.y,1)+' quintales']});
   el('chart-yield-table').innerHTML=table(['Cooperativa','Registros con ambos datos'],groupRows(pairs,'coop').map(([g,r])=>[groupLabel(g),r.length]));
  }
  const activities=stacked('chart-activities',rows,'activity',coops,allRows);
  const phone=stacked('chart-phone',rows,'phone',coops,allRows),literacy=stacked('chart-literacy',rows,'literacy',coops,allRows);
  const frequent = new Map(D.commonAmounts(rows,{top:Infinity}).map(g=>[g.coop,g]));
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
     generateLabels:c=>Chart.defaults.plugins.legend.labels.generateLabels(c).map((item,i)=>({...item,text:item.text+' · '+visible[i].values.reduce((a,b)=>a+b,0)}))
    }}},
    scales:{x:{title:{display:true,text:scale.exact?'Monto exacto (S/)':'Rango de monto (S/)'},grid:{display:false},ticks:{maxRotation:45}},
     y:{beginAtZero:true,title:{display:true,text:'Solicitudes'},ticks:{precision:0}}}
   });
   el('chart-amounts-frequency').innerHTML=table(
    [scale.exact?'Monto (S/)':'Rango (S/)',...by.map(g=>g.name)],
    labels.map((label,i)=>[label,...by.map(g=>g.values[i])]));
  }
  requestAnimationFrame(()=>Object.values(charts).forEach(c=>c.resize()));
  return {production:coffee||yieldPlot,inclusion:phone||literacy,credit:activities||amounts};
 }
 return {render,resize:()=>Object.values(charts).forEach(c=>c.resize()),table,esc,fmt,charts};
})();
