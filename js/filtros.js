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

/* ---------- B9: leyendas interactivas ---------- */

if (typeof Chart !== 'undefined') {
  const legend = Chart.defaults.plugins.legend;
  const defaultClick = legend.onClick;
  legend.onHover = (event) => { if (event.native?.target) event.native.target.style.cursor = 'pointer'; };
  legend.onLeave = (event) => { if (event.native?.target) event.native.target.style.cursor = 'default'; };
  legend.onClick = function onLegendClick(event, item, legendObj) {
    const chart = legendObj.chart;
    if (item.datasetIndex !== undefined) {
      const visible = chart.data.datasets.filter((d, i) => chart.isDatasetVisible(i)).length;
      // No se deja ocultar la última serie: el gráfico vacío parecería «sin datos».
      if (visible === 1 && chart.isDatasetVisible(item.datasetIndex)) return;
    }
    defaultClick.call(this, event, item, legendObj);
  };
}

/* ---------- Enlaces entre pantallas (por ejemplo, de Cruces a Relaciones) ---------- */
document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-nav]');
  if (link) nav(link.dataset.nav);
});
