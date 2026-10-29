/* Gráficos con denominadores explícitos. Se recalculan con la selección. */
const PDCharts=(()=>{
 const D=PDData,charts={},palette=['#123F24','#8A5424','#315B81','#77608E','#68732F'],marks=['circle','triangle','rect','rectRot','crossRot'];
 const fmt=(v,d=2)=>v==null?'No calculable':v.toLocaleString('es-PE',{maximumFractionDigits:d,minimumFractionDigits:d});
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const table=(headers,rows)=>`<table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
 const el=id=>document.getElementById(id),note=(id,t)=>el(id+'-note').textContent=t;
 function chart(id,type,data,options={}){if(typeof Chart==='undefined'){note(id,'No se pudo cargar el motor de gráficos. Revisa vendor/.');return;}
  charts[id]=new Chart(el(id),{type,data,options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:false}},...options}});
 }
 const lineLabels={id:'percentLabels',afterDatasetsDraw(c){if(!c.options.pdPercent)return;const ctx=c.ctx;ctx.save();ctx.font='600 12px Segoe UI';ctx.textAlign='center';ctx.textBaseline='middle';c.data.datasets.forEach((d,i)=>c.getDatasetMeta(i).data.forEach((bar,j)=>{if(d.data[j]>=9){ctx.fillStyle='#fff';ctx.fillText(Math.round(d.data[j])+'%',(bar.x+bar.base)/2,bar.y);}}));ctx.restore();}};
 if(typeof Chart!=='undefined'){Chart.defaults.font.family='Segoe UI, sans-serif';Chart.defaults.font.size=12;Chart.defaults.color='#46534A';Chart.register(lineLabels);}
 function scatter(id,rows,x,y,coops,opts={}){
  const datasets=coops.map((coop,i)=>({label:groupLabel(coop),data:rows.filter(r=>r.coop===coop&&D.finite(r[x])&&D.finite(r[y])).map(r=>({x:r[x],y:r[y],code:r.code})),backgroundColor:palette[i%5],pointStyle:marks[i%5],pointRadius:4,pointHoverRadius:6}));
  chart(id,'scatter',{datasets},{plugins:{legend:{display:true,position:'top'},tooltip:{callbacks:{label:c=>`${c.raw.code}: ${fmt(c.raw.x)}; ${fmt(c.raw.y)}`}}},scales:{x:{title:{display:true,text:opts.xLabel||D.label(x)}},y:{title:{display:true,text:opts.yLabel||D.label(y)}}}});
 }
 // Nombres de los ejes del mapa en lenguaje de la empresa, según las variables que más pesan.
 const axisName=(model,j)=>{const top=model.components[j].weights.map((w,i)=>({w:Math.abs(w),k:model.vars[i]})).sort((a,b)=>b.w-a.w).slice(0,3).map(t=>t.k),has=k=>top.includes(k);if(['area','qq','income'].filter(has).length>=2)return 'Tamaño de la producción';if(has('age')&&has('years'))return 'Edad y años en la cooperativa';if(has('family'))return 'Tamaño del hogar';return 'Otro patrón';};
 const strength=v=>v==null?'No calculable':Math.abs(v)<.1?'Casi nula':Math.abs(v)<.3?'Débil':Math.abs(v)<.6?'Moderada':'Fuerte';
 const direction=v=>v==null||Math.abs(v)<.1?'':v>0?' · suben juntas':' · una sube y la otra baja';
 const NICE={SMARTPHONE:'Smartphone',BASICO:'Celular básico','SIN DATO':'Sin dato','OTRO / REVISAR':'Otra respuesta',LECTURA:'Dificultad para leer',ESCRITURA:'Dificultad para escribir',AMBAS:'Dificultad para leer y escribir','FERTILIZACIÓN':'Fertilización','CRIANZA DE ANIMALES':'Crianza de animales','EMPRENDIMIENTO / OTROS':'Emprendimiento u otros'};
 const nice=(cat,key)=>cat==='NINGUNO'&&key==='phone'?'Sin celular':cat==='NINGUNA'?'Sin dificultad':NICE[cat]||cat;
 function stacked(id,rows,key,coops){
  const categories=[...new Set(rows.map(r=>r[key]||'SIN DATO'))].sort();
  const groups=coops.filter(c=>rows.some(r=>r.coop===c)),ns=groups.map(c=>rows.filter(r=>r.coop===c).length);
  const catColors={'SMARTPHONE':'#123F24','BASICO':'#8A5424','NINGUNO':'#315B81','SIN DATO':'#737B75','OTRO / REVISAR':'#77608E','NINGUNA':'#123F24','LECTURA':'#8A5424','ESCRITURA':'#315B81','AMBAS':'#77608E','FERTILIZACIÓN':'#123F24','CRIANZA DE ANIMALES':'#8A5424','EMPRENDIMIENTO / OTROS':'#315B81'};
  const counts=categories.map(cat=>groups.map(c=>rows.filter(r=>r.coop===c&&(r[key]||'SIN DATO')===cat).length));
  chart(id,'bar',{labels:groups.map((g,i)=>`${groupLabel(g)} (${ns[i]} productoras)`),datasets:categories.map((cat,k)=>({label:nice(cat,key),data:counts[k].map((n,j)=>100*n/ns[j]),backgroundColor:catColors[cat]||palette[k%5]}))},{indexAxis:'y',pdPercent:true,plugins:{legend:{display:true,position:'bottom',labels:{boxWidth:12}},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.raw,1)}% (${counts[c.datasetIndex][c.dataIndex]}/${ns[c.dataIndex]})`}}},scales:{x:{stacked:true,min:0,max:100,ticks:{callback:v=>v+'%'}},y:{stacked:true}}});
  el(id+'-table').innerHTML=table(['Cooperativa','Categoría','Productoras','% del grupo'],groups.flatMap((g,j)=>categories.map((cat,k)=>[groupLabel(g),nice(cat,key),counts[k][j],fmt(100*counts[k][j]/ns[j],1)+'%'])));
  const findings=groups.map((g,j)=>{const max=Math.max(...counts.map(c=>c[j]));const top=categories.filter((_,k)=>counts[k][j]===max);return groupLabel(g)+': '+top.map(t=>nice(t,key)).join(' / ')+(top.length>1?' (empate)':'')+' '+fmt(100*max/ns[j],1)+'% ('+max+'/'+ns[j]+')';});
  note(id,findings.join('. ')+`. Productoras: ${rows.length}. Cada barra incluye a quienes no respondieron (sin dato) y suma 100 %. Describe a las productoras seleccionadas; no mide el efecto del programa.`);
 }
 function render(rows,allRows,model){
  Object.values(charts).forEach(c=>c.destroy());for(const k of Object.keys(charts))delete charts[k];
  const coops=[...new Set(allRows.map(r=>r.coop))].sort((a,b)=>(({NORANDINO:0,'BAGUA GRANDE':1}[a]??2)-({NORANDINO:0,'BAGUA GRANDE':1}[b]??2))||a.localeCompare(b)),n=rows.length;
  // PCA ajustado al cargar: filtrar no rota ni vuelve a estandarizar el mapa.
  const axis=Number(el('pca-plane').value||1),points=model.ok?rows.filter(r=>model.scores.has(r)).map(r=>({...r,p1:model.scores.get(r)[0],pY:model.scores.get(r)[axis]})):[];
  scatter('chart-pca',points,'p1','pY',coops,{xLabel:model.ok?`Eje 1: ${axisName(model,0)}`:'Eje 1',yLabel:model.ok?`Eje ${axis+1}: ${axisName(model,axis)}`:`Eje ${axis+1}`});
  if(model.ok){
   note('chart-pca',`${points.length} de ${n} productoras seleccionadas aparecen en el mapa. Estos dos ejes reúnen el ${fmt(model.variance[0]+model.variance[axis],1)} % de las diferencias entre las ${model.n} productoras de la carga.`);
   el('pca-reading').innerHTML=model.variance.slice(0,3).map((v,j)=>{const top=model.components[j].weights.map((w,i)=>({w,k:model.vars[i]})).sort((a,b)=>Math.abs(b.w)-Math.abs(a.w)).slice(0,3);return `<p><strong>Eje ${j+1}: ${esc(axisName(model,j))}</strong><br>Reúne el ${fmt(v,1)} % de las diferencias. Lo que más influye: ${top.map(t=>esc(D.label(t.k))).join(', ')}.</p>`;}).join('')+`<p><strong>Los tres ejes juntos reúnen el ${fmt(model.variance.slice(0,3).reduce((a,b)=>a+b,0),1)} % de las diferencias entre productoras.</strong></p><p class="chart-note">${model.excluded} productoras no aparecen en el mapa por tener datos incompletos. Los ejes corresponden a esta carga, no a un modelo histórico.</p>`;
   el('pca-loadings').innerHTML=table(['Variable','Eje 1','Eje 2','Eje 3'],model.vars.map((k,i)=>[D.label(k),...model.components.slice(0,3).map(c=>fmt(c.weights[i],3))]));
   let acc=0;const cumulative=model.variance.map(v=>acc+=v);
   chart('chart-variance','line',{labels:['1 eje','2 ejes','3 ejes','4 ejes','5 ejes','6 ejes'],datasets:[{data:cumulative,borderColor:'#123F24',pointRadius:4,tension:0},{data:[80,80,80,80,80,80],borderColor:'#737B75',borderDash:[5,4],pointRadius:0}]},{plugins:{legend:{display:false}},scales:{y:{min:0,max:100,title:{display:true,text:'Información conservada (%)'}}}});
   note('chart-variance',`Con 3 ejes se conserva el ${fmt(cumulative[2],1)} % de las diferencias entre productoras y con 4 ejes, el ${fmt(cumulative[3],1)} %. La línea punteada marca 80 %, una referencia y no una regla.`);
   el('chart-variance-table').innerHTML=table(['Eje','Aporta %','Acumulado %'],model.variance.map((v,i)=>['Eje '+(i+1),fmt(v),fmt(cumulative[i])]));
  }else{el('pca-reading').textContent=model.reason;el('pca-loadings').textContent=model.reason;note('chart-pca',model.reason);chart('chart-variance','line',{labels:[],datasets:[]});note('chart-variance',model.reason);el('chart-variance-table').textContent='';}
  const groups=coops.filter(c=>rows.some(r=>r.coop===c)),mode=el('qq-mode').value;
  const stats=groups.map(c=>{const vals=rows.filter(r=>r.coop===c&&D.finite(r.qq)).map(r=>r.qq);return {c,n:vals.length,total:vals.length?vals.reduce((a,b)=>a+b,0):null,median:D.median(vals)};});
  chart('chart-qq-coop','bar',{labels:groups.map(groupLabel),datasets:[{data:stats.map(s=>s[mode]),backgroundColor:groups.map(c=>palette[coops.indexOf(c)%5])}]},{scales:{y:{beginAtZero:true,title:{display:true,text:mode==='total'?'Quintales totales reportados':'Quintales de la productora típica'}}}});
  el('chart-qq-coop-table').innerHTML=table(['Cooperativa','Productoras con acopio','Típica (qq)','Total (qq)'],stats.map(s=>[groupLabel(s.c),s.n,fmt(s.median,1),fmt(s.total,1)]));
  note('chart-qq-coop','La productora típica es la del valor central: la mitad acopia más y la otra mitad menos. El total depende de cuántas socias tiene cada cooperativa y no equivale al rendimiento.');
  scatter('chart-yield',rows,'area','qq',coops);const aq=D.correlation(rows,'area','qq','spearman');note('chart-yield',`${aq.n} de ${n} productoras tienen área y acopio. ${aq.value==null?'No se puede medir la relación.':'A más hectáreas suele haber más acopio ('+strength(aq.value).toLowerCase()+'), pero el área no lo explica todo.'} El área está en hectáreas. El acopio es lo entregado a la cooperativa, no la producción total.`);
  stacked('chart-activities',rows,'activity',coops);stacked('chart-phone',rows,'phone',coops);stacked('chart-literacy',rows,'literacy',coops);
  const bins=[0,0,0,0],binNames=['0 a < 1 000','1 000 a < 1 500','1 500 a < 2 000','2 000 o más'];
  rows.filter(r=>D.finite(r.amount)).forEach(r=>bins[r.amount<1000?0:r.amount<1500?1:r.amount<2000?2:3]++);
  chart('chart-amounts','bar',{labels:binNames,datasets:[{data:bins,backgroundColor:'#123F24',barPercentage:1,categoryPercentage:.95}]},{scales:{x:{title:{display:true,text:'Monto solicitado (S/)'}},y:{beginAtZero:true,ticks:{precision:0},title:{display:true,text:'Productoras'}}}});
  const na=bins.reduce((a,b)=>a+b,0);note('chart-amounts',`${na===n?'Las '+n+' productoras tienen':na+' de '+n+' productoras tienen'} monto registrado${na===n?'':' ('+(n-na)+' sin dato)'}. Son montos solicitados, no entregados.`);el('chart-amounts-table').innerHTML=table(['Monto S/','Solicitudes'],binNames.map((b,i)=>[b,bins[i]]));
  const x=el('rel-x').value,y=el('rel-y').value,method=el('corr-method').value;
  scatter('chart-relation',rows,x,y,coops);const r=D.correlation(rows,x,y,method),by=groups.map(c=>({c,...D.correlation(rows.filter(r=>r.coop===c),x,y,method)}));
  note('chart-relation',`${D.label(x)} frente a ${D.label(y)}. ${r.n} de ${n} productoras tienen ambos datos; ${n-r.n} quedan fuera de este gráfico.`);
  el('relation-insight').textContent=r.value==null?`No se puede medir: hacen falta al menos 3 productoras con ambos datos y que los valores no sean todos iguales (hay ${r.n}).`:Math.abs(r.value)<.1?`No se ve una relación clara entre las dos variables (${r.n} productoras).`:`Relación ${strength(r.value).toLowerCase()}: ${r.value>0?'cuando una sube, la otra tiende a subir':'cuando una sube, la otra tiende a bajar'} (${r.n} productoras). ${r.n<10?'Son pocas: conviene no generalizar.':''}`;
  el('relation-groups').innerHTML=table(['Grupo','Productoras','Relación'],[['Total',r.n,strength(r.value)+direction(r.value)],...by.map(g=>[groupLabel(g.c),g.n,strength(g.value)+direction(g.value)])]);
  const vars=D.pcaVars,short=['Edad','Convivientes','Antigüedad','Área','Acopio','Ingreso'];
  el('correlation-matrix').innerHTML=`<table class="heatmap"><caption>Cuanto más oscuro, más fuerte la relación. Azul: suben juntas. Marrón: una sube y la otra baja. N/C: no se puede calcular.</caption><thead><tr><th>Variable</th>${short.map(k=>`<th>${k}</th>`).join('')}</tr></thead><tbody>${vars.map((a,i)=>`<tr><th scope="row">${short[i]}</th>${vars.map(b=>{const c=D.correlation(rows,a,b,method),v=c.value,t=v==null?0:Math.abs(v),base=v>=0?[49,91,129]:[138,84,36],rgb=base.map(q=>Math.round(255+(q-255)*t));return `<td><button class="matrix-cell" data-x="${a}" data-y="${b}" ${a===b?'disabled':''} style="background:rgb(${rgb.join(',')});color:${t>.72?'white':'#172019'}" aria-label="${esc(D.label(a))} con ${esc(D.label(b))}: ${fmt(v)}, ${c.n} productoras">${v==null?'N/C':fmt(v)}<small>${c.n} prod.</small></button></td>`;}).join('')}</tr>`).join('')}</tbody></table>`;
  requestAnimationFrame(()=>Object.values(charts).forEach(c=>c.resize()));
 }
 return {render,resize:()=>Object.values(charts).forEach(c=>c.resize()),table,esc,fmt,charts};
})();
