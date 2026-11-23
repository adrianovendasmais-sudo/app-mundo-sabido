/* Junta os arquivos de src/ em app.js (uma única função, como antes).
   Uso: node build.js           -> gera app.js
        node build.js --check   -> confere se app.js está igual ao que seria gerado */
const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'src');
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.js')).sort();
const body=files.map(f=>fs.readFileSync(path.join(dir,f),'utf8').replace(/\n$/,'')).join('\n');
const out="(function(){\n'use strict';\n\n"+body+"\n})();\n";
const target=path.join(__dirname,'app.js');
if(process.argv.includes('--check')){
  const cur=fs.existsSync(target)?fs.readFileSync(target,'utf8'):'';
  if(cur!==out){console.error('app.js está diferente de src/. Rode: node build.js');process.exit(1);}
  console.log('app.js confere com src/ ('+files.length+' arquivos)');
}else{
  fs.writeFileSync(target,out);console.log('app.js gerado de '+files.length+' arquivos de src/ ('+out.length+' bytes)');
}
