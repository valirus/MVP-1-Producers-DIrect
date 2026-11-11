/* Descripción y agregación del archivo cargado. No modifica registros. */
(function(root){
  'use strict';
  const D=root.PDData||(typeof require!=='undefined'?require('./data_core.js'):null);
  const place=r=>r.territory&&r.province&&!D.norm(r.territory).endsWith(' - '+D.norm(r.province))?r.territory+' - '+r.province:r.territory||r.province||null;
  function overview(rows){
    const distinct=fn=>new Set(rows.map(fn).filter(v=>v!=null)).size;
    let level,title,get;
    if(distinct(place)>1){level='territory';title='Productoras por distrito y provincia';get=place;}
    else if(distinct(r=>r.base)>1){level='base';title='Productoras por grupo local';get=r=>r.base;}
    else if(distinct(r=>r.coop)>1){level='coop';title='Productoras por cooperativa';get=r=>r.coop;}
    else {level='selection';title=rows.length?(place(rows[0])||rows[0].base||rows[0].coop):'Resumen de la selección';get=r=>place(r)||r.base||r.coop;}
    const groups=new Map();
    rows.forEach(r=>{const name=get(r)||'Ubicación vacía';if(!groups.has(name))groups.set(name,[]);groups.get(name).push(r);});
    return {level,title,groups:[...groups].map(([name,records])=>({name,records,n:records.length})).sort((a,b)=>b.n-a.n||a.name.localeCompare(b.name,'es'))};
  }
  function metricGroups(rows,key){
    return overview(rows).groups.map(({name,records,n})=>{
      const values=records.map(r=>r[key]).filter(D.finite);
      return {name,records:n,answered:values.length,total:values.reduce((sum,value)=>sum+value,0)};
    }).filter(group=>group.answered);
  }
  function tiles(groups,width=900,height=280){
    const out=[];
    function split(items,x,y,w,h){
      if(!items.length)return;
      if(items.length===1){out.push({...items[0],x,y,w,h});return;}
      const total=items.reduce((s,g)=>s+g.n,0);let cut=1,sum=items[0].n;
      while(cut<items.length-1&&Math.abs(sum+items[cut].n-total/2)<Math.abs(sum-total/2)){sum+=items[cut].n;cut++;}
      const ratio=sum/total;
      if(w>=h){split(items.slice(0,cut),x,y,w*ratio,h);split(items.slice(cut),x+w*ratio,y,w*(1-ratio),h);}
      else {split(items.slice(0,cut),x,y,w,h*ratio);split(items.slice(cut),x,y+h*ratio,w,h*(1-ratio));}
    }
    split(groups.filter(g=>g.n>0),0,0,width,height);return out;
  }
  function describe(values,kind){
    const present=values.filter(v=>v!=null&&String(v).trim()!=='');
    if(!present.length)return {kind,valid:0,empty:values.length,unique:0,mean:null,min:null,max:null,mode:[],modeN:0};
    const key=v=>Array.isArray(v)?[...v].sort().join('; '):typeof v==='boolean'?(v?'Sí':'No'):String(v);
    const counts=new Map();present.forEach(v=>{const k=key(v);counts.set(k,(counts.get(k)||0)+1);});
    const sorted=[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'es'));
    const numbers=present.filter(D.finite);
    return {kind,valid:present.length,empty:values.length-present.length,unique:counts.size,
      mean:kind==='number'&&numbers.length?D.mean(numbers):null,
      min:kind==='number'&&numbers.length?numbers.reduce((a,b)=>Math.min(a,b)):null,
      max:kind==='number'&&numbers.length?numbers.reduce((a,b)=>Math.max(a,b)):null,
      mode:sorted.filter(([,n])=>n===sorted[0][1]).map(([value])=>value),modeN:sorted[0][1]};
  }
  function dataset(records,audit,profile){
    const coverage=D.coverage(records,audit);
    const columns=coverage.map(f=>{
      const kind=['code'].includes(f.key)?'id':D.numeric.includes(f.key)?'number':'category';
      const values=records.map(r=>D.extraKinds[f.key]==='bin'?(r[f.key]===1?'Sí':r[f.key]===0?'No':null):r[f.key]);
      return {...f,stats:describe(values,kind),empty:Math.max(0,f.missing-f.invalid)};
    });
    const heads=profile.matrix[profile.header]||[],map=profile.map;
    const input=profile.matrix.slice(profile.header+1).filter(r=>r.some(v=>v!=null&&String(v).trim()!==''));
    const identities=new Map();let missingKeys=0;
    input.forEach(r=>{
      const code=r[map.code],coop=map.coop===undefined?profile.fixedCoop:r[map.coop];
      if(code==null||!String(code).trim()||coop==null||!String(coop).trim()){missingKeys++;return;}
      const id=JSON.stringify([D.norm(coop),D.norm(code)]);identities.set(id,(identities.get(id)||0)+1);
    });
    const repeated=[...identities.values()].filter(n=>n>1).reduce((s,n)=>s+n,0);
    const normalizedHeads=heads.map(D.norm).filter(Boolean),seen=new Set(),duplicates=new Set();
    normalizedHeads.forEach(h=>{if(seen.has(h))duplicates.add(h);seen.add(h);});
    const width=input.reduce((n,row)=>Math.max(n,row.length),heads.length);
    const unnamed=Array.from({length:width},(_,i)=>i).filter(i=>!D.norm(heads[i])&&input.some(row=>row[i]!=null&&String(row[i]).trim()!==''));
    const required=map.code!==undefined&&(map.coop!==undefined||!!profile.fixedCoop);
    const invalid=columns.reduce((n,c)=>n+c.invalid,0);
    const checks=[
      {name:'Código y cooperativa',ok:required,detail:required?'Columnas reconocidas':'Faltan columnas obligatorias'},
      {name:'Identificadores completos',ok:!missingKeys,detail:missingKeys?missingKeys+' filas con código o cooperativa vacíos':input.length+' filas completas'},
      {name:'Identificadores únicos',ok:!repeated,detail:repeated?repeated+' filas con identificador repetido':identities.size+' identificadores únicos'},
      {name:'Encabezados completos',ok:!unnamed.length,detail:unnamed.length?'Columnas sin título: '+unnamed.map(i=>String(i+1)).join(', '):'Todas las columnas con contenido tienen título'},
      {name:'Encabezados únicos',ok:!duplicates.size,detail:duplicates.size?'Repetidos: '+[...duplicates].join(', '):normalizedHeads.length+' encabezados distintos'},
      {name:'Tipos de datos',ok:!invalid,detail:invalid?invalid+' valores no válidos':'Valores compatibles en los campos asignados'}
    ];
    const used=new Set(Object.values(map)),blocked=new Set(D.sensitiveHeaders([profile]).map(f=>f.column-1));
    const extras=Array.from({length:width},(_,i)=>heads[i]||'').flatMap((header,i)=>{
      if((!header&&!unnamed.includes(i))||used.has(i)||blocked.has(i))return [];
      const raw=records.map(r=>profile.matrix[r.sourceRow-1]?.[i]??null),present=raw.filter(v=>v!=null&&String(v).trim()!=='');
      const parsed=present.map(v=>D.parseNumber(v,'dot').value),numeric=present.length&&parsed.every(D.finite);
      return [{header:String(header||'Columna '+(i+1)+' (sin título)'),stats:describe(numeric?raw.map(v=>D.parseNumber(v,'dot').value):raw,numeric?'number':'category')}];
    });
    return {columns,checks,extras,inputRows:input.length,repeated,missingKeys};
  }
  const api={place,overview,metricGroups,tiles,describe,dataset};root.PDResumen=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
