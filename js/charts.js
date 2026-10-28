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
  const datasets=coops.map((coop,i)=>({label:coop,data:rows.filter(r=>r.coop===coop&&D.finite(r[x])&&D.finite(r[y])).map(r=>({x:r[x],y:r[y],code:r.code})),backgroundColor:palette[i%5],pointStyle:marks[i%5],pointRadius:4,pointHoverRadius:6}));
  chart(id,'scatter',{datasets},{plugins:{legend:{display:true,position:'top'},tooltip:{callbacks:{label:c=>`${c.raw.code}: ${fmt(c.raw.x)}; ${fmt(c.raw.y)}`}}},scales:{x:{title:{display:true,text:opts.xLabel||D.label(x)}},y:{title:{display:true,text:opts.yLabel||D.label(y)}}}});
 }
 function stacked(id,rows,key,coops){
  const categories=[...new Set(rows.map(r=>r[key]||'SIN DATO'))].sort();
  const groups=coops.filter(c=>rows.some(r=>r.coop===c)),ns=groups.map(c=>rows.filter(r=>r.coop===c).length);
  const catColors={'SMARTPHONE':'#123F24','BASICO':'#8A5424','NINGUNO':'#315B81','SIN DATO':'#737B75','OTRO / REVISAR':'#77608E','NINGUNA':'#123F24','LECTURA':'#8A5424','ESCRITURA':'#315B81','AMBAS':'#77608E','FERTILIZACIÓN':'#123F24','CRIANZA DE ANIMALES':'#8A5424','EMPRENDIMIENTO / OTROS':'#315B81'};
  const counts=categories.map(cat=>groups.map(c=>rows.filter(r=>r.coop===c&&(r[key]||'SIN DATO')===cat).length));
  chart(id,'bar',{labels:groups.map((g,i)=>`${g} (n=${ns[i]})`),datasets:categories.map((cat,k)=>({label:cat,data:counts[k].map((n,j)=>100*n/ns[j]),backgroundColor:catColors[cat]||palette[k%5]}))},{indexAxis:'y',pdPercent:true,plugins:{legend:{display:true,position:'bottom',labels:{boxWidth:12}},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.raw,1)}% (${counts[c.datasetIndex][c.dataIndex]}/${ns[c.dataIndex]})`}}},scales:{x:{stacked:true,min:0,max:100,ticks:{callback:v=>v+'%'}},y:{stacked:true}}});
  el(id+'-table').innerHTML=table(['Cooperativa','Categoría','n','% del grupo'],groups.flatMap((g,j)=>categories.map((cat,k)=>[g,cat,counts[k][j],fmt(100*counts[k][j]/ns[j],1)+'%'])));
  const findings=groups.map((g,j)=>{const max=Math.max(...counts.map(c=>c[j]));const top=categories.filter((_,k)=>counts[k][j]===max);return g+': '+top.join(' / ')+(top.length>1?' (empate)':'')+' '+fmt(100*max/ns[j],1)+'% ('+max+'/'+ns[j]+')';});
  note(id,findings.join('. ')+`. Base: ${rows.length} registros; cada barra incluye SIN DATO y suma 100%. Las proporciones describen la selección, no el efecto del programa.`);
 }
 function render(rows,allRows,model){
  Object.values(charts).forEach(c=>c.destroy());for(const k of Object.keys(charts))delete charts[k];
  const coops=[...new Set(allRows.map(r=>r.coop))].sort((a,b)=>(({NORANDINO:0,'BAGUA GRANDE':1}[a]??2)-({NORANDINO:0,'BAGUA GRANDE':1}[b]??2))||a.localeCompare(b)),n=rows.length;
  // PCA ajustado al cargar: filtrar no rota ni vuelve a estandarizar el mapa.
  const axis=Number(el('pca-plane').value||1),points=model.ok?rows.filter(r=>model.scores.has(r)).map(r=>({...r,p1:model.scores.get(r)[0],pY:model.scores.get(r)[axis]})):[];
  scatter('chart-pca',points,'p1','pY',coops,{xLabel:model.ok?`PC1 (${fmt(model.variance[0])}%)`:'PC1',yLabel:model.ok?`PC${axis+1} (${fmt(model.variance[axis])}%)`:`PC${axis+1}`});
  if(model.ok){
   note('chart-pca',`${points.length}/${n} productoras seleccionadas tienen coordenadas. Este plano conserva ${fmt(model.variance[0]+model.variance[axis])}% de la varianza del ajuste completo (n=${model.n}).`);
   el('pca-reading').innerHTML=model.variance.slice(0,3).map((v,j)=>{const top=model.components[j].weights.map((w,i)=>({w,k:model.vars[i]})).sort((a,b)=>Math.abs(b.w)-Math.abs(a.w)).slice(0,3);return `<p><strong>PC${j+1}: ${fmt(v)}%</strong><br>${top.map(t=>`${esc(D.label(t.k))}: ${fmt(t.w,3)}`).join('<br>')}</p>`;}).join('')+`<p><strong>Tres componentes: ${fmt(model.variance.slice(0,3).reduce((a,b)=>a+b,0))}%.</strong></p><p class="chart-note">${model.excluded} registros excluidos solo del PCA por datos incompletos. Los pesos corresponden a esta carga, no a un modelo histórico.</p>`;
   el('pca-loadings').innerHTML=table(['Variable','PC1','PC2','PC3'],model.vars.map((k,i)=>[D.label(k),...model.components.slice(0,3).map(c=>fmt(c.weights[i],3))]));
   let acc=0;const cumulative=model.variance.map(v=>acc+=v);
   chart('chart-variance','line',{labels:['PC1','PC2','PC3','PC4','PC5','PC6'],datasets:[{data:cumulative,borderColor:'#123F24',pointRadius:4,tension:0},{data:[80,80,80,80,80,80],borderColor:'#737B75',borderDash:[5,4],pointRadius:0}]},{plugins:{legend:{display:false}},scales:{y:{min:0,max:100,title:{display:true,text:'Varianza acumulada (%)'}}}});
   note('chart-variance',`Ajuste completo n=${model.n}. Tres componentes: ${fmt(cumulative[2])}%; cuatro: ${fmt(cumulative[3])}%. La referencia discontinua es 80%, no una regla obligatoria.`);
   el('chart-variance-table').innerHTML=table(['Componente','Varianza %','Acumulada %'],model.variance.map((v,i)=>['PC'+(i+1),fmt(v),fmt(cumulative[i])]));
  }else{el('pca-reading').textContent=model.reason;el('pca-loadings').textContent=model.reason;note('chart-pca',model.reason);chart('chart-variance','line',{labels:[],datasets:[]});note('chart-variance',model.reason);el('chart-variance-table').textContent='';}
  const groups=coops.filter(c=>rows.some(r=>r.coop===c)),mode=el('qq-mode').value;
  const stats=groups.map(c=>{const vals=rows.filter(r=>r.coop===c&&D.finite(r.qq)).map(r=>r.qq);return {c,n:vals.length,total:vals.length?vals.reduce((a,b)=>a+b,0):null,median:D.median(vals)};});
  chart('chart-qq-coop','bar',{labels:groups,datasets:[{data:stats.map(s=>s[mode]),backgroundColor:groups.map(c=>palette[coops.indexOf(c)%5])}]},{scales:{y:{beginAtZero:true,title:{display:true,text:mode==='total'?'Quintales totales reportados':'Mediana de quintales por productora'}}}});
  el('chart-qq-coop-table').innerHTML=table(['Cooperativa','n con acopio','Mediana qq','Total qq'],stats.map(s=>[s.c,s.n,fmt(s.median,1),fmt(s.total,1)]));
  note('chart-qq-coop','Compara la mediana para describir a la productora típica. El total también refleja cuántos registros aporta cada cooperativa; no equivale a rendimiento.');
  scatter('chart-yield',rows,'area','qq',coops);const aq=D.correlation(rows,'area','qq');note('chart-yield',`Pares completos: ${aq.n}/${n}. Pearson: ${fmt(aq.value)}. Área sin unidad confirmada; acopio no es producción total. Se evita dividir acopio entre área y llamarlo rendimiento.`);
  stacked('chart-activities',rows,'activity',coops);stacked('chart-phone',rows,'phone',coops);stacked('chart-literacy',rows,'literacy',coops);
  const bins=[0,0,0,0],binNames=['0 a < 1 000','1 000 a < 1 500','1 500 a < 2 000','2 000 o más'];
  rows.filter(r=>D.finite(r.amount)).forEach(r=>bins[r.amount<1000?0:r.amount<1500?1:r.amount<2000?2:3]++);
  chart('chart-amounts','bar',{labels:binNames,datasets:[{data:bins,backgroundColor:'#123F24',barPercentage:1,categoryPercentage:.95}]},{scales:{x:{title:{display:true,text:'Monto solicitado (S/)'}},y:{beginAtZero:true,ticks:{precision:0},title:{display:true,text:'Productoras'}}}});
  const na=bins.reduce((a,b)=>a+b,0);note('chart-amounts',`${na}/${n} solicitudes con monto válido. ${n-na} sin dato. Los límites no se solapan; no son montos desembolsados.`);el('chart-amounts-table').innerHTML=table(['Monto S/','Solicitudes'],binNames.map((b,i)=>[b,bins[i]]));
  const x=el('rel-x').value,y=el('rel-y').value,method=el('corr-method').value;
  scatter('chart-relation',rows,x,y,coops);const r=D.correlation(rows,x,y,method),by=groups.map(c=>({c,...D.correlation(rows.filter(r=>r.coop===c),x,y,method)}));
  note('chart-relation',`${D.label(x)} frente a ${D.label(y)}. ${r.n}/${n} pares completos; ${n-r.n} excluidos de este par.`);
  el('relation-insight').textContent=r.value==null?`No se puede calcular el coeficiente: hacen falta al menos tres pares completos y variación en ambas variables (n=${r.n}).`:`En la selección, ${method==='pearson'?'Pearson r':'Spearman rho'} = ${fmt(r.value)} con ${r.n} pares. ${r.value>.05?'Los valores tienden a aumentar juntos.':r.value<-.05?'Los valores tienden a moverse en sentidos opuestos.':'El coeficiente está cerca de cero.'} ${r.n<10?'La selección es pequeña: evita generalizar.':''}`;
  el('relation-groups').innerHTML=table(['Grupo','Pares n',method==='pearson'?'r':'rho'],[['Total',r.n,fmt(r.value)],...by.map(g=>[g.c,g.n,fmt(g.value)])]);
  const vars=D.pcaVars,short=['Edad','Convivientes','Antigüedad','Área','Acopio','Ingreso'];
  el('correlation-matrix').innerHTML=`<table class="heatmap"><caption>${method==='pearson'?'Pearson':'Spearman'} · azul: positivo; marrón: negativo. N/C: no calculable.</caption><thead><tr><th>Variable</th>${short.map(k=>`<th>${k}</th>`).join('')}</tr></thead><tbody>${vars.map((a,i)=>`<tr><th scope="row">${short[i]}</th>${vars.map(b=>{const c=D.correlation(rows,a,b,method),v=c.value,t=v==null?0:Math.abs(v),base=v>=0?[49,91,129]:[138,84,36],rgb=base.map(q=>Math.round(255+(q-255)*t));return `<td><button class="matrix-cell" data-x="${a}" data-y="${b}" ${a===b?'disabled':''} style="background:rgb(${rgb.join(',')});color:${t>.72?'white':'#172019'}" aria-label="${esc(D.label(a))} con ${esc(D.label(b))}: ${fmt(v)}, ${c.n} pares">${v==null?'N/C':fmt(v)}<small>n=${c.n}</small></button></td>`;}).join('')}</tr>`).join('')}</tbody></table>`;
  requestAnimationFrame(()=>Object.values(charts).forEach(c=>c.resize()));
 }
 return {render,resize:()=>Object.values(charts).forEach(c=>c.resize()),table,esc,fmt,charts};
})();
