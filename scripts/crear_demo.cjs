/* Genera un archivo ficticio para probar el tablero sin usar información operativa. */
const fs=require('node:fs'),path=require('node:path'),X=require('../vendor/xlsx.full.min.js');
const out=path.resolve(process.argv[2]||path.join(__dirname,'../data/processed/demo_ficticia.xlsx'));
const columns=['codigo_productora','cooperativa','distrito','provincia','base_sector','edad_al_cierre','n_familiares_convivientes',
  'antiguedad_socio_titular_anios','area_cafe_reportada','quintales_acopiados','ingreso_principal_pen','monto_solicitado_pen','actividad_a_financiar',
  'tipo_celular_beneficiaria','dificultad_lectoescritura','nivel_educativo','acceso_internet','agua_desague','servicios_financieros',
  'canales_preferidos','usa_yape','ahorro_capitalizacion_cooperativa','credito_vigente_socio_cooperativa','credito_vigente_beneficiaria_sistema',
  'capacitacion_cooperativa','periodo'];
const rows=Array.from({length:30},(_,i)=>{
  const west=i<18;
  return ['DEMO-'+String(i+1).padStart(3,'0'),west?'Bosque Claro':'Valle Verde',west?'Distrito Norte':'Distrito Sur',
    'Provincia Demo',i%2?'Sector A':'Sector B',27+i,1+i%4,2+i%6,i===29?null:.5+(i%9)*.25,12+(i*7)%49,2000+i*125,
    [850,950,950,1350,1650,2100][(i+(west?1:3))%6],west?'Fertilización':i%2?'Crianza de animales':'Emprendimiento',
    i%4?'SMARTPHONE':'BASICO',i%5?'NINGUNA':'LECTURA',i%3?'SECUNDARIA_COMPLETA':'PRIMARIA_COMPLETA',
    i%4?'EN_CASA':'FUERA_DE_CASA',i%3?'AMBOS':'SOLO_AGUA',i%3?'YAPE':'NINGUNO',i%4?'WHATSAPP; LLAMADAS':'LLAMADAS',
    +(i%3!==0),+(i%3!==0),+(i%5===0),0,+(i%5!==0),2027];
});
const book=X.utils.book_new();
X.utils.book_append_sheet(book,X.utils.aoa_to_sheet([columns,...rows]),'Productoras');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,Buffer.from(X.write(book,{bookType:'xlsx',type:'array'})));
console.log(out);
