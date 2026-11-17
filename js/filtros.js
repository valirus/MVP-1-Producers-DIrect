/* Filtros categóricos con búsqueda integrada, estado de ficha y leyendas.
 * Se carga antes de app.js y conserva los select como fuente de estado. */
'use strict';

const byIdF = (id) => document.getElementById(id);
/* ---------- B8: la productora elegida ya no está en la selección ---------- */

function setProducerNote(text) {
  const note = byIdF('producer-note');
  if (!note) return;
  note.hidden = !text;
  note.textContent = text;
}

/* Selectores con búsqueda: escribir solo filtra opciones; Enter o clic selecciona.
 * Se conserva el select como fuente de estado para las dependencias de app.js.
 */
const filterCombos = new Map();
function enhanceFilter(id) {
  const select=byIdF(id), field=select.closest('.field'), label=field.querySelector('label');
  const box=document.createElement('div'); box.className='filter-combo';
  const input=document.createElement('input'); input.id=id+'-input'; input.type='text';
  input.autocomplete='off'; input.spellcheck=false; input.setAttribute('role','combobox');
  input.setAttribute('aria-autocomplete','list'); input.setAttribute('aria-expanded','false');
  input.setAttribute('aria-controls',id+'-list');
  label.htmlFor=input.id;
  const clear=document.createElement('button'); clear.type='button'; clear.className='combo-clear';
  clear.textContent='×'; clear.setAttribute('aria-label','Limpiar '+label.textContent.toLowerCase());
  const toggle=document.createElement('button'); toggle.type='button'; toggle.className='combo-toggle';
  toggle.textContent='▾'; toggle.setAttribute('aria-label','Abrir opciones de '+label.textContent.toLowerCase());
  toggle.setAttribute('aria-controls',id+'-list'); toggle.setAttribute('aria-expanded','false');
  const list=document.createElement('div'); list.id=id+'-list'; list.className='combo-list';
  list.setAttribute('role','listbox'); list.setAttribute('aria-label',label.textContent); list.hidden=true;
  const status=document.createElement('span'); status.className='sr-only'; status.setAttribute('role','status');
  box.append(input,clear,toggle,list,status); select.after(box); select.hidden=true;
  let options=[],active=-1,query='';
  const selected=()=>select.selectedOptions[0]?.textContent||'';
  function close(){list.hidden=true;input.value=selected();input.setAttribute('aria-expanded','false');toggle.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');}
  function highlight(index){
    active=index;
    [...list.querySelectorAll('[role=option]')].forEach((node,i)=>node.classList.toggle('active',i===active));
    const node=list.children[active];
    if(node?.getAttribute('role')==='option'){input.setAttribute('aria-activedescendant',node.id);node.scrollIntoView({block:'nearest'});}
    else input.removeAttribute('aria-activedescendant');
  }
  function choose(value){select.value=value;close();input.focus();select.dispatchEvent(new Event('change',{bubbles:true}));}
  function open(search=''){
    query=search;
    options=[...select.options].filter(o=>!o.disabled&&(!query||PDData.norm(o.textContent).includes(PDData.norm(query))));
    list.replaceChildren();list.hidden=false;input.setAttribute('aria-expanded','true');toggle.setAttribute('aria-expanded','true');
    options.forEach((option,i)=>{
      const node=document.createElement('div');node.id=id+'-option-'+i;node.setAttribute('role','option');
      node.setAttribute('aria-selected',String(option.selected));node.textContent=option.textContent;
      node.addEventListener('pointerdown',event=>event.preventDefault());
      node.addEventListener('click',()=>choose(option.value));list.append(node);
    });
    if(!options.length){const empty=document.createElement('div');empty.className='combo-empty';empty.textContent='No hay coincidencias';list.append(empty);}
    status.textContent=options.length?options.length+' opciones disponibles':'No hay coincidencias';
    highlight(options.length?Math.max(0,options.findIndex(o=>o.selected)):-1);
  }
  input.addEventListener('click',()=>{if(list.hidden)open();input.select();});
  input.addEventListener('input',()=>open(input.value));
  input.addEventListener('keydown',event=>{
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
      if(list.hidden&&['Home','End'].includes(event.key))return;
      event.preventDefault();
      if(list.hidden){open();return;}
      const next=event.key==='Home'?0:event.key==='End'?options.length-1:Math.max(0,Math.min(options.length-1,active+(event.key==='ArrowDown'?1:-1)));
      highlight(next);
    }else if(event.key==='Enter'&&!list.hidden){event.preventDefault();if(options[active])choose(options[active].value);}
    else if(event.key==='Escape'){event.preventDefault();close();}
    else if(event.key==='Tab')close();
  });
  toggle.addEventListener('click',()=>{if(list.hidden){input.focus();open();input.select();}else close();});
  clear.addEventListener('click',()=>choose('all'));
  box.addEventListener('focusout',event=>{if(!box.contains(event.relatedTarget))close();});
  document.addEventListener('pointerdown',event=>{if(!box.contains(event.target))close();});
  const sync=()=>{close();clear.hidden=select.value==='all';};
  filterCombos.set(id,{sync,close});sync();
}
['filter-coop','filter-territory','filter-base'].forEach(enhanceFilter);
function afterFiltersBuilt(){filterCombos.forEach(combo=>combo.sync());}

