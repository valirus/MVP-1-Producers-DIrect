/* Configuración explícita de columnas. Se reutiliza el lector del contrato. */
'use strict';
let sourceSession = null, importRequest = 0;

function inspectWorkbook(wb) {
  const profiles=[], sheets=[];
  wb.SheetNames.forEach((name,i)=>{
    const sheet=wb.Sheets[name], hidden=!!wb.Workbook?.Sheets?.[i]?.Hidden;
    const range=sheet?.['!ref']?XLSX.utils.decode_range(sheet['!ref']):null;
    const oversized=range&&(range.e.r>=50001||range.e.c>=250||(range.e.r+1)*(range.e.c+1)>2000000);
    let profile=null;
    if(!hidden&&range&&!oversized){
      const matrix=XLSX.utils.sheet_to_json(sheet,{header:1,defval:null,blankrows:true,raw:true,range:{s:{r:0,c:0},e:range.e}});
      profile=D.sheetProfile(name,matrix);
      profiles.push(profile);
    }
    const row=profile?.matrix[profile.header]||[];
    sheets.push({name,hidden,columns:range?range.e.c+1:0,
      rows:profile?profile.matrix.slice(profile.header+1).filter(r=>r.some(v=>v!=null&&String(v).trim()!=='')).length:0,
      state:hidden?'Oculta':oversized?'Supera el límite':!range?'Vacía':'Disponible',
      headerRow:profile?profile.header+1:null,headers:row.map(v=>String(v??''))});
  });
  return {profiles,sheets};
}

function beginConfiguration(session,selectedName) {
  pending={...session,profiles:session.profiles.map(p=>({...p,map:{...p.map}}))};
  $('sheet-select').replaceChildren(...pending.profiles.map((p,i)=>new Option(p.name,String(i))));
  const index=pending.profiles.findIndex(p=>p.name===selectedName);
  $('sheet-select').value=String(Math.max(0,index));
  drawConfiguration(); syncControls(); $('sheet-select').focus();
}
function drawConfiguration() {
  if(!pending)return;
  const p=pending.profiles[Number($('sheet-select').value)];
  if(!p)return;
  $('header-row').value=p.header+1;
  const header=p.matrix[p.header]||[], blocked=new Set(D.sensitiveHeaders([p]).map(s=>s.column-1));
  $('column-mapping').innerHTML=D.fields.filter(([k])=>k!=='infocorp').map(([key,,label])=>
    `<div class="field"><label for="map-${key}">${H.esc(datasetLabel([key,'',label]))}${['code','coop'].includes(key)?' *':''}</label><select id="map-${key}" data-map="${key}"><option value="">Sin columna</option>${header.map((h,i)=>h&&!blocked.has(i)?`<option value="${i}"${p.map[key]===i?' selected':''}>${H.esc(XLSX.utils.encode_col(i)+': '+h)}</option>`:'').join('')}</select></div>`).join('');
  const used=new Set(Object.values(p.map));
  $('mapping-unused').textContent=header.filter((h,i)=>h&&!used.has(i)).join(' · ')||'Ninguna';
  $('mapping-personal').hidden=!blocked.size;
}
function saveConfiguration() {
  if(!pending)return;
  const p=pending.profiles[Number($('sheet-select').value)];
  const map={};
  $('column-mapping').querySelectorAll('[data-map]').forEach(select=>{if(select.value!=='')map[select.dataset.map]=Number(select.value);});
  p.map=map;
  const session={...pending,numberMode:'dot'};
  loadProfile(p,session.fileName,session);
}
document.getElementById('sheet-select').addEventListener('change',drawConfiguration);
document.getElementById('header-row').addEventListener('change',()=>{
  if(!pending)return;
  const p=pending.profiles[Number($('sheet-select').value)],row=Number($('header-row').value)-1;
  if(!Number.isInteger(row)||row<0||row>=Math.min(100,p.matrix.length)){setImportError('Elige una fila de encabezados entre 1 y '+Math.min(100,p.matrix.length)+'.');return;}
  p.header=row;p.map=D.inferMap(p.matrix[row]||[]);drawConfiguration();
});
document.getElementById('column-mapping').addEventListener('change',()=>{
  if(!pending)return;
  const p=pending.profiles[Number($('sheet-select').value)];p.map={};
  document.querySelectorAll('[data-map]').forEach(s=>{if(s.value!=='')p.map[s.dataset.map]=Number(s.value);});
  const used=new Set(Object.values(p.map));
  $('mapping-unused').textContent=(p.matrix[p.header]||[]).filter((h,i)=>h&&!used.has(i)).join(' · ')||'Ninguna';
});
document.getElementById('configure-data').addEventListener('click',()=>{if(sourceSession)beginConfiguration(sourceSession,sourceSession.selectedName);});
