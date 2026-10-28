/* PCA sobre correlaciones muestrales. Jacobi simétrico; no pesos fijos. */
(function(root){'use strict';
function eigenSymmetric(input){const n=input.length,a=input.map(r=>[...r]),v=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j)));let converged=false;
 for(let iter=0;iter<1000;iter++){let p=0,q=1,max=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(Math.abs(a[i][j])>max){max=Math.abs(a[i][j]);p=i;q=j;}if(max<1e-12){converged=true;break;}
 const theta=.5*Math.atan2(2*a[p][q],a[q][q]-a[p][p]),c=Math.cos(theta),s=Math.sin(theta),app=a[p][p],aqq=a[q][q],apq=a[p][q];
 for(let k=0;k<n;k++)if(k!==p&&k!==q){const kp=a[k][p],kq=a[k][q];a[k][p]=a[p][k]=c*kp-s*kq;a[k][q]=a[q][k]=s*kp+c*kq;}
 a[p][p]=c*c*app-2*s*c*apq+s*s*aqq;a[q][q]=s*s*app+2*s*c*apq+c*c*aqq;a[p][q]=a[q][p]=0;
 for(let k=0;k<n;k++){const kp=v[k][p],kq=v[k][q];v[k][p]=c*kp-s*kq;v[k][q]=s*kp+c*kq;}}
 if(!converged)throw Error('La descomposición no convergió.');return Array.from({length:n},(_,i)=>i).sort((i,j)=>a[j][j]-a[i][i]).map(i=>{const w=v.map(r=>r[i]);let im=0;w.forEach((x,j)=>{if(Math.abs(x)>Math.abs(w[im]))im=j;});return {value:Math.max(0,a[i][i]),weights:w.map(x=>x*(w[im]<0?-1:1))};});}
function fitPCA(records,vars=['age','family','years','area','qq','income']){const complete=records.filter(r=>vars.every(k=>typeof r[k]==='number'&&Number.isFinite(r[k]))),n=complete.length;
 if(n<=vars.length)return {ok:false,n,excluded:records.length-n,reason:'PCA no disponible: requiere al menos 7 registros completos en las seis variables.'};
 const means=vars.map(k=>complete.reduce((s,r)=>s+r[k],0)/n),stds=vars.map((k,j)=>Math.sqrt(complete.reduce((s,r)=>s+(r[k]-means[j])**2,0)/(n-1)));
 if(stds.some(x=>x<=1e-12))return {ok:false,n,excluded:records.length-n,reason:'PCA no disponible: hay una variable constante.'};
 const z=complete.map(r=>vars.map((k,j)=>(r[k]-means[j])/stds[j])),cov=vars.map((_,i)=>vars.map((_,j)=>z.reduce((s,r)=>s+r[i]*r[j],0)/(n-1))),components=eigenSymmetric(cov),total=components.reduce((s,c)=>s+c.value,0),scores=new Map(complete.map((r,i)=>[r,components.map(c=>c.weights.reduce((s,w,j)=>s+w*z[i][j],0))]));
 return {ok:true,n,excluded:records.length-n,vars,means,stds,components,variance:components.map(c=>100*c.value/total),scores};}
root.PDPCA={eigenSymmetric,fitPCA};if(typeof module!=='undefined')module.exports=root.PDPCA;
})(typeof globalThis!=='undefined'?globalThis:this);