// details mantiene su comportamiento nativo de teclado y comunica su estado al lector.
document.querySelectorAll('details[data-table-toggle]').forEach(details=>{
  const summary=details.querySelector('summary');
  details.addEventListener('toggle',()=>{summary.textContent=details.open?'Ocultar tabla':'Ver tabla';});
});

/* Leyendas compartidas: botones con estado, tachado y transición de las series. */
const PDLegend = (()=>{
  const duration=()=>typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:180;
  function toggle(chart,index){
    if(!Number.isInteger(index)||!chart.data.datasets[index])return;
    const ms=duration(),visible=chart.isDatasetVisible(index);
    chart.options.animation=ms?{duration:ms}:false;
    for(const mode of ['show','hide'])chart.options.transitions[mode].animation={duration:ms};
    if(visible)chart.hide(index);else chart.show(index);
    chart.config.options.pdLegendChange?.(chart);
  }
  function sync(chart){
    const root=chart.$pdLegend;if(!root)return;
    const items=Chart.defaults.plugins.legend.labels.generateLabels(chart);
    const labels=new Set(items.map(item=>String(item.datasetIndex)));
    root.querySelectorAll('button').forEach(button=>{if(!labels.has(button.dataset.datasetIndex))button.remove();});
    items.forEach(item=>{
      let button=root.querySelector(`[data-dataset-index="${item.datasetIndex}"]`);
      if(!button){
        button=document.createElement('button');button.type='button';button.className='legend-toggle';
        button.dataset.datasetIndex=item.datasetIndex;
        const swatch=document.createElement('b');swatch.className='legend-swatch';swatch.setAttribute('aria-hidden','true');
        const text=document.createElement('span');text.className='legend-label';
        button.append(swatch,text);button.onclick=()=>toggle(chart,item.datasetIndex);root.append(button);
      }
      const visible=chart.isDatasetVisible(item.datasetIndex),swatch=button.querySelector('b');
      const background=chart.data.datasets[item.datasetIndex].backgroundColor;
      const color=typeof background==='string'?background:item.fillStyle;
      button.setAttribute('aria-pressed',String(visible));
      button.setAttribute('aria-label',(visible?'Ocultar ':'Mostrar ')+item.text);
      button.querySelector('span').textContent=item.text;
      if(chart.config.options.pdLegendPoints){
        swatch.classList.add('legend-symbol');
        swatch.textContent=({circle:'●',triangle:'▲',rect:'■',rectRot:'◆',crossRot:'×'})[chart.data.datasets[item.datasetIndex].pointStyle]||'●';
        swatch.style.color=color;
      }else swatch.style.backgroundColor=color;
    });
    chart.$pdLegendEmpty.hidden=chart.data.datasets.some((_,i)=>chart.isDatasetVisible(i));
  }
  const plugin={id:'pdInteractiveLegend',beforeInit(chart){
    const config=chart.config.options,legend=chart.options.plugins.legend;
    if(!config.pdLegendContainer&&!legend.display)return;
    const box=chart.canvas.parentElement;
    let root=config.pdLegendContainer?document.getElementById(config.pdLegendContainer):null;
    chart.$pdLegendOwned=!root;
    if(!root){root=document.createElement('div');if(legend.position==='top')box.before(root);else box.after(root);}
    root.classList.add('chart-legend');root.setAttribute('role','group');
    root.setAttribute('aria-label','Leyenda de '+(chart.canvas.getAttribute('aria-label')||'gráfico'));
    const empty=document.createElement('p');empty.className='chart-note';empty.hidden=true;empty.textContent='Todas las series están ocultas.';
    empty.setAttribute('role','status');root.after(empty);
    chart.$pdLegend=root;chart.$pdLegendEmpty=empty;
    legend.display=false;
  },afterUpdate:sync,afterDestroy(chart){
    if(chart.$pdLegendOwned)chart.$pdLegend?.remove();else chart.$pdLegend?.replaceChildren();
    chart.$pdLegendEmpty?.remove();
  }};
  return {toggle,sync,plugin};
})();
if(typeof Chart!=='undefined')Chart.register(PDLegend.plugin);

/* ---------- Enlaces entre pantallas (por ejemplo, de Cruces a Relaciones) ---------- */
document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-nav]');
  if (link) nav(link.dataset.nav);
});
