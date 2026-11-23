/* Junta os arquivos de src/ em app.js (uma única função, como antes).
   Uso: node build.js           -> gera app.js
        node build.js --check   -> confere se app.js está igual ao que seria gerado */
const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'src');
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.js')).sort();
const body=files.map(f=>fs.readFileSync(path.join(dir,f),'utf8').replace(/\n$/,'')).join('\n');
/* As imagens de images/ são embutidas no app.js (data URI). Assim o app não depende de a pasta images/ ser publicada. */
const mime={png:'image/png',svg:'image/svg+xml',webp:'image/webp',jpg:'image/jpeg'};
const withImgs=body.replace(/const MIMG=(\{[^\n]*\});/,(all,json)=>{
  const map=JSON.parse(json),o={};
  Object.keys(map).forEach(k=>{const f=path.join(__dirname,map[k]);o[k]='data:'+mime[path.extname(f).slice(1)]+';base64,'+fs.readFileSync(f).toString('base64');});
  return 'const MIMG='+JSON.stringify(o)+';';
});
const out="(function(){\n'use strict';\n\n"+withImgs+"\n})();\n";
const target=path.join(__dirname,'app.js');
if(process.argv.includes('--check')){
  const cur=fs.existsSync(target)?fs.readFileSync(target,'utf8'):'';
  if(cur!==out){console.error('app.js está diferente de src/. Rode: node build.js');process.exit(1);}
  console.log('app.js confere com src/ ('+files.length+' arquivos)');
}else{
  fs.writeFileSync(target,out);console.log('app.js gerado de '+files.length+' arquivos de src/ ('+out.length+' bytes)');
}
