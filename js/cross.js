/* Indicadores de campo: porcentajes sobre respuestas válidas, por cooperativa. */
let accessCharts = [];
function renderCross(data) {
  accessCharts.forEach(chart=>chart.destroy());
  accessCharts=[];
  const root=$('cross-grid'), groups=groupRows(data,'coop');
  root.replaceChildren();
  if (!groups.length) return false;

  function stats(items) {
    return items.map(item=>({
      label:item.label, values:groups.map(([,rows])=>share(rows,item.f))
    })).filter(row=>row.values.some(s=>s.pct!=null));
  }
  function text(s) {
    return s.pct==null?'—':`${H.fmt(s.pct,1)} % · ${Math.round(s.pct*s.n/100)} de ${s.n}`;
  }
  function pctText(s) {
    return s.pct==null?'—':`${H.fmt(s.pct,1)} %`;
  }
  function table(rows,fmtCell=text) {
    return H.table(['Indicador',...groups.map(([g])=>groupLabel(g))],rows.map(r=>[r.label,...r.values.map(fmtCell)]));
  }
  function card(title, html) {
    const node=document.createElement('article');
    node.className='card-panel col-6';
    node.innerHTML=`<h3>${H.esc(title)}</h3>${html}`;
    root.append(node);
    return node;
  }

  function compare(title,rows,note='') {
    if (!rows.length) return;
    const colors=groups.map(([g])=>coopColor(g));
    if(groups.length>5 || new Set(colors).size<groups.length) {
      card(title,'<div class="table-scroll">'+table(rows)+'</div>');
      return;
    }
    const node=card(title,
      `<div class="compact-chart" style="height:${Math.max(170,rows.length*58+42)}px"><canvas role="img" aria-label="${H.esc(title)} por cooperativa"></canvas></div>`+
      '<details><summary>Ver cifras</summary>'+note+'<div class="table-scroll">'+table(rows)+'</div></details>');
    accessCharts.push(new Chart(node.querySelector('canvas'),{
      type:'bar',
      data:{labels:rows.map(r=>r.label),datasets:groups.map(([g],i)=>({
        label:groupLabel(g),groupIndex:i,data:rows.map(r=>r.values[i].pct),backgroundColor:coopColor(g),maxBarThickness:22,borderRadius:4
      })).filter(d=>d.data.some(v=>v!=null))},
      options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,animation:false,
        plugins:{legend:{display:true,position:'bottom',onClick:()=>{},labels:{boxWidth:12}},
          tooltip:{callbacks:{label:c=>c.dataset.label+': '+text(rows[c.dataIndex].values[c.dataset.groupIndex])}}},
        scales:{x:{min:0,max:100,ticks:{callback:v=>v+'%',stepSize:25}},y:{grid:{display:false}}}}
    }));
  }
  compare('Canales preferidos de contacto',stats([
    {label:'WhatsApp',f:INDICATORS.find(x=>x.id==='wa').f},
    {label:'Llamadas',f:INDICATORS.find(x=>x.id==='call').f}
  ]),'<p class="chart-note">Podían elegir más de un canal.</p>');
  const training=stats([{label:'Reportó capacitación',f:r=>r.trainedCoop}])[0];
  if (training) {
    const rows=groups.flatMap(([g],i)=>{
      const s=training.values[i];
      return s.pct==null?[]:[`<div class="meter-row"><div><strong>${H.esc(groupLabel(g))}</strong><span>${H.esc(pctText(s))}</span></div><div class="meter-track" aria-hidden="true"><span style="width:${s.pct}%;background:${coopColor(g)}"></span></div></div>`];
    });
    card('Capacitación reportada',`<div class="meter-list">${rows.join('')}</div><details><summary>Ver cifras</summary><div class="table-scroll">${H.table(['Cooperativa','Reportó capacitación'],groups.flatMap(([g],i)=>training.values[i].pct==null?[]:[[groupLabel(g),text(training.values[i])]]))}</div></details>`);
  }

  const edu={label:'Cursó secundaria o superior',f:r=>{
    const level=educationGroup(r.education);
    return !level||level==='Otro'?null:+EDU_GROUPS.slice(3).includes(level);
  }};
  const home=INDICATORS.filter(x=>['net','sewer'].includes(x.id));
  const household=stats([edu,...home]);
  compare('Educación y servicios del hogar',household);

  const finance=stats([
    {label:'Sin servicios financieros',f:GAPS.find(x=>x.label==='No usa ningún servicio financiero').f},
    {label:'Sin Yape',f:GAPS.find(x=>x.label==='Sin Yape').f},
    {label:'Sin ahorros ni aportes de capital en su cooperativa',f:r=>r.savingsCoop==null?null:1-r.savingsCoop}
  ]);
  if (finance.length) {
    const node=card('Acceso a servicios financieros',`<div class="table-scroll cross-pct">${table(finance,pctText)}</div><details><summary>Ver cifras</summary><div class="table-scroll">${table(finance)}</div></details>`);
    if(!household.length) node.classList.replace('col-6','col-12');
  }
  return !!root.childElementCount;
}
