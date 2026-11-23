(function(){
'use strict';

/* ========== utilidades ========== */
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
let RNG=Math.random;
const rand=n=>Math.floor(RNG()*n);
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let FIXED=false;function seeded(seed,fn){const keep=RNG,kf=FIXED;RNG=mulberry(seed);FIXED=true;try{return fn();}finally{RNG=keep;FIXED=kf;}}
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rand(i+1);const t=a[i];a[i]=a[j];a[j]=t;}return a;};
const pick=(a,n)=>shuffle(a).slice(0,n);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const today=()=>{try{return new Date().toLocaleDateString('sv-SE');}catch(e){return new Date().toISOString().slice(0,10);}};
const PRAISE=['Muito bem!','Isso mesmo!','Parabéns!','Você acertou!','Show!','Perfeito!','Arrasou!'];
const praise=()=>PRAISE[rand(PRAISE.length)];

/* ========== progresso salvo ========== */
const KEY='ferias-sabidas-v1';
const PRIV_V=2;                /* suba este número se o uso dos dados mudar: o aviso inicial volta a aparecer */
const PRIV_CONTACT='';         /* nome e e-mail do responsável pelo app (preencher antes de divulgar) */
/* Preferências ficam em cada aluno (P.prefs) e são lidas por S.rate, S.sound, S.fx... (propriedades não enumeráveis).
   Estrelas, rodadas, dia e tema também ficam no aluno. S guarda só a lista de alunos e o aluno atual. */
const DEFAULT_PREFS={rate:0.85,sound:true,auto:'listen',upper:true,big:false,legible:false,
  fx:true,conf:true,anim:true,masc:true,dots:true,vol:1,fewOpts:false,mediated:false,
  pv:2,pausebtn:true,pauseSec:120,reinf:'stars',goalTokens:5,reward:'Hora de brincar!',interest:''};
const GUEST=Object.assign({},DEFAULT_PREFS);
let S={cur:null,profiles:[]};
let P=null,SESS=null;
let legacy=null;
try{const r=localStorage.getItem(KEY);if(r){legacy=JSON.parse(r);Object.assign(S,legacy);}}catch(e){}
const oldPrefs={};
['rate','sound','auto','upper','big','legible'].forEach(k=>{if(S[k]!==undefined)oldPrefs[k]=S[k];});
if(S.calm){['fx','conf','anim','dots'].forEach(k=>{oldPrefs[k]=false;});}
const normSkin=v=>v==='algodao'||v==='mundo'?v:'aventura';
function newProfile(o){
  return {id:'p'+Date.now().toString(36)+Math.floor(Math.random()*1000),name:o.name||'Aluno(a)',birth:o.birth||'',grade:o.grade||'',klass:o.klass||'',notes:o.notes||'',
    skin:normSkin(o.skin),stars:o.stars||0,rounds:o.rounds||{},
    day:(o.day&&typeof o.day==='object')?o.day:{d:'',m:{}},log:[],sessions:[],rep:{by:'',obs:'',beh:''},
    band:o.band||'auto',worlds:o.worlds||null,an:o.an||{},prefs:Object.assign({},DEFAULT_PREFS,o.prefs||{}),tokens:{n:0},routine:[],rday:{d:'',done:{}},goals:[],streak:{last:'',n:0},stick:[],chal:'',cap:{eyes:'',neck:'',ear:'',back:''},lvl:{},proj:{}};
}
if(!Array.isArray(S.profiles))S.profiles=[];
if(!S.profiles.length&&legacy&&(legacy.stars||legacy.skin||(legacy.rounds&&Object.keys(legacy.rounds).length))){
  S.profiles.push(newProfile({name:'Aluno(a)',skin:legacy.skin,stars:legacy.stars,rounds:legacy.rounds,day:legacy.day,prefs:oldPrefs}));
  S.cur=S.profiles[0].id;
}
['stars','rounds','day','skin','rate','sound','auto','upper','calm','big','legible'].forEach(k=>{delete S[k];});
S.profiles.forEach(p=>{
  if(!Array.isArray(p.log))p.log=[];
  if(!Array.isArray(p.sessions))p.sessions=[];
  if(!p.rep)p.rep={by:'',obs:'',beh:''};
  if(!p.day||typeof p.day!=='object')p.day={d:'',m:{}};
  if(!p.rounds)p.rounds={};
  if(!p.stars)p.stars=0;
  const pvOk=!!(p.prefs&&p.prefs.pv>=2);
  p.prefs=Object.assign({},DEFAULT_PREFS,p.prefs||(Object.keys(oldPrefs).length?oldPrefs:{}));
  if(!pvOk){p.prefs.masc=true;p.prefs.pv=2;}
  if(!p.tokens)p.tokens={n:0};
  if(!Array.isArray(p.routine))p.routine=[];
  if(!p.rday)p.rday={d:'',done:{}};
  if(!Array.isArray(p.goals))p.goals=[];
  if(!p.streak)p.streak={last:'',n:0};
  if(!Array.isArray(p.stick))p.stick=[];
  if(!p.chal)p.chal='';
  if(!p.cap)p.cap={eyes:'',neck:'',ear:'',back:''};
  if(!p.lvl)p.lvl={};
  if(!p.proj||typeof p.proj!=='object')p.proj={};
  if(!p.band)p.band='auto';
  if(!Array.isArray(p.worlds)||!p.worlds.length)p.worlds=null;
  if(!p.an)p.an={};
});
Object.keys(DEFAULT_PREFS).forEach(k=>{
  Object.defineProperty(S,k,{get(){const o=P?P.prefs:GUEST;return o[k]===undefined?DEFAULT_PREFS[k]:o[k];},set(v){(P?P.prefs:GUEST)[k]=v;}});
});
Object.defineProperty(S,'calm',{get(){return !S.fx&&!S.conf&&!S.anim&&!S.dots;},set(v){['fx','conf','anim','dots'].forEach(k=>{S[k]=!v;});}});
Object.defineProperties(S,{
  stars:{get(){return P?P.stars:0},set(v){if(P)P.stars=v;}},
  rounds:{get(){return P?P.rounds:{}},set(v){if(P)P.rounds=v;}},
  day:{get(){return P?P.day:{d:'',m:{}}},set(v){if(P)P.day=v;}},
  skin:{get(){return P?P.skin:null},set(v){if(P)P.skin=v;}}
});
function save(){if(typeof WIPED!=='undefined'&&WIPED)return;try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function setProfile(id){P=S.profiles.find(p=>p.id===id)||null;S.cur=P?P.id:null;save();applySkin();applyPrefs();}
function logEntry(e,sid){
  if(!P)return null;
  e.ts=Date.now();e.sid=sid||null;
  P.log.push(e);
  if(P.log.length>5000)P.log.splice(0,P.log.length-5000);
  save();
  return e;
}
const strip=s=>String(s==null?'':s).replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').trim();
function markToday(mod){if(S.day.d!==today())S.day={d:today(),m:{}};S.day.m[mod]=true;bumpStreak();save();}
function rank(){const t=[[300,'Lenda das Férias'],[160,'Mestre'],[80,'Campeão'],[30,'Aventureiro'],[0,'Explorador']];return t.find(x=>S.stars>=x[0])[1];}
function roundsOf(k){return Object.keys(S.rounds).filter(x=>x.indexOf(k+':')===0).reduce((a,x)=>a+S.rounds[x],0);}

/* ========== sons ========== */
let ac=null;
function tone(f,t0,d,type,g){
  if(!S.sound||!S.fx)return;
  try{
    ac=ac||new (window.AudioContext||window.webkitAudioContext)();
    const o=ac.createOscillator(),v=ac.createGain(),t=ac.currentTime+t0;
    o.type=type||'sine';o.frequency.value=f;
    v.gain.setValueAtTime(0.0001,t);v.gain.linearRampToValueAtTime((g||0.12)*S.vol,t+0.02);v.gain.exponentialRampToValueAtTime(0.0001,t+d);
    o.connect(v);v.connect(ac.destination);o.start(t);o.stop(t+d+0.05);
  }catch(e){}
}
const sfx={
  ok(){tone(660,0,.12);tone(880,.1,.2);},
  bad(){tone(190,0,.25,'triangle',.14);},
  win(){[523,659,784,1047].forEach((f,i)=>tone(f,i*.11,.22));},
  tap(){tone(520,0,.05,'sine',.06);}
};

/* ========== voz (leitura em voz alta) ========== */
const hasTTS=('speechSynthesis' in window)&&('SpeechSynthesisUtterance' in window);
let voices=[];
function loadVoices(){if(!hasTTS)return;try{voices=speechSynthesis.getVoices()||[];}catch(e){voices=[];}}
if(hasTTS){loadVoices();try{speechSynthesis.addEventListener('voiceschanged',loadVoices);}catch(e){}}
function voiceFor(lang){
  const l=lang.toLowerCase();
  const norm=v=>v.lang.toLowerCase().replace('_','-');
  const exact=voices.filter(v=>norm(v)===l);
  const pre=voices.filter(v=>norm(v).indexOf(l.slice(0,2))===0);
  const pool=exact.length?exact:pre;
  return pool.find(v=>/google|natural|enhanced|premium|luciana|joana|francisca|samantha/i.test(v.name))||pool[0]||null;
}
let token=0;
function stopSpeech(){token++;if(hasTTS){try{speechSynthesis.cancel();}catch(e){}}}
function say(parts,done,onpart){
  if(!hasTTS||!S.sound||PAUSED){if(done)done();return;}
  if(!Array.isArray(parts))parts=[parts];
  stopSpeech();
  const my=token;
  /* todas as partes entram na fila da voz de uma vez: a troca entre inglês e português não espera nada do aplicativo */
  setTimeout(()=>{
    if(my!==token)return;
    if(!parts.length){if(done)done();return;}
    let fin=false,tm=null;
    const end=()=>{if(fin||my!==token)return;fin=true;clearTimeout(tm);if(done)done();};
    let est=500;
    parts.forEach((p,idx)=>{
      const u=new SpeechSynthesisUtterance(p.t);
      u.lang=p.lang||'pt-BR';
      const v=voiceFor(u.lang);if(v)u.voice=v;
      u.rate=p.rate||S.rate;u.pitch=1.08;u.volume=S.vol;
      u.onstart=()=>{if(my===token&&onpart)onpart(idx);};
      if(idx===parts.length-1){u.onend=end;u.onerror=end;}
      est+=Math.max(1200,p.t.length*150/(p.rate||S.rate)+500);
      try{speechSynthesis.speak(u);}catch(e){end();}
    });
    tm=setTimeout(end,est+1500);
  },70);
}

/* ========== ícones ========== */
const ICON={
  speaker:'<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  mute:'<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  star:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" fill="#FFC21A" stroke="#E69500" stroke-width="1.2" stroke-linejoin="round"/></svg>',
  piece:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6.2a2.3 2.3 0 1 1 4.6 0H20v6.2a2.3 2.3 0 1 0 0 4.6V20h-6.2a2.3 2.3 0 1 0-4.6 0H4v-5.2a2.3 2.3 0 1 1 0-4.6V4z" fill="currentColor"/></svg>'
};

/* ========== mascote, confete e nível ========== */
function mascot(mood,cls){
  return '<span class="cfig'+(cls?' '+cls:'')+'">'+accSvg(true)+'<img class="mascot" src="'+MIMG.capy+'" alt="Capi, a capivara do aplicativo" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'mascot capifb\',textContent:\'🦫\'}))">'+accSvg(false)+'</span>';
}
function confetti(){
  if(!S.conf||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))return;
  const box=document.createElement('div');box.className='confetti';box.setAttribute('aria-hidden','true');
  const cols=['var(--c-letras)','var(--c-leitura)','var(--c-contas)','var(--c-puzzle)','var(--c-ingles)','#FFC21A'];
  for(let i=0;i<26;i++){
    const s=document.createElement('i'),a=Math.random()*Math.PI*2,d=90+Math.random()*160;
    s.style.cssText='--x:'+Math.round(Math.cos(a)*d)+'px;--y:'+Math.round(Math.sin(a)*d-60)+'px;--r:'+Math.round(Math.random()*540-270)+'deg;background:'+cols[i%cols.length]+';animation-delay:'+(Math.random()*.08).toFixed(2)+'s';
    box.appendChild(s);
  }
  document.body.appendChild(box);setTimeout(()=>box.remove(),1300);
}
const RANKS=[[0,'Explorador'],[30,'Aventureiro'],[80,'Campeão'],[160,'Mestre'],[300,'Lenda das Férias']];
function rankInfo(){
  let k=0;RANKS.forEach((r,i)=>{if(S.stars>=r[0])k=i;});
  const cur=RANKS[k],nx=RANKS[k+1]||null;
  return {name:cur[1],next:nx,pct:nx?Math.max(6,Math.round(100*(S.stars-cur[0])/(nx[0]-cur[0]))):100};
}
const TILE={letras:'Mundo das Letras',leitura:'Mundo da Leitura',contas:'Mundo dos Números',mente:'Mundo da Mente',puzzle:'Mundo dos Quebra-Cabeças',ingles:'Mundo do Inglês'};
const SHORT={letras:'Alfabeto e sílabas',leitura:'Palavras, frases e histórias',contas:'Somar, subtrair e tabuada',mente:'Atenção, memória e lógica',puzzle:'Monte a imagem',ingles:'Palavras com som'};
const BADGE={letras:['Aa','Letras'],leitura:['📖','Leitura'],contas:['➕','Números'],mente:['🧠','Mente'],puzzle:['🧩','Quebra-cabeças'],ingles:['🌎','Inglês']};

/* ========== interesses, fichas, pausa e rotina ========== */
const MIMG={"capy": "images/capy.png", "head": "images/head.png", "abc": "images/abc.png", "n123": "images/n123.png", "puz": "images/puz.png", "flag": "images/flag.png", "book": "images/book.png", "bulb": "images/bulb.png"};
const GLOBE='<svg class="globe" viewBox="0 0 48 48" aria-hidden="true"><defs><radialGradient id="gg" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#6FD0FF"/><stop offset="1" stop-color="#1668D8"/></radialGradient></defs><circle cx="24" cy="24" r="22" fill="#fff"/><circle cx="24" cy="24" r="19.5" fill="url(#gg)"/><path d="M12 14c4-4 9-4 10 0s-3 5-2 9-6 3-8-1-3-5 0-8zM28 24c4-2 9 0 8 5s-5 8-8 6-3-9 0-11zM30 10c3-1 6 1 5 3s-4 3-6 2-1-4 1-5z" fill="#5BC236"/><path d="M14 10c3-3 6-4 9-3" stroke="#fff" stroke-width="2" fill="none" opacity=".5" stroke-linecap="round"/></svg>';
const ICON_GEAR='<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6a.5.5 0 0 0 .1-.6l-1.9-3.3a.5.5 0 0 0-.6-.2l-2.4 1a7.4 7.4 0 0 0-1.7-1l-.4-2.5a.5.5 0 0 0-.5-.4h-3.8a.5.5 0 0 0-.5.4l-.4 2.5a7.4 7.4 0 0 0-1.7 1l-2.4-1a.5.5 0 0 0-.6.2L2.5 8.8a.5.5 0 0 0 .1.6l2 1.6a7.6 7.6 0 0 0 0 2l-2 1.6a.5.5 0 0 0-.1.6l1.9 3.3c.1.2.4.3.6.2l2.4-1c.5.4 1.1.7 1.7 1l.4 2.5c0 .2.3.4.5.4h3.8c.2 0 .5-.2.5-.4l.4-2.5c.6-.3 1.2-.6 1.7-1l2.4 1c.2.1.5 0 .6-.2l1.9-3.3a.5.5 0 0 0-.1-.6l-2-1.6zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/></svg>';
const ICON_PAUSE='<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor"/></svg>';
const INTERESTS=[['','Nenhum','✨'],['trens','Trens','🚂'],['dino','Dinossauros','🦖'],['carros','Carros','🚗'],['espaco','Espaço','🚀'],['animais','Animais','🐶'],['futebol','Futebol','⚽'],['princesas','Princesas','👑']];
const INT_EMOJI={trens:['🚂','🚃','🚉','🛤️','🚄'],dino:['🦖','🦕','🥚','🦴','🌋'],carros:['🚗','🚕','🚙','🏍️','🚌'],espaco:['🚀','🪐','🌙','⭐','🛸'],
  animais:['🐶','🐱','🐰','🦁','🐘'],futebol:['⚽','🥅','🏆','👟','🎽'],princesas:['👑','🏰','🧚','🪄','🦄']};
const TOKEN_EMOJI={trens:'🚂',dino:'🦖',carros:'🚗',espaco:'🚀',animais:'🐶',futebol:'⚽',princesas:'👑'};
const INT_ITEMS={trens:[{w:'vagões',g:'os'},{w:'trens',g:'os'}],dino:[{w:'dinossauros',g:'os'},{w:'ovos de dinossauro',g:'os'}],carros:[{w:'carrinhos',g:'os'}],
  espaco:[{w:'foguetes',g:'os'},{w:'estrelas',g:'as'}],animais:[{w:'bichinhos',g:'os'},{w:'gatinhos',g:'os'}],futebol:[{w:'bolas',g:'as'},{w:'gols',g:'os'}],princesas:[{w:'coroas',g:'as'},{w:'fadas',g:'as'}]};
const INT_WORDS={trens:[['trem','🚂'],['trilho','🛤️'],['vagão','🚃'],['estação','🚉']],dino:[['dino','🦖'],['ovo','🥚'],['osso','🦴'],['vulcão','🌋']],
  carros:[['carro','🚗'],['roda','🛞'],['moto','🏍️'],['ônibus','🚌']],espaco:[['lua','🌙'],['foguete','🚀'],['planeta','🪐'],['estrela','⭐']],
  animais:[['gato','🐱'],['cão','🐶'],['peixe','🐟'],['leão','🦁']],futebol:[['bola','⚽'],['gol','🥅'],['taça','🏆'],['chuteira','👟']],
  princesas:[['coroa','👑'],['castelo','🏰'],['fada','🧚'],['varinha','🪄']]};
const hasInt=()=>!!(S.interest&&INT_EMOJI[S.interest]&&!FIXED);
const tokenEmoji=()=>TOKEN_EMOJI[S.interest]||'⭐';
const wordsBase=()=>FIXED?WORDS:WORDS.concat(WORDS_X);
function allWords(){return wordsBase().concat(hasInt()?INT_WORDS[S.interest].map(x=>({w:x[0],e:x[1]})):[]);}
function pickWords(n){
  if(!hasInt())return pick(wordsBase(),n);
  const iw=INT_WORDS[S.interest].map(x=>({w:x[0],e:x[1]})),a=pick(iw,Math.min(3,iw.length));
  return shuffle(a.concat(pick(wordsBase().filter(x=>!a.some(y=>y.e===x.e)),n-a.length)));
}

let PAUSED=false,PAUSED_MS=0;
function overlay(html,cls){
  const d=document.createElement('div');d.className='ovl '+(cls||'');d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
  d.innerHTML=html;document.body.appendChild(d);return d;
}
function startPause(onEnd){
  if(PAUSED)return;
  PAUSED=true;stopSpeech();
  const t0=Date.now(),secs=S.pauseSec|0;
  const d=overlay(`<div class="pcircle" aria-hidden="true"></div><h2>Pausa</h2><p>Respire com calma. Volte quando quiser.</p>
    ${secs?'<div class="pbar" aria-hidden="true"><i id="pfill"></i></div><p id="pleft"></p>':''}
    <button class="btn primary" id="pback" style="--c:var(--c-puzzle)">Voltar às atividades</button>`,'pause');
  let iv=null;
  if(secs){
    const upd=()=>{const el=Math.floor((Date.now()-t0)/1000),f=d.querySelector('#pfill'),l=d.querySelector('#pleft');
      if(f)f.style.width=Math.min(100,100*el/secs)+'%';
      if(l)l.textContent=el>=secs?'Quando estiver pronto, toque no botão.':'';};
    upd();iv=setInterval(upd,1000);
  }
  d.querySelector('#pback').onclick=()=>{
    if(iv)clearInterval(iv);
    d.remove();PAUSED=false;
    const ms=Date.now()-t0;PAUSED_MS+=ms;
    logEntry({mod:'pausa',act:'pausa',dom:'',lab:'Pausa',ans:'',ms:ms},SESS&&view.name==='avalrun'?SESS.id:null);
    if(onEnd)onEnd();
  };
  d.querySelector('#pback').focus();
}
function startBreak(onEnd){
  const d=overlay('<span class="emo xl" aria-hidden="true">🎈</span><h2>Hora de brincar!</h2><p>Quando terminar, toque no botão.</p><button class="btn primary" id="bkOk" style="--c:var(--c-ingles)">Terminei</button>','pause');
  d.querySelector('#bkOk').onclick=()=>{d.remove();if(onEnd)onEnd();};
  d.querySelector('#bkOk').focus();
}
const tokenOn=()=>!!P&&S.reinf==='tokens';
function tokenAdd(){if(!tokenOn())return false;P.tokens.n=(P.tokens.n||0)+1;save();return P.tokens.n>=S.goalTokens;}
function tokenBarHTML(){
  const g=S.goalTokens,n=Math.min(P.tokens.n||0,g),e=tokenEmoji();
  return '<div class="tokbar" role="img" aria-label="Fichas: '+n+' de '+g+'">'+Array.from({length:g},(_,i)=>'<span class="tk'+(i<n?' on':'')+'">'+e+'</span>').join('')+'</div>';
}
function refreshTokens(m){const el=$('.tokbar',m);if(el)el.outerHTML=tokenBarHTML();}
function showReward(){
  if(PAUSED)return;
  PAUSED=true;stopSpeech();sfx.win();fanfare();rain();
  const t0=Date.now(),e=tokenEmoji();
  const d=overlay('<div class="rwd" aria-hidden="true">'+Array.from({length:S.goalTokens},()=>'<span>'+e+'</span>').join('')+'</div><h2>Quadro completo!</h2><p class="bigtxt">'+esc(S.reward||'Hora de brincar!')+'</p><button class="btn primary" id="rwOk" style="--c:var(--c-contas)">Combinado!</button>','reward');
  d.querySelector('#rwOk').onclick=()=>{d.remove();PAUSED=false;PAUSED_MS+=Date.now()-t0;P.tokens.n=0;save();if(view.name==='home')screens.home($('#main'));};
  d.querySelector('#rwOk').focus();
}
function progressHTML(ri){
  if(S.reinf==='none')return '';
  if(S.reinf==='tokens')return '<div class="xp"><div class="rx"><span>Meu quadro de fichas</span><span>'+Math.min(P.tokens.n||0,S.goalTokens)+'/'+S.goalTokens+'</span></div>'+tokenBarHTML()+'<div class="rx"><small>Complete para: '+esc(S.reward||'Hora de brincar!')+'</small></div></div>';
  return '<div class="xp"><div class="rx"><span>'+ICON.star.replace('<svg','<svg width="26" height="26" style="vertical-align:-5px"')+' '+S.stars+' '+(S.stars===1?'estrela':'estrelas')+'</span><span>'+esc(ri.name)+'</span></div>'
    +'<div class="xpbar" role="img" aria-label="Progresso para o próximo nível"><i style="width:'+ri.pct+'%"></i></div>'
    +'<div class="rx"><small>'+(ri.next?'Faltam '+(ri.next[0]-S.stars)+' estrelas para '+esc(ri.next[1]):'Você chegou ao nível mais alto!')+'</small></div></div>';
}

const ROUTINE_STEPS={letras:['Aa','Letras'],leitura:['📖','Leitura'],contas:['➕','Números'],mente:['🧠','Mente'],puzzle:['🧩','Quebra-cabeças'],ingles:['🌎','Inglês'],pausa:['🌿','Pausa'],brincar:['🎈','Brincar']};
function routineDone(k){
  if(ROUTINE_STEPS[k]&&MODS[k])return !!(P.day.m&&P.day.m[k]);
  return !!(P.rday&&P.rday.d===today()&&P.rday.done[k]);
}
function progressCompact(ri){
  if(S.reinf!=='stars')return progressHTML(ri);
  return '<div class="xp xpc"><div class="rx"><span>Nível: '+esc(ri.name)+'</span></div>'
    +'<div class="xpbar" role="img" aria-label="Progresso para o próximo nível"><i style="width:'+ri.pct+'%"></i></div>'
    +'<div class="rx"><small>'+(ri.next?'Faltam '+(ri.next[0]-S.stars)+' '+((ri.next[0]-S.stars)===1?'estrela':'estrelas')+' para '+esc(ri.next[1]):'Você chegou ao nível mais alto!')+'</small></div></div>';
}
const STAR_HOW='Você ganha 1 estrela a cada resposta certa de primeira, 2 a 5 estrelas ao montar um quebra-cabeça e 5 estrelas ao concluir o desafio do dia.';
function missionBtn(d){
  const w=worlds(),left=w.filter(k=>!d[k]);
  if(!left.length)return '<p class="missiondone">Missão de hoje cumprida! Você pode jogar mais quando quiser.</p>';
  const k=left[0],cont=left.length<w.length;
  return '<button class="btn primary mission" style="--c:var(--c-'+k+')" data-go="menu"'+dataArg(k)+' aria-label="'+(cont?'Continuar':'Começar')+' minha missão: '+esc(TILE[k]||MODS[k].title)+'">'+(cont?'Continuar minha missão':'Começar minha missão')+' <span aria-hidden="true">›</span></button><small class="missionnext">Próximo: '+esc(TILE[k]||MODS[k].title)+'</small>';
}
function routineHTML(){
  const R=P.routine||[];
  if(!R.length)return '';
  const cur=R.findIndex(k=>!routineDone(k));
  return '<div class="xp routine"><div class="rx"><span>Minha rotina de hoje</span><span>'+R.filter(routineDone).length+'/'+R.length+'</span></div><div class="steps">'
    +R.map((k,i)=>{const done=routineDone(k),st=ROUTINE_STEPS[k],tag=done?'Feito':i===cur?'Agora':(cur>=0&&i===cur+1)?'Depois':'';
      return '<button class="step'+(done?' done':'')+(i===cur?' now':'')+'" data-act="step" data-k="'+k+'" aria-label="'+st[1]+(tag?', '+tag:'')+'"><span class="si">'+(done?'✓':st[0])+'</span><b>'+st[1]+'</b><small>'+tag+'</small></button>';}).join('')
    +'</div></div>';
}
function rdone(k){
  if(!P.rday||P.rday.d!==today())P.rday={d:today(),done:{}};
  P.rday.done[k]=true;save();
  if(view.name==='home')screens.home($('#main'));
}

/* apoio do adulto (modo mediado) */
const SUP=[['Sozinha(o)',0],['Com dica',1],['Com ajuda',2]];
const supportHTML=()=>'<div class="sup" role="group" aria-label="Nível de apoio dado pelo adulto"><span>Apoio:</span>'+SUP.map((s,i)=>'<button type="button" class="supchip'+(i===0?' on':'')+'" data-l="'+s[1]+'">'+s[0]+'</button>').join('')+'</div>';


/* ========== conteúdo: letras e sílabas ========== */
const LETTERS=[
['A','abelha','🐝','á'],['B','bola','⚽','bê'],['C','casa','🏠','cê'],['D','dado','🎲','dê'],['E','elefante','🐘','é'],
['F','flor','🌸','éfe'],['G','gato','🐱','gê'],['H','helicóptero','🚁','agá'],['I','igreja','⛪','i'],['J','jacaré','🐊','jota'],
['K','kiwi','🥝','cá'],['L','leão','🦁','éle'],['M','maçã','🍎','ême'],['N','navio','🚢','êne'],['O','ovo','🥚','ó'],
['P','pato','🦆','pê'],['Q','queijo','🧀','quê'],['R','rato','🐭','érre'],['S','sol','☀️','ésse'],['T','tartaruga','🐢','tê'],
['U','uva','🍇','u'],['V','vaca','🐮','vê'],['W','waffle','🧇','dáblio'],['X','xícara','☕','xis'],['Y','yakisoba','🍜','ípsilon'],['Z','zebra','🦓','zê']
];
const SYL=[
{s:['BO','LA'],e:'⚽'},{s:['GA','TO'],e:'🐱'},{s:['CA','SA'],e:'🏠'},{s:['PA','TO'],e:'🦆'},{s:['SA','PO'],e:'🐸'},
{s:['FA','DA'],e:'🧚'},{s:['VA','CA'],e:'🐮'},{s:['U','VA'],e:'🍇'},{s:['LU','A'],e:'🌙'},{s:['LI','VRO'],e:'📖'},
{s:['PEI','XE'],e:'🐟'},{s:['BO','NÉ'],e:'🧢'},{s:['MA','CA','CO'],e:'🐒'},{s:['BA','NA','NA'],e:'🍌'},{s:['SA','PA','TO'],e:'👟'},
{s:['TO','MA','TE'],e:'🍅'},{s:['PI','PO','CA'],e:'🍿'},{s:['A','BE','LHA'],e:'🐝'},{s:['FO','GUE','TE'],e:'🚀'},{s:['CO','E','LHO'],e:'🐰'},
{s:['ES','TRE','LA'],e:'⭐'},{s:['CA','VA','LO'],e:'🐴'},{s:['JA','CA','RÉ'],e:'🐊'}
];
const SYLPOOL=Array.from(new Set(SYL.reduce((a,x)=>a.concat(x.s),[])));
const WORDS=(()=>{
  const m={};
  LETTERS.forEach(l=>{if(['kiwi','waffle','yakisoba'].indexOf(l[1])<0)m[l[1]]=l[2];});
  SYL.forEach(x=>{m[x.s.join('').toLowerCase()]=x.e;});
  return Object.keys(m).map(w=>({w:w,e:m[w]}));
})();

/* ========== conteúdo: leitura ========== */
const SENT=[
{t:'O sol brilha no ___.',o:['céu','chão','mar'],a:'céu'},
{t:'A abelha faz ___.',o:['mel','pão','sopa'],a:'mel'},
{t:'O peixe vive na ___.',o:['água','terra','nuvem'],a:'água'},
{t:'Eu escovo os ___ todos os dias.',o:['dentes','livros','pratos'],a:'dentes'},
{t:'O passarinho canta na ___.',o:['árvore','panela','água'],a:'árvore'},
{t:'Eu leio um ___ antes de dormir.',o:['livro','sapato','copo'],a:'livro'},
{t:'Quando chove, eu uso o ___.',o:['guarda-chuva','chinelo','ventilador'],a:'guarda-chuva'},
{t:'O bolo é feito no ___.',o:['forno','sofá','jardim'],a:'forno'},
{t:'Na escola, a professora escreve na ___.',o:['lousa','cama','geladeira'],a:'lousa'},
{t:'O leão é o rei da ___.',o:['selva','cozinha','escola'],a:'selva'},
{t:'De noite, a ___ ilumina o céu.',o:['lua','mesa','bola'],a:'lua'},
{t:'A vaca dá ___.',o:['leite','suco','café'],a:'leite'}
];
const STORIES=[
{t:'O gato Bino',s:['Bino é um gato pequeno.','Ele gosta de brincar com uma bola azul.','Um dia, a bola rolou para debaixo do sofá.','Bino miou bem alto.','A Ana ouviu e pegou a bola para ele.'],
 q:[{q:'Qual é o nome do gato?',o:['Bino','Ana','Bola'],a:'Bino'},{q:'De que cor era a bola?',o:['Azul','Vermelha','Verde'],a:'Azul'},{q:'Onde a bola foi parar?',o:['Debaixo do sofá','Na cozinha','No jardim'],a:'Debaixo do sofá'}]},
{t:'A tartaruga Lia',s:['Lia é uma tartaruga muito lenta.','Todo dia ela caminha até o lago.','No caminho, ela encontra uma borboleta amarela.','As duas ficam amigas e passam a tarde ao sol.'],
 q:[{q:'Como é a Lia?',o:['Lenta','Rápida','Barulhenta'],a:'Lenta'},{q:'Quem a Lia encontra no caminho?',o:['Uma borboleta amarela','Um sapo verde','Um peixe'],a:'Uma borboleta amarela'}]},
{t:'Dia de chuva',s:['Hoje o céu está cinza.','A chuva começou a cair.','Pedro veste a capa e calça as botas.','Ele pula nas poças e ri muito.','Depois, toma um chocolate quente com a mãe.'],
 q:[{q:'O que Pedro veste?',o:['Uma capa','Um short','Uma fantasia'],a:'Uma capa'},{q:'Com quem ele toma chocolate quente?',o:['Com a mãe','Com o pai','Com a vovó'],a:'Com a mãe'},{q:'Como está o céu?',o:['Cinza','Azul','Rosa'],a:'Cinza'}]}
];

/* ========== conteúdo: inglês ========== */
const EN={
animais:{title:'Animais',d:'Dog, cat, bird...',g:'Dog',items:[
 {en:'dog',pt:'cachorro',e:'🐶'},{en:'cat',pt:'gato',e:'🐱'},{en:'bird',pt:'pássaro',e:'🐦'},{en:'fish',pt:'peixe',e:'🐟'},{en:'cow',pt:'vaca',e:'🐮'},
 {en:'horse',pt:'cavalo',e:'🐴'},{en:'rabbit',pt:'coelho',e:'🐰'},{en:'duck',pt:'pato',e:'🦆'},{en:'pig',pt:'porco',e:'🐷'},{en:'sheep',pt:'ovelha',e:'🐑'}]},
cores:{title:'Cores',d:'Red, blue, green...',g:'Red',items:[
 {en:'red',pt:'vermelho',c:'#E03131'},{en:'blue',pt:'azul',c:'#1C7ED6'},{en:'yellow',pt:'amarelo',c:'#FCC419'},{en:'green',pt:'verde',c:'#2F9E44'},{en:'orange',pt:'laranja',c:'#F76707'},
 {en:'purple',pt:'roxo',c:'#7048E8'},{en:'pink',pt:'rosa',c:'#F783AC'},{en:'black',pt:'preto',c:'#212529'},{en:'white',pt:'branco',c:'#FFFFFF'},{en:'brown',pt:'marrom',c:'#8D5524'}]},
numeros:{title:'Números',d:'One, two, three...',g:'1 2',items:[
 {en:'one',pt:'um',n:1},{en:'two',pt:'dois',n:2},{en:'three',pt:'três',n:3},{en:'four',pt:'quatro',n:4},{en:'five',pt:'cinco',n:5},
 {en:'six',pt:'seis',n:6},{en:'seven',pt:'sete',n:7},{en:'eight',pt:'oito',n:8},{en:'nine',pt:'nove',n:9},{en:'ten',pt:'dez',n:10}]},
frutas:{title:'Frutas',d:'Apple, banana, grape...',g:'Apple',items:[
 {en:'apple',pt:'maçã',e:'🍎'},{en:'banana',pt:'banana',e:'🍌'},{en:'grape',pt:'uva',e:'🍇'},{en:'orange',pt:'laranja',e:'🍊'},{en:'strawberry',pt:'morango',e:'🍓'},
 {en:'watermelon',pt:'melancia',e:'🍉'},{en:'pineapple',pt:'abacaxi',e:'🍍'},{en:'pear',pt:'pera',e:'🍐'},{en:'lemon',pt:'limão',e:'🍋'},{en:'cherry',pt:'cereja',e:'🍒'}]},
familia:{title:'Família',d:'Mother, father, baby...',g:'Mom',items:[
 {en:'mother',pt:'mãe',e:'👩'},{en:'father',pt:'pai',e:'👨'},{en:'sister',pt:'irmã',e:'👧'},{en:'brother',pt:'irmão',e:'👦'},
 {en:'baby',pt:'bebê',e:'👶'},{en:'grandma',pt:'vovó',e:'👵'},{en:'grandpa',pt:'vovô',e:'👴'}]},
frases:{title:'Palavrinhas úteis',d:'Hello, thank you...',g:'Hi!',items:[
 {en:'Hello',pt:'olá',e:'👋'},{en:'Good morning',pt:'bom dia',e:'🌅'},{en:'Good night',pt:'boa noite',e:'🌙'},
 {en:'Thank you',pt:'obrigado',e:'🙏'},{en:'Please',pt:'por favor',e:'🤲'},{en:'Goodbye',pt:'tchau',e:'🚶'}]}
};
const enVisual=it=>it.c?`<span class="swatch" style="background:${it.c}"></span>`:(it.n?`<span class="bignum">${it.n}</span>`:`<span class="emo">${it.e}</span>`);

/* ========== mais conteúdo (só para as atividades livres; a avaliação guiada continua usando os bancos originais) ========== */
const SYL_X=[{s:['BO','LO'],e:'🎂'},{s:['SO','PA'],e:'🍲'},{s:['CO','BRA'],e:'🐍'},{s:['UR','SO'],e:'🐻'},{s:['TI','GRE'],e:'🐯'},{s:['SI','NO'],e:'🔔'},
{s:['LU','VA'],e:'🧤'},{s:['ME','IA'],e:'🧦'},{s:['BA','LÃO'],e:'🎈'},{s:['RO','BÔ'],e:'🤖'},{s:['CHA','PÉU'],e:'🎩'},{s:['GI','RA','FA'],e:'🦒'},
{s:['SOR','VE','TE'],e:'🍦'},{s:['VI','O','LÃO'],e:'🎸'},{s:['PRE','SEN','TE'],e:'🎁'},{s:['RE','LÓ','GIO'],e:'⏰'},{s:['GA','LI','NHA'],e:'🐔'},
{s:['LA','RAN','JA'],e:'🍊'},{s:['ME','LAN','CI','A'],e:'🍉'},{s:['CO','RA','ÇÃO'],e:'❤️'},{s:['ES','CO','LA'],e:'🏫'}];
const WORDS_X=((l)=>{const s={};return l.filter(x=>{if(s[x.w]||s['e'+x.e])return false;s[x.w]=s['e'+x.e]=1;return true;});})(SYL_X.map(x=>({w:x.s.join('').toLowerCase(),e:x.e})).concat([['bolo','🎂'],['pizza','🍕'],['avião','✈️'],['trem','🚂'],['barco','⛵'],['nuvem','☁️'],['chuva','🌧️'],
 ['árvore','🌳'],['urso','🐻'],['pão','🍞'],['leite','🥛'],['suco','🧃'],['lápis','✏️'],['chave','🔑'],['mão','✋'],['olho','👁️'],['bicicleta','🚲'],['telefone','📞'],['tambor','🥁'],['carro','🚗'],['moto','🏍️'],['bruxa','🧙'],['vela','🕯️']].map(x=>({w:x[0],e:x[1]}))));
const SENT_X=[
{t:'O cachorro abana o ___.',o:['rabo','prato','livro'],a:'rabo'},{t:'Eu uso o ___ para escrever.',o:['lápis','garfo','travesseiro'],a:'lápis'},
{t:'No verão faz muito ___.',o:['calor','gelo','frio'],a:'calor'},{t:'A galinha bota ___.',o:['ovos','leite','pão'],a:'ovos'},
{t:'À noite eu durmo na ___.',o:['cama','pia','rua'],a:'cama'},{t:'O barco navega no ___.',o:['mar','sofá','ar'],a:'mar'},
{t:'O avião voa no ___.',o:['céu','mar','chão'],a:'céu'},{t:'Eu lavo as mãos com água e ___.',o:['sabão','areia','tinta'],a:'sabão'},
{t:'O carro tem quatro ___.',o:['rodas','asas','patas'],a:'rodas'},{t:'O pão é feito com ___.',o:['farinha','pedra','papel'],a:'farinha'},
{t:'A girafa tem o pescoço bem ___.',o:['comprido','curto','azul'],a:'comprido'},{t:'A professora ensina as crianças na ___.',o:['escola','praia','padaria'],a:'escola'},
{t:'Para ver as horas, olhamos o ___.',o:['relógio','sapato','pente'],a:'relógio'},{t:'O sorvete é bem ___.',o:['gelado','quente','duro'],a:'gelado'},
{t:'Antes de atravessar a rua, olho para os dois ___.',o:['lados','pés','pratos'],a:'lados'},{t:'O sapo pula na ___.',o:['lagoa','nuvem','cama'],a:'lagoa'},
{t:'Eu uso óculos para ___ melhor.',o:['ver','pular','comer'],a:'ver'},{t:'A formiga é muito ___.',o:['pequena','gigante','barulhenta'],a:'pequena'}];
STORIES.push(
{t:'O foguete de Théo',s:['Théo construiu um foguete com caixas de papelão.','Ele pintou de vermelho e colou uma estrela dourada.','O cachorro Max entrou como astronauta.','Eles contaram juntos: três, dois, um, decolar!','Na imaginação deles, o foguete chegou até a lua.'],
 q:[{q:'Com o que Théo fez o foguete?',o:['Caixas de papelão','Madeira','Areia'],a:'Caixas de papelão'},{q:'Quem foi o astronauta?',o:['Max','A lua','Théo'],a:'Max'},{q:'Até onde o foguete chegou?',o:['Até a lua','Até o mar','Até a escola'],a:'Até a lua'}]},
{t:'A festa da Malu',s:['Hoje é aniversário da Malu.','Ela está fazendo sete anos.','Os amigos trouxeram presentes e balões.','Todos cantaram parabéns e comeram bolo de morango.','Malu soprou as velas e fez um pedido.'],
 q:[{q:'Quantos anos a Malu faz?',o:['Sete','Dez','Três'],a:'Sete'},{q:'De que era o bolo?',o:['Morango','Chocolate','Cenoura'],a:'Morango'},{q:'O que a Malu fez com as velas?',o:['Soprou','Guardou','Comeu'],a:'Soprou'}]},
{t:'O jardim da vovó',s:['A vovó tem um jardim cheio de flores.','Tem rosas vermelhas, margaridas brancas e girassóis amarelos.','Toda manhã, ela rega as plantas com um regador azul.','As abelhas visitam as flores e a vovó sorri.'],
 q:[{q:'Quem cuida do jardim?',o:['A vovó','O vovô','O gato'],a:'A vovó'},{q:'De que cor são os girassóis?',o:['Amarelos','Brancos','Vermelhos'],a:'Amarelos'},{q:'Quem visita as flores?',o:['As abelhas','Os peixes','Os leões'],a:'As abelhas'}]});
Object.assign(EN,{
corpo:{title:'Corpo',d:'Eye, ear, nose...',g:'Eye',items:[{en:'eye',pt:'olho',e:'👁️'},{en:'ear',pt:'orelha',e:'👂'},{en:'nose',pt:'nariz',e:'👃'},{en:'mouth',pt:'boca',e:'👄'},{en:'hand',pt:'mão',e:'✋'},{en:'foot',pt:'pé',e:'🦶'},{en:'tooth',pt:'dente',e:'🦷'},{en:'arm',pt:'braço',e:'💪'}]},
escola:{title:'Escola',d:'Book, pencil, bag...',g:'Book',items:[{en:'book',pt:'livro',e:'📖'},{en:'pencil',pt:'lápis',e:'✏️'},{en:'bag',pt:'mochila',e:'🎒'},{en:'ruler',pt:'régua',e:'📏'},{en:'scissors',pt:'tesoura',e:'✂️'},{en:'school',pt:'escola',e:'🏫'},{en:'clock',pt:'relógio',e:'⏰'},{en:'paint',pt:'tinta',e:'🎨'}]},
comidas:{title:'Comidas',d:'Bread, milk, cake...',g:'Milk',items:[{en:'bread',pt:'pão',e:'🍞'},{en:'milk',pt:'leite',e:'🥛'},{en:'egg',pt:'ovo',e:'🥚'},{en:'cheese',pt:'queijo',e:'🧀'},{en:'rice',pt:'arroz',e:'🍚'},{en:'cake',pt:'bolo',e:'🎂'},{en:'pizza',pt:'pizza',e:'🍕'},{en:'juice',pt:'suco',e:'🧃'},{en:'ice cream',pt:'sorvete',e:'🍦'}]},
clima:{title:'Tempo',d:'Sun, rain, cloud...',g:'Sun',items:[{en:'sun',pt:'sol',e:'☀️'},{en:'rain',pt:'chuva',e:'🌧️'},{en:'cloud',pt:'nuvem',e:'☁️'},{en:'snow',pt:'neve',e:'❄️'},{en:'wind',pt:'vento',e:'💨'},{en:'rainbow',pt:'arco-íris',e:'🌈'},{en:'moon',pt:'lua',e:'🌙'},{en:'star',pt:'estrela',e:'⭐'}]},
roupas:{title:'Roupas',d:'Shirt, shoes, hat...',g:'Hat',items:[{en:'shirt',pt:'camiseta',e:'👕'},{en:'pants',pt:'calça',e:'👖'},{en:'shoes',pt:'sapatos',e:'👟'},{en:'hat',pt:'boné',e:'🧢'},{en:'dress',pt:'vestido',e:'👗'},{en:'socks',pt:'meias',e:'🧦'},{en:'gloves',pt:'luvas',e:'🧤'},{en:'glasses',pt:'óculos',e:'👓'}]},
transporte:{title:'Transportes',d:'Car, bus, plane...',g:'Car',items:[{en:'car',pt:'carro',e:'🚗'},{en:'bus',pt:'ônibus',e:'🚌'},{en:'bike',pt:'bicicleta',e:'🚲'},{en:'train',pt:'trem',e:'🚂'},{en:'plane',pt:'avião',e:'✈️'},{en:'boat',pt:'barco',e:'⛵'},{en:'truck',pt:'caminhão',e:'🚚'},{en:'rocket',pt:'foguete',e:'🚀'}]},
casa:{title:'Casa',d:'House, bed, door...',g:'Bed',items:[{en:'house',pt:'casa',e:'🏠'},{en:'bed',pt:'cama',e:'🛏️'},{en:'door',pt:'porta',e:'🚪'},{en:'key',pt:'chave',e:'🔑'},{en:'phone',pt:'telefone',e:'📞'},{en:'TV',pt:'televisão',e:'📺'},{en:'lamp',pt:'lâmpada',e:'💡'}]},
acoes:{title:'Ações',d:'Run, eat, sleep...',g:'Run',items:[{en:'run',pt:'correr',e:'🏃'},{en:'eat',pt:'comer',e:'🍽️'},{en:'sleep',pt:'dormir',e:'😴'},{en:'read',pt:'ler',e:'📖'},{en:'swim',pt:'nadar',e:'🏊'},{en:'sing',pt:'cantar',e:'🎤'},{en:'dance',pt:'dançar',e:'💃'},{en:'draw',pt:'desenhar',e:'🎨'}]}
});
const sylPool=()=>FIXED?SYL:SYL.concat(SYL_X);
const sentPool=()=>FIXED?SENT:SENT.concat(SENT_X);

/* ---- novos jogos ---- */
const RIMAS=[['gato','pato','rato','prato'],['bola','cola','sola','escola'],['pão','mão','chão','balão'],['casa','asa','brasa'],['dedo','medo','cedo'],['pente','dente','gente'],
 ['luz','cruz','capuz'],['leão','limão','feijão','coração'],['mala','bala','sala','fala'],['fada','nada','espada','estrada'],['festa','floresta','testa'],['anel','papel','pincel','cascavel'],
 ['sol','farol','lençol','anzol'],['rei','lei','grei'],['faca','vaca','placa','macaca']];
function qRima(){
  return pick(RIMAS,6).map(g=>{
    const w=pick(g,2),base=w[0],ans=w[1];
    const others=pick([].concat.apply([],RIMAS.filter(x=>x!==g)).filter(x=>g.indexOf(x)<0),3);
    return {dom:'ler',lab:'Rima com “'+base+'”',ans:ans,stem:`<span class="bigword w">${base}</span>`,prompt:'Qual palavra termina com o mesmo som?',say:[{t:'Qual palavra rima com '+base+'?'}],noauto:false,
      opts:shuffle([ans].concat(others)).map(o=>({h:`<span class="otext">${esc(o)}</span>`,ok:o===ans})),cols:2,after:[{t:base+' rima com '+ans}]};
  });
}
const OPOS=[['grande','pequeno'],['alto','baixo'],['dia','noite'],['quente','frio'],['cheio','vazio'],['feliz','triste'],['rápido','devagar'],['aberto','fechado'],['claro','escuro'],['novo','velho'],['perto','longe'],['forte','fraco'],['molhado','seco'],['entrar','sair'],['subir','descer'],['liso','áspero']];
function qOpostos(){
  return pick(OPOS,6).map(pr=>{
    const f=rand(2),w=pr[f],ans=pr[1-f];
    const others=pick([].concat.apply([],OPOS.filter(x=>x!==pr)),3);
    return {dom:'comp',lab:'Oposto de “'+w+'”',ans:ans,stem:`<span class="bigword w">${w}</span>`,prompt:'Qual é o oposto?',say:[{t:'Qual é o oposto de '+w+'?'}],
      opts:shuffle([ans].concat(others)).map(o=>({h:`<span class="otext">${esc(o)}</span>`,ok:o===ans})),cols:2,after:[{t:w+' é o contrário de '+ans}]};
  });
}
function qOrdemAlfa(){
  return pick(Array.from({length:24},(_,i)=>i+1),6).map(i=>{
    const after=rand(2)===1,base=LETTERS[i],ans=LETTERS[after?i+1:i-1];
    const others=pick(LETTERS.filter(x=>x[0]!==ans[0]&&x[0]!==base[0]),3);
    return {dom:'letra',lab:'Letra '+(after?'depois':'antes')+' de '+base[0],ans:ans[0],stem:`<span class="bigword w">${base[0]}</span>`,prompt:'Qual letra vem '+(after?'depois':'antes')+' desta no alfabeto?',
      say:[{t:'Qual letra vem '+(after?'depois':'antes')+' do '+base[3]+'?'}],opts:shuffle([ans].concat(others)).map(x=>({lab:x[0],h:`<span class="w">${x[0]}</span>`,ok:x===ans})),cols:2,after:[{t:ans[0]+', '+ans[3]}]};
  });
}
function qMaiMin(){
  return pick(LETTERS,6).map(L=>{
    const low=rand(2)===1,ans=low?L[0].toLowerCase():L[0];
    const others=pick(LETTERS.filter(x=>x[0]!==L[0]),3).map(x=>low?x[0].toLowerCase():x[0]);
    return {dom:'letra',lab:(low?'Minúscula':'Maiúscula')+' de '+L[0],ans:ans,stem:`<span class="bigword w">${low?L[0]:L[0].toLowerCase()}</span>`,prompt:low?'Toque na letra minúscula (pequena) que combina.':'Toque na letra maiúscula (grande) que combina.',
      say:[{t:low?'Qual é a letra minúscula do '+L[3]+'?':'Qual é a letra maiúscula do '+L[3]+'?'}],opts:shuffle([ans].concat(others)).map(x=>({lab:x,h:`<span class="w">${x}</span>`,ok:x===ans})),cols:2,after:[{t:L[3]}]};
  });
}
function qFalta(level){
  const out=[],seen=new Set();let g=0;
  while(out.length<8&&g++<200){
    const max=level===2?20:10,c=rand(max-2)+3,a=rand(c-1)+1,b=c-a,key=a+'_'+c;if(seen.has(key))continue;seen.add(key);
    out.push({dom:'calc',lab:a+' + ? = '+c,ans:b,stem:`<span class="eq">${a} + ❔ = ${c}</span>`,prompt:'Quanto falta para completar?',say:[{t:'Quanto falta para '+a+' chegar a '+c+'?'}],opts:numOpts(b),cols:2,after:[{t:a+' mais '+b+' é '+c}]});
  }
  return out;
}
function qMaior(){
  return Array.from({length:8},()=>{
    const a=rand(40)+1;let b=rand(40)+1;if(b===a)b=a+3;const big=rand(2)===0,ans=big?Math.max(a,b):Math.min(a,b);
    return {dom:'calc',lab:(big?'Maior':'Menor')+': '+a+' ou '+b,ans:ans,stem:`<div class="dots2"><span class="bignum">${a}</span><span class="plus">ou</span><span class="bignum">${b}</span></div>`,prompt:big?'Qual número é o MAIOR?':'Qual número é o MENOR?',
      say:[{t:big?'Qual número é o maior?':'Qual número é o menor?'}],opts:shuffle([a,b]).map(n=>({lab:String(n),h:`<span class="num">${n}</span>`,ok:n===ans})),cols:2,after:[{t:String(ans)}]};
  });
}
function qDobro(){
  return Array.from({length:8},(_,i)=>{
    const half=i%2===1,n=half?(rand(9)+1)*2:rand(10)+1,ans=half?n/2:n*2;
    return {dom:'calc',lab:(half?'Metade de ':'Dobro de ')+n,ans:ans,stem:`<span class="eq">${half?'Metade':'Dobro'} de ${n}</span>`,prompt:half?'Divida em duas partes iguais.':'É o mesmo número duas vezes.',
      say:[{t:'Qual é '+(half?'a metade':'o dobro')+' de '+n+'?'}],opts:numOpts(ans,[n]),cols:2,after:[{t:String(ans)}]};
  });
}
function qVizinho(){
  return Array.from({length:8},()=>{
    const n=rand(88)+6,after=rand(2)===1,ans=after?n+1:n-1;
    return {dom:'calc',lab:'Número '+(after?'depois':'antes')+' de '+n,ans:ans,stem:`<span class="eq">${n}</span>`,prompt:'Qual número vem '+(after?'logo depois':'logo antes')+'?',
      say:[{t:'Qual número vem '+(after?'depois':'antes')+' do '+n+'?'}],opts:numOpts(ans,[n]),cols:2,after:[{t:String(ans)}]};
  });
}
const CONT_E=['⭐','🍎','🐟','🎈','🍪','🚗','🌸','⚽','🐞','🍓'];
function qContar(){
  return Array.from({length:8},(_,i)=>{
    const n=i<3?rand(5)+2:rand(9)+4,e=CONT_E[rand(CONT_E.length)];
    return {dom:'calc',lab:'Contar '+n+' figuras',ans:n,stem:`<div class="dots2">${Array.from({length:n},()=>`<span class="emo sm">${e}</span>`).join('')}</div>`,prompt:'Quantas figuras tem?',say:[{t:'Quantas figuras tem?'}],opts:numOpts(n),cols:2,after:[{t:String(n)}]};
  });
}
const GRUPOS=[['🐶','🐱','🐰','🐻','🐯','🦁'],['🍎','🍌','🍇','🍓','🍉','🍊'],['🚗','🚌','🚲','✈️','🚂','⛵'],['⚽','🏀','🎾','🏐','🏈'],['👕','👖','🧦','🧢','🧤','👗'],['☀️','🌧️','⛈️','❄️','🌈','☁️'],['📖','✏️','🎒','📏','✂️']];
function qIntruso(){
  return Array.from({length:6},()=>{
    const gs=pick(GRUPOS,2),mine=pick(gs[0],3),odd=pick(gs[1],1)[0];
    return {dom:'aten',lab:'Qual não combina',ans:odd,stem:'<span class="stemtext">Qual não combina com os outros?</span>',prompt:'Três são do mesmo grupo. Ache o que não é.',say:[{t:'Qual figura não combina com as outras?'}],
      opts:shuffle(mine.concat([odd])).map(x=>({lab:x,h:`<span class="emo">${x}</span>`,ok:x===odd})),cols:2};
  });
}

/* ========== módulos ========== */
/* ---- mais conteúdo (só prática livre; a avaliação usa apenas o conteúdo base) ---- */
SYL_X.push({s:['JA','CA','RÉ'],e:'🐊'},{s:['PE','TE','CA'],e:'🥎'},{s:['CA','MI','SA'],e:'👕'},{s:['SA','PO','TE'],e:'🧦'},{s:['TE','LE','FO','NE'],e:'📞'},
 {s:['MA','CA','CO'],e:'🐒'},{s:['PI','PO','CA'],e:'🍿'},{s:['BA','NA','NA'],e:'🍌'},{s:['TO','MA','TE'],e:'🍅'},{s:['CE','NO','U','RA'],e:'🥕'},
 {s:['FO','GUE','TE'],e:'🚀'},{s:['A','BE','LHA'],e:'🐝'},{s:['TA','TU'],e:'🦔'},{s:['CA','VA','LO'],e:'🐴'},{s:['PA','TO'],e:'🦆'});
(()=>{const have=new Set(WORDS.concat(WORDS_X).map(x=>x.w));const haveE=new Set(WORDS.concat(WORDS_X).map(x=>x.e));
  [['foguete','🚀'],['abelha','🐝'],['cavalo','🐴'],['pato','🦆'],['banana','🍌'],['tomate','🍅'],['cenoura','🥕'],['macaco','🐒'],['jacaré','🐊'],['camisa','👕'],
   ['pipoca','🍿'],['coruja','🦉'],['sapo','🐸'],['peixe','🐟'],['coelho','🐰'],['nuvem','☁️'],['estrela','⭐'],['vulcão','🌋'],['tesoura','✂️'],['guitarra','🎸']]
   .forEach(a=>{if(!have.has(a[0])&&!haveE.has(a[1])){have.add(a[0]);haveE.add(a[1]);WORDS_X.push({w:a[0],e:a[1]});}});})();
SENT_X.push(
{t:'A abelha faz ___.',o:['mel','sopa','gelo'],a:'mel'},{t:'A lua aparece à ___.',o:['noite','manhã','tarde'],a:'noite'},
{t:'O peixe vive na ___.',o:['água','areia seca','árvore'],a:'água'},{t:'A vaca dá ___.',o:['leite','suco','chá'],a:'leite'},
{t:'Eu escovo os ___ depois de comer.',o:['dentes','sapatos','livros'],a:'dentes'},{t:'O sol é muito ___.',o:['quente','frio','gelado'],a:'quente'},
{t:'A bicicleta tem duas ___.',o:['rodas','asas','portas'],a:'rodas'},{t:'Eu guardo os brinquedos na ___.',o:['caixa','panela','pia'],a:'caixa'},
{t:'O passarinho faz o ninho na ___.',o:['árvore','geladeira','mesa'],a:'árvore'},{t:'Quando chove, eu abro o ___.',o:['guarda-chuva','garfo','livro'],a:'guarda-chuva'},
{t:'A tartaruga anda muito ___.',o:['devagar','rápido','alto'],a:'devagar'},{t:'Eu bebo água no ___.',o:['copo','sapato','chapéu'],a:'copo'});
STORIES.push(
{t:'A abelha Zuzu',s:['Zuzu é uma abelha trabalhadeira.','Toda manhã ela voa até o jardim.','Ela pousa nas flores amarelas e colhe o néctar.','À tarde, volta para a colmeia e faz mel com as amigas.'],
 q:[{q:'O que a Zuzu faz com o néctar?',o:['Mel','Suco','Bolo'],a:'Mel'},{q:'Quando ela voa até o jardim?',o:['De manhã','De noite','Na hora do jantar'],a:'De manhã'},{q:'De que cor são as flores?',o:['Amarelas','Roxas','Brancas'],a:'Amarelas'}]},
{t:'O piquenique',s:['No sábado, a família foi ao parque.','Eles estenderam uma toalha na grama.','Lia levou sanduíches e Davi levou suco de uva.','Depois de comer, todos jogaram bola até o sol se pôr.'],
 q:[{q:'Para onde a família foi?',o:['Ao parque','À praia','À escola'],a:'Ao parque'},{q:'Quem levou o suco?',o:['Davi','Lia','A mãe'],a:'Davi'},{q:'O que fizeram depois de comer?',o:['Jogaram bola','Dormiram','Pintaram'],a:'Jogaram bola'}]},
{t:'O robô Zeca',s:['Zeca é um robô pequeno e prateado.','Ele ajuda a arrumar o quarto de Bia.','Zeca guarda os livros na estante e os carrinhos na caixa.','Bia agradece e dá um abraço no amigo de lata.'],
 q:[{q:'Como é o Zeca?',o:['Um robô pequeno','Um gato grande','Um pássaro'],a:'Um robô pequeno'},{q:'Onde ele guarda os livros?',o:['Na estante','Na pia','No jardim'],a:'Na estante'},{q:'O que Bia faz no final?',o:['Dá um abraço','Chora','Vai embora'],a:'Dá um abraço'}]});
Object.assign(EN,{
brinquedos:{title:'Brinquedos',d:'Ball, doll, kite...',g:'Toy',items:[
 {en:'ball',pt:'bola',e:'⚽'},{en:'kite',pt:'pipa',e:'🪁'},{en:'doll',pt:'boneca',e:'🪆'},{en:'teddy bear',pt:'ursinho de pelúcia',e:'🧸'},{en:'robot',pt:'robô',e:'🤖'},
 {en:'puzzle',pt:'quebra-cabeça',e:'🧩'},{en:'balloon',pt:'balão',e:'🎈'},{en:'drum',pt:'tambor',e:'🥁'},{en:'car',pt:'carrinho',e:'🚗'},{en:'train',pt:'trem',e:'🚂'}]},
profissoes:{title:'Profissões',d:'Doctor, teacher, chef...',g:'Job',items:[
 {en:'doctor',pt:'médico',e:'🧑‍⚕️'},{en:'teacher',pt:'professor',e:'🧑‍🏫'},{en:'chef',pt:'cozinheiro',e:'🧑‍🍳'},{en:'farmer',pt:'agricultor',e:'🧑‍🌾'},{en:'firefighter',pt:'bombeiro',e:'🧑‍🚒'},
 {en:'astronaut',pt:'astronauta',e:'🧑‍🚀'},{en:'artist',pt:'artista',e:'🧑‍🎨'},{en:'pilot',pt:'piloto',e:'🧑‍✈️'},{en:'police officer',pt:'policial',e:'👮'},{en:'singer',pt:'cantor',e:'🧑‍🎤'}]},
natureza:{title:'Natureza',d:'Tree, flower, moon...',g:'Sun',items:[
 {en:'tree',pt:'árvore',e:'🌳'},{en:'flower',pt:'flor',e:'🌸'},{en:'sun',pt:'sol',e:'☀️'},{en:'moon',pt:'lua',e:'🌙'},{en:'star',pt:'estrela',e:'⭐'},
 {en:'mountain',pt:'montanha',e:'⛰️'},{en:'sea',pt:'mar',e:'🌊'},{en:'cloud',pt:'nuvem',e:'☁️'},{en:'rainbow',pt:'arco-íris',e:'🌈'},{en:'leaf',pt:'folha',e:'🍃'}]}
});

STORIES.push(
{t:'O dia de chuva',s:['Pedro olhou pela janela e viu a chuva cair.','A mãe fez um bolo de milho para o lanche.','Depois, Pedro vestiu a capa amarela e pulou nas poças.','À noite, ele tomou chocolate quente e dormiu feliz.'],
 q:[{q:'De que cor era a capa do Pedro?',o:['Amarela','Azul','Vermelha'],a:'Amarela'},{q:'O que a mãe fez?',o:['Um bolo de milho','Uma sopa','Um suco'],a:'Um bolo de milho'},{q:'Onde o Pedro pulou?',o:['Nas poças','No sofá','Na cama'],a:'Nas poças'}]},
{t:'A pipa da Duda',s:['Duda ganhou uma pipa vermelha.','No sábado, ela foi até a praça.','O vento estava forte, e a pipa subiu bem alto.','Duda segurou a linha com as duas mãos e sorriu.'],
 q:[{q:'De que cor era a pipa?',o:['Vermelha','Verde','Rosa'],a:'Vermelha'},{q:'Aonde a Duda foi?',o:['À praça','À escola','Ao mercado'],a:'À praça'},{q:'Como estava o vento?',o:['Forte','Parado','Gelado'],a:'Forte'}]},
{t:'O jardim da vovó',s:['A vovó Rosa tem um jardim cheio de flores.','Todas as manhãs, ela rega as plantas.','Uma abelha vem visitar as flores amarelas.','Quando as flores crescem, a vovó faz um buquê para a neta.'],
 q:[{q:'Qual é o nome da vovó?',o:['Rosa','Lia','Ana'],a:'Rosa'},{q:'O que a vovó faz de manhã?',o:['Rega as plantas','Faz bolo','Vai à praia'],a:'Rega as plantas'},{q:'Quem visita as flores amarelas?',o:['Uma abelha','Um gato','Um cavalo'],a:'Uma abelha'}]},
{t:'O cachorro Tobi',s:['Tobi é um cachorro cor de caramelo.','Ele adora passear no parque.','Um dia, Tobi achou um osso grande debaixo da árvore.','Então ele escondeu o osso no quintal.'],
 q:[{q:'Qual é a cor do Tobi?',o:['Caramelo','Preto','Branco'],a:'Caramelo'},{q:'Onde o Tobi gosta de passear?',o:['No parque','Na escola','No mar'],a:'No parque'},{q:'Onde ele escondeu o osso?',o:['No quintal','No sofá','Na cozinha'],a:'No quintal'}]}
);
Object.assign(EN,{
esportes:{title:'Esportes',d:'Soccer, swim, dance...',g:'Run',items:[
 {en:'basketball',pt:'basquete',e:'🏀'},{en:'volleyball',pt:'vôlei',e:'🏐'},{en:'tennis',pt:'tênis',e:'🎾'},{en:'surf',pt:'surfar',e:'🏄'},
 {en:'skate',pt:'skate',e:'🛹'},{en:'golf',pt:'golfe',e:'⛳'},{en:'karate',pt:'caratê',e:'🥋'},{en:'fishing',pt:'pescar',e:'🎣'},{en:'medal',pt:'medalha',e:'🏅'},{en:'trophy',pt:'troféu',e:'🏆'}]},
verduras:{title:'Legumes e verduras',d:'Carrot, tomato, corn...',g:'Corn',items:[
 {en:'carrot',pt:'cenoura',e:'🥕'},{en:'tomato',pt:'tomate',e:'🍅'},{en:'potato',pt:'batata',e:'🥔'},{en:'corn',pt:'milho',e:'🌽'},{en:'onion',pt:'cebola',e:'🧅'},
 {en:'lettuce',pt:'alface',e:'🥬'},{en:'broccoli',pt:'brócolis',e:'🥦'},{en:'cucumber',pt:'pepino',e:'🥒'},{en:'garlic',pt:'alho',e:'🧄'},{en:'mushroom',pt:'cogumelo',e:'🍄'}]},
sentimentos:{title:'Sentimentos',d:'Happy, sad, sleepy...',g:'Happy',items:[
 {en:'happy',pt:'feliz',e:'😀'},{en:'sad',pt:'triste',e:'😢'},{en:'angry',pt:'bravo',e:'😠'},{en:'scared',pt:'assustado',e:'😨'},
 {en:'surprised',pt:'surpreso',e:'😮'},{en:'cold',pt:'com frio',e:'🥶'},{en:'hot',pt:'com calor',e:'🥵'},{en:'sick',pt:'doente',e:'🤒'},{en:'in love',pt:'apaixonado',e:'😍'}]},
bichos:{title:'Bichinhos',d:'Bee, ant, frog, snake...',g:'Bee',items:[
 {en:'butterfly',pt:'borboleta',e:'🦋'},{en:'bee',pt:'abelha',e:'🐝'},{en:'ant',pt:'formiga',e:'🐜'},{en:'spider',pt:'aranha',e:'🕷️'},{en:'snail',pt:'caracol',e:'🐌'},
 {en:'ladybug',pt:'joaninha',e:'🐞'},{en:'caterpillar',pt:'lagarta',e:'🐛'},{en:'frog',pt:'sapo',e:'🐸'},{en:'turtle',pt:'tartaruga',e:'🐢'},{en:'snake',pt:'cobra',e:'🐍'}]},
espaco:{title:'Espaço',d:'Planet, rocket, astronaut...',g:'Moon',items:[
 {en:'planet',pt:'planeta',e:'🪐'},{en:'Earth',pt:'Terra',e:'🌍'},{en:'telescope',pt:'telescópio',e:'🔭'},
 {en:'satellite',pt:'satélite',e:'🛰️'},{en:'alien',pt:'alienígena',e:'👽'},{en:'flying saucer',pt:'disco voador',e:'🛸'},{en:'comet',pt:'cometa',e:'☄️'},{en:'galaxy',pt:'galáxia',e:'🌌'}]},
cidade:{title:'Cidade',d:'Hospital, school, bank...',g:'City',items:[
 {en:'hospital',pt:'hospital',e:'🏥'},{en:'museum',pt:'museu',e:'🏛️'},{en:'bank',pt:'banco',e:'🏦'},{en:'store',pt:'loja',e:'🏪'},{en:'church',pt:'igreja',e:'⛪'},
 {en:'bridge',pt:'ponte',e:'🌉'},{en:'traffic light',pt:'semáforo',e:'🚦'},{en:'hotel',pt:'hotel',e:'🏨'},{en:'castle',pt:'castelo',e:'🏰'},{en:'factory',pt:'fábrica',e:'🏭'}]}
});

const MODS={
letras:{title:'Letras e sílabas',sub:'Conheça o alfabeto, junte sílabas e descubra com qual letra cada palavra começa.',glyph:'Aa',
  acts:[{id:'explorar',t:'Conhecer as letras',d:'Toque na letra e escute',g:'A'},{id:'silabas',t:'Montar palavras',d:'Junte as sílabas na ordem',g:'BO'},{id:'inicial',t:'Qual letra começa?',d:'Ouça a palavra e escolha a letra',g:'?'},{id:'achar',t:'Ache a letra',d:'Ouça o nome e toque na letra',g:'Bê'},{id:'silfalta',t:'Qual sílaba falta?',d:'Complete a palavra',g:'BO_'}]},
leitura:{title:'Leitura',sub:'Leia palavras, complete frases e ouça histórias curtas. O botão Ouvir ajuda quando travar.',glyph:'Lê',
  acts:[{id:'palavra',t:'Palavra e figura',d:'Leia a palavra e ache a figura',g:'Ba'},{id:'frase',t:'Complete a frase',d:'Escolha a palavra que falta',g:'__'},{id:'historias',t:'Histórias',d:'Ouça, leia e responda',g:'Li'}]},
contas:{title:'Números',sub:'Somar, subtrair e tabuada. A voz lê cada conta em voz alta.',glyph:'2+3',
  acts:[{id:'n1',t:'Até 10',d:'Somar e subtrair com bolinhas',g:'10'},{id:'n2',t:'Até 20',d:'Contas um pouco maiores',g:'20'},{id:'n3',t:'Tabuada',d:'Vezes 2, 3, 4, 5 e 10',g:'×'},{id:'n4',t:'Problemas',d:'Pequenas histórias com contas',g:'?'}]},
mente:{title:'Mente',sub:'Jogos de atenção, memória e lógica. Observe, lembre e descubra o que vem depois.',glyph:'🧠',
  acts:[{id:'diferente',t:'Ache o diferente',d:'Atenção visual',g:'👀'},{id:'memoria',t:'Memória',d:'Olhe, guarde e lembre',g:'🤔'},{id:'padrao',t:'O que vem depois?',d:'Padrões e sequências',g:'🔁'}]},
puzzle:{title:'Quebra-cabeça',sub:'Troque as peças de lugar até a imagem ficar completa.',glyph:ICON.piece,
  acts:[{id:'p1',t:'Fácil',d:'4 peças',g:'4'},{id:'p2',t:'Médio',d:'6 peças',g:'6'},{id:'p3',t:'Difícil',d:'9 peças',g:'9'}]},
ingles:{title:'Inglês',sub:'Ouça as palavras em inglês, repita em voz alta e depois jogue.',glyph:'Hi!',
  acts:Object.keys(EN).map(k=>({id:k,t:EN[k].title,d:EN[k].d,g:EN[k].g})).concat([{id:'mix',t:'Desafio misto',d:'Perguntas de todos os temas',g:'?'}])}
};
const MNAME={letras:'Letras',leitura:'Leitura',contas:'Números',mente:'Mente',puzzle:'Quebra-cabeça',ingles:'Inglês'};

/* ========== perguntas (jogos de escolha) ========== */
function qLetraInicial(){
  return pick(LETTERS,6).map(L=>{
    const others=pick(LETTERS.filter(x=>x[0]!==L[0]),2).map(x=>x[0]);
    const letters=shuffle([L[0]].concat(others));
    return {dom:'fon',lab:'Letra inicial de '+L[1],ans:L[0],stem:`<span class="emo xl">${L[2]}</span>`,prompt:'Com qual letra começa o nome da figura?',say:[{t:'Com qual letra começa '+L[1]+'?'}],
      opts:letters.map(x=>({h:`<span class="w">${x}</span>`,ok:x===L[0]})),cols:3,after:[{t:L[1]}]};
  });
}
function qPalavraFigura(){
  return pickWords(6).map(it=>{
    const others=pick(allWords().filter(x=>x.w!==it.w&&x.e!==it.e),3);
    return {dom:'ler',lab:'Ler a palavra “'+it.w+'”',ans:it.w,stem:`<span class="bigword w">${it.w}</span>`,prompt:'Leia a palavra e toque na figura certa.',say:[{t:it.w}],noauto:true,
      opts:shuffle([it].concat(others)).map(x=>({lab:x.w,h:`<span class="emo">${x.e}</span>`,ok:x===it})),cols:2,after:[{t:it.w}]};
  });
}
function qFrase(){
  return pick(sentPool(),6).map(it=>{
    const stem=esc(it.t).replace('___','<span class="blank">&nbsp;&nbsp;&nbsp;</span>');
    return {dom:'comp',lab:it.t.replace('___','…'),ans:it.a,stem:`<span class="stemtext">${stem}</span>`,prompt:'Qual palavra completa a frase?',say:[{t:it.t.replace('___',', ... ,')}],noauto:true,
      opts:shuffle(it.o).map(o=>({h:`<span class="otext">${esc(o)}</span>`,ok:o===it.a})),cols:1,after:[{t:it.t.replace('___',it.a)}]};
  });
}
function storyQs(i){
  return STORIES[i].q.map(q=>({dom:'comp',lab:q.q,ans:q.a,stem:`<span class="stemtext">${esc(q.q)}</span>`,prompt:'Se precisar, volte e ouça a história de novo.',say:[{t:q.q}],noauto:true,
    opts:shuffle(q.o).map(o=>({h:`<span class="otext">${esc(o)}</span>`,ok:o===q.a})),cols:1}));
}
function numOpts(ans,extra){
  const set=new Set([ans]);
  const cand=shuffle((extra||[]).concat([ans-1,ans+1,ans-2,ans+2,ans+3,ans-3,ans+10,ans-10]).filter(x=>x>=0&&x!==ans));
  for(const x of cand){if(set.size>=4)break;set.add(x);}
  return shuffle(Array.from(set)).map(n=>({h:`<span class="num">${n}</span>`,ok:n===ans}));
}
const dots=n=>'<i></i>'.repeat(n);
const objs=n=>hasInt()?Array.from({length:n},()=>'<span class="emo sm">'+INT_EMOJI[S.interest][0]+'</span>').join(''):dots(n);
const gone=n=>hasInt()?Array.from({length:n},()=>'<span class="emo sm gone">'+INT_EMOJI[S.interest][0]+'</span>').join(''):'<i class="gone"></i>'.repeat(n);
function mathQs(level){
  const out=[],seen=new Set();let guard=0;
  const NAMES=S.skin==='algodao'?['Ana','Lia','Bia','Duda','Malu','Alice']:S.skin==='mundo'?['Ana','Pedro','Lia','Davi','Bia','Caio']:['Pedro','Davi','Caio','Théo','Enzo','Lucas'];
  const ITEMS=hasInt()?INT_ITEMS[S.interest]:[{w:'balas',g:'as'},{w:'figurinhas',g:'as'},{w:'carrinhos',g:'os'},{w:'livros',g:'os'},{w:'biscoitos',g:'os'},{w:'bolinhas',g:'as'}];
  while(out.length<8&&guard++<400){
    let a,b,op,ans,key,q;
    if(level===1){
      op=rand(2)?'+':'−';
      if(op==='+'){a=rand(9)+1;b=rand(10-a)+1;ans=a+b;}else{a=rand(9)+2;b=rand(a-1)+1;ans=a-b;}
    }else if(level===2){
      op=rand(2)?'+':'−';
      if(op==='+'){a=rand(15)+3;b=rand(20-a-1)+2;ans=a+b;}else{a=rand(10)+11;b=rand(a-2)+2;ans=a-b;}
    }else if(level===3){
      op='×';a=[2,3,4,5,10][rand(5)];b=rand(10)+1;ans=a*b;
    }else{
      op=rand(2)?'+':'−';
      if(op==='+'){a=rand(12)+3;b=rand(20-a-1)+2;ans=a+b;}else{a=rand(10)+11;b=rand(a-2)+2;ans=a-b;}
    }
    key=a+op+b;if(seen.has(key))continue;seen.add(key);
    if(level===4){
      const nm=NAMES[rand(NAMES.length)],it=ITEMS[rand(ITEMS.length)];
      const text=op==='+'?`${nm} tem ${a} ${it.w}. Ganhou mais ${b}. Quant${it.g} ${it.w} ${nm} tem agora?`:`${nm} tinha ${a} ${it.w}. Deu ${b} para um amigo. Quant${it.g} ${it.w} sobraram?`;
      q={stem:`<span class="stemtext">${esc(text)}</span>`,prompt:'Pense com calma e escolha a resposta.',say:[{t:text}],opts:numOpts(ans),cols:2};
    }else{
      const word=op==='+'?'mais':op==='−'?'menos':'vezes';
      let vis='';
      if(level===1){
        vis=op==='+'?`<div class="dots2"><span class="grp">${objs(a)}</span><span class="plus">+</span><span class="grp g2">${objs(b)}</span></div>`
                    :`<div class="dots2"><span class="grp">${objs(a-b)}${gone(b)}</span></div>`;
      }
      q={stem:`${vis}<span class="eq">${a} ${op} ${b} = ?</span>`,prompt:level===1&&op==='−'?'As bolinhas tracejadas foram tiradas.':'Quanto é?',
         say:[{t:`Quanto é ${a} ${word} ${b}?`}],opts:numOpts(ans,op==='×'?[ans+a,ans-a,ans+b]:[]),cols:2};
    }
    q.dom='calc';q.lvl=level;q.lab=(level===4?'Problema ':'')+a+' '+op+' '+b;q.ans=ans;
    q.after=[{t:`${ans}`}];
    out.push(q);
  }
  return out;
}
function qIngles(p){return qInglesRaw(p).map(q=>{q.dom='ing';q.lab=q.after[0].t;return q;});}
function qInglesRaw(poolIn){
  const seenEn=new Set();
  const seenVis=new Set();
  const pool=poolIn.filter(x=>{const k=x.en.toLowerCase();if(seenEn.has(k))return false;const v=x.e||x.c||(x.n!=null?'n'+x.n:'');if(v&&seenVis.has(v))return false;seenEn.add(k);if(v)seenVis.add(v);return true;});
  const items=pick(pool,Math.min(6,pool.length));
  const types=shuffle(['A','B','C','A','B','C']);
  return items.map((it,idx)=>{
    const t=types[idx%types.length];
    const others=shuffle(pool.filter(x=>x!==it&&x.pt!==it.pt)).slice(0,3);
    const four=shuffle([it].concat(others));
    const after=[{t:it.en,lang:'en-US'},{t:it.pt,lang:'pt-BR'}];
    if(t==='A')return {stem:`<span class="bigspk">${ICON.speaker}</span>`,prompt:'Ouça e toque na figura certa.',say:[{t:it.en,lang:'en-US',rate:S.rate*0.9}],
      opts:four.map(x=>({h:enVisual(x),ok:x===it})),cols:2,after};
    if(t==='B')return {stem:enVisual(it),prompt:'Como se diz em inglês?',say:[{t:'Como se diz em inglês?'}],
      opts:four.map(x=>({h:`<span class="otext">${esc(x.en)}</span>`,ok:x===it})),cols:2,after};
    return {stem:`<span class="stemtext">${esc(it.en)}</span>`,prompt:'O que essa palavra quer dizer?',say:[{t:it.en,lang:'en-US',rate:S.rate*0.9}],
      opts:four.map(x=>({h:`<span class="otext">${esc(x.pt)}</span>`,ok:x===it})),cols:2,after};
  });
}

/* ========== navegação ========== */
const app=$('#app');
let view={name:'home'};
const screens={};
const ACTS={};
const actions={};
/* navegação ligada ao histórico: o botão voltar do celular volta uma tela */
let hist=[],hpos=0,HOK=true;
const sameView=(a,b)=>!!a&&!!b&&a.name===b.name&&JSON.stringify(a.arg||null)===JSON.stringify(b.arg||null);
function go(name,arg,opt){
  stopSpeech();
  const ent={name:name,arg:arg};
  view={name:name,arg:arg};
  if(opt&&opt.replace){hist[hpos]=ent;try{history.replaceState({i:hpos},'');}catch(e){}}
  else{hist=hist.slice(0,hpos+1);hist.push(ent);hpos=hist.length-1;try{history.pushState({i:hpos},'');}catch(e){HOK=false;}}
  NAVFOCUS=true;render();try{window.scrollTo(0,0);}catch(e){}
}
function backTo(name,arg){
  if(HOK&&hpos>0&&sameView(hist[hpos-1],{name:name,arg:arg}))history.back();
  else go(name,arg,{replace:true});
}
window.addEventListener('popstate',e=>{
  const i=e.state&&typeof e.state.i==='number'?e.state.i:0;
  stopSpeech();
  const ent=hist[i]||{name:P?'home':'who'};
  hist[i]=ent;hpos=i;
  view={name:ent.name,arg:ent.arg};
  NAVFOCUS=true;render();try{window.scrollTo(0,0);}catch(x){}
});
const dataArg=a=>a===undefined?'':` data-arg="${esc(JSON.stringify(a))}"`;
const backBtn=(name,arg)=>`<button class="back" data-go="${name}"${dataArg(arg)}>‹ Voltar</button>`;

function headerHTML(){
  return `<header class="top"><h1 class="sr">Mundo das Descobertas</h1><button class="brand" data-go="home" aria-label="Início">${S.skin==='mundo'?`<span class="logo" role="img" aria-label="Mundo das Descobertas">${GLOBE}<span class="lg"><i>Mundo das</i><b>Descobertas</b></span></span>`:`<img class="mascot hd" src="${MIMG.head}" alt=""><span>Mundo das <b>Descobertas</b></span>`}</button>
  <div class="tools">${S.reinf!=='stars'?'':`<span class="starpill" aria-label="${S.stars} estrelas">${ICON.star}<b id="starN">${S.stars}</b></span>`}${P&&S.pausebtn?`<button class="iconbtn" data-act="pause" aria-label="Pausa">${ICON_PAUSE}</button>`:''}
  <button class="iconbtn" data-act="sound" aria-pressed="${S.sound}" aria-label="${S.sound?'Desligar o som':'Ligar o som'}">${S.sound?ICON.speaker:ICON.mute}</button>
  ${P?`<button class="chip hdchip" data-go="who">${esc(P.name.split(' ')[0])}</button>`:''}<button class="iconbtn" data-go="parents" aria-label="Área dos adultos e configurações">${ICON_GEAR}</button></div></header>`;
}
function addStars(n){
  if(S.reinf==='none')return;
  S.stars+=n;save();
  const e=$('#starN');
  if(e){e.textContent=S.stars;const p=e.parentNode;p.classList.remove('bump');void p.offsetWidth;p.classList.add('bump');}
}
const NAVS=[['home','Início','M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],['progress','Meu Progresso','M4 20V10h4v10zm6 0V4h4v16zm6 0v-7h4v7z'],['achv','Conquistas','M7 3h10v3h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 16.9V19h3v2H8v-2h3v-2.1A5 5 0 0 1 8.3 13H8a4 4 0 0 1-4-4V6h3zM6 8v1a2 2 0 0 0 1.2 1.8A9 9 0 0 1 7 8zm12 0h-1.2a9 9 0 0 1-.2 2.8A2 2 0 0 0 18 9z'],['who','Perfil','M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5z']];
const NAV_ON={home:'home',menu:'home',proj:'home',projv:'home',projs:'home',projfolio:'home',progress:'progress',achv:'achv',armario:'achv',who:'who',pform:'who'};
function navHTML(){
  const show=S.skin==='mundo'&&P&&NAV_ON[view.name];
  document.body.classList.toggle('hasnav',!!show);
  if(!show)return '';
  return '<nav class="bnav" aria-label="Menu principal">'+NAVS.map(n=>'<button data-go="'+n[0]+'"'+(NAV_ON[view.name]===n[0]?' aria-current="page"':'')+'><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="'+n[2]+'"/></svg><span>'+n[1]+'</span></button>').join('')+'</nav>';
}
function focusMain(){
  const mm=$('#main');if(!mm)return;const ae=document.activeElement;
  if(ae&&ae!==document.body&&mm.contains(ae))return;
  mm.setAttribute('tabindex','-1');try{mm.focus({preventScroll:true});}catch(x){}
}
actions.skipmain=()=>{const mm=$('#main');if(mm){mm.setAttribute('tabindex','-1');mm.focus();}};
function render(){
  const bare=S.privOk!==PRIV_V;
  if(bare&&view.name!=='privacy')view={name:'intro'};
  else if(!P&&['who','pform','pin','privacy'].indexOf(view.name)<0)view={name:'who'};
  gateAdult();
  if(bare)document.body.classList.remove('hasnav');
  app.innerHTML=bare?'<main id="main"></main>':'<button class="skip" data-act="skipmain">Ir para o conteúdo</button>'+(S.skin==='mundo'?'<div class="grass" aria-hidden="true"></div>':'')+headerHTML()+'<main id="main"></main>'+navHTML();
  const f=screens[view.name]||screens.home;
  f($('#main'),view.arg);
  if(NAVFOCUS){NAVFOCUS=false;focusMain();}
}
let NAVFOCUS=false;
app.addEventListener('click',e=>{
  if(S.pin&&ADULT_V.indexOf(view.name)>=0&&!adultOk()){render();return;}
  if(UNLOCK&&ADULT_V.indexOf(view.name)>=0)ULAST=Date.now();
  const cf=e.target.closest('.cfig:not(.sm)');if(cf&&actions.capi&&(cf.closest('.hero2')||cf.closest('.mcap'))&&!cf.closest('.armprev')){actions.capi(cf);return;}
  const g=e.target.closest('[data-go]');
  if(g){
    sfx.tap();
    if(g.dataset.go==='who'&&S.shared&&P&&!g.classList.contains('back')){sharedLogout();return;}
    let arg;try{arg=g.dataset.arg?JSON.parse(g.dataset.arg):undefined;}catch(x){}
    if(g.classList.contains('back'))backTo(g.dataset.go,arg);else go(g.dataset.go,arg);return;
  }
  const a=e.target.closest('[data-act]');
  if(a&&actions[a.dataset.act])actions[a.dataset.act](a,e);
});

/* ========== telas ========== */
screens.home=m=>{
  const d=S.day.d===today()?S.day.m:{};
  const done=worlds().filter(k=>d[k]).length;
  const ri=rankInfo();
  if(S.skin==='mundo')return homeMundo(m,d,done,ri);
  m.innerHTML=`<section class="hero2"><div>${S.masc?mascot('happy'):''}</div><div class="bubble"><h1>Olá, ${esc(P?P.name.split(' ')[0]:'')}!</h1><p>O que vamos aprender hoje?</p></div></section>
  ${routineHTML()}${progressCompact(ri)}${recHTML()}${challengeHTML()}${projCardHTML()}
  <div class="xp"><div class="rx"><span>Missão de hoje</span><span>${done}/${worlds().length}</span></div>
  <div class="badges">${worlds().map(k=>`<div class="badge${d[k]?' done':''}" style="--c:var(--c-${k})"><span>${d[k]?'✓':BADGE[k][0]}</span>${BADGE[k][1]}</div>`).join('')}</div>${missionBtn(d)}</div>
  <div class="tiles">${worlds().map(k=>{const M=MODS[k],n=roundsOf(k);
    return `<button class="tile" style="--c:var(--c-${k})" data-go="menu"${dataArg(k)}><span class="glyph">${M.glyph}</span><span class="ttl">${TILE[k]||M.title}</span><span class="dsc">${esc(SHORT[k])}</span><span class="cnt">${n?n+(n===1?' rodada completa':' rodadas completas'):'Comece por aqui'}</span></button>`;}).join('')}</div>`;
  m.insertAdjacentHTML('beforeend','<div class="row"><button class="chip" data-act="skinpick">Trocar tema</button><button class="chip" data-go="who">Trocar aluno</button><button class="chip" data-go="achv">Conquistas</button><button class="chip" data-go="armario">Armário da Capi</button></div>');
};

const MT=[['letras','Mundo das Letras','abc','linear-gradient(160deg,#6DB6FF,#3F86F0)','#0F1F66'],['contas','Mundo dos Números','n123','linear-gradient(160deg,#D4F27E,#8ED83F)','#14344A'],
 ['puzzle','Mundo dos Quebra-Cabeças','puz','linear-gradient(160deg,#C98AEB,#A45BD4)','#fff'],['ingles','Mundo do Inglês','flag','linear-gradient(160deg,#FFC37E,#FF9A3C)','#5A2A00'],
 ['leitura','Mundo da Leitura','book','linear-gradient(160deg,#6BE8D0,#2CC5AA)','#0B3B45'],['mente','Mundo da Mente','bulb','linear-gradient(160deg,#E7B6FB,#C98AEB)','#3A1B66']];
function homeMundo(m,d,done,ri){
  m.innerHTML=`<section class="mhero"><div class="mcap">${S.masc?mascot('happy','big'):''}</div>
  <div class="mside"><div class="bubble"><h1>Olá, ${esc(P?P.name.split(' ')[0]:'')}!</h1><p>O que vamos aprender hoje?</p></div>${progressCompact(ri)}</div></section>
  ${routineHTML()}${recHTML()}${challengeHTML()}${projCardHTML()}
  <div class="xp"><div class="rx"><span>🎯 Minha Missão de Hoje</span><span class="pillc">${done}/${worlds().length}</span></div>
  <div class="badges">${worlds().map(k=>`<div class="badge${d[k]?' done':''}" style="--c:var(--c-${k})"><span>${d[k]?'✓':BADGE[k][0]}</span>${BADGE[k][1]}</div>`).join('')}</div>${missionBtn(d)}</div>
  <div class="mtiles">${worlds().map(k=>MT.find(t=>t[0]===k)).filter(Boolean).map(t=>`<button class="mtile" style="--bg-t:${t[3]};--tc:${t[4]}" data-go="menu"${dataArg(t[0])}><img src="${MIMG[t[2]]}" alt="" aria-hidden="true"><span class="mt">${t[1]}</span><i class="chev" aria-hidden="true">›</i></button>`).join('')}</div>
  <div class="row"><button class="chip" data-act="skinpick">Trocar tema</button><button class="chip" data-go="armario">👕 Armário da Capi</button></div>`;
}
screens.progress=m=>{
  const ri=rankInfo(),d=S.day.d===today()?S.day.m:{},done=worlds().filter(k=>d[k]).length;
  const tot=worlds().reduce((a,k)=>a+roundsOf(k),0),mx=Math.max(1,...worlds().map(k=>roundsOf(k)));
  m.innerHTML=`${S.skin==='mundo'?'':backBtn('home')}<h2 class="mtitle" style="--c:var(--c-letras)">Meu Progresso</h2>
  <div class="xp" style="margin-top:12px"><div class="rx"><span>⭐ ${S.stars} ${S.stars===1?'estrela':'estrelas'}</span><span>${esc(ri.name)}</span></div><div class="xpbar"><i style="width:${ri.pct}%"></i></div>
  <div class="rx"><small>${ri.next?'Faltam '+(ri.next[0]-S.stars)+' estrelas para '+esc(ri.next[1]):'Você chegou ao nível mais alto!'}</small></div><div class="rx"><small>${STAR_HOW}</small></div></div>
  <div class="xp"><div class="rx"><span>Hoje</span><span>${done}/${worlds().length} missões</span></div><div class="rx"><span>🔥 Dias seguidos</span><span>${streakNow()} (recorde ${(P.streak&&P.streak.best)||0})</span></div></div>
  <div class="xp"><div class="rx"><span>Rodadas por área</span><span>${tot} no total</span></div>
  ${worlds().map(k=>{const n=roundsOf(k);return `<div class="prow" style="--c:var(--c-${k})"><span>${esc(TILE[k])}</span><div class="pbar2" role="img" aria-label="${n} rodadas"><i style="width:${Math.round(100*n/mx)}%"></i></div><b>${n}</b></div>`;}).join('')}</div>`;
};
screens.achv=m=>{
  const trophies=RANKS.map(r=>{const ok=S.stars>=r[0];return `<div class="trophy${ok?' on':''}"><span aria-hidden="true">${ok?'🏆':'🔒'}</span><b>${esc(r[1])}</b><small>${r[0]} estrelas</small></div>`;}).join('');
  const meds=worlds().map(k=>{const n=roundsOf(k),lv=n>=10?3:n>=5?2:n>=1?1:0;return `<div class="trophy${lv?' on':''}" style="--c:var(--c-${k})"><span aria-hidden="true">${['🔒','🥉','🥈','🥇'][lv]}</span><b>${esc(TILE[k])}</b><small>${lv===3?'Ouro!':lv===2?'Prata · 10 rodadas = ouro':lv===1?'Bronze · 5 rodadas = prata':'1 rodada = bronze'}</small></div>`;}).join('');
  m.innerHTML=`${S.skin==='mundo'?'':backBtn('home')}<h2 class="mtitle" style="--c:var(--c-puzzle)">Conquistas</h2><div class="row" style="margin:6px 0"><button class="chip" data-go="armario">👕 Armário da Capi</button></div><div class="xp xpc"><div class="rx"><span>Próximo nível: ${(function(){const r=rankInfo();return r.next?esc(r.next[1]):'você já chegou ao topo!';})()}</span></div>${(function(){const r=rankInfo();return r.next?'<div class="xpbar" role="img" aria-label="Progresso para o próximo nível"><i style="width:'+r.pct+'%"></i></div><div class="rx"><small>Faltam '+(r.next[0]-S.stars)+' estrelas</small></div>':'';})()}<div class="rx"><small>${STAR_HOW}</small></div></div><h3 class="sech">Minhas figurinhas</h3>${stickersHTML()}<h3 class="sech">Níveis</h3><div class="trophies">${trophies}</div><h3 class="sech">Medalhas</h3><div class="trophies">${meds}</div>`;
};
screens.menu=(m,k)=>{
  const M=MODS[k];if(!M)return go('home');
  m.innerHTML=`${backBtn('home')}<h2 class="mtitle" style="--c:var(--c-${k})">${({contas:'Números',puzzle:'Quebra-cabeças',mente:'Mente'})[k]||M.title}</h2><p class="msub">${esc(M.sub)}</p>
  <div class="acts" style="--c:var(--c-${k})">${actsFor(k).map(a=>`<button class="act" data-go="act"${dataArg({m:k,id:a.id})}><span class="glyph sm">${a.g}</span><span><b>${esc(a.t)}</b><small>${esc(a.d)}</small></span></button>`).join('')}</div>`;
};
screens.act=(m,arg)=>{const f=arg&&ACTS[arg.m+':'+arg.id];if(f)f(m,arg);else go('home');};

/* --- resultado --- */
/* ---- comemoração de conquistas ---- */
function rain(){
  if(!S.conf||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))return;
  const box=document.createElement('div');box.className='rain';box.setAttribute('aria-hidden','true');
  const cols=['#FF5C8A','#FFC21A','#3FB950','#2F9BF0','#9B6BFF','#FF8A3D'],em=['⭐','🎉','✨'];
  for(let i=0;i<46;i++){
    const s=document.createElement('i');
    s.style.cssText='left:'+Math.round(Math.random()*100)+'%;background:'+cols[i%cols.length]+';animation-duration:'+(1.8+Math.random()*1.6).toFixed(2)+'s;animation-delay:'+(Math.random()*.9).toFixed(2)+'s;--d:'+Math.round(Math.random()*120-60)+'px';
    if(i%7===0){s.textContent=em[i%3];s.style.background='none';s.style.width='auto';s.style.height='auto';s.style.fontSize='22px';}
    box.appendChild(s);
  }
  document.body.appendChild(box);setTimeout(()=>box.remove(),4200);
}
function fanfare(){[523,659,784,1047,784,1047,1319].forEach((f,i)=>tone(f,i*.13,.26,'triangle',.13));}
const MILESTONES=[3,5,7,10,14,21,30,50,100];
function celebrate(items,done){
  items=items.filter(Boolean);
  if(!items.length){if(done)done();return;}
  const it=items.shift();
  const d=overlay('<div class="party'+(S.anim?'':' still')+'"><div class="glow" aria-hidden="true"></div><div class="pico" aria-hidden="true">'+it.ico+'</div>'
    +'<p class="plabel">Conquista nova!</p><h2>'+esc(it.title)+'</h2>'+(it.sub?'<p class="bigtxt">'+esc(it.sub)+'</p>':'')
    +(S.masc?'<div class="pcap">'+mascot('cheer','big')+'</div>':'')
    +'<button class="btn primary" id="pOk">'+(items.length?'Próxima conquista':'Que legal!')+'</button></div>','partyo');
  fanfare();rain();confetti();say({t:'Parabéns! '+it.title});
  const t=setTimeout(rain,2300);
  const ok=d.querySelector('#pOk');ok.focus();
  ok.onclick=()=>{clearTimeout(t);d.remove();stopSpeech();sfx.tap();celebrate(items,done);};
}
function achievementsFor(o,r,stk,nacc){
  const L=[];
  if(r===1)L.push({ico:'🏆',title:'Rodada perfeita!',sub:'Tudo certo de primeira!'});
  if(o.extra&&/Subiu/.test(o.extra))L.push({ico:'🚀',title:'Subiu de nível!',sub:o.extra.replace(/[!🚀 ]+$/,'').trim()});
  if(o.key==='desafio:dia'&&o.extra&&/bônus|concluído/.test(o.extra))L.push({ico:'🎯',title:'Desafio do dia concluído!',sub:o.extra});
  const n=streakNow(),st=P&&P.streak;
  if(st&&MILESTONES.indexOf(n)>=0&&st.mk!==today()+':'+n){st.mk=today()+':'+n;save();L.push({ico:'🔥',title:n+' dias seguidos!',sub:'Você não desiste. Que orgulho!'});}
  if(stk)L.push({ico:stk,title:'Nova figurinha!',sub:'Ela foi para o seu álbum.'});
  if(nacc)L.push({ico:nacc.ico,title:'A Capi ganhou: '+nacc.n,sub:'Vista no Armário da Capi.'});
  return L;
}
function result(m,o){
  S.rounds[o.key]=(S.rounds[o.key]||0)+1;markToday(o.module);save();
  sfx.win();if(S.reinf==='stars')confetti();
  const r=o.earned/o.total;
  const stk=giveSticker();
  const nacc=ACC.find(a=>a.need===roundsAll());
  const msg=r===1?'Perfeito! Tudo certo de primeira!':r>=0.6?'Muito bem! Continue assim!':'Boa tentativa! Vamos jogar de novo?';
  m.innerHTML=`<section class="result" style="--c:var(--c-${o.module})"><div class="medal">${mascot('cheer')}</div><h2>${msg}</h2>
  <p class="score"><b>${o.earned}</b> de ${o.total} de primeira</p>${o.extra?`<p class="score"><b>${esc(o.extra)}</b></p>`:''}${stk?`<p class="stkline">Nova figurinha: <span>${stk}</span></p>`:''}${nacc?`<p class="stkline">A Capi ganhou: <span>${nacc.ico}</span> ${nacc.n}! <button class="chip" data-go="armario">Ver no armário</button></p>`:''}
  <div class="row"><button class="btn primary" id="again">Jogar de novo</button><button class="btn" id="menuBtn">Voltar ao menu</button></div></section>`;
  $('#again',m).onclick=()=>{sfx.tap();o.again();};
  $('#menuBtn',m).onclick=()=>{sfx.tap();backTo.apply(null,o.back);};
  say({t:msg});
  const A=achievementsFor(o,r,stk,nacc);
  if(A.length)setTimeout(()=>{if(m.querySelector('.result'))celebrate(A);},900);
}
function playbar(i,n){
  return `<div class="playbar"><button class="back" id="qb">‹ Sair</button><div class="dots" role="img" aria-label="Pergunta ${i+1} de ${n}">${Array.from({length:n},(_,k)=>`<i class="${k<i?'done':k===i?'now':''}"></i>`).join('')}</div><span class="cntleft">${i+1} de ${n}</span></div>`;
}

/* --- novas perguntas --- */
function qLetraNome(){
  return pick(LETTERS,6).map(L=>{
    const others=pick(LETTERS.filter(x=>x[0]!==L[0]),3).map(x=>x[0]);
    const ls=shuffle([L[0]].concat(others));
    return {dom:'letra',lab:'Achar a letra '+L[0],ans:L[0],stem:`<span class="bigspk">${ICON.speaker}</span>`,
      prompt:'Ouça e toque na letra certa.',say:[{t:'Toque na letra '+L[3]}],
      opts:ls.map(x=>({lab:x,h:`<span class="w">${x}</span>`,ok:x===L[0]})),cols:2,after:[{t:L[0]+', '+L[3]}]};
  });
}
function qSilabaFalta(){
  return pick(sylPool(),6).map(w=>{
    const k=rand(w.s.length),miss=w.s[k];
    const wrong=pick(SYLPOOL.filter(x=>x!==miss),3);
    const shown=w.s.map((s,j)=>j===k?'<span class="blank">&nbsp;&nbsp;&nbsp;</span>':esc(s)).join(' ');
    return {dom:'silc',lab:'Sílaba que falta em '+w.s.join('').toLowerCase(),ans:miss,
      stem:`<span class="emo xl">${w.e}</span><span class="bigword w">${shown}</span>`,prompt:'Qual sílaba completa a palavra?',
      say:[{t:w.s.join('').toLowerCase()}],
      opts:shuffle(wrong.concat([miss])).map(s=>({lab:s,h:`<span class="otext w">${esc(s)}</span>`,ok:s===miss})),cols:2,after:[{t:w.s.join('').toLowerCase()}]};
  });
}
const ATT=[['🐶','🐱'],['🍎','🍅'],['⭐','🌟'],['🔴','🟠'],['🚗','🚕'],['🐟','🐠'],['🌞','🌝'],['🟦','🟪'],['🧡','❤️'],['🐻','🐼']];
function qAtencao(){
  const prs=shuffle(ATT);
  return [4,4,6,6,9,9].map((n,i)=>{
    const pr=prs[i],f=rand(2),a=pr[f],b=pr[1-f],pos=rand(n);
    return {dom:'aten',lab:'Achar o diferente ('+n+' figuras)',ans:b,
      stem:'<span class="stemtext">Qual figura é diferente?</span>',prompt:'Toque na figura que não é igual às outras.',
      say:[{t:'Toque na figura que é diferente das outras.'}],
      opts:Array.from({length:n},(_,k)=>{const e=k===pos?b:a;return {lab:e,h:`<span class="emo">${e}</span>`,ok:k===pos};}),cols:n===4?2:3};
  });
}
const MEMO=['🐶','🐱','🐸','🐟','🍎','🍌','⭐','🚗','⚽','🏠','🌈','🎈','🚀','🦆','🍇','🐢'];
function qMemoria(){
  const specs=[{n:2,t:'any'},{n:2,t:'any'},{n:3,t:'first'},{n:3,t:'last'},{n:4,t:'last'},{n:4,t:'first'}];
  return specs.map(sp=>{
    const MP=hasInt()?INT_EMOJI[S.interest].concat(MEMO.slice(0,6)):MEMO;
    const seq=pick(MP,sp.n),rest=MP.filter(x=>seq.indexOf(x)<0);
    let ans,opts,ask,kind;
    if(sp.t==='any'){ans=seq[rand(seq.length)];opts=[ans].concat(pick(rest,3));ask='Qual figura estava na lista?';kind='reconhecer';}
    else if(sp.t==='first'){ans=seq[0];opts=seq.concat(pick(rest,Math.max(0,4-seq.length)));ask='Qual foi a primeira figura?';kind='primeira';}
    else{ans=seq[seq.length-1];opts=seq.concat(pick(rest,Math.max(0,4-seq.length)));ask='Qual foi a última figura?';kind='última';}
    return {dom:'mem',lab:'Memória de '+sp.n+' figuras ('+kind+')',ans:ans,memo:true,
      stem:`<div class="dots2">${seq.map(x=>`<span class="emo">${x}</span>`).join('')}</div><span class="stemtext">Olhe bem e guarde na memória.</span>`,
      hide:'<span class="emo xl">🤔</span>',prompt:ask,say:[{t:ask}],
      opts:shuffle(opts).map(x=>({lab:x,h:`<span class="emo">${x}</span>`,ok:x===ans})),cols:2};
  });
}
const PAT_E=['🔴','🔵','🟢','🟡','⭐','🌙','🐶','🐱'];
function qPadroes(){
  const E=shuffle(hasInt()?INT_EMOJI[S.interest].concat(['🔴','🔵','🟢']):PAT_E);
  const items=[
    {seq:[E[0],E[1],E[0],E[1],E[0]],ans:E[1],pool:[E[0],E[1],E[2],E[3]],lab:'Padrão AB'},
    {seq:[E[2],E[3],E[2],E[3],E[2]],ans:E[3],pool:[E[2],E[3],E[4],E[5]],lab:'Padrão AB'},
    {seq:[E[4],E[4],E[5],E[4],E[4]],ans:E[5],pool:[E[4],E[5],E[6],E[7]],lab:'Padrão AAB'},
    {seq:[E[0],E[1],E[2],E[0],E[1]],ans:E[2],pool:[E[0],E[1],E[2],E[3]],lab:'Padrão ABC'},
    {seq:[2,4,6,8],ans:10,pool:[9,10,12,7],lab:'Sequência de 2 em 2'},
    {seq:[5,10,15,20],ans:25,pool:[21,25,30,22],lab:'Sequência de 5 em 5'}
  ];
  return items.map(it=>({dom:'log',lab:it.lab+': '+it.seq.join(' ')+' ?',ans:it.ans,
    stem:`<div class="dots2">${it.seq.map(x=>`<span class="${typeof x==='number'?'bignum':'emo'}">${x}</span>`).join('')}<span class="${typeof it.ans==='number'?'bignum':'emo'}">❔</span></div>`,
    prompt:'O que vem depois? Descubra o padrão.',say:[{t:'O que vem depois? Descubra o padrão.'}],
    opts:shuffle(it.pool).map(x=>({lab:String(x),h:typeof x==='number'?`<span class="num">${x}</span>`:`<span class="emo">${x}</span>`,ok:x===it.ans})),cols:2}));
}

function qOpts(q,cfg){
  if(!S.fewOpts||cfg.assess||q.opts.length<=2)return q.opts;
  const ok=q.opts.filter(x=>x.ok).slice(0,1),bad=shuffle(q.opts.filter(x=>!x.ok)).slice(0,1);
  return shuffle(ok.concat(bad));
}
/* --- jogo de escolha (motor único, com registro de cada resposta) --- */
function quiz(m,cfg){
  const myView=view;
  const qs=cfg.make();let i=0,earned=0;
  let tried=false,locked=false,t0=0,tShow=0,tFirst=null,listens=0,wrong=[],memoMs=null,p0=0,lastEntry=null,supL=0;
  function entry(q,ok1,tries,err){
    const right=q.opts.find(x=>x.ok)||{};
    const e=logEntry({mod:cfg.module,act:cfg.key,dom:q.dom||'',lab:q.lab||strip(q.stem).slice(0,80),
      ans:q.ans!=null?String(q.ans):(right.lab||strip(right.h)),ok1:ok1,tries:tries,ms:tFirst,listens:listens,err:err,view:memoMs,sup:S.mediated?supL:undefined},
      cfg.assess&&SESS?SESS.id:null);
    lastEntry=e;
  }
  function show(){
    const q=qs[i];q.shown=qOpts(q,cfg);tried=false;locked=false;listens=0;wrong=[];memoMs=null;tFirst=null;supL=0;lastEntry=null;p0=PAUSED_MS;tShow=Date.now();t0=tShow;
    m.innerHTML=`<section class="play" style="--c:var(--c-${cfg.module})">${playbar(i,qs.length)}
    <div class="qcard" id="qcard" tabindex="-1"><div class="stem" id="qs">${q.stem}</div><p class="prompt" id="qp">${q.memo?'Quando estiver pronto, toque no botão.':(q.prompt||'')}</p>
    ${q.memo?'<button class="btn primary" id="memoBtn">Já memorizei</button>':''}
    <button class="listen" id="ql" aria-label="Ouvir de novo"${q.memo?' hidden':''}>${ICON.speaker}<span>Ouvir</span></button></div>
    <div class="opts c${q.cols||2}" id="qo"${q.memo?' hidden':''}>${q.shown.map((o,k)=>`<button class="opt" data-k="${k}"${o.lab?` aria-label="${esc(o.lab)}"`:''}>${o.h}</button>`).join('')}</div>
    <p class="fb" id="fb" role="status" aria-live="polite"></p>${(S.masc&&!cfg.assess)?capiHTML():''}${S.mediated?supportHTML():''}</section>`;
    if(tokenOn()&&!cfg.assess)$('.playbar',m).insertAdjacentHTML('afterend',tokenBarHTML());
    $$('.supchip',m).forEach(c=>c.onclick=()=>{supL=+c.dataset.l;$$('.supchip',m).forEach(x=>x.classList.toggle('on',x===c));if(lastEntry)lastEntry.sup=supL,save();});
    $('#qb',m).onclick=()=>backTo.apply(null,cfg.back);
    $('#ql',m).onclick=()=>{listens++;say(q.say);};
    $$('.opt',m).forEach(b=>b.onclick=()=>choose(b,q));
    try{$('#qcard',m).focus({preventScroll:true});}catch(x){}
    if(q.memo&&!cfg.assess)capiSet(m,'memo','Guarde na memória!');
    if(q.memo){
      $('#memoBtn',m).onclick=()=>{
        memoMs=Date.now()-tShow-(PAUSED_MS-p0);if(!cfg.assess)capiSet(m,'idle','Qual era?');
        $('#qs',m).innerHTML=q.hide;$('#qp',m).textContent=q.prompt||'';
        $('#memoBtn',m).hidden=true;$('#qo',m).hidden=false;$('#ql',m).hidden=false;try{$('#qo .opt',m).focus({preventScroll:true});}catch(x){}
        t0=Date.now();say(q.say);
      };
    }else if(S.auto==='all'||!q.noauto){
      setTimeout(()=>{if(view===myView)say(q.say);},300);
    }
  }
  function next(){if(view!==myView)return;i++;if(i>=qs.length)finish();else show();}
  function choose(b,q){
    if(locked||b.disabled)return;
    const o=q.shown[+b.dataset.k],fb=$('#fb',m),olab=o.lab||strip(o.h);
    if(tFirst===null)tFirst=Math.max(0,Date.now()-t0-(PAUSED_MS-p0));
    if(cfg.assess){
      locked=true;b.classList.add('picked');$$('.opt',m).forEach(x=>{x.disabled=true;});
      sfx.tap();if(o.ok)earned++;
      entry(q,!!o.ok,1,o.ok?[]:[olab]);
      setTimeout(next,S.mediated?3600:1400);return;
    }
    if(o.ok){
      locked=true;b.classList.add('right');
      $$('.opt',m).forEach(x=>{if(x!==b)x.disabled=true;});
      sfx.ok();
      if(!tried&&S.reinf==='stars')confetti();
      let msg=praise();
      let full=false;
      if(!tried){earned++;addStars(1);if(tokenOn()){full=tokenAdd();refreshTokens(m);}}else msg='Isso! Agora você acertou.';
      entry(q,!tried,wrong.length+1,wrong.slice());
      fb.textContent=msg;fb.className='fb good';if(!cfg.assess)capiSet(m,'happy');
      say((q.after||[]).concat([{t:msg}]));
      if(full)setTimeout(()=>{if(view===myView)showReward();},1000);
      setTimeout(()=>{if(PAUSED){const w=setInterval(()=>{if(!PAUSED){clearInterval(w);next();}},300);}else next();},2100+((q.after||[]).length>1?800:0)+(S.mediated?1500:0));
    }else{
      tried=true;wrong.push(olab);b.classList.add('wrong');b.disabled=true;sfx.bad();
      fb.textContent='Quase! Tente outra vez.';fb.className='fb try';capiSet(m,'try');
      {const nx=$$('.opt',m).find(x=>!x.disabled);if(nx)try{nx.focus({preventScroll:true});}catch(x){}}
      say({t:'Tente outra vez.'});
      if(wrong.length===1&&!cfg.assess){const live=$$('.opt',m).filter(x=>!x.disabled);if(live.length>=3){const bad=live.find(x=>!q.shown[+x.dataset.k].ok);if(bad){bad.disabled=true;bad.style.visibility='hidden';fb.textContent='Tirei uma opção para ajudar. Tente de novo!';}}}
    }
  }
  function finish(){
    if(cfg.onDone){cfg.onDone(earned,qs.length);return;}
    result(m,{module:cfg.module,key:cfg.key,earned:earned,total:qs.length,again:()=>quiz(m,cfg),back:cfg.back});
  }
  show();
}

/* ---- dinâmica: figurinhas, sequência de dias, desafio do dia ---- */
const STICKERS=['🦄','🐉','🦋','🐬','🦊','🐼','🦉','🐙','🦖','🚀','🛸','🏆','🎨','🎸','🍭','🍩','🌈','⚡','🔮','🧸','🎠','🦜','🐢','🦒','🐘','🦁','🐳','🌟','🎯','🪁','🏰','🍀','🌻','🍉','🍕','⛵','🚁','🎪','🧩','🐝'];
function giveSticker(){
  if(!P||S.reinf==='none')return null;
  const have=P.stick||(P.stick=[]),fresh=STICKERS.filter(x=>have.indexOf(x)<0),pool=fresh.length?fresh:STICKERS;
  const s=pool[Math.floor(Math.random()*pool.length)];have.push(s);save();return s;
}
function stickersHTML(){
  const have=(P&&P.stick)||[],cnt={};have.forEach(x=>{cnt[x]=(cnt[x]||0)+1;});
  const got=Object.keys(cnt).length;
  return '<p class="msub">'+got+' de '+STICKERS.length+' figurinhas. Cada rodada completa dá uma nova!</p><div class="album">'+STICKERS.map(s=>cnt[s]?'<span class="stk on" title="'+s+'">'+s+(cnt[s]>1?'<small>×'+cnt[s]+'</small>':'')+'</span>':'<span class="stk" aria-hidden="true">?</span>').join('')+'</div>';
}
function bumpStreak(){
  if(!P)return;const st=P.streak||(P.streak={last:'',n:0}),t=today();
  if(st.last===t)return;
  let y;try{y=new Date(Date.now()-864e5).toLocaleDateString('sv-SE');}catch(e){y='';}
  st.n=st.last===y?(st.n||0)+1:1;st.best=Math.max(st.best||0,st.n);st.last=t;save();
}
function streakNow(){
  if(!P||!P.streak||!P.streak.n)return 0;let y;try{y=new Date(Date.now()-864e5).toLocaleDateString('sv-SE');}catch(e){y='';}
  return (P.streak.last===today()||P.streak.last===y)?P.streak.n:0;
}
const CHAL_GENS=[qLetraInicial,qLetraNome,qSilabaFalta,qPalavraFigura,qFrase,()=>mathQs(1),()=>mathQs(2),()=>mathQs(3),qAtencao,qPadroes,
  ()=>qIngles(Object.keys(EN).reduce((a,k)=>a.concat(EN[k].items),[])),qRima,qOpostos,qOrdemAlfa,qMaiMin,()=>qFalta(1),qMaior,qDobro,qVizinho,qContar,qIntruso];
function mixQs(n){return pick(chalGens(),n+4).map(g=>{const a=g();return a&&a.length?pick(a,1)[0]:null;}).filter(Boolean).slice(0,n);}
function challengeHTML(){
  const done=P&&P.chal===today(),n=streakNow();
  return '<div class="chalrow"><button class="chal" data-go="act"'+dataArg({m:'desafio',id:'dia'})+'><span class="ci" aria-hidden="true">🎯</span><span class="ct"><b>Desafio do dia</b><small>'+(done?'Feito hoje! Jogue de novo sem pressa':'6 perguntas surpresa de todas as áreas')+'</small></span>'
    +'<span class="cb">'+(done?'✓':(S.reinf==='stars'?'+5 ⭐':'Jogar'))+'</span></button>'
    +'<button class="chal sm" data-go="act"'+dataArg({m:'desafio',id:'surpresa'})+' aria-label="Jogo surpresa"><span class="ci" aria-hidden="true">🎲</span><span class="ct"><b>Surpresa</b></span></button></div>'
    +(n?'<p class="streak" role="status">🔥 '+n+(n===1?' dia seguido':' dias seguidos')+'</p>':'');
}
ACTS['desafio:dia']=m=>quiz(m,{key:'desafio:dia',module:'desafio',make:()=>mixQs(6),back:['home'],onDone:(earned,total)=>{
  const first=P.chal!==today();let extra='';
  if(first){P.chal=today();save();if(S.reinf==='stars'){addStars(5);extra='+5 estrelas de bônus do desafio!';}else extra='Desafio do dia concluído!';}
  result(m,{module:'desafio',key:'desafio:dia',earned:earned,total:total,again:()=>ACTS['desafio:surpresa'](m),back:['home'],extra:extra});
}});
ACTS['desafio:surpresa']=m=>quiz(m,{key:'desafio:surpresa',module:'desafio',make:()=>mixQs(6),back:['home']});
/* novas atividades nos menus */
/* ---- nível que se ajusta + recomendação do dia ---- */
const LV_NAMES=['Nível 1','Nível 2','Nível 3'];
const lvGet=k=>{const v=P&&P.lvl?P.lvl[k]:0;return v>=0&&v<=2?v:0;};
function adaptDone(m,cfg,earned,total){
  const r=earned/total,k=cfg.lvKey,old=lvGet(k);let nw=old,extra='';
  if(r>=0.83&&old<2){nw=old+1;extra='Subiu para o '+LV_NAMES[nw].toLowerCase()+'! 🚀';}
  else if(r<=0.34&&old>0){nw=old-1;extra='Vamos treinar um pouco mais fácil: '+LV_NAMES[nw].toLowerCase()+'.';}
  else extra='Você está no '+LV_NAMES[old].toLowerCase()+'.';
  if(P){if(!P.lvl)P.lvl={};P.lvl[k]=nw;save();}
  result(m,{module:cfg.module,key:cfg.key,earned:earned,total:total,again:()=>cfg.restart(m),back:cfg.back,extra:extra});
}
function adaptive(m,module,key,make){
  const cfg={key:key,module:module,lvKey:key,back:['menu',module],restart:mm=>adaptive(mm,module,key,make),make:()=>make(lvGet(key))};
  cfg.onDone=(e,t)=>adaptDone(m,cfg,e,t);
  quiz(m,cfg);
}
function qPalavraNivel(l){
  const all=allWords(),f=w=>l===0?w.length<=4:l===1?(w.length>=5&&w.length<=6):w.length>=7;
  let pool=all.filter(x=>f(x.w));if(pool.length<8)pool=all;
  return pick(pool,6).map(it=>{
    const others=pick(all.filter(x=>x.w!==it.w&&x.e!==it.e),3);
    return {dom:'ler',lab:'Ler a palavra “'+it.w+'”',ans:it.w,stem:`<span class="bigword w">${it.w}</span>`,prompt:'Leia a palavra e toque na figura certa.',say:[{t:it.w}],noauto:true,
      opts:shuffle([it].concat(others)).map(x=>({lab:x.w,h:`<span class="emo">${x.e}</span>`,ok:x===it})),cols:2,after:[{t:it.w}]};
  });
}
const LV_MATH=[1,2,4];
ACTS['contas:meu']=m=>adaptive(m,'contas','contas:meu',l=>mathQs(LV_MATH[l]).slice(0,6));
ACTS['leitura:meu']=m=>adaptive(m,'leitura','leitura:meu',qPalavraNivel);
MODS.contas.acts.unshift({id:'meu',t:'Contas do meu nível',d:'Sobe sozinho quando você vai bem',g:'⬆️'});
MODS.leitura.acts.unshift({id:'meu',t:'Palavras do meu nível',d:'Fica mais difícil quando você vai bem',g:'⬆️'});
/* recomendação do dia: olha as últimas respostas de cada área */
const REC={ler:{t:'Leitura de palavras',m:'leitura',id:'meu',ico:'📖'},fon:{t:'Letras e sons',m:'letras',id:'inicial',ico:'🔤'},letra:{t:'Reconhecer letras',m:'letras',id:'achar',ico:'🔠'},
  silc:{t:'Montar palavras',m:'letras',id:'silabas',ico:'🧩'},comp:{t:'Completar frases',m:'leitura',id:'frase',ico:'✏️'},calc:{t:'Números',m:'contas',id:'meu',ico:'➕'},
  aten:{t:'Atenção',m:'mente',id:'diferente',ico:'👀'},mem:{t:'Memória',m:'mente',id:'memoria',ico:'🤔'},log:{t:'Lógica',m:'mente',id:'padrao',ico:'🔁'},viso:{t:'Quebra-cabeça',m:'puzzle',id:'p1',ico:'🧩'}};
function recommend(){
  if(!P||!P.log.length)return null;
  const by={};
  for(let i=P.log.length-1;i>=0;i--){const e=P.log[i];if(e.sid||!isItem(e)||!REC[e.dom])continue;const a=by[e.dom]||(by[e.dom]={n:0,ok:0});if(a.n<12){a.n++;if(e.ok1)a.ok++;}}
  let best=null;
  Object.keys(by).forEach(d=>{const a=by[d];if(a.n<4)return;const r=a.ok/a.n;if(r<0.8&&(!best||r<best.r))best={d:d,r:r,n:a.n};});
  if(!best)return null;
  let R=REC[best.d];if(best.d==='ling'&&ageBand()==='big')R={t:'Vocabulário',m:'leitura',id:'sinonimos',ico:'🗣️'};return {t:R.t,m:R.m,id:R.id,ico:R.ico,pct:Math.round(best.r*100)};
}
function recHTML(){
  const r=recommend();if(!r)return '';
  return '<button class="chal rec" data-go="act"'+dataArg({m:r.m,id:r.id})+'><span class="ci" aria-hidden="true">'+r.ico+'</span><span class="ct"><b>Para hoje: '+esc(r.t)+'</b><small>Um treino curtinho para ficar mais forte</small></span><span class="cb">Ir</span></button>';
}

MODS.letras.acts.push({id:'ordem',t:'Ordem do alfabeto',d:'Qual letra vem depois?',g:'A→B'},{id:'maiusc',t:'Maiúscula e minúscula',d:'Combine A com a',g:'Aa'});
MODS.leitura.acts.push({id:'rima',t:'Quem rima?',d:'Palavras com o mesmo final',g:'🎵'},{id:'oposto',t:'Palavras opostas',d:'Grande e pequeno',g:'↔'});
MODS.contas.acts.push({id:'n5',t:'Quanto falta?',d:'3 + ? = 8',g:'+?'},{id:'n6',t:'Maior ou menor?',d:'Compare os números',g:'<>'},{id:'n7',t:'Dobro e metade',d:'Dobrar e dividir ao meio',g:'×2'},
  {id:'n8',t:'Antes e depois',d:'Qual número vem antes ou depois?',g:'1·2'},{id:'n9',t:'Contar figuras',d:'Quantos tem?',g:'🔢'});
MODS.mente.acts.push({id:'intruso',t:'Qual não combina?',d:'Ache o intruso do grupo',g:'🧐'});
/* ---- atividades por faixa ---- */
const MQ=(k,mod,mk)=>{ACTS[mod+':'+k]=m=>quiz(m,{key:mod+':'+k,module:mod,make:mk,back:['menu',mod]});};
MQ('vogais','letras',qLetraPre);MQ('figura','leitura',qFigura);MQ('numerais','contas',qNumeral);MQ('contar','contas',qContarPre);MQ('formas','mente',qFormas);
MQ('texto','leitura',qTextoBig);MQ('ortografia','leitura',qOrtografia);MQ('sinonimos','leitura',qSinonimos);
MQ('dig','contas',()=>qCalcBig(0).slice(0,6));MQ('mult','contas',()=>qCalcBig(1).slice(0,6));MQ('rac','contas',qRacBig);
MODS.letras.acts.push({id:'vogais',t:'Achar letras fáceis',d:'Vogais e letras que a criança já vê',g:'Aa',only:'pre'});
MODS.leitura.acts.push({id:'figura',t:'Qual figura?',d:'Ouça a palavra e ache a figura',g:'👂',only:'pre'},
  {id:'texto',t:'Textos e perguntas',d:'Leia um texto e responda',g:'📰',only:'big'},{id:'ortografia',t:'Escreva certo',d:'Qual palavra está certa?',g:'✅',only:'big'},{id:'sinonimos',t:'Palavras parecidas',d:'Sinônimos e vocabulário',g:'≈',only:'big'});
MODS.contas.acts.push({id:'numerais',t:'Qual número?',d:'Ouça e ache o número',g:'7',only:'pre'},{id:'contar',t:'Contar até 10',d:'Quantas figuras tem?',g:'🔢',only:'pre'},
  {id:'dig',t:'Contas maiores',d:'Somar e subtrair com dezenas',g:'48',only:'big'},{id:'mult',t:'Multiplicar e dividir',d:'Tabuada completa e divisão',g:'×÷',only:'big'},{id:'rac',t:'Desafios numéricos',d:'Sequências, números que faltam e problemas',g:'🧮',only:'big'});
MODS.mente.acts.push({id:'formas',t:'Cores e tamanhos',d:'Ouça e toque na cor ou no tamanho',g:'🎨',only:'pre'});
const PRE_OK={letras:['explorar','achar','vogais','inicial','tracar'],leitura:['figura'],contas:['contar','numerais','n9','tracar','n6'],mente:['diferente','memoria','padrao','formas','intruso'],puzzle:['p1','p2'],ingles:null};
const BIG_NO={letras:['explorar','achar','inicial','maiusc','tracar','ordem'],leitura:['meu','palavra'],contas:['n1','n5','n8','n9','tracar'],puzzle:['p1'],mente:[],ingles:[]};
function actsFor(k){
  const b=ageBand(),M=MODS[k];
  return M.acts.filter(a=>{
    if(a.noPre&&b==='pre')return false;
    if(a.only&&a.only!==b)return false;
    const custom=!!(P&&Array.isArray(P.worlds)&&P.worlds.length);
    if(b==='pre'&&!a.only&&!custom){const ok=PRE_OK[k];return ok===null||(ok&&ok.indexOf(a.id)>=0);}
    if(b==='big'&&!a.only&&!custom){return (BIG_NO[k]||[]).indexOf(a.id)<0;}
    return true;
  });
}
/* adaptativo para 9 a 12: contas grandes */
ACTS['contas:meu']=m=>adaptive(m,'contas','contas:meu',l=>ageBand()==='big'?qCalcBig(l).slice(0,6):mathQs(LV_MATH[l]).slice(0,6));
/* desafio do dia e recomendação por faixa */
const CHAL_PRE=[qLetraPre,qInicialPre,qFigura,qNumeral,qContarPre,qFormas,qAtencao,qPadroes,qIntruso];
const CHAL_BIG=[qOrtografia,qSinonimos,qTextoBig,()=>qCalcBig(0),()=>qCalcBig(1),()=>qCalcBig(2),qRacBig,qAtencao,qPadroes,qIntruso,
  ()=>qIngles(Object.keys(EN).reduce((a,k)=>a.concat(EN[k].items),[])),qOpostos,qRima];
function chalGens(){const b=ageBand();return b==='pre'?CHAL_PRE:b==='big'?CHAL_BIG:CHAL_MID;}
REC.ling={t:'Vocabulário',m:'leitura',id:'figura',ico:'🗣️'};REC.for={t:'Cores e tamanhos',m:'mente',id:'formas',ico:'🎨'};
REC.ort={t:'Ortografia',m:'leitura',id:'ortografia',ico:'✅'};REC.rac={t:'Desafios numéricos',m:'contas',id:'rac',ico:'🧮'};
/* ========== mundos por idade: relógios, dinheiro, cores e formas ========== */
const ALLW=['letras','leitura','contas','relogio','dinheiro','formas','mente','puzzle','ingles'];
const WNAME={letras:'Letras',leitura:'Leitura',contas:'Números',relogio:'Relógios',dinheiro:'Dinheiro',formas:'Cores e formas',mente:'Mente',puzzle:'Quebra-cabeças',ingles:'Inglês'};
function worldsFor(b){return b==='pre'?['letras','contas','formas','mente','puzzle','ingles']:b==='big'?['leitura','contas','dinheiro','relogio','mente','puzzle','ingles']:['letras','leitura','contas','relogio','dinheiro','mente','puzzle','ingles'];}
function worlds(){
  const d=worldsFor(ageBand());
  if(P&&Array.isArray(P.worlds)&&P.worlds.length)return ALLW.filter(k=>P.worlds.indexOf(k)>=0);
  return d;
}
MNAME.relogio='Relógios';MNAME.dinheiro='Dinheiro';MNAME.formas='Cores e formas';
TILE.relogio='Mundo dos Relógios';TILE.dinheiro='Mundo do Dinheiro';TILE.formas='Mundo das Cores e Formas';
SHORT.relogio='Horas, tempo e calendário';SHORT.dinheiro='Moedas, notas e trocos';SHORT.formas='Cores, formas e tamanhos';
BADGE.relogio=['🕒','Relógios'];BADGE.dinheiro=['💰','Dinheiro'];BADGE.formas=['🎨','Formas'];
ROUTINE_STEPS.relogio=['🕒','Relógios'];ROUTINE_STEPS.dinheiro=['💰','Dinheiro'];ROUTINE_STEPS.formas=['🎨','Cores e formas'];
/* ícones desenhados (SVG) para o tema Mundo */
const svgU=s=>'data:image/svg+xml;utf8,'+encodeURIComponent(s);
MIMG.clock=svgU('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="30" cy="16" r="10" fill="#E8A010"/><circle cx="70" cy="16" r="10" fill="#E8A010"/><circle cx="50" cy="56" r="38" fill="#F2B632"/><circle cx="50" cy="56" r="31" fill="#fff"/><g stroke="#27407A" stroke-width="3" stroke-linecap="round"><path d="M50 30v6M50 76v6M24 56h6M70 56h6"/><path d="M50 56V40" stroke-width="5"/><path d="M50 56l13 8" stroke-width="4"/></g><circle cx="50" cy="56" r="4" fill="#E03131"/></svg>');
MIMG.coins=svgU('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="38" cy="78" rx="26" ry="9" fill="#C98A0B"/><rect x="12" y="62" width="52" height="16" fill="#E8A010"/><ellipse cx="38" cy="62" rx="26" ry="9" fill="#FFD43B"/><ellipse cx="62" cy="52" rx="26" ry="9" fill="#C98A0B"/><rect x="36" y="36" width="52" height="16" fill="#E8A010"/><ellipse cx="62" cy="36" rx="26" ry="9" fill="#FFD43B"/><text x="62" y="41" font-size="14" font-weight="800" text-anchor="middle" fill="#9A6700" font-family="Arial">R$</text></svg>');
MIMG.shapes=svgU('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="30" cy="32" r="22" fill="#FF6B6B"/><rect x="54" y="12" width="36" height="36" rx="5" fill="#4DABF7"/><path d="M30 92 L52 52 L74 92Z" fill="#FFD43B"/><rect x="62" y="58" width="28" height="30" rx="14" fill="#51CF66"/></svg>');
MT.push(['relogio','Mundo dos Relógios','clock','linear-gradient(160deg,#FFE08A,#FFB938)','#4A2A00'],['dinheiro','Mundo do Dinheiro','coins','linear-gradient(160deg,#8DE8B0,#34C77B)','#06361F'],['formas','Mundo das Cores e Formas','shapes','linear-gradient(160deg,#FFA9CB,#F5679F)','#5A0F32']);
/* ---- relógio analógico em SVG ---- */
function clockSVG(h,m,size){
  const ah=((h%12)+m/60)*30,am=m*6,r=(a,l)=>{const t=a*Math.PI/180;return [(50+Math.sin(t)*l).toFixed(1),(50-Math.cos(t)*l).toFixed(1)];};
  const H=r(ah,24),M=r(am,35);
  let n='';for(let i=1;i<=12;i++){const p=r(i*30,38);n+=`<text x="${p[0]}" y="${(+p[1]+3.4).toFixed(1)}" font-size="9.5" font-weight="800" text-anchor="middle" fill="#27407A" font-family="Arial,sans-serif">${i}</text>`;}
  for(let i=0;i<60;i++){if(i%5===0)continue;const a=r(i*6,46),b=r(i*6,48);n+=`<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="#9AA9D6" stroke-width=".8"/>`;}
  return `<svg class="clk" viewBox="0 0 100 100" width="${size||150}" height="${size||150}" role="img" aria-label="Relógio"><circle cx="50" cy="50" r="49" fill="#fff" stroke="#3B5BDB" stroke-width="3.5"/>${n}<path d="M50 50L${H[0]} ${H[1]}" stroke="#27407A" stroke-width="5" stroke-linecap="round"/><path d="M50 50L${M[0]} ${M[1]}" stroke="#E03131" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="50" r="3.5" fill="#27407A"/></svg>`;
}
const p2=n=>(n<10?'0':'')+n;
const tStr=(h,m)=>h+':'+p2(m);
function timeOpts(h,m,level){
  const set=new Set([tStr(h,m)]);
  const cand=shuffle([tStr(m===0?12:Math.round(m/5)||12,h*5%60),tStr(h,(m+30)%60),tStr(h%12+1,m),tStr((h+10)%12+1,m),tStr(h,(m+15)%60),tStr(h,(m+45)%60),tStr((h%12)+1,(m+30)%60)]);
  for(const c of cand){if(set.size>=4)break;set.add(c);}
  let k=1;while(set.size<4){set.add(tStr((h+k)%12+1,m));k++;}
  return shuffle(Array.from(set)).map(x=>({lab:x,h:`<span class="num" style="font-size:34px">${x}</span>`,ok:x===tStr(h,m)}));
}
function rndTime(level){
  const h=rand(12)+1;let m;
  if(level===0)m=rand(2)?0:30;else m=rand(12)*5;
  return [h,m];
}
function qHoras(level){
  const seen=new Set(),out=[];let g=0;
  while(out.length<6&&g++<80){
    const t=rndTime(level),k=t.join(':');if(seen.has(k))continue;seen.add(k);
    out.push({dom:'hora',lab:'Ler o relógio: '+tStr(t[0],t[1]),ans:tStr(t[0],t[1]),stem:clockSVG(t[0],t[1],150),prompt:'Que horas o relógio marca?',say:[{t:'Que horas o relógio marca?'}],opts:timeOpts(t[0],t[1],level),cols:2});
  }
  return out;
}
function qHoraDigital(level){
  const seen=new Set(),out=[];let g=0;
  while(out.length<6&&g++<80){
    const t=rndTime(level),k=t.join(':');if(seen.has(k))continue;seen.add(k);
    const alts=[[t[0],(t[1]+30)%60],[t[0]%12+1,t[1]],[(t[0]+10)%12+1,t[1]],[t[0],(t[1]+15)%60],[t[1]/5||12,t[0]*5%60]].filter(a=>!(a[0]===t[0]&&a[1]===t[1])&&a[1]>=0);
    const uniq=[];alts.forEach(a=>{if(!uniq.some(u=>u[0]===a[0]&&u[1]===a[1]))uniq.push(a);});
    const wrong=shuffle(uniq).slice(0,3);
    out.push({dom:'hora',lab:'Achar o relógio das '+tStr(t[0],t[1]),ans:tStr(t[0],t[1]),stem:`<span class="eq">${tStr(t[0],t[1])}</span>`,prompt:'Qual relógio mostra essa hora?',say:[{t:'Qual relógio mostra '+t[0]+(t[1]?' e '+(t[1]===30?'meia':t[1]):' horas')+'?'}],
      opts:shuffle([[t[0],t[1],true]].concat(wrong.map(a=>[a[0],a[1],false]))).map(a=>({lab:tStr(a[0],a[1]),h:clockSVG(a[0],a[1],84),ok:a[2]})),cols:2});
  }
  return out;
}
function qDuracao(){
  const out=[];
  for(let i=0;i<6;i++){
    const h=rand(9)+7,m=rand(12)*5,d=[15,20,25,30,40,45,50,60,75,90,105,120][rand(12)];
    const tot=h*60+m+d,h2=Math.floor(tot/60),m2=tot%60;
    if(i%2===0){
      out.push({dom:'hora',lab:'Hora final: '+tStr(h,m)+' + '+d+' min',ans:tStr(h2,m2),stem:`<span class="stemtext">São ${tStr(h,m)}. Que horas serão daqui a <b>${d} minutos</b>?</span>`,prompt:'Calcule a nova hora.',say:[{t:'São '+h+' horas e '+m+' minutos. Que horas serão daqui a '+d+' minutos?'}],noauto:true,
        opts:(()=>{const s=new Set([tStr(h2,m2)]);[tStr(h2,(m2+10)%60),tStr(h2+1,m2),tStr(h2,(m2+50)%60),tStr(h2-1,m2),tStr(h,(m+d)%60)].forEach(x=>{if(s.size<4)s.add(x);});return shuffle(Array.from(s)).map(x=>({lab:x,h:`<span class="num" style="font-size:34px">${x}</span>`,ok:x===tStr(h2,m2)}));})(),cols:2});
    }else{
      const fm=x=>x<60?x+' min':(x%60?Math.floor(x/60)+' h '+x%60+' min':Math.floor(x/60)+' h');
      const set=new Set([fm(d)]);[d+10,d-10,d+15,d-5,d+20].forEach(x=>{if(x>0&&set.size<4)set.add(fm(x));});
      out.push({dom:'hora',lab:'Duração de '+tStr(h,m)+' até '+tStr(h2,m2),ans:fm(d),stem:`<span class="stemtext">A aula começou às ${tStr(h,m)} e terminou às ${tStr(h2,m2)}. Quanto tempo durou?</span>`,prompt:'Quanto tempo passou?',say:[{t:'A aula começou às '+h+' horas e '+m+' minutos e terminou às '+h2+' horas e '+m2+' minutos. Quanto tempo durou?'}],noauto:true,
        opts:shuffle(Array.from(set)).map(x=>({lab:x,h:`<span class="otext">${x}</span>`,ok:x===fm(d)})),cols:2});
    }
  }
  return out;
}
const DIAS=['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
const MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
function textOpts(ans,pool){const s=new Set([ans]);shuffle(pool.filter(x=>x!==ans)).forEach(x=>{if(s.size<4)s.add(x);});return shuffle(Array.from(s)).map(x=>({lab:String(x),h:`<span class="otext">${esc(String(x))}</span>`,ok:x===ans}));}
function qCalendario(level){
  const out=[];
  const FACT0=[['Quantos dias tem uma semana?','7',['5','6','8','10']],['Quantos meses tem um ano?','12',['10','11','13','52']],['Qual mês vem depois de dezembro?','janeiro',['fevereiro','novembro','março']],
    ['Qual dia vem antes de domingo?','sábado',['segunda-feira','sexta-feira','quarta-feira']],['Em qual estação as folhas costumam cair?','outono',['verão','primavera','inverno']]];
  const FACT1=[['Quantos dias tem um ano comum?','365',['360','364','366','300']],['Quantos dias tem fevereiro em ano bissexto?','29',['28','30','31','27']],['Quantos minutos tem uma hora?','60',['30','100','120','45']],
    ['Quantos anos tem uma década?','10',['5','100','20','12']],['Quantos meses têm 30 dias?','4',['3','5','6','7']],['Quantos segundos tem um minuto?','60',['30','100','120','50']],['Quantas horas tem um dia?','24',['12','20','48','60']]];
  const FACT=level===0?FACT0:FACT1;
  const pool=shuffle(['a','b','c','d','e','f']);
  for(let i=0;i<6;i++){
    const t=i%3;
    if(t===0){const d=rand(7),a=DIAS[(d+1)%7];out.push({dom:'hora',lab:'Dia depois de '+DIAS[d],ans:a,stem:`<span class="stemtext">Qual dia vem depois de <b>${DIAS[d]}</b>?</span>`,prompt:'Pense na ordem da semana.',say:[{t:'Qual dia vem depois de '+DIAS[d]+'?'}],noauto:true,opts:textOpts(a,DIAS),cols:2});}
    else if(t===1){const mm=rand(12),a=MESES[(mm+(level?2:1))%12];out.push({dom:'hora',lab:'Mês '+(level?'dois meses depois':'depois')+' de '+MESES[mm],ans:a,stem:`<span class="stemtext">${level?'Dois meses depois de':'Qual mês vem depois de'} <b>${MESES[mm]}</b>${level?'?':'?'}</span>`,prompt:'Pense na ordem dos meses.',say:[{t:(level?'Dois meses depois de ':'Qual mês vem depois de ')+MESES[mm]+'?'}],noauto:true,opts:textOpts(a,MESES),cols:2});}
    else{const f=FACT[rand(FACT.length)];out.push({dom:'hora',lab:f[0],ans:f[1],stem:`<span class="stemtext">${f[0]}</span>`,prompt:'Escolha a resposta.',say:[{t:f[0]}],noauto:true,opts:textOpts(f[1],f[2]),cols:2});}
  }
  return out;
}
/* ---- dinheiro ---- */
const BRL=c=>'R$ '+(c/100).toFixed(2).replace('.',',');
const COINS={5:['0,05','#B87333'],10:['0,10','#C98A3B'],25:['0,25','#D8A93B'],50:['0,50','#C0C4CC'],100:['1,00','#F2C230']};
const BILLS={2:['#8FA1B3','#fff'],5:['#8E5BD6','#fff'],10:['#E8505B','#fff'],20:['#F2B632','#4A2A00'],50:['#C98A3B','#fff'],100:['#3FA3E0','#fff']};
const coinH=v=>`<span style="display:inline-grid;place-items:center;width:46px;height:46px;border-radius:50%;background:${COINS[v][1]};border:3px solid rgba(0,0,0,.18);font:800 13px Arial,sans-serif;color:#3a2a00;margin:2px">${COINS[v][0]}</span>`;
const billH=v=>`<span style="display:inline-grid;place-items:center;width:74px;height:40px;border-radius:7px;background:${BILLS[v][0]};border:2px solid rgba(0,0,0,.2);font:800 15px Arial,sans-serif;color:${BILLS[v][1]};margin:2px">R$ ${v}</span>`;
function moneyOpts(ans,extra){
  const s=new Set([ans]);shuffle([ans+50,ans-50,ans+100,ans-100,ans+25,ans-25,ans+10,ans-10,ans*2].concat(extra||[]).filter(x=>x>0&&x!==ans)).forEach(x=>{if(s.size<4)s.add(x);});
  return shuffle(Array.from(s)).map(x=>({lab:BRL(x),h:`<span class="otext">${BRL(x)}</span>`,ok:x===ans}));
}
function qValores(level){
  const out=[];
  for(let i=0;i<6;i++){
    let items=[],sum=0;
    if(level===0){
      const nb=rand(2)+1,nc=rand(3)+1;
      for(let k=0;k<nb;k++){const v=[2,5,10,20][rand(4)];items.push(billH(v));sum+=v*100;}
      for(let k=0;k<nc;k++){const v=[50,100][rand(2)];items.push(coinH(v));sum+=v;}
    }else{
      const nb=rand(2)+1,nc=rand(3)+2;
      for(let k=0;k<nb;k++){const v=[5,10,20,50][rand(4)];items.push(billH(v));sum+=v*100;}
      for(let k=0;k<nc;k++){const v=[5,10,25,50,100][rand(5)];items.push(coinH(v));sum+=v;}
    }
    out.push({dom:'din',lab:'Contar dinheiro: '+BRL(sum),ans:BRL(sum),stem:`<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:2px">${items.join('')}</div>`,prompt:'Quanto dinheiro tem aqui?',say:[{t:'Quanto dinheiro tem aqui?'}],opts:moneyOpts(sum),cols:2});
  }
  return out;
}
function qTroco(level){
  const out=[];
  for(let i=0;i<6;i++){
    let paid,price;
    if(level===0){paid=[1000,500,2000][rand(3)];price=(rand(paid/100-1)+1)*100;}
    else{paid=[2000,5000,10000][rand(3)];price=Math.round((rand(paid/100*8)/10+paid/100*0.12)*2)*50;if(price>=paid)price=paid-250;if(price<=0)price=350;}
    const ch=paid-price,it=['🍫','⚽','📒','🧃','🎈','🚗'][rand(6)];
    out.push({dom:'din',lab:'Troco de '+BRL(paid)+' para '+BRL(price),ans:BRL(ch),stem:`<span class="stemtext">${it} custa <b>${BRL(price)}</b>. Você paga com <b>${BRL(paid)}</b>.</span>`,prompt:'Qual é o troco?',say:[{t:'O item custa '+BRL(price).replace('R$','')+' reais. Você paga com '+BRL(paid).replace('R$','')+' reais. Qual é o troco?'}],noauto:true,opts:moneyOpts(ch),cols:2});
  }
  return out;
}
function qBarato(){
  const E=[['🍎',150],['🍌',90],['🥛',450],['🍫',300],['🧃',250],['🍪',200],['📒',800],['✏️',120],['🎈',50],['🚗',1500],['⚽',3500],['🧸',2500]];
  return Array.from({length:6},()=>{
    const t=pick(E,3),min=t.slice().sort((a,b)=>a[1]-b[1])[0],mx=t.slice().sort((a,b)=>b[1]-a[1])[0],ask=rand(2);
    const a=ask?mx:min;
    return {dom:'din',lab:'Qual é o mais '+(ask?'caro':'barato'),ans:a[0],stem:`<span class="stemtext">Qual é o mais <b>${ask?'caro':'barato'}</b>?</span>`,prompt:'Compare os preços.',say:[{t:'Qual é o mais '+(ask?'caro':'barato')+'?'}],
      opts:t.map(x=>({lab:x[0],h:`<span style="display:grid;gap:2px;justify-items:center"><span class="emo">${x[0]}</span><span style="font:800 18px Arial,sans-serif">${BRL(x[1])}</span></span>`,ok:x===a})),cols:3};
  });
}
function qCompras(level){
  const out=[];
  for(let i=0;i<6;i++){
    const items=pick([['lápis',level?2.5:2],['caderno',level?9:8],['borracha',level?1.5:1],['suco',level?4.5:3],['bala',level?0.5:1],['pão',level?1.5:2]],2);
    const q1=rand(3)+2,q2=rand(2)+1,tot=Math.round((q1*items[0][1]+q2*items[1][1])*100);
    const nm=(q,n)=>q+' '+n+(q>1&&!/[sz]$/.test(n)?'s':'');
    out.push({dom:'din',lab:'Total da compra: '+BRL(tot),ans:BRL(tot),stem:`<span class="stemtext">${nm(q1,items[0][0])} a ${BRL(items[0][1]*100)} cada e ${nm(q2,items[1][0])} a ${BRL(items[1][1]*100)} cada. Quanto você gasta?</span>`,prompt:'Some o total da compra.',say:[{t:'Quanto você gasta no total?'}],noauto:true,opts:moneyOpts(tot),cols:2});
  }
  return out;
}
function qPouparBig(){
  const out=[];
  const goals=[[60,5],[90,10],[120,15],[48,6],[200,25],[75,15],[150,10],[36,4]];
  pick(goals,3).forEach(g=>{
    const w=g[0]/g[1],s=new Set([w]);[w+1,w-1,w+2,w*2].forEach(x=>{if(x>0&&s.size<4)s.add(x);});
    out.push({dom:'din',lab:'Poupar R$ '+g[1]+' por semana para R$ '+g[0],ans:w,stem:`<span class="stemtext">Você quer um jogo de <b>R$ ${g[0]}</b>. Guardando <b>R$ ${g[1]}</b> por semana, em quantas semanas consegue comprar?</span>`,prompt:'Pense em quantas vezes cabe.',say:[{t:'Você quer um jogo de '+g[0]+' reais. Guardando '+g[1]+' reais por semana, em quantas semanas consegue comprar?'}],noauto:true,opts:shuffle(Array.from(s)).map(x=>({lab:String(x),h:`<span class="num">${x}</span>`,ok:x===w})),cols:2});
  });
  pick([[40,25],[80,50],[60,50],[100,10],[200,25],[80,10],[120,50],[50,20]],3).forEach(g=>{
    const pay=Math.round(g[0]*(100-g[1]))/100*100;
    out.push({dom:'din',lab:g[1]+'% de desconto em R$ '+g[0],ans:BRL(pay),stem:`<span class="stemtext">Uma camiseta custa <b>R$ ${g[0]}</b> e está com <b>${g[1]}% de desconto</b>. Quanto você paga?</span>`,prompt:'Calcule o desconto e subtraia.',say:[{t:'Uma camiseta custa '+g[0]+' reais e está com '+g[1]+' por cento de desconto. Quanto você paga?'}],noauto:true,opts:moneyOpts(pay,[g[0]*100-pay,g[0]*100]),cols:2});
  });
  return shuffle(out);
}
/* ---- cores e formas (4–5 anos) ---- */
const SHP={círculo:'<circle cx="50" cy="50" r="38"/>',quadrado:'<rect x="14" y="14" width="72" height="72" rx="4"/>',triângulo:'<path d="M50 10L92 88H8Z"/>',retângulo:'<rect x="6" y="26" width="88" height="48" rx="4"/>',estrela:'<path d="M50 6l13 28 31 4-23 21 6 31-27-15-27 15 6-31L6 38l31-4z"/>',coração:'<path d="M50 88C10 58 8 28 30 20c10-4 18 2 20 10 2-8 10-14 20-10 22 8 20 38-20 68z"/>'};
const shapeSvg=(n,c,s)=>`<svg viewBox="0 0 100 100" width="${s||64}" height="${s||64}" fill="${c}" stroke="rgba(0,0,0,.18)" stroke-width="3" role="img" aria-label="${n}">${SHP[n]}</svg>`;
function qShapes(){
  const names=Object.keys(SHP),cols=['#FF6B6B','#4DABF7','#FFD43B','#51CF66','#9775FA','#FF922B'],out=[];
  pick(names,4).forEach(n=>{
    const o=shuffle([n].concat(pick(names.filter(x=>x!==n),2))),c=shuffle(cols);
    out.push({dom:'for',lab:'Achar o '+n,ans:n,stem:`<span class="bigspk">${ICON.speaker}</span>`,prompt:'Ouça e toque na forma certa.',say:[{t:'Toque no '+n}],opts:o.map((x,i)=>({lab:x,h:shapeSvg(x,c[i]),ok:x===n})),cols:3});
  });
  [['triângulo',3],['quadrado',4]].forEach(a=>{
    const s=new Set([a[1]]);[3,4,5,0,6].forEach(x=>{if(s.size<3)s.add(x);});
    out.push({dom:'for',lab:'Lados do '+a[0],ans:a[1],stem:`<div style="display:grid;justify-items:center;gap:6px">${shapeSvg(a[0],'#4DABF7',90)}<span class="stemtext">Quantos lados tem?</span></div>`,prompt:'Conte os lados.',say:[{t:'Quantos lados tem essa forma?'}],opts:shuffle(Array.from(s)).map(x=>({lab:String(x),h:`<span class="num">${x}</span>`,ok:x===a[1]})),cols:3});
  });
  return out;
}
/* ---- mundos novos no menu ---- */
MODS.relogio={title:'Relógios e tempo',sub:'Aprenda a ler as horas, medir o tempo e usar o calendário.',glyph:'🕒',acts:[
  {id:'horas',t:'Que horas são?',d:'Leia o relógio de ponteiros',g:'🕒'},{id:'digital',t:'Achar o relógio',d:'Da hora digital ao relógio de ponteiros',g:'12:30'},
  {id:'calendario',t:'Dias e meses',d:'Semana, meses e calendário',g:'📅'},{id:'duracao',t:'Quanto tempo passou?',d:'Duração e horas depois',g:'⏳',only:'big'}]};
MODS.dinheiro={title:'Dinheiro',sub:'Moedas, notas, troco e escolhas de compra.',glyph:'💰',acts:[
  {id:'valores',t:'Contar dinheiro',d:'Quanto dinheiro tem aqui?',g:'💵'},{id:'troco',t:'Qual é o troco?',d:'Pague e receba o troco',g:'🪙'},
  {id:'barato',t:'Mais barato, mais caro',d:'Compare preços',g:'🏷️',only:'mid'},{id:'compras',t:'Quanto eu gasto?',d:'Some a compra',g:'🛒'},{id:'poupar',t:'Poupar e descontos',d:'Metas de poupança e porcentagem',g:'🐷',only:'big'}]};
MODS.formas={title:'Cores e formas',sub:'Descubra cores, tamanhos e formas.',glyph:'🎨',acts:[{id:'cores',t:'Cores e tamanhos',d:'Ouça e toque na cor ou no tamanho',g:'🎨'},{id:'formas',t:'Formas',d:'Círculo, quadrado, triângulo...',g:'🔺'}]};
const lvOf=()=>ageBand()==='big'?1:0;
MQ('horas','relogio',()=>qHoras(lvOf()));MQ('digital','relogio',()=>qHoraDigital(lvOf()));MQ('calendario','relogio',()=>qCalendario(lvOf()));MQ('duracao','relogio',qDuracao);
MQ('valores','dinheiro',()=>qValores(lvOf()));MQ('troco','dinheiro',()=>qTroco(lvOf()));MQ('barato','dinheiro',qBarato);MQ('compras','dinheiro',()=>qCompras(lvOf()));MQ('poupar','dinheiro',qPouparBig);
MQ('cores','formas',qFormas);MQ('formas','formas',qShapes);
/* 4–5 anos: figura passa para o Mundo das Letras e a leitura some */
MODS.letras.acts.push({id:'figura',t:'Qual figura?',d:'Ouça a palavra e ache a figura',g:'👂',only:'pre'});MQ('figura','letras',qFigura);
MODS.leitura.acts=MODS.leitura.acts.filter(a=>a.id!=='figura');
MODS.mente.acts=MODS.mente.acts.filter(a=>a.id!=='formas');
REC.for={t:'Cores e formas',m:'formas',id:'cores',ico:'🎨'};REC.hora={t:'Hora e tempo',m:'relogio',id:'horas',ico:'🕒'};REC.din={t:'Dinheiro',m:'dinheiro',id:'valores',ico:'💰'};
Object.assign(PRE_OK,{letras:['explorar','achar','vogais','inicial','tracar','figura'],leitura:[],relogio:null,dinheiro:null,formas:null});
CHAL_BIG.push(()=>qHoras(1),qDuracao,()=>qCalendario(1),()=>qValores(1),()=>qTroco(1),qPouparBig);
const CHAL_MID=CHAL_GENS.concat([()=>qHoras(0),()=>qHoraDigital(0),()=>qCalendario(0),()=>qValores(0),()=>qTroco(0),qBarato]);
/* ========== ciências e natureza (prática livre, 6 a 12 anos) ========== */
const CIEN_MID=[
['Em qual planeta nós vivemos?','Terra',['Marte','Lua','Sol']],['O que as plantas precisam para crescer?','Água e luz do sol',['Só barulho','Só doces','Só frio']],
['Qual destes animais é um mamífero?','Baleia',['Sapo','Tubarão','Águia']],['Quantas estações tem o ano?','4',['2','3','6']],
['De onde vem a luz do dia?','Do Sol',['Da Lua','Das nuvens','Do vento']],['O que o gelo vira quando derrete?','Água',['Fumaça','Areia','Pedra']],
['Qual destes animais bota ovos?','Galinha',['Vaca','Cachorro','Gato']],['Qual parte da planta fica debaixo da terra?','Raiz',['Flor','Folha','Fruto']],
['Com que parte do corpo nós ouvimos?','Orelhas',['Olhos','Nariz','Mãos']],['Qual destes é o maior animal?','Baleia-azul',['Elefante','Girafa','Tubarão']],
['Como os peixes respiram na água?','Com as brânquias',['Com o nariz','Com as asas','Com os dentes']],['O que a abelha produz?','Mel',['Leite','Queijo','Suco']],
['Como se chama o satélite natural da Terra?','Lua',['Sol','Marte','Estrela']],['De onde vem a água da chuva?','Das nuvens',['Do chão','Das árvores','Da Lua']],
['Qual animal não tem pernas?','Cobra',['Sapo','Cachorro','Aranha']],['Qual é a estrela do nosso Sistema Solar?','Sol',['Lua','Terra','Júpiter']],
['Qual órgão bombeia o sangue pelo corpo?','Coração',['Estômago','Pulmão','Cérebro']],['Quando devemos escovar os dentes?','Depois de comer',['Só no aniversário','Nunca','Só de manhã cedo']],
['A lagarta se transforma em quê?','Borboleta',['Abelha','Pássaro','Formiga']],['Qual destes é um inseto?','Formiga',['Cobra','Peixe','Sapo']]];
const CIEN_BIG=[
['Como se chama o processo pelo qual as plantas produzem seu alimento com a luz do sol?','Fotossíntese',['Digestão','Respiração','Evaporação']],['Qual gás do ar nós usamos para respirar?','Oxigênio',['Gás carbônico','Nitrogênio','Hélio']],
['Qual é o planeta mais próximo do Sol?','Mercúrio',['Vênus','Marte','Netuno']],['Qual é o maior planeta do Sistema Solar?','Júpiter',['Saturno','Terra','Netuno']],
['Quais são os três estados físicos da água?','Sólido, líquido e gasoso',['Quente, morno e frio','Mar, rio e lago','Chuva, neve e vento']],['Em uma cadeia alimentar, quem produz o próprio alimento?','As plantas',['Os leões','Os fungos','Os coelhos']],
['Como se chama o animal que come somente plantas?','Herbívoro',['Carnívoro','Onívoro','Decompositor']],['Qual órgão filtra o sangue e produz a urina?','Rins',['Fígado','Pulmões','Coração']],
['Qual gás as plantas absorvem do ar para a fotossíntese?','Gás carbônico',['Oxigênio','Hidrogênio','Hélio']],['Como se chama o conjunto formado pelos seres vivos e o ambiente em que vivem?','Ecossistema',['Fóssil','Galáxia','Vulcão']],
['O movimento da Terra em torno do Sol se chama:','Translação',['Rotação','Evaporação','Erosão']],['O movimento da Terra em torno de si mesma causa:','O dia e a noite',['As estações do ano','As marés apenas','Os eclipses']],
['Ao nível do mar, a água ferve a quantos graus Celsius?','100 °C',['50 °C','0 °C','200 °C']],['Qual osso protege o cérebro?','Crânio',['Fêmur','Costela','Coluna']],
['O morcego é um animal de qual grupo?','Mamífero',['Ave','Réptil','Inseto']],['Qual é a menor unidade que forma os seres vivos?','Célula',['Órgão','Osso','Músculo']],
['Qual planeta é conhecido como planeta vermelho?','Marte',['Vênus','Júpiter','Mercúrio']],['O corpo ajuda a produzir qual vitamina com a luz do sol?','Vitamina D',['Vitamina C','Vitamina K','Vitamina B12']],
['O que acontece com a água que evapora e esfria nas nuvens?','Condensa e pode virar chuva',['Vira areia','Desaparece para sempre','Vira gelo no mar']],['Qual destes é um recurso renovável?','Energia do Sol',['Petróleo','Carvão mineral','Gás natural']]];
const CIEN_PRE=[
['Qual bicho vive na água?',['🐟','peixe'],[['🐶','cachorro'],['🐦','passarinho'],['🐱','gato']]],
['Qual bicho voa?',['🐦','passarinho'],[['🐶','cachorro'],['🐢','tartaruga'],['🐮','vaca']]],
['O que a gente usa para ouvir?',['👂','orelha'],[['👁️','olho'],['👃','nariz'],['👅','língua']]],
['O que a gente usa para ver?',['👁️','olho'],[['👂','orelha'],['👃','nariz'],['🦶','pé']]],
['O que a gente usa para sentir cheiro?',['👃','nariz'],[['👁️','olho'],['👂','orelha'],['🦶','pé']]],
['Qual é bem quente?',['☀️','sol'],[['❄️','neve'],['🧊','gelo'],['⛄','boneco de neve']]],
['Qual é bem gelado?',['🧊','gelo'],[['☀️','sol'],['🔥','fogo'],['🍳','frigideira']]],
['O que a planta precisa para crescer?',['💧','água'],[['🍭','pirulito'],['🧸','ursinho'],['📱','celular']]],
['O que aparece no céu de noite?',['🌙','lua'],[['☀️','sol'],['🌈','arco-íris'],['🚗','carro']]],
['Qual bicho faz mel?',['🐝','abelha'],[['🐶','cachorro'],['🐟','peixe'],['🐢','tartaruga']]],
['De onde nascem as frutas?',['🌳','árvore'],[['🚗','carro'],['🪑','cadeira'],['🧱','tijolo']]],
['Com o que a gente escova os dentes?',['🪥','escova de dentes'],[['🥄','colher'],['🍴','garfo'],['🖍️','giz de cera']]],
['O que a gente faz para ficar limpinho?',['🛁','tomar banho'],[['🎮','jogar'],['🛌','dormir'],['🍭','comer doce']]],
['Qual bicho é bem grande e tem tromba?',['🐘','elefante'],[['🐭','rato'],['🐰','coelho'],['🐱','gato']]],
['Qual bicho pula e vive perto da lagoa?',['🐸','sapo'],[['🐶','cachorro'],['🐮','vaca'],['🐦','passarinho']]],
['O que cai do céu quando chove?',['💧','água'],[['🧱','pedra'],['🍎','maçã'],['🧸','ursinho']]]];
function qCiencia(){
  if(ageBand()==='pre')return pick(CIEN_PRE,6).map(c=>({dom:'',lab:'Ciências: '+c[0],ans:c[1][1],stem:`<span class="stemtext">${esc(c[0])}</span>`,prompt:'Toque na resposta.',say:[{t:c[0]}],
    opts:shuffle([c[1]].concat(c[2])).map(x=>({lab:x[1],h:`<span class="emo">${x[0]}</span>`,ok:x===c[1]})),cols:2,after:[{t:c[1][1]}]}));
  const pool=ageBand()==='big'?CIEN_BIG:CIEN_MID;
  return pick(pool,6).map(c=>({dom:'',lab:'Ciências: '+c[0].slice(0,60),ans:c[1],stem:`<span class="stemtext">${esc(c[0])}</span>`,prompt:'Escolha a resposta certa.',say:[{t:c[0]}],noauto:true,
    opts:shuffle([c[1]].concat(c[2])).map(x=>({lab:x,h:`<span class="otext">${esc(x)}</span>`,ok:x===c[1]})),cols:1}));
}
MODS.mente.acts.push({id:'ciencia',t:'Ciências e natureza',d:'Bichos, plantas, corpo humano e espaço',g:'🔬'});
MQ('ciencia','mente',qCiencia);
CHAL_BIG.push(qCiencia);CHAL_MID.push(qCiencia);CHAL_PRE.push(qCiencia);PRE_OK.mente.push('ciencia');

/* ========== histórias em inglês com interpretação (prática livre) ========== */
const EN_STORIES=[
{t:"Tom's Cat",lv:'Fácil',s:['Tom has a cat.','The cat is black.','The cat likes milk.','Tom loves his cat.'],pt:['Tom tem um gato.','O gato é preto.','O gato gosta de leite.','Tom ama o seu gato.'],
 q:[{q:'What color is the cat?',o:['Black','White','Brown'],a:'Black'},{q:'What does the cat like?',o:['Milk','Juice','Rice'],a:'Milk'},{q:'Who loves the cat?',o:['Tom','Anna','Dad'],a:'Tom'}]},
{t:'A Sunny Day',lv:'Fácil',s:['It is a sunny day.','Mia goes to the park.','She plays with a red ball.','Her dog runs after the ball.'],pt:['É um dia de sol.','Mia vai ao parque.','Ela brinca com uma bola vermelha.','O cachorro dela corre atrás da bola.'],
 q:[{q:'How is the weather?',o:['Sunny','Rainy','Cold'],a:'Sunny'},{q:'Where does Mia go?',o:['To the park','To school','To the beach'],a:'To the park'},{q:'What color is the ball?',o:['Red','Blue','Green'],a:'Red'}]},
{t:'At School',lv:'Fácil',s:['Ben is at school.','He has a blue bag.','In the bag, he has two books and a pencil.','Ben likes to read.'],pt:['Ben está na escola.','Ele tem uma mochila azul.','Na mochila, ele tem dois livros e um lápis.','Ben gosta de ler.'],
 q:[{q:"What color is Ben's bag?",o:['Blue','Red','Yellow'],a:'Blue'},{q:'How many books does Ben have?',o:['Two','One','Three'],a:'Two'},{q:'What does Ben like to do?',o:['Read','Swim','Sleep'],a:'Read'}]},
{t:'My Family',lv:'Fácil',s:['I have a small family.','My mother is a teacher.','My father is a cook.','I have one brother.','We eat dinner together.'],pt:['Eu tenho uma família pequena.','Minha mãe é professora.','Meu pai é cozinheiro.','Eu tenho um irmão.','Nós jantamos juntos.'],
 q:[{q:"What is the mother's job?",o:['A teacher','A doctor','A cook'],a:'A teacher'},{q:'How many brothers does the child have?',o:['One','Two','None'],a:'One'},{q:'Who eats dinner together?',o:['The family','Only the father','Only the brother'],a:'The family'}]},
{t:'The Lost Key',lv:'Médio',s:['Anna cannot find her key.','She looks under the table and behind the sofa.','Then she checks her coat.','The key is in the pocket!','Anna is very happy.'],pt:['Anna não consegue achar a chave.','Ela procura embaixo da mesa e atrás do sofá.','Então ela confere o casaco.','A chave está no bolso!','Anna fica muito feliz.'],
 q:[{q:'What is Anna looking for?',o:['Her key','Her phone','Her shoes'],a:'Her key'},{q:'Where does she find it?',o:['In her coat pocket','Under the table','Behind the sofa'],a:'In her coat pocket'},{q:'How does Anna feel at the end?',o:['Happy','Angry','Tired'],a:'Happy'}]},
{t:'Saturday Plans',lv:'Médio',s:['On Saturday, Leo wakes up early.','He eats breakfast and rides his bike to the beach.','There, he meets his friends and they play volleyball.','In the evening, he goes home tired.'],pt:['No sábado, Leo acorda cedo.','Ele toma café da manhã e vai de bicicleta até a praia.','Lá, ele encontra os amigos e eles jogam vôlei.','À noite, ele volta para casa cansado.'],
 q:[{q:'How does Leo go to the beach?',o:['By bike','By bus','By car'],a:'By bike'},{q:'What do the friends play?',o:['Volleyball','Soccer','Tennis'],a:'Volleyball'},{q:'How is Leo in the evening?',o:['Tired','Hungry','Cold'],a:'Tired'}]},
{t:'The Rainy Picnic',lv:'Médio',s:['Sara planned a picnic, but it started to rain.','She did not cancel it.','She put a blanket in the living room and ate sandwiches with her sister.','It was a fun picnic!'],pt:['Sara planejou um piquenique, mas começou a chover.','Ela não cancelou.','Ela colocou uma manta na sala e comeu sanduíches com a irmã.','Foi um piquenique divertido!'],
 q:[{q:'What happened to the picnic?',o:['It moved inside the house','It was canceled','It was at the park'],a:'It moved inside the house'},{q:'Where did they eat?',o:['In the living room','In the garden','At school'],a:'In the living room'},{q:'Who ate with Sara?',o:['Her sister','Her teacher','Her dog'],a:'Her sister'}]},
{t:'The New Student',lv:'Médio',s:['Carlos is a new student at school.','He is shy, so he sits alone at lunch.','A girl named Julia invites him to sit with her group.','Soon, Carlos has new friends.'],pt:['Carlos é um aluno novo na escola.','Ele é tímido, por isso senta sozinho no almoço.','Uma garota chamada Julia o convida para sentar com o grupo dela.','Logo, Carlos tem novos amigos.'],
 q:[{q:'Why does Carlos sit alone?',o:['He is shy','He is angry','He is sick'],a:'He is shy'},{q:'Who invites Carlos?',o:['Julia','The teacher','His mother'],a:'Julia'},{q:'What happens soon?',o:['He makes new friends','He changes schools','He goes home'],a:'He makes new friends'}]}
];
function enStoryQs(i){
  return EN_STORIES[i].q.map(q=>({dom:'ing',lab:q.q,ans:q.a,stem:`<span class="stemtext">${esc(q.q)}</span>`,prompt:'Escolha a resposta certa. As respostas estão em inglês.',say:[{t:q.q,lang:'en-US',rate:S.rate*0.9}],noauto:true,
    opts:shuffle(q.o).map(o=>({lab:o,h:`<span class="otext">${esc(o)}</span>`,ok:o===q.a})),cols:1,after:[{t:q.a,lang:'en-US',rate:S.rate*0.9}]}));
}
MODS.ingles.acts.push({id:'historias',t:'Histórias em inglês',d:'Leia, ouça e responda perguntas',g:'📖',noPre:true});
MODS.ingles.acts.splice(-1,0,MODS.ingles.acts.pop());
ACTS['ingles:historias']=m=>{
  m.innerHTML=`${backBtn('menu','ingles')}<h2 class="mtitle" style="--c:var(--c-ingles)">Histórias em inglês</h2><p class="msub">Histórias curtas. Ouça em inglês, veja a tradução se precisar e responda às perguntas.</p>
  <div class="acts" style="--c:var(--c-ingles)">${EN_STORIES.map((s,i)=>`<button class="act" data-go="act"${dataArg({m:'ingles',id:'historia',i:i})}><span class="glyph sm">${i+1}</span><span><b>${esc(s.t)}</b><small>${s.lv} · ${s.s.length} frases · ${s.q.length} perguntas</small></span></button>`).join('')}</div>`;
};
ACTS['ingles:historia']=(m,arg)=>{
  const i=arg.i,st=EN_STORIES[i];let showPt=false;
  m.innerHTML=`${backBtn('act',{m:'ingles',id:'historias'})}<h2 class="mtitle" style="--c:var(--c-ingles)">${esc(st.t)}</h2>
  <div class="story">${st.s.map((s,k)=>`<button class="sent" data-k="${k}" lang="en">${esc(s)}<small class="ptr" hidden style="display:block;font-weight:600;opacity:.8;margin-top:4px">${esc(st.pt[k])}</small></button>`).join('')}</div>
  <div class="row" style="--c:var(--c-ingles)"><button class="btn primary" id="sAll">${ICON.speaker}<span>Ouvir a história</span></button><button class="btn" id="sPt" aria-pressed="false">Ver em português</button><button class="btn" id="sQ">Responder as perguntas</button></div>`;
  const sents=$$('.sent',m);
  const mark=k=>sents.forEach((b,j)=>b.classList.toggle('on',j===k));
  const en=t=>({t:t,lang:'en-US',rate:S.rate*0.9});
  sents.forEach((b,k)=>b.onclick=()=>{mark(k);say(en(st.s[k]),()=>mark(-1));});
  $('#sAll',m).onclick=()=>{say(st.s.map(en),()=>mark(-1),mark);};
  $('#sPt',m).onclick=e=>{showPt=!showPt;$$('.ptr',m).forEach(x=>{x.hidden=!showPt;});e.currentTarget.setAttribute('aria-pressed',String(showPt));e.currentTarget.textContent=showPt?'Esconder o português':'Ver em português';};
  $('#sQ',m).onclick=()=>{sfx.tap();quiz(m,{key:'ingles:hist'+i,module:'ingles',make:()=>enStoryQs(i),back:['act',{m:'ingles',id:'historia',i:i}]});};
};

/* ---- v37: histórias em inglês mais longas (9–12 anos) ---- */
EN_STORIES.push(
{t:'The School Garden',lv:'Mais difícil',s:['Last spring, our class decided to build a garden behind the school.','Every student brought something: seeds, small shovels or old buckets.','We planted tomatoes, carrots and sunflowers.','Each morning, two students watered the plants before class.','After two months, the sunflowers were taller than the teacher!','We shared the vegetables with the school kitchen.'],
 pt:['Na primavera passada, nossa turma decidiu construir uma horta atrás da escola.','Cada aluno trouxe algo: sementes, pazinhas ou baldes velhos.','Plantamos tomates, cenouras e girassóis.','Toda manhã, dois alunos molhavam as plantas antes da aula.','Depois de dois meses, os girassóis estavam mais altos que a professora!','Dividimos os legumes com a cozinha da escola.'],
 q:[{q:'Where did the class build the garden?',o:['Behind the school','In a park','At home'],a:'Behind the school'},{q:'What did the students bring?',o:['Seeds, shovels or buckets','Only food','Computers'],a:'Seeds, shovels or buckets'},{q:'When did two students water the plants?',o:['Every morning','Every night','Only on Sundays'],a:'Every morning'},{q:'What happened to the sunflowers after two months?',o:['They were taller than the teacher','They died','They were very small'],a:'They were taller than the teacher'},{q:'What did the class do with the vegetables?',o:['Shared them with the school kitchen','Sold them at a market','Threw them away'],a:'Shared them with the school kitchen'}]},
{t:'The Science Fair',lv:'Mais difícil',s:['Marina was nervous about the science fair.','Her project showed how plants grow toward the light.','For three weeks, she kept a small plant in a box with a hole on one side.','Every few days, she took a photo and measured the stem.','On the day of the fair, the judges asked many questions.','Marina answered calmly, and she won second place.'],
 pt:['Marina estava nervosa com a feira de ciências.','O projeto dela mostrava como as plantas crescem em direção à luz.','Durante três semanas, ela manteve uma plantinha numa caixa com um buraco de um lado.','A cada poucos dias, ela tirava uma foto e media o caule.','No dia da feira, os jurados fizeram muitas perguntas.','Marina respondeu com calma e ganhou o segundo lugar.'],
 q:[{q:'How did Marina feel before the fair?',o:['Nervous','Bored','Angry'],a:'Nervous'},{q:'What did her project show?',o:['Plants grow toward the light','Plants need no water','Plants grow only at night'],a:'Plants grow toward the light'},{q:'How long did she watch the plant?',o:['Three weeks','Three days','Three years'],a:'Three weeks'},{q:'What did she do every few days?',o:['Took a photo and measured the stem','Changed the plant','Watered it with juice'],a:'Took a photo and measured the stem'},{q:'What place did Marina win?',o:['Second place','First place','Third place'],a:'Second place'}]},
{t:'The Lighthouse',lv:'Mais difícil',s:['A long time ago, a man named Henry lived in a lighthouse by the sea.','Every evening, he climbed 120 steps to turn on the big light.','The light helped ships to avoid the dangerous rocks.','One stormy night, a small boat was lost in the fog.','Henry rang a loud bell and kept the light on until morning.','The boat arrived safely, and the sailors thanked him.'],
 pt:['Há muito tempo, um homem chamado Henry morava num farol à beira-mar.','Toda noite, ele subia 120 degraus para acender a luz grande.','A luz ajudava os navios a evitar as pedras perigosas.','Numa noite de tempestade, um barco pequeno se perdeu na neblina.','Henry tocou um sino alto e manteve a luz acesa até de manhã.','O barco chegou em segurança e os marinheiros agradeceram.'],
 q:[{q:'Where did Henry live?',o:['In a lighthouse','On a ship','In a forest'],a:'In a lighthouse'},{q:'How many steps did he climb?',o:['120','12','1,200'],a:'120'},{q:'Why was the light important?',o:['It helped ships avoid the rocks','It warmed the sea','It scared the fish'],a:'It helped ships avoid the rocks'},{q:'What was the problem one stormy night?',o:['A small boat was lost in the fog','The light broke','Henry was sick'],a:'A small boat was lost in the fog'},{q:'How did Henry help the boat?',o:['He rang a bell and kept the light on','He sailed out to it','He called the police'],a:'He rang a bell and kept the light on'}]},
{t:'Learning to Swim',lv:'Mais difícil',s:['Pedro was afraid of deep water, so he never went into the pool.','His cousin Lia offered to teach him.','First, he only sat on the edge and moved his feet.','Next, he practiced floating with a foam board.','It took many weeks, but he did not give up.','Now Pedro swims across the pool and helps other kids who feel scared.'],
 pt:['Pedro tinha medo de água funda, então nunca entrava na piscina.','A prima dele, Lia, ofereceu-se para ensiná-lo.','Primeiro, ele só sentava na borda e mexia os pés.','Depois, ele praticou flutuar com uma prancha de espuma.','Levou muitas semanas, mas ele não desistiu.','Agora Pedro atravessa a piscina e ajuda outras crianças que têm medo.'],
 q:[{q:'Why did Pedro never go into the pool?',o:['He was afraid of deep water','He did not like his cousin','He had no swimsuit'],a:'He was afraid of deep water'},{q:'Who offered to teach him?',o:['His cousin Lia','His teacher','His father'],a:'His cousin Lia'},{q:'What did he do first?',o:['Sat on the edge and moved his feet','Jumped in','Swam across'],a:'Sat on the edge and moved his feet'},{q:'What does "he did not give up" mean?',o:['He kept trying','He stopped','He got angry'],a:'He kept trying'},{q:'What does Pedro do now?',o:['Swims and helps other kids','Never swims','Teaches adults only'],a:'Swims and helps other kids'}]}
);

/* ---- v37: conversas curtas em inglês (prática livre) ---- */
const EN_DLG=[
['Hello! How are you?','I am fine, thank you.',['I am ten years old.','It is on the table.']],
['What is your name?','My name is Ana.',['I like pizza.','It is Monday.']],
['How old are you?','I am nine years old.',['I am from Brazil.','I am fine.']],
['Where are you from?','I am from Brazil.',['I am nine.','Yes, please.']],
['What time is it?','It is three o\'clock.',['It is red.','I like it.']],
['Do you like pizza?','Yes, I do.',['It is Tuesday.','I am happy.']],
['Would you like some water?','Yes, please.',['I am ten.','See you later.']],
['Thank you!','You are welcome.',['Good morning.','I am sorry.']],
['I am sorry.','It is OK.',['You are welcome.','Nice to meet you.']],
['Good morning!','Good morning! How are you?',['Good night!','Goodbye!']],
['Nice to meet you.','Nice to meet you, too.',['See you tomorrow.','I am hungry.']],
['What is your favorite color?','My favorite color is blue.',['I am six years old.','It is a dog.']],
['Can you help me, please?','Sure! What do you need?',['I am a student.','Today is sunny.']],
['What is the weather like today?','It is rainy.',['It is my brother.','I have two cats.']],
['Do you have a pet?','Yes, I have a dog.',['Yes, it is nine o\'clock.','No, I am Tom.']],
['What do you want for lunch?','I want rice and beans.',['I am at school.','It is cold.']],
['Where is the bathroom?','It is down the hall.',['It is my birthday.','I like soccer.']],
['See you tomorrow!','See you! Bye!',['Nice to meet you.','You are welcome.']],
['Happy birthday!','Thank you very much!',['Good night.','I am sorry.']],
['What do you do on weekends?','I play soccer with my friends.',['I am a teacher.','It is a big house.']]
];
function qDialogos(){
  return pick(EN_DLG,6).map(c=>({dom:'ing',lab:c[0],ans:c[1],stem:`<span class="stemtext" lang="en">“${esc(c[0])}”</span>`,prompt:'Escolha a melhor resposta. Ouça a frase e responda em inglês.',say:[{t:c[0],lang:'en-US',rate:S.rate*0.9}],noauto:true,
    opts:shuffle([c[1]].concat(c[2])).map(x=>({lab:x,h:`<span class="otext" lang="en">${esc(x)}</span>`,ok:x===c[1]})),cols:1,after:[{t:c[1],lang:'en-US',rate:S.rate*0.9}]}));
}
MODS.ingles.acts.splice(-1,0,{id:'dialogos',t:'Conversas curtas',d:'Ouça a pergunta e escolha a resposta',g:'💬',noPre:true});
MQ('dialogos','ingles',qDialogos);

/* ========== v37: Ateliê de projetos (7+ anos) — sem "certo/errado": escolher, testar, receber pistas e explicar ========== */
const dayDiff=(a,b)=>Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5);
function projOk(){
  if(!P||ageBand()==='pre')return false;
  const y=ageYears(P.birth);return y==null||y>=7;
}
const brl=n=>{n=Math.round(n*100)/100;return 'R$ '+(n%1?n.toFixed(2).replace('.',','):String(n));};
const PROJ=[
{id:'zoo',e:'🦁',t:'Meu zoológico',d:'Escolha os bichos, cuide dos espaços e do dinheiro.',steps:[
 {k:'pick',t:'Escolher o tema',q:'Que tipo de zoológico você quer criar?',opts:[['🌍','Savana'],['🌳','Floresta'],['🧊','Polo Norte'],['🌊','Mar']],why:'Por que você escolheu esse tema?'},
 {k:'scn',t:'Cada bicho no seu lugar',intro:'Os bichos chegaram! Teste onde cada um fica melhor. Cada tentativa traz uma pista.',items:[
  {q:'Onde o pinguim vai morar?',o:[['🧊 Área gelada','Combina! O pinguim vive em lugares frios e nada muito bem.',1],['🏜️ Área de deserto','Pista: no deserto faz muito calor e quase não tem água. O pinguim ficaria desconfortável. Que tal testar outro lugar?',0],['🌴 Floresta quente','Pista: lá é quente e úmido, bem diferente do frio de onde o pinguim vem.',0]]},
  {q:'Onde o camelo vai morar?',o:[['🏜️ Área de deserto','Combina! O camelo guarda gordura na corcova e aguenta muito tempo sem beber.',1],['🧊 Área gelada','Pista: o camelo vem de lugares quentes e secos. No gelo ele passaria frio.',0],['🌊 Lago grande','Pista: o camelo não é bom nadador e não precisa de tanta água. Tente outro lugar.',0]]},
  {q:'O que o leão vai comer?',o:[['🥩 Carne','Combina! O leão é carnívoro: precisa de carne para ter energia.',1],['🥬 Só alface','Pista: o leão tem dentes feitos para cortar carne. Só com alface ele ficaria com fome.',0],['🍌 Só frutas','Pista: frutas são ótimas para macacos, mas o leão precisa de outro tipo de comida.',0]]}]},
 {k:'budget',t:'Fazer o orçamento',q:'Você tem R$ 100 para a primeira semana. Escolha no que vai gastar.',budget:100,min:3,items:[['🥩','Comida para os bichos',40],['🛠️','Cercas novas',35],['🌿','Plantas e árvores',20],['🩺','Cuidados do veterinário',30],['🎨','Placas e cartazes',15],['🪑','Bancos para os visitantes',25]]},
 {k:'write',t:'Contar como pensei',q:'Como você decidiu o que escolher? Teve algo que você quis mudar no meio do caminho?',ph:'Escreva do seu jeito...'},
 {k:'write',t:'Dar um nome',q:'Qual é o nome do seu zoológico? Escreva uma frase para convidar as pessoas a visitar.',ph:'Ex.: Zoo Aventura, venha conhecer...'}]},
{id:'limonada',e:'🍋',t:'Minha barraca',d:'Planeje uma barraca: o que vender, quanto gastar e que preço cobrar.',steps:[
 {k:'pick',t:'Escolher o produto',q:'O que você vai vender na sua barraca?',opts:[['🍋','Limonada'],['🍇','Suco de uva'],['🍰','Bolo'],['🍿','Pipoca']],why:'Por que as pessoas vão querer comprar isso?'},
 {k:'budget',t:'Comprar o material',q:'Você tem R$ 40 para comprar o material. Escolha o que vai levar.',budget:40,min:4,items:[['🍋','Limões',12],['🍬','Açúcar',6],['🥤','Copos',8],['🧊','Gelo',5],['🫙','Jarra grande',10],['🪧','Cartaz colorido',4],['🥢','Canudos',7],['🧻','Guardanapos',3]]},
 {k:'scn',t:'Testar preços',intro:'Preço é uma decisão difícil. Teste as opções e leia as pistas.',items:[
  {q:'Você vende cada copo por R$ 0,50. Se vender 20 copos, quanto entra?',o:[['R$ 10','Isso! Dois copos dão R$ 1. Então 20 copos dão 10 reais.',1],['R$ 20','Pista: R$ 0,50 é metade de R$ 1. Então 20 copos dão a metade de 20.',0],['R$ 5','Pista: a cada 2 copos você ganha R$ 1. Quantos reais dão 20 copos?',0]]},
  {q:'E se você cobrar R$ 10 por copo?',o:[['Poucas pessoas vão comprar','Combina! Quando o preço é muito alto, muita gente desiste de comprar.',1],['Vai vender muito mais','Pista: pense em você: compraria um copo de limonada por R$ 10?',0],['Nada muda','Pista: o preço faz diferença para quem compra. Tente outra ideia.',0]]},
  {q:'E se você cobrar R$ 0,10 por copo?',o:[['Vende muito, mas ganha pouco','Combina! Muita gente compra, mas o dinheiro pode não cobrir o que você gastou.',1],['Ganha muito dinheiro','Pista: você gastou R$ 40 no material. Quantos copos precisaria vender a R$ 0,10 para cobrir isso?',0],['Ninguém vai querer','Pista: um preço baixo atrai compradores. O problema pode ser outro.',0]]}]},
 {k:'write',t:'Conversa com o cliente',q:'Um cliente diz: "Está caro!". O que você responde? E se sobrar produto no fim do dia, o que você faz?',ph:'Escreva do seu jeito...'},
 {k:'write',t:'Meu plano final',q:'Escreva seu plano: que preço vai cobrar, quantos copos pretende vender e como vai chamar os clientes.',ph:'Meu plano é...'}]},
{id:'feijao',e:'🌱',t:'Diário do feijão',d:'Plante de verdade e observe durante alguns dias. Volte para registrar.',steps:[
 {k:'do',t:'Plantar o feijão',q:'Pegue um copo, algodão molhado e um grão de feijão. Coloque o grão no algodão e deixe perto da janela. Peça ajuda a um adulto, se precisar.',note:'O que você acha que vai acontecer? Escreva sua previsão.',btn:'Já plantei!'},
 {k:'do',t:'Primeira observação',wait:2,q:'Passaram alguns dias. Olhe o seu feijão com calma. O algodão ainda está úmido? Ele mudou?',note:'O que você viu? Pode descrever ou comparar com o dia em que plantou.',btn:'Já observei!'},
 {k:'do',t:'Segunda observação',wait:2,q:'Observe de novo. Se tiver uma régua, meça o tamanho do broto ou da raiz.',note:'O que mudou desde a última vez? Se mediu, escreva o tamanho.',btn:'Já observei!'},
 {k:'write',t:'O que descobri',wait:1,q:'Sua previsão estava certa? O que a planta precisou para crescer? O que você faria diferente numa próxima vez?',ph:'Descobri que...'}]},
{id:'historia',e:'📖',t:'Minha história',d:'Crie uma história com personagem, problema e final. No fim, ouça ela pronta.',steps:[
 {k:'pick',t:'Escolher o personagem',q:'Quem é o personagem principal da sua história?',opts:[['🦸','Super-herói'],['🐉','Dragão'],['🧑‍🚀','Astronauta'],['🦊','Raposa esperta']],why:'Dê um nome ao personagem e diga uma coisa que ele faz muito bem.'},
 {k:'write',t:'O lugar',q:'Onde a história começa? Descreva o lugar para quem vai ler.',ph:'A história começa em...'},
 {k:'write',t:'O problema',q:'Qual problema aparece? Algo precisa dar errado para a história ficar interessante.',ph:'Um dia, aconteceu que...'},
 {k:'pick',t:'A ajuda',q:'Que ajuda aparece para resolver o problema?',opts:[['🧑‍🤝‍🧑','Um amigo'],['✨','Um objeto mágico'],['💡','Uma ideia inteligente'],['💪','Muita coragem']],why:'Conte como isso resolve o problema.'},
 {k:'write',t:'O final',q:'Como a história termina? O personagem mudou depois dessa aventura?',ph:'No final...'}]}
];
function psteps(id){return (P.proj&&P.proj[id]&&P.proj[id].s)||[];}
function pCount(id){return psteps(id).filter(Boolean).length;}
function pAvail(pr,i){
  const st=psteps(pr.id);
  if(st[i])return {ok:true,done:true};
  for(let k=0;k<i;k++)if(!st[k])return {ok:false,msg:'Termine a etapa anterior'};
  const w=pr.steps[i].wait||0,prev=i>0?st[i-1]:null;
  if(prev&&w>0){const dd=dayDiff(prev.d,today());if(dd<w)return {ok:false,msg:w-dd===1?'Volte amanhã':'Volte em '+(w-dd)+' dias'};}
  if(!w){const n=st.filter(x=>x&&x.d===today()).length;if(n>=2)return {ok:false,msg:'Por hoje chega! Volte amanhã'};}
  return {ok:true};
}
function pCommit(pr,i,ans,bonus){
  if(!P.proj)P.proj={};
  const p=P.proj[pr.id]||(P.proj[pr.id]={s:[]}),first=!p.s[i];
  ans.d=first?today():(p.s[i].d||today());
  p.s[i]=ans;
  let earned=0,fin=false;
  if(first){
    earned=2+(bonus?1:0);
    if(p.s.filter(Boolean).length===pr.steps.length&&!p.fin){p.fin=today();earned+=3;fin=true;}
  }
  save();if(earned)addStars(earned);
  return {earned:earned,fin:fin};
}
function projCardHTML(){
  if(!projOk())return '';
  const cur=PROJ.find(p=>pCount(p.id)>0&&pCount(p.id)<p.steps.length);
  const sub=cur?'Continue: '+cur.t+' ('+pCount(cur.id)+'/'+cur.steps.length+')':'Projetos de vários dias. Aqui você escolhe, testa e explica.';
  return '<div class="chalrow one"><button class="chal rec proj" data-go="proj"><span class="ci" aria-hidden="true">🛠️</span><span class="ct"><b>Ateliê de projetos</b><small>'+esc(sub)+'</small></span><span class="cb">Abrir</span></button></div>';
}
screens.proj=m=>{
  if(!projOk())return go('home',undefined,{replace:true});
  m.innerHTML=`${backBtn('home')}<h2 class="mtitle" style="--c:var(--c-mente)">Ateliê de projetos</h2>
  <p class="msub">Projetos de vários dias. Aqui não existe resposta certa ou errada: você escolhe, testa, muda de ideia e conta como pensou. As estrelas vêm do seu esforço.</p>
  <div class="acts" style="--c:var(--c-mente)">${PROJ.map(p=>{const n=pCount(p.id),t=p.steps.length;
    return `<button class="act" data-go="projv"${dataArg({id:p.id})}><span class="glyph sm" aria-hidden="true">${p.e}</span><span><b>${esc(p.t)}</b><small>${esc(p.d)} · ${n===t?'Concluído ✓':n?n+' de '+t+' etapas':t+' etapas'}</small></span></button>`;}).join('')}</div>
  <div class="row"><button class="chip" data-go="projfolio">📁 Meu portfólio</button></div>`;
};
screens.projv=(m,arg)=>{
  const pr=PROJ.find(x=>x.id===(arg&&arg.id));if(!pr||!projOk())return go('proj',undefined,{replace:true});
  m.innerHTML=`${backBtn('proj')}<h2 class="mtitle" style="--c:var(--c-mente)">${pr.e} ${esc(pr.t)}</h2><p class="msub">${esc(pr.d)}</p>
  <ol class="psteps">${pr.steps.map((s,i)=>{const a=pAvail(pr,i),cur=a.ok&&!a.done;
    const tag=a.done?'Feita ✓ (ver ou mudar)':cur?'Fazer agora':a.msg;
    return `<li>${a.ok?`<button class="pstep${cur?' cur':''}${a.done?' done':''}" data-go="projs"${dataArg({id:pr.id,i:i})}>`:'<div class="pstep lock">'}<span class="pn" aria-hidden="true">${a.done?'✓':i+1}</span><span class="pt"><b>${esc(s.t)}</b><small>${esc(tag)}</small></span>${a.ok?'</button>':'</div>'}</li>`;}).join('')}</ol>
  <div class="row"><button class="chip" data-go="projfolio">📁 Meu portfólio</button></div>`;
};
function projAnswerLines(pr,i,a){
  const s=pr.steps[i];if(!a)return [];
  if(s.k==='pick')return [(s.opts[a.v]?s.opts[a.v][0]+' '+s.opts[a.v][1]:'')+(a.w?' — '+a.w:'')];
  if(s.k==='scn')return s.items.map((it,j)=>{const o=it.o[a.c&&a.c[j]];return o?it.q+' → '+o[0]:'';}).filter(Boolean);
  if(s.k==='budget')return [(a.sel||[]).map(k=>s.items[k]?s.items[k][0]+' '+s.items[k][1]+' ('+brl(s.items[k][2])+')':'').join(', ')+'. Total: '+brl(a.tot||0)+' de '+brl(s.budget)+'.'];
  return [a.w||''].filter(Boolean);
}
function projStory(){
  const pr=PROJ.find(x=>x.id==='historia'),st=psteps('historia'),out=[];
  const pk=(i)=>{const a=st[i],s=pr.steps[i];return a&&s.opts[a.v]?s.opts[a.v]:null;};
  if(st[0]){const o=pk(0);out.push((o?'O personagem é '+o[1].toLowerCase()+'. ':'')+(st[0].w||''));}
  [1,2].forEach(i=>{if(st[i]&&st[i].w)out.push(st[i].w);});
  if(st[3]){const o=pk(3);out.push((o?'A ajuda foi: '+o[1].toLowerCase()+'. ':'')+(st[3].w||''));}
  if(st[4]&&st[4].w)out.push(st[4].w);
  return out.map(x=>x.trim()).filter(Boolean);
}
screens.projfolio=m=>{
  if(!projOk())return go('home',undefined,{replace:true});
  const any=PROJ.filter(p=>pCount(p.id)>0);
  m.innerHTML=`${backBtn('proj')}<h2 class="mtitle" style="--c:var(--c-mente)">Meu portfólio</h2><p class="msub">Tudo o que você criou e pensou nos projetos fica guardado aqui.</p>
  ${any.length?any.map(p=>`<section class="panel"><h3>${p.e} ${esc(p.t)} <small>${pCount(p.id)}/${p.steps.length}</small></h3>${p.steps.map((s,i)=>{const L=projAnswerLines(p,i,psteps(p.id)[i]);return L.length?`<div class="pf"><b>${esc(s.t)}</b>${L.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:'';}).join('')}
  ${p.id==='historia'&&projStory().length>1?`<div class="pf story2"><b>Minha história completa</b>${projStory().map(x=>`<p>${esc(x)}</p>`).join('')}<button class="btn noprint" id="pfListen">${ICON.speaker}<span>Ouvir minha história</span></button></div>`:''}</section>`).join(''):'<div class="panel"><p>Você ainda não guardou nada. Comece um projeto e volte aqui depois.</p><button class="btn primary" data-go="proj">Ver projetos</button></div>'}
  ${any.length?'<div class="row noprint"><button class="chip" data-act="print">Imprimir meu portfólio</button></div>':''}`;
  const b=$('#pfListen',m);if(b)b.onclick=()=>{sfx.tap();say(projStory().map(t=>({t:t})));};
};
screens.projs=(m,arg)=>{
  const pr=PROJ.find(x=>x.id===(arg&&arg.id)),i=arg&&arg.i,st=pr&&pr.steps[i];
  if(!st||!projOk())return go('proj',undefined,{replace:true});
  if(!pAvail(pr,i).ok)return go('projv',{id:pr.id},{replace:true});
  const old=psteps(pr.id)[i]||null;
  m.innerHTML=`${backBtn('projv',{id:pr.id})}<h2 class="mtitle" style="--c:var(--c-mente)">${pr.e} ${esc(pr.t)}</h2><p class="msub">Etapa ${i+1} de ${pr.steps.length}: ${esc(st.t)}</p><div class="panel" id="pbody"></div>`;
  const body=$('#pbody',m);
  const spk=t=>`<button class="btn noprint" type="button" id="pspk">${ICON.speaker}<span>Ouvir</span></button>`;
  const bindSpk=t=>{const b=$('#pspk',body);if(b)b.onclick=()=>{sfx.tap();say({t:t});};};
  const refocus=sel=>{const f=sel&&$(sel,body);if(f)try{f.focus({preventScroll:true});}catch(e){}};
  const end=(res,msg)=>{
    sfx.ok();if(res.fin)rain();
    const nx=i+1<pr.steps.length?pAvail(pr,i+1):null;
    body.innerHTML=`<div class="pend" role="status"><div class="pbig" aria-hidden="true">${res.fin?'🎉':'🌟'}</div><h3>${res.fin?'Projeto concluído!':'Etapa guardada!'}</h3><p>${esc(msg)}</p>${res.earned&&S.reinf==='stars'?`<p class="pstar">+${res.earned} ⭐ pelo seu esforço</p>`:''}
    <div class="row">${res.fin?'<button class="btn primary" data-go="projfolio">Ver meu portfólio</button>':nx&&nx.ok?`<button class="btn primary" data-go="projs"${dataArg({id:pr.id,i:i+1})}>Próxima etapa</button>`:`<p class="hint">${esc(nx&&nx.msg?nx.msg+' para a próxima etapa.':'')}</p>`}<button class="btn" data-go="projv"${dataArg({id:pr.id})}>Voltar ao projeto</button></div></div>`;
    const h=$('h3',body);if(h){h.setAttribute('tabindex','-1');h.focus();}
  };
  if(st.k==='pick'){
    let sel=old?old.v:-1,why=old&&old.w||'';
    const draw=()=>{
      body.innerHTML=`<h3 id="pq">${esc(st.q)}</h3>${spk()}<div class="popts" role="group" aria-labelledby="pq">${st.opts.map((o,k)=>`<button class="popt" data-k="${k}" aria-pressed="${sel===k}"><span aria-hidden="true">${o[0]}</span><b>${esc(o[1])}</b></button>`).join('')}</div>
      <label class="fl" for="pw">${esc(st.why)} <small>(se quiser)</small></label><textarea id="pw" class="inp" rows="3" maxlength="400">${esc(why)}</textarea>
      <p class="hint" id="pmsg" role="status"></p><button class="btn primary" id="pok">Guardar minha escolha</button>`;
      bindSpk(st.q);
      $$('.popt',body).forEach(b=>b.onclick=()=>{sfx.tap();sel=+b.dataset.k;draw();refocus('.popt[data-k="'+sel+'"]');});
      $('#pw',body).oninput=e=>{why=e.target.value;};
      $('#pok',body).onclick=()=>{if(sel<0){$('#pmsg',body).textContent='Escolha uma das opções primeiro.';return;}end(pCommit(pr,i,{v:sel,w:why.trim()},why.trim().length>=20),'Sua escolha e suas ideias já estão no portfólio. Você pode mudar quando quiser.');};
    };draw();
  }else if(st.k==='scn'){
    let j=0,chosen=old&&old.c?old.c.slice():[],tried=[],last=-1,pend=-1,xs=0;
    const draw=()=>{
      const it=st.items[j];
      body.innerHTML=`<p class="hint">${j===0?esc(st.intro)+' ':''}Situação ${j+1} de ${st.items.length}</p><h3 id="pq">${esc(it.q)}</h3>${spk()}<div class="popts one" role="group" aria-labelledby="pq">${it.o.map((o,k)=>`<button class="popt" data-k="${k}" aria-pressed="${pend===k}"><b>${esc(o[0])}</b></button>`).join('')}</div>
      <div class="clue" id="pclue" role="status" aria-live="polite">${pend>=0?`<span aria-hidden="true">${it.o[pend][2]?'🌟':'💡'}</span> ${esc(it.o[pend][1])}`:'Toque numa opção para testar e ver a pista.'}</div>
      <div class="row"><button class="btn primary" id="pok"${pend<0?' disabled aria-disabled="true"':''}>Escolher esta opção</button></div>`;
      bindSpk(it.q);
      $$('.popt',body).forEach(b=>b.onclick=()=>{sfx.tap();pend=+b.dataset.k;if(tried.indexOf(pend)<0)tried.push(pend);draw();refocus('.popt[data-k="'+pend+'"]');});
      $('#pok',body).onclick=()=>{
        if(pend<0)return;chosen[j]=pend;xs+=tried.length-1;tried=[];pend=-1;
        if(j+1<st.items.length){j++;draw();const h=$('#pq',body);if(h){h.setAttribute('tabindex','-1');h.focus();}}
        else end(pCommit(pr,i,{c:chosen},xs>0),xs>0?'Você testou '+(xs+st.items.length)+' opções antes de decidir. Testar é uma ótima forma de aprender!':'Você fez suas escolhas. Da próxima vez, teste outras opções para ver as pistas.');
      };
    };draw();
  }else if(st.k==='budget'){
    let sel=old&&old.sel?old.sel.slice():[];
    const tot=()=>sel.reduce((a,k)=>a+st.items[k][2],0);
    const draw=()=>{
      const t=tot(),left=st.budget-t;
      body.innerHTML=`<h3 id="pq">${esc(st.q)}</h3>${spk()}<div class="popts one" role="group" aria-labelledby="pq">${st.items.map((o,k)=>`<button class="popt" data-k="${k}" aria-pressed="${sel.indexOf(k)>=0}"><span aria-hidden="true">${o[0]}</span><b>${esc(o[1])}</b><i>${brl(o[2])}</i></button>`).join('')}</div>
      <div class="clue" role="status" aria-live="polite"><span aria-hidden="true">${left<0?'💡':'💰'}</span> Gasto: ${brl(t)} de ${brl(st.budget)}. ${left<0?'Pista: passou '+brl(-left)+'. Tire algum item ou troque por um mais barato.':left===0?'Você usou todo o dinheiro.':'Ainda sobram '+brl(left)+'.'}</div>
      <p class="hint" id="pmsg" role="status"></p><button class="btn primary" id="pok">Guardar meu orçamento</button>`;
      bindSpk(st.q);
      $$('.popt',body).forEach(b=>b.onclick=()=>{sfx.tap();const k=+b.dataset.k,p=sel.indexOf(k);if(p>=0)sel.splice(p,1);else sel.push(k);draw();refocus('.popt[data-k="'+k+'"]');});
      $('#pok',body).onclick=()=>{
        if(tot()>st.budget){$('#pmsg',body).textContent='Ainda passou do dinheiro. Tire ou troque algum item e tente de novo.';return;}
        if(sel.length<st.min){$('#pmsg',body).textContent='Escolha pelo menos '+st.min+' itens para o seu projeto funcionar.';return;}
        const l=st.budget-tot();
        end(pCommit(pr,i,{sel:sel.slice(),tot:tot()},sel.length>=st.min+1),l>0?'Seu orçamento fechou e ainda sobraram '+brl(l)+'. Será que a sobra pode servir para algo?':'Seu orçamento fechou certinho, sem sobrar nada.');
      };
    };draw();
  }else{
    const isDo=st.k==='do';let txt=old&&old.w||'';
    body.innerHTML=`<h3 id="pq">${esc(st.q)}</h3>${spk()}${isDo?`<label class="fl" for="pw">${esc(st.note)} <small>(se quiser)</small></label>`:`<label class="fl" for="pw">Sua resposta</label>`}
    <textarea id="pw" class="inp" rows="${isDo?3:5}" maxlength="600" placeholder="${esc(st.ph||'Escreva do seu jeito...')}">${esc(txt)}</textarea>
    <p class="hint" id="pmsg" role="status"></p><button class="btn primary" id="pok">${esc(isDo?st.btn:'Guardar')}</button>`;
    bindSpk(st.q);
    $('#pw',body).oninput=e=>{txt=e.target.value;};
    $('#pok',body).onclick=()=>{
      const w=txt.trim();
      if(!isDo&&w.length<3){$('#pmsg',body).textContent='Escreva pelo menos uma frase curta.';return;}
      end(pCommit(pr,i,{w:w},w.length>=40),isDo?'Registro guardado. Observar com calma é como cientistas trabalham.':'Suas palavras já estão no portfólio.'+(w.length>=40?' Você explicou com detalhes!':''));
    };
  }
};

CHAL_PRE.push(qShapes);
function collectWorlds(band,birth){
  const b=band==='auto'?bandFromBirth(birth):band,def=worldsFor(b);
  const arr=ALLW.filter(k=>{const c=document.getElementById('wd-'+k);return c&&c.checked;});
  if(!arr.length||(arr.length===def.length&&arr.every(k=>def.indexOf(k)>=0)))return null;
  return arr;
}
function worldsPanelHTML(d){
  const b=d.band&&d.band!=='auto'?d.band:bandFromBirth(d.birth),sel=Array.isArray(d.worlds)&&d.worlds.length?d.worlds:worldsFor(b);
  return '<details class="panel"><summary><h3>Mundos liberados</h3></summary><p class="hint">O app escolhe os mundos pela idade. Você pode ligar ou desligar qualquer um. Se mudar a idade ou a faixa, a lista volta para o padrão da idade.</p>'
    +ALLW.map(k=>'<label class="chk"><input type="checkbox" id="wd-'+k+'"'+(sel.indexOf(k)>=0?' checked':'')+'><span>'+esc(TILE[k]||('Mundo '+WNAME[k]))+'</span></label>').join('')+'</details>';
}
function bindPform(){
  const pb=()=>{const v=$('#pf-band').value;return v==='auto'?bandFromBirth($('#pf-birth').value):v;};
  const upd=reset=>{
    const b=pb(),y=ageYears($('#pf-birth').value),info=$('#pf-bandinfo');
    if(info)info.textContent='Faixa em uso: '+BAND_NAME[b]+(y!=null?' (idade: '+y+' anos)':'')+'. Mundos: '+worldsFor(b).map(k=>WNAME[k]).join(', ')+'.';
    if(reset)ALLW.forEach(k=>{const c=$('#wd-'+k);if(c)c.checked=worldsFor(b).indexOf(k)>=0;});
  };
  $('#pf-birth').oninput=$('#pf-birth').onchange=()=>upd(true);$('#pf-band').onchange=()=>upd(true);upd(false);
}

ACTS['letras:ordem']=m=>quiz(m,{key:'letras:ordem',module:'letras',make:qOrdemAlfa,back:['menu','letras']});
ACTS['letras:maiusc']=m=>quiz(m,{key:'letras:maiusc',module:'letras',make:qMaiMin,back:['menu','letras']});
ACTS['leitura:rima']=m=>quiz(m,{key:'leitura:rima',module:'leitura',make:qRima,back:['menu','leitura']});
ACTS['leitura:oposto']=m=>quiz(m,{key:'leitura:oposto',module:'leitura',make:qOpostos,back:['menu','leitura']});
ACTS['contas:n5']=m=>quiz(m,{key:'contas:n5',module:'contas',make:()=>qFalta(1).concat(qFalta(2)).slice(0,8),back:['menu','contas']});
ACTS['contas:n6']=m=>quiz(m,{key:'contas:n6',module:'contas',make:qMaior,back:['menu','contas']});
ACTS['contas:n7']=m=>quiz(m,{key:'contas:n7',module:'contas',make:qDobro,back:['menu','contas']});
ACTS['contas:n8']=m=>quiz(m,{key:'contas:n8',module:'contas',make:qVizinho,back:['menu','contas']});
ACTS['contas:n9']=m=>quiz(m,{key:'contas:n9',module:'contas',make:qContar,back:['menu','contas']});
ACTS['mente:intruso']=m=>quiz(m,{key:'mente:intruso',module:'mente',make:qIntruso,back:['menu','mente']});

/* ---- Capi interativa: reações, toque, armário e traçado de letras ---- */
const CAP_PH={happy:['Isso!','Muito bem!','Você é demais!','Mandou bem!','Uhul!','Que esperto!'],try:['Quase! Tente de novo.','Calma, você consegue!','Respire e tente outra vez.'],idle:['Estou aqui com você!','Pense com calma.','Vamos lá!'],
  memo:['Guarde na memória!'],tap:['Oi! Eu sou a Capi!','Vamos aprender juntos?','Você é muito esperto!','Quer um desafio?','Adoro estudar com você!','Capivaras adoram aprender!']};
const CAP_EMO={happy:['🎉','⭐','👏'],try:['💪'],idle:['💬'],memo:['🤔']};
const rnd=a=>a[Math.floor(Math.random()*a.length)];
function capiHTML(){return '<div class="capi" id="capi" data-st="idle">'+mascot('happy','sm')+'<span class="cbub" id="cbub" role="status">'+rnd(CAP_PH.idle)+'</span><span class="cemo" id="cemo" aria-hidden="true">'+rnd(CAP_EMO.idle)+'</span></div>';}
function capiSet(m,st,txt){
  const c=$('#capi',m);if(!c)return;
  c.dataset.st='';void c.offsetWidth;c.dataset.st=st;
  const b=$('#cbub',m),e=$('#cemo',m);if(b)b.textContent=txt||rnd(CAP_PH[st]||CAP_PH.idle);if(e)e.textContent=rnd(CAP_EMO[st]||CAP_EMO.idle);
}
actions.capi=cf=>{
  const box=cf.closest('.hero2,.mcap')||cf.parentNode;
  cf.classList.remove('jump');void cf.offsetWidth;cf.classList.add('jump');
  const old=$('.cbub.float',box);if(old)old.remove();
  const t=rnd(CAP_PH.tap),b=document.createElement('span');b.className='cbub float';b.textContent=t;box.appendChild(b);
  setTimeout(()=>{b.remove();cf.classList.remove('jump');},2600);
  sfx.ok();say({t:t});
};
/* acessórios (desbloqueiam com rodadas completas) */
function roundsAll(){return Object.keys(S.rounds).reduce((a,k)=>a+(S.rounds[k]||0),0);}
function petals(){return [0,72,144,216,288].map(a=>'<circle cx="0" cy="-13" r="9" fill="#ff8fb8" transform="rotate('+a+')"/>').join('');}
const ACC=[
 {id:'oculos',slot:'eyes',n:'Óculos escuros',ico:'😎',need:2,svg:'<ellipse cx="152" cy="148" rx="36" ry="40" fill="#1b1b2f"/><ellipse cx="276" cy="96" rx="28" ry="26" fill="#1b1b2f"/><path d="M194 128Q224 100 242 104" stroke="#1b1b2f" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M104 120Q60 110 40 118" stroke="#1b1b2f" stroke-width="8" fill="none" stroke-linecap="round"/><ellipse cx="135" cy="130" rx="14" ry="9" fill="#fff" opacity=".35" transform="rotate(-25 135 130)"/><ellipse cx="266" cy="84" rx="10" ry="6" fill="#fff" opacity=".35"/>'},
 {id:'gravata',slot:'neck',n:'Gravata-borboleta',ico:'🎀',need:5,svg:'<path d="M214 266L214 304L250 285Z" fill="#E03131"/><path d="M290 266L290 304L254 285Z" fill="#E03131"/><rect x="244" y="272" width="16" height="26" rx="6" fill="#B02525"/><circle cx="228" cy="285" r="3" fill="#fff"/><circle cx="276" cy="285" r="3" fill="#fff"/>'},
 {id:'flor',slot:'ear',n:'Flor na orelha',ico:'🌸',need:9,svg:'<g transform="translate(92 92)">'+petals()+'<circle r="7" fill="#FFD43B"/></g>'},
 {id:'cachecol',slot:'neck',n:'Cachecol',ico:'🧣',need:14,svg:'<path d="M170 258Q250 305 340 258L346 282Q250 335 176 284Z" fill="#E64980"/><path d="M200 272l8-10M240 292l8-10M280 288l8-10M318 270l8-10" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M322 278L346 282L360 350L330 352Z" fill="#D6336C"/><path d="M336 300l14-4M338 322l16-4" stroke="#fff" stroke-width="6" stroke-linecap="round"/>'},
 {id:'capa',slot:'back',n:'Capa de herói',ico:'🦸',need:20,svg:'<path d="M120 252L398 262Q420 350 410 452L8 452Q-4 360 40 300Z" fill="#E03131"/><path d="M398 262Q420 350 410 452" stroke="#B02525" stroke-width="6" fill="none"/>'}];
const accOn=a=>roundsAll()>=a.need;
function accSvg(back){
  const c=(P&&P.cap)||{};
  const s=ACC.filter(a=>(a.slot==='back')===!!back&&c[a.slot]===a.id&&accOn(a)).map(a=>a.svg).join('');
  return s?'<svg class="cacc'+(back?' back':'')+'" viewBox="0 0 411 460" aria-hidden="true">'+s+'</svg>':'';
}
/* traçar letras e números com o dedo */
const TFONT='800 250px "Fredoka","Arial Rounded MT Bold","Trebuchet MS",Arial,sans-serif';
function traceGame(m,kind){
  const myView=view;
  const items=(kind==='letras'?pick(LETTERS,6).map(L=>({ch:S.upper?L[0]:L[0].toLowerCase(),say:'Trace a letra '+L[3]+'.',lab:'Traçar a letra '+L[0]})):pick('0123456789'.split(''),6).map(d=>({ch:d,say:'Trace o número '+d+'.',lab:'Traçar o número '+d})));
  let i=0,earned=0;
  function show(){
    const it=items[i];let tries=0,full=false;const t0=Date.now(),p0=PAUSED_MS;
    m.innerHTML='<section class="play" style="--c:var(--c-'+kind+')">'+playbar(i,items.length)+'<div class="qcard"><p class="prompt">Passe o dedo por cima '+(kind==='letras'?'da letra':'do número')+'. Siga a forma.</p>'
      +'<div class="tracebox"><canvas id="tc" width="320" height="320" aria-label="Área para traçar"></canvas></div>'
      +'<div class="row" style="margin:0"><button class="btn" id="tclr">Limpar</button><button class="btn primary" id="tok">Pronto</button><button class="btn" id="tskip" hidden>Pular</button></div></div>'
      +'<p class="fb" id="fb" role="status" aria-live="polite"></p>'+((S.masc)?capiHTML():'')+'</section>';
    if(tokenOn())$('.playbar',m).insertAdjacentHTML('afterend',tokenBarHTML());
    capiSet(m,'idle','Siga a forma com o dedo!');
    const cv=$('#tc',m),ctx=cv.getContext('2d'),W=320;
    const mk=document.createElement('canvas');mk.width=mk.height=W;const mc=mk.getContext('2d');
    const ink=document.createElement('canvas');ink.width=ink.height=W;const ic=ink.getContext('2d');
    function glyph(c){c.font=TFONT;c.textAlign='center';c.textBaseline='middle';c.fillText(it.ch,W/2,W/2+14);}
    mc.fillStyle='#000';glyph(mc);
    const mask=mc.getImageData(0,0,W,W).data;let gTot=0;for(let k=3;k<mask.length;k+=4)if(mask[k]>128)gTot++;
    cv._mask=mask;
    const col=getComputedStyle(m.firstChild).getPropertyValue('--c').trim()||'#2F78E6';
    ic.lineCap='round';ic.lineJoin='round';ic.lineWidth=30;ic.strokeStyle='#000';
    function draw(){
      ctx.clearRect(0,0,W,W);ctx.fillStyle='rgba(120,140,190,.28)';glyph(ctx);
      ctx.save();ctx.globalAlpha=.9;ctx.drawImage(ink,0,0);ctx.restore();
      ctx.globalCompositeOperation='source-atop';ctx.fillStyle=col;ctx.globalAlpha=.85;ctx.fillRect(0,0,W,W);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    }
    /* o desenho é recolorido só onde a criança passou; o guia é redesenhado por baixo */
    function paint(){
      ctx.clearRect(0,0,W,W);ctx.fillStyle='rgba(120,140,190,.30)';glyph(ctx);
      const tmp=document.createElement('canvas');tmp.width=tmp.height=W;const tc=tmp.getContext('2d');tc.drawImage(ink,0,0);tc.globalCompositeOperation='source-in';tc.fillStyle=col;tc.fillRect(0,0,W,W);
      ctx.globalAlpha=.8;ctx.drawImage(tmp,0,0);ctx.globalAlpha=1;
    }
    let down=false,last=null;
    const pt=e=>{const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*W/r.height};};
    cv.addEventListener('pointerdown',e=>{e.preventDefault();down=true;last=pt(e);try{cv.setPointerCapture(e.pointerId);}catch(x){}ic.beginPath();ic.moveTo(last.x,last.y);ic.lineTo(last.x+.1,last.y+.1);ic.stroke();paint();});
    cv.addEventListener('pointermove',e=>{if(!down)return;e.preventDefault();const p=pt(e);ic.beginPath();ic.moveTo(last.x,last.y);ic.lineTo(p.x,p.y);ic.stroke();last=p;paint();});
    const up=()=>{down=false;};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);cv.addEventListener('pointerleave',up);
    paint();
    $('#qb',m).onclick=()=>backTo('menu',kind);
    $('#tclr',m).onclick=()=>{ic.clearRect(0,0,W,W);paint();sfx.tap();};
    const next=()=>{if(view!==myView)return;i++;if(i>=items.length)result(m,{module:kind,key:kind+':tracar',earned:earned,total:items.length,again:()=>traceGame(m,kind),back:['menu',kind]});else show();};
    $('#tskip',m).onclick=()=>{sfx.tap();logEntry({mod:kind,act:kind+':tracar',dom:kind==='letras'?'letra':'calc',lab:it.lab,ans:it.ch,ok1:false,tries:tries,ms:Date.now()-t0-(PAUSED_MS-p0),listens:0,err:['pulou'],cov:null});next();};
    $('#tok',m).onclick=()=>{
      const d=ic.getImageData(0,0,W,W).data;let inG=0,tot=0;
      for(let k=3,px=0;k<d.length;k+=4,px++){if(d[k]>40){tot++;if(mask[k]>128)inG++;}}
      const cov=gTot?inG/gTot:0,prec=tot?inG/tot:0,ok=tot>40&&cov>=0.5&&prec>=0.55;
      tries++;const fb=$('#fb',m);
      if(ok){
        const first=tries===1;if(first){earned++;addStars(1);if(tokenOn()){full=tokenAdd();refreshTokens(m);}}
        sfx.ok();if(first&&S.reinf==='stars')confetti();
        fb.textContent=first?praise():'Isso! Agora ficou bom.';fb.className='fb good';capiSet(m,'happy');say({t:fb.textContent});
        logEntry({mod:kind,act:kind+':tracar',dom:kind==='letras'?'letra':'calc',lab:it.lab,ans:it.ch,ok1:first,tries:tries,ms:Date.now()-t0-(PAUSED_MS-p0),listens:0,err:[],cov:Math.round(cov*100)});
        $('#tok',m).disabled=true;$('#tclr',m).disabled=true;
        if(full)setTimeout(()=>{if(view===myView)showReward();},900);
        setTimeout(()=>{if(PAUSED){const w=setInterval(()=>{if(!PAUSED){clearInterval(w);next();}},300);}else next();},1800);
      }else{
        sfx.bad();fb.textContent=tot<=40?'Passe o dedo por cima da forma.':(prec<0.55?'Tente ficar por cima da forma.':'Quase! Cubra mais um pouquinho.');fb.className='fb try';capiSet(m,'try');say({t:fb.textContent});
        if(tries>=2)$('#tskip',m).hidden=false;
      }
    };
    setTimeout(()=>{if(view===myView)say({t:it.say});},300);
  }
  show();
}
MODS.letras.acts.push({id:'tracar',t:'Traçar letras',d:'Cubra a letra com o dedo',g:'✍️'});
MODS.contas.acts.push({id:'tracar',t:'Traçar números',d:'Cubra o número com o dedo',g:'✍️'});
ACTS['letras:tracar']=m=>traceGame(m,'letras');
ACTS['contas:tracar']=m=>traceGame(m,'contas');
/* armário da Capi */
screens.armario=m=>{
  const c=P.cap||(P.cap={eyes:'',neck:'',ear:'',back:''}),tot=roundsAll();
  m.innerHTML=backBtn('home')+'<h2 class="mtitle" style="--c:var(--c-puzzle)">Armário da Capi</h2><p class="msub">Complete rodadas para ganhar acessórios. Toque para a Capi vestir ou tirar.</p>'
   +'<div class="armprev" id="armprev">'+mascot('happy','big')+'</div><p class="msub" style="text-align:center">'+tot+' '+(tot===1?'rodada completa':'rodadas completas')+'</p>'
   +'<div class="armlist">'+ACC.map(a=>{const on=accOn(a),worn=c[a.slot]===a.id;
     return '<button class="armitem'+(worn?' worn':'')+(on?'':' lock')+'" data-act="arm" data-id="'+a.id+'"'+(on?'':' disabled')+' aria-pressed="'+worn+'"><span class="ai" aria-hidden="true">'+(on?a.ico:'🔒')+'</span><b>'+a.n+'</b><small>'+(on?(worn?'Vestido':'Vestir'):'Faltam '+(a.need-tot)+' rodadas')+'</small></button>';}).join('')+'</div>';
};
actions.arm=b=>{
  const a=ACC.find(x=>x.id===b.dataset.id);if(!a||!accOn(a))return;
  const c=P.cap||(P.cap={eyes:'',neck:'',ear:'',back:''});c[a.slot]=c[a.slot]===a.id?'':a.id;save();sfx.ok();
  screens.armario($('#main'));
};

/* --- letras --- */
ACTS['letras:explorar']=m=>{
  let sel=0;
  m.innerHTML=`${backBtn('menu','letras')}<h2 class="mtitle" style="--c:var(--c-letras)">Conhecer as letras</h2><p class="msub">Toque em uma letra para ver a figura e ouvir como se fala.</p>
  <div class="letterdetail" id="ld"></div>
  <div class="lgrid">${LETTERS.map((L,k)=>`<button class="lbtn" data-k="${k}" aria-label="Letra ${L[0]}">${L[0]}<small>${L[0].toLowerCase()}</small></button>`).join('')}</div>`;
  function paint(speak){
    const L=LETTERS[sel];
    $('#ld',m).innerHTML=`<div class="ldbig">${L[0]}<small>${L[0].toLowerCase()}</small></div><span class="emo xl">${L[2]}</span>
    <div style="display:grid;gap:10px;justify-items:start"><div class="ldtext"><b>${L[0]}</b> de <span class="w">${L[1]}</span></div>
    <button class="listen" id="ldl">${ICON.speaker}<span>Ouvir</span></button></div>`;
    $$('.lbtn',m).forEach((b,k)=>b.classList.toggle('on',k===sel));
    const talk=()=>say([{t:L[3]},{t:L[0]+' de '+L[1]}]);
    $('#ldl',m).onclick=talk;
    if(speak)talk();
  }
  $$('.lbtn',m).forEach(b=>b.onclick=()=>{sel=+b.dataset.k;sfx.tap();paint(true);});
  paint(false);
};
ACTS['letras:silabas']=m=>syllables(m);
ACTS['letras:inicial']=m=>quiz(m,{key:'letras:inicial',module:'letras',make:qLetraInicial,back:['menu','letras']});
ACTS['letras:achar']=m=>quiz(m,{key:'letras:achar',module:'letras',make:qLetraNome,back:['menu','letras']});
ACTS['letras:silfalta']=m=>quiz(m,{key:'letras:silfalta',module:'letras',make:qSilabaFalta,back:['menu','letras']});
ACTS['mente:diferente']=m=>quiz(m,{key:'mente:diferente',module:'mente',make:qAtencao,back:['menu','mente']});
ACTS['mente:memoria']=m=>quiz(m,{key:'mente:memoria',module:'mente',make:qMemoria,back:['menu','mente']});
ACTS['mente:padrao']=m=>quiz(m,{key:'mente:padrao',module:'mente',make:qPadroes,back:['menu','mente']});

function syllables(m){
  const myView=view;const words=pick(sylPool(),6);let i=0,earned=0;
  function show(){
    const w=words[i];let filled=0,mistakes=false,locked=false;
    const word=w.s.join('').toLowerCase();
    const extra=pick(SYLPOOL.filter(x=>w.s.indexOf(x)<0),1);
    const tiles=shuffle(w.s.concat(extra)).map(t=>({t:t,used:false}));
    m.innerHTML=`<section class="play" style="--c:var(--c-letras)">${playbar(i,words.length)}
    <div class="qcard"><div class="stem"><span class="emo xl">${w.e}</span></div><p class="prompt">Toque nas sílabas na ordem certa.</p>
    <div class="slots">${w.s.map(()=>'<span class="slot w"></span>').join('')}</div>
    <button class="listen" id="ql">${ICON.speaker}<span>Ouvir</span></button></div>
    <div class="sylrow">${tiles.map((t,k)=>`<button class="syl w" data-k="${k}">${t.t}</button>`).join('')}</div>
    <p class="fb" id="fb" role="status" aria-live="polite"></p></section>`;
    $('#qb',m).onclick=()=>backTo('menu','letras');
    $('#ql',m).onclick=()=>say({t:word});
    const fb=$('#fb',m);
    $$('.syl',m).forEach(b=>b.onclick=()=>{
      if(locked)return;
      const t=tiles[+b.dataset.k];if(t.used)return;
      if(t.t===w.s[filled]){
        t.used=true;b.disabled=true;b.classList.add('used');
        const sl=$$('.slot',m)[filled];sl.textContent=t.t;sl.classList.add('on');
        filled++;sfx.tap();
        if(filled===w.s.length){
          locked=true;sfx.ok();
          let msg=praise();
          if(!mistakes){earned++;addStars(1);}else msg='Isso! Palavra completa.';
          fb.textContent=msg;fb.className='fb good';
          say([{t:word},{t:msg}]);
          setTimeout(()=>{if(view!==myView)return;i++;if(i<words.length)show();else result(m,{module:'letras',key:'letras:silabas',earned:earned,total:words.length,again:()=>syllables(m),back:['menu','letras']});},2200);
        }
      }else{
        mistakes=true;sfx.bad();
        b.classList.remove('wrong');void b.offsetWidth;b.classList.add('wrong');
        b.addEventListener('animationend',()=>b.classList.remove('wrong'),{once:true});
        fb.textContent='Essa não é a próxima. Tente outra!';fb.className='fb try';
      }
    });
    setTimeout(()=>{if(view===myView)say({t:word});},300);
  }
  show();
}

/* --- leitura --- */
ACTS['leitura:palavra']=m=>quiz(m,{key:'leitura:palavra',module:'leitura',make:qPalavraFigura,back:['menu','leitura']});
ACTS['leitura:frase']=m=>quiz(m,{key:'leitura:frase',module:'leitura',make:qFrase,back:['menu','leitura']});
ACTS['leitura:historias']=m=>{
  m.innerHTML=`${backBtn('menu','leitura')}<h2 class="mtitle" style="--c:var(--c-leitura)">Histórias</h2><p class="msub">Escolha uma história. Toque nas frases para ouvir ou peça para ler tudo.</p>
  <div class="acts" style="--c:var(--c-leitura)">${STORIES.map((s,i)=>`<button class="act" data-go="act"${dataArg({m:'leitura',id:'historia',i:i})}><span class="glyph sm">${i+1}</span><span><b>${esc(s.t)}</b><small>${s.s.length} frases · ${s.q.length} perguntas</small></span></button>`).join('')}</div>`;
};
ACTS['leitura:historia']=(m,arg)=>{
  const i=arg.i,st=STORIES[i];
  m.innerHTML=`${backBtn('act',{m:'leitura',id:'historias'})}<h2 class="mtitle" style="--c:var(--c-leitura)">${esc(st.t)}</h2>
  <div class="story">${st.s.map((s,k)=>`<button class="sent" data-k="${k}">${esc(s)}</button>`).join('')}</div>
  <div class="row" style="--c:var(--c-leitura)"><button class="btn primary" id="sAll">${ICON.speaker}<span>Ouvir a história</span></button><button class="btn" id="sQ">Responder as perguntas</button></div>`;
  const sents=$$('.sent',m);
  const mark=k=>sents.forEach((b,j)=>b.classList.toggle('on',j===k));
  sents.forEach((b,k)=>b.onclick=()=>{mark(k);say({t:st.s[k]},()=>mark(-1));});
  $('#sAll',m).onclick=()=>{say(st.s.map(t=>({t:t})),()=>mark(-1),mark);};
  $('#sQ',m).onclick=()=>{sfx.tap();quiz(m,{key:'leitura:hist'+i,module:'leitura',make:()=>storyQs(i),back:['act',{m:'leitura',id:'historia',i:i}]});};
};

/* --- contas --- */
[1,2,3,4].forEach(n=>{ACTS['contas:n'+n]=m=>quiz(m,{key:'contas:n'+n,module:'contas',make:()=>mathQs(n),back:['menu','contas']});});

/* --- quebra-cabeça --- */
const SCENES=[
{n:'Dia na praia',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="#8fd3ff"/><rect width="300" height="130" fill="#c4ebff"/><circle cx="238" cy="62" r="34" fill="#ffd43b"/><ellipse cx="68" cy="60" rx="40" ry="16" fill="#ffffff"/><ellipse cx="96" cy="48" rx="28" ry="14" fill="#ffffff"/><rect y="130" width="300" height="85" fill="#2f8fe0"/><path d="M0 152 q25 -12 50 0 t50 0 t50 0 t50 0 t50 0 t50 0" fill="none" stroke="#b9e1ff" stroke-width="5"/><path d="M0 186 q25 -12 50 0 t50 0 t50 0 t50 0 t50 0 t50 0" fill="none" stroke="#7bbcf0" stroke-width="5"/><path d="M0 208 Q150 186 300 208 V300 H0 Z" fill="#f6d28b"/><rect x="63" y="168" width="6" height="92" fill="#7a4b21"/><path d="M18 178 Q66 112 114 178 Z" fill="#e8403a"/><path d="M66 134 L42 178 H90 Z" fill="#ffffff"/><path d="M186 252 h82 l-12 24 h-58 z" fill="#d9480f"/><rect x="224" y="196" width="5" height="56" fill="#7a4b21"/><path d="M229 200 L264 248 H229 Z" fill="#ffffff"/><circle cx="140" cy="270" r="11" fill="#ff6b6b"/><circle cx="118" cy="282" r="6" fill="#ffa8a8"/></svg>'},
{n:'Fazenda feliz',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="#a5d8ff"/><circle cx="58" cy="56" r="28" fill="#ffe066"/><ellipse cx="190" cy="48" rx="38" ry="14" fill="#ffffff"/><ellipse cx="214" cy="38" rx="24" ry="12" fill="#ffffff"/><path d="M0 190 Q90 126 170 172 T300 158 V300 H0 Z" fill="#69db7c"/><path d="M0 238 Q120 196 300 230 V300 H0 Z" fill="#40c057"/><rect x="176" y="132" width="92" height="82" fill="#e03131"/><path d="M164 138 L222 92 L280 138 Z" fill="#a61e1e"/><rect x="204" y="166" width="36" height="48" fill="#ffffff"/><path d="M204 166 L240 214 M240 166 L204 214" stroke="#e03131" stroke-width="3" fill="none"/><rect x="38" y="166" width="14" height="62" fill="#7a4b21"/><circle cx="45" cy="148" r="34" fill="#2f9e44"/><circle cx="30" cy="160" r="20" fill="#37b24d"/><rect x="20" y="246" width="260" height="8" fill="#ffffff"/><rect x="20" y="268" width="260" height="8" fill="#ffffff"/><rect x="40" y="238" width="8" height="46" fill="#ffffff"/><rect x="120" y="238" width="8" height="46" fill="#ffffff"/><rect x="200" y="238" width="8" height="46" fill="#ffffff"/><circle cx="104" cy="214" r="6" fill="#ff8787"/><circle cx="140" cy="222" r="6" fill="#ffd43b"/></svg>'},
{n:'Viagem ao espaço',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="#0b1033"/><circle cx="30" cy="30" r="2.5" fill="#ffffff"/><circle cx="96" cy="60" r="2" fill="#ffffff"/><circle cx="150" cy="22" r="3" fill="#ffffff"/><circle cx="268" cy="30" r="2" fill="#ffffff"/><circle cx="40" cy="120" r="2" fill="#ffffff"/><circle cx="262" cy="170" r="2.5" fill="#ffffff"/><circle cx="20" cy="190" r="2" fill="#ffffff"/><circle cx="110" cy="266" r="2" fill="#ffffff"/><circle cx="200" cy="270" r="3" fill="#ffffff"/><circle cx="230" cy="90" r="40" fill="#ff922b"/><ellipse cx="230" cy="90" rx="62" ry="12" fill="none" stroke="#ffd8a8" stroke-width="6"/><circle cx="62" cy="234" r="42" fill="#dee2e6"/><circle cx="48" cy="222" r="9" fill="#adb5bd"/><circle cx="76" cy="248" r="12" fill="#adb5bd"/><circle cx="72" cy="214" r="5" fill="#adb5bd"/><path d="M150 84 Q182 128 174 192 H126 Q118 128 150 84 Z" fill="#f1f3f5"/><circle cx="150" cy="138" r="13" fill="#4dabf7"/><path d="M126 168 L100 208 L126 196 Z" fill="#e03131"/><path d="M174 168 L200 208 L174 196 Z" fill="#e03131"/><path d="M136 194 Q150 252 164 194 Z" fill="#ffa94d"/></svg>'}
];
SCENES.push(
{n:'Floresta encantada',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="#c5f0ff"/><circle cx="240" cy="54" r="30" fill="#ffe066"/><path d="M0 170 Q80 110 160 160 T300 140 V300 H0Z" fill="#8ce99a"/><path d="M0 230 Q150 180 300 225 V300 H0Z" fill="#51cf66"/><rect x="40" y="150" width="16" height="80" fill="#8d5524"/><path d="M48 70 L88 160 H8Z" fill="#2f9e44"/><path d="M48 100 L96 190 H0Z" fill="#37b24d"/><rect x="236" y="160" width="16" height="70" fill="#8d5524"/><circle cx="244" cy="140" r="40" fill="#2b8a3e"/><circle cx="224" cy="156" r="24" fill="#40c057"/><path d="M110 250 q0 -36 36 -36 q36 0 36 36z" fill="#e03131"/><rect x="136" y="250" width="20" height="24" fill="#fff3bf"/><circle cx="130" cy="236" r="5" fill="#fff"/><circle cx="160" cy="232" r="4" fill="#fff"/><ellipse cx="80" cy="268" rx="22" ry="12" fill="#ffa8a8"/></svg>'},
{n:'Cidade colorida',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="#a5d8ff"/><circle cx="50" cy="50" r="26" fill="#ffd43b"/><ellipse cx="200" cy="44" rx="36" ry="12" fill="#fff"/><rect x="20" y="120" width="70" height="140" fill="#f783ac"/><rect x="100" y="80" width="60" height="180" fill="#74c0fc"/><rect x="170" y="140" width="50" height="120" fill="#ffd43b"/><rect x="230" y="100" width="55" height="160" fill="#b197fc"/><g fill="#fff"><rect x="32" y="138" width="14" height="14"/><rect x="62" y="138" width="14" height="14"/><rect x="32" y="170" width="14" height="14"/><rect x="62" y="170" width="14" height="14"/><rect x="112" y="100" width="14" height="14"/><rect x="136" y="100" width="14" height="14"/><rect x="112" y="132" width="14" height="14"/><rect x="136" y="132" width="14" height="14"/><rect x="242" y="118" width="14" height="14"/><rect x="264" y="118" width="14" height="14"/><rect x="242" y="150" width="14" height="14"/></g><rect y="250" width="300" height="50" fill="#495057"/><rect x="20" y="272" width="40" height="6" fill="#fff"/><rect x="120" y="272" width="40" height="6" fill="#fff"/><rect x="220" y="272" width="40" height="6" fill="#fff"/><path d="M60 262 h54 l-6 -14 h-42z" fill="#ff6b6b"/><circle cx="74" cy="266" r="6" fill="#212529"/><circle cx="100" cy="266" r="6" fill="#212529"/></svg>'},
{n:'Fundo do mar',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="#4dabf7"/><rect y="150" width="300" height="150" fill="#1c7ed6"/><path d="M0 270 Q150 240 300 270 V300 H0Z" fill="#ffe8a3"/><ellipse cx="90" cy="110" rx="34" ry="20" fill="#ff922b"/><path d="M120 110 L146 92 V128Z" fill="#ff922b"/><circle cx="74" cy="104" r="4" fill="#212529"/><ellipse cx="210" cy="170" rx="26" ry="15" fill="#ffd43b"/><path d="M234 170 L254 156 V184Z" fill="#ffd43b"/><circle cx="198" cy="166" r="3" fill="#212529"/><path d="M40 270 q-10 -50 6 -70 q4 30 12 70z" fill="#51cf66"/><path d="M250 270 q10 -60 -6 -80 q-6 40 -12 80z" fill="#40c057"/><circle cx="160" cy="226" r="26" fill="#f783ac"/><path d="M160 226 m-20 6 q20 22 40 0" fill="none" stroke="#fff" stroke-width="4"/><circle cx="130" cy="60" r="6" fill="#d0ebff"/><circle cx="146" cy="44" r="4" fill="#d0ebff"/><circle cx="60" cy="150" r="5" fill="#d0ebff"/><path d="M270 262 l-8 -22 l16 0z" fill="#ff6b6b"/></svg>'});
const SKIN_SCENES={
algodao:{n:'Reino de algodão-doce',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="#ffd6ea"/><rect width="300" height="170" fill="#ffe3f0"/><ellipse cx="58" cy="62" rx="40" ry="15" fill="#ffffff"/><ellipse cx="84" cy="52" rx="26" ry="13" fill="#ffffff"/><ellipse cx="244" cy="44" rx="36" ry="14" fill="#ffffff"/><path d="M20 200 A130 130 0 0 1 280 200" fill="none" stroke="#e64980" stroke-width="10"/><path d="M30 200 A120 120 0 0 1 270 200" fill="none" stroke="#f06595" stroke-width="10"/><path d="M40 200 A110 110 0 0 1 260 200" fill="none" stroke="#f783ac" stroke-width="10"/><path d="M50 200 A100 100 0 0 1 250 200" fill="none" stroke="#fcc2d7" stroke-width="10"/><rect x="104" y="140" width="92" height="84" fill="#f783ac"/><rect x="88" y="116" width="32" height="108" fill="#faa2c1"/><rect x="180" y="116" width="32" height="108" fill="#faa2c1"/><path d="M82 116 L104 72 L126 116 Z" fill="#be4bdb"/><path d="M174 116 L196 72 L218 116 Z" fill="#be4bdb"/><path d="M132 224 V198 a18 18 0 0 1 36 0 V224 Z" fill="#ffffff"/><rect x="103" y="62" width="3" height="14" fill="#7a4b21"/><path d="M106 62 L120 67 L106 72 Z" fill="#ff6b6b"/><circle cx="104" cy="150" r="7" fill="#fff0f6"/><circle cx="196" cy="150" r="7" fill="#fff0f6"/><path d="M0 224 Q150 204 300 224 V300 H0 Z" fill="#fcc2d7"/><rect x="30" y="238" width="5" height="52" fill="#ffffff"/><circle cx="32" cy="230" r="17" fill="#ff8787"/><circle cx="32" cy="230" r="8" fill="#ffffff"/><rect x="260" y="244" width="5" height="46" fill="#ffffff"/><circle cx="262" cy="236" r="16" fill="#e64980"/><circle cx="262" cy="236" r="7" fill="#ffffff"/><circle cx="150" cy="262" r="6" fill="#ffd43b"/><circle cx="214" cy="274" r="5" fill="#ffffff"/></svg>'},
aventura:{n:'Terra dos dinossauros',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="#ffe8cc"/><rect width="300" height="120" fill="#a5d8ff"/><circle cx="52" cy="54" r="28" fill="#ffd43b"/><ellipse cx="170" cy="40" rx="38" ry="13" fill="#ffffff"/><path d="M170 232 L212 126 H244 L290 232 Z" fill="#7a4b21"/><path d="M212 126 L218 104 L226 124 L234 102 L244 126 Z" fill="#ff6b6b"/><circle cx="230" cy="86" r="12" fill="#ced4da"/><circle cx="244" cy="68" r="16" fill="#adb5bd"/><path d="M0 226 Q150 206 300 230 V300 H0 Z" fill="#69b34c"/><path d="M0 262 Q150 244 300 266 V300 H0 Z" fill="#4c9a32"/><path d="M46 214 Q10 216 8 250" fill="none" stroke="#51cf66" stroke-width="16" stroke-linecap="round"/><ellipse cx="96" cy="214" rx="56" ry="32" fill="#51cf66"/><rect x="62" y="232" width="17" height="38" fill="#37b24d"/><rect x="108" y="232" width="17" height="38" fill="#37b24d"/><path d="M128 200 Q152 152 138 110" fill="none" stroke="#51cf66" stroke-width="22" stroke-linecap="round"/><ellipse cx="140" cy="104" rx="19" ry="12" fill="#51cf66"/><circle cx="146" cy="100" r="3" fill="#212529"/><circle cx="80" cy="206" r="8" fill="#94d82d"/><circle cx="106" cy="220" r="6" fill="#94d82d"/><ellipse cx="204" cy="272" rx="14" ry="18" fill="#fff3bf"/><circle cx="200" cy="268" r="3" fill="#f59f00"/><circle cx="208" cy="278" r="3" fill="#f59f00"/></svg>'}
};
const scenes=()=>[SKIN_SCENES[S.skin==='algodao'?'algodao':'aventura']].concat(SCENES);
let sceneIdx=0;
function puzzle(m,cols,rows,key,opt){
  opt=opt||{};
  const myView=view;
  const list=scenes();
  const sc=opt.scene||list[sceneIdx%list.length];
  const uri='data:image/svg+xml;utf8,'+encodeURIComponent(sc.svg);
  const n=cols*rows;
  let order;do{order=shuffle(Array.from({length:n},(_,i)=>i));}while(order.every((v,i)=>v===i));
  let sel=-1,moves=0,done=false;
  const tStart=Date.now(),p0=PAUSED_MS;
  const minSw=(()=>{const seen=new Array(n).fill(false);let cyc=0;for(let s=0;s<n;s++){if(!seen[s]){cyc++;let x=s;while(!seen[x]){seen[x]=true;x=order[x];}}}return n-cyc;})();
  m.innerHTML=`${opt.assess?backBtn('aval'):backBtn('menu','puzzle')}<h2 class="mtitle" style="--c:var(--c-puzzle)">${esc(sc.n)}</h2>
  <p class="msub">Toque em duas peças para trocar de lugar. Peça no lugar certo ganha borda verde.</p>
  <div class="pz"><div class="board" id="board"></div><div class="pzside"><div class="thumb" id="thumb" role="img" aria-label="Imagem de referência"></div><p class="mv" id="mv">Trocas: 0</p><p class="sr" id="pzLive" role="status" aria-live="polite"></p></div></div><div id="pzEnd"></div>`;
  $('#thumb',m).style.backgroundImage='url("'+uri+'")';
  const board=$('#board',m);
  board.style.gridTemplateColumns='repeat('+cols+',1fr)';
  board.style.gridTemplateRows='repeat('+rows+',1fr)';
  const btns=[];
  for(let p=0;p<n;p++){
    const b=document.createElement('button');
    b.type='button';b.className='ptile';b.setAttribute('aria-label','Peça '+(p+1));
    b.style.backgroundImage='url("'+uri+'")';
    b.style.backgroundSize=(cols*100)+'% '+(rows*100)+'%';
    b.onclick=()=>tap(p);
    board.appendChild(b);btns.push(b);
  }
  function paint(){
    btns.forEach((b,p)=>{
      const id=order[p],x=id%cols,y=Math.floor(id/cols);
      b.style.backgroundPosition=(cols>1?x/(cols-1)*100:0)+'% '+(rows>1?y/(rows-1)*100:0)+'%';
      b.classList.toggle('sel',p===sel);
      b.classList.toggle('fit',id===p);
      b.setAttribute('aria-pressed',p===sel?'true':'false');
      b.setAttribute('aria-label','Peça '+(id+1)+', posição '+(p+1)+(id===p?', no lugar certo':', fora do lugar')+(p===sel?', selecionada':''));
    });
  }
  function tap(p){
    if(done)return;
    sfx.tap();
    if(sel<0){sel=p;}
    else if(sel===p){sel=-1;}
    else{const t=order[sel];order[sel]=order[p];order[p]=t;sel=-1;moves++;$('#mv',m).textContent='Trocas: '+moves;}
    paint();
    {const L=$('#pzLive',m);if(L){const ok=order.filter((v,i)=>v===i).length;L.textContent=sel>=0?'Peça '+(order[sel]+1)+' selecionada. Escolha outra peça para trocar.':'Trocas: '+moves+'. '+ok+' de '+n+' peças no lugar.';}}
    if(order.every((v,i)=>v===i))win();
  }
  function win(){
    done=true;board.classList.add('solved');
    sfx.win();if(!opt.assess&&S.reinf==='stars')confetti();
    logEntry({mod:'puzzle',act:key,dom:'viso',lab:'Quebra-cabeça de '+n+' peças',ans:'',ok1:null,tries:1,ms:Date.now()-tStart-(PAUSED_MS-p0),listens:0,err:[],pieces:n,moves:moves,minMoves:minSw},opt.assess&&SESS?SESS.id:null);
    if(opt.assess){
      $('#pzEnd',m).innerHTML='<div class="endcard"><div class="row"><button class="btn primary" id="pzCont">Continuar</button></div></div>';
      $('#pzCont',m).onclick=()=>{sfx.tap();opt.onDone();};
      return;
    }
    const st=n>=9?5:n>=6?3:2;
    addStars(st);S.rounds[key]=(S.rounds[key]||0)+1;markToday('puzzle');save();
    const stk=giveSticker();
    const tkFull=tokenOn()&&(tokenAdd(),P.tokens.n>=S.goalTokens);
    say({t:'Parabéns! Você montou o quebra-cabeça!'});
    if(tkFull)setTimeout(showReward,1200);
    $('#pzEnd',m).innerHTML=`<div class="endcard" style="--c:var(--c-puzzle)"><b>Muito bem!${S.reinf==='stars'?' +'+st+' estrelas':''}${stk?' Figurinha nova: '+stk:''}</b><div class="row"><button class="btn primary" id="pzNext">Outro quebra-cabeça</button><button class="btn" id="pzMenu">Voltar ao menu</button></div></div>`;
    $('#pzNext',m).onclick=()=>{sfx.tap();sceneIdx++;if(view===myView)puzzle(m,cols,rows,key);};
    $('#pzMenu',m).onclick=()=>{sfx.tap();backTo('menu','puzzle');};
  }
  paint();
}
ACTS['puzzle:p1']=m=>puzzle(m,2,2,'puzzle:p1');
ACTS['puzzle:p2']=m=>puzzle(m,2,3,'puzzle:p2');
ACTS['puzzle:p3']=m=>puzzle(m,3,3,'puzzle:p3');

/* --- inglês --- */
function topicScreen(m,tk){
  const T=EN[tk];
  m.innerHTML=`${backBtn('menu','ingles')}<h2 class="mtitle" style="--c:var(--c-ingles)">${esc(T.title)}</h2>
  <p class="msub">Toque em um cartão para ouvir em inglês e em português. Repita em voz alta!</p>
  <div class="row" style="--c:var(--c-ingles)"><button class="btn primary" id="play">Jogar</button><button class="btn" id="all">${ICON.speaker}<span>Ouvir todos</span></button></div>
  <div class="cards">${T.items.map((it,k)=>`<button class="ecard" data-k="${k}">${enVisual(it)}<b>${esc(it.en)}</b><small>${esc(it.pt)}</small></button>`).join('')}</div>`;
  const cards=$$('.ecard',m);
  const mark=k=>cards.forEach((c,j)=>c.classList.toggle('on',j===k));
  cards.forEach((c,k)=>c.onclick=()=>{const it=T.items[k];mark(k);say([{t:it.en,lang:'en-US',rate:S.rate*0.9},{t:it.pt,lang:'pt-BR'}],()=>mark(-1));});
  $('#all',m).onclick=()=>{
    const parts=[];T.items.forEach(it=>{parts.push({t:it.en,lang:'en-US',rate:S.rate*0.9});parts.push({t:it.pt,lang:'pt-BR'});});
    say(parts,()=>mark(-1),i=>mark(Math.floor(i/2)));
  };
  $('#play',m).onclick=()=>{sfx.tap();quiz(m,{key:'ingles:'+tk,module:'ingles',make:()=>qIngles(T.items),back:['act',{m:'ingles',id:tk}]});};
}
Object.keys(EN).forEach(tk=>{ACTS['ingles:'+tk]=m=>topicScreen(m,tk);});
ACTS['ingles:mix']=m=>{
  const all=Object.keys(EN).reduce((a,k)=>a.concat(EN[k].items),[]);
  quiz(m,{key:'ingles:mix',module:'ingles',make:()=>qIngles(all),back:['menu','ingles']});
};

/* ========== alunos ========== */
const turmas=()=>Array.from(new Set(S.profiles.map(p=>(p.klass||'').trim()).filter(Boolean))).sort((x,y)=>x.localeCompare(y,'pt-BR'));
let WHOK='';
screens.who=m=>{
  const ts=turmas();if(ts.indexOf(WHOK)<0)WHOK='';
  const list=WHOK?S.profiles.filter(p=>p.klass===WHOK):S.profiles;
  m.innerHTML=`${updBarHTML()}<section class="hero2"><div>${mascot('cheer')}</div><div class="bubble"><h1>Quem vai estudar?</h1><p>${list.length?'Toque no seu nome.':'Cadastre o primeiro aluno para começar.'}</p></div></section>
  ${ts.length>1?`<div class="row" role="group" aria-label="Filtrar por turma"><button class="chip" data-act="whok" data-v="" aria-pressed="${WHOK===''}">Todas as turmas</button>${ts.map(t=>`<button class="chip" data-act="whok" data-v="${esc(t)}" aria-pressed="${WHOK===t}">${esc(t)}</button>`).join('')}</div>`:''}
  <div class="skins">${list.map(p=>`<button class="pcard" data-act="pick" data-id="${esc(p.id)}" style="--pc:${p.skin==='algodao'?'#F06595':p.skin==='mundo'?'#2F9BF0':'#3E7BD6'}"><span class="pav" aria-hidden="true">${p.skin==='algodao'?'🎀':p.skin==='mundo'?'🦫':'🦖'}</span><b>${esc(p.name)}</b><small>${p.klass?esc(p.klass)+' · ':''}${p.stars} ${p.stars===1?'estrela':'estrelas'}</small></button>`).join('')}
  <button class="pcard add" data-go="pform"><span class="pav" aria-hidden="true">+</span><b>Novo aluno</b><small>Cadastrar</small></button></div>
  <div class="row">${S.pin?'':'<label class="chip" for="bkFile" style="cursor:pointer">Restaurar cópia de segurança</label><input type="file" id="bkFile" accept=".json,application/json" hidden>'}<button class="chip" data-go="privacy" data-arg='{"from":"who"}'>Privacidade e termos de uso</button></div><p id="bkMsg" role="status" aria-live="polite"></p><div id="bkPlan"></div>`;
};
actions.whok=b=>{WHOK=b.dataset.v;render();};
actions.pick=b=>{setProfile(b.dataset.id);go('home',undefined,{replace:true});};

screens.pform=(m,arg)=>{
  const ed=arg&&arg.id?S.profiles.find(p=>p.id===arg.id):null;
  const d=ed||{name:'',birth:'',grade:'',notes:'',skin:'mundo',band:'auto',an:{}};
  const an=d.an||{};
  const grades=['','Educação infantil','1º ano','2º ano','3º ano','4º ano','5º ano','6º ano','7º ano','Outro / EJA / não seriado'];
  m.innerHTML=`${backBtn(ed?'parents':'who')}<h2 class="mtitle" style="--c:var(--c-letras)">${ed?'Editar aluno':'Novo aluno'}</h2>
  <div id="pform" data-skin="${d.skin}" data-id="${ed?esc(ed.id):''}">
  <div class="panel">
    <label class="fl" for="pf-name">Nome ou apelido</label>
    <input id="pf-name" class="inp" maxlength="40" value="${esc(d.name)}" autocomplete="off">
    <p class="hint">Use só o primeiro nome ou um apelido. Não coloque sobrenome, CPF, endereço nem telefone.</p>
    <p class="warn" id="pf-err" hidden>Escreva um nome ou apelido para continuar.</p>
    <label class="fl" for="pf-birth">Data de nascimento (opcional)</label>
    <input id="pf-birth" class="inp" type="date" value="${esc(d.birth)}">
    <label class="fl" for="pf-grade">Ano escolar (opcional)</label>
    <select id="pf-grade" class="inp">${grades.map(g=>`<option value="${esc(g)}"${g===d.grade?' selected':''}>${g||'Não informar'}</option>`).join('')}</select>
    <label class="fl" for="pf-klass">Turma (opcional)</label>
    <input id="pf-klass" class="inp" maxlength="30" list="pf-klist" value="${esc(d.klass||'')}" autocomplete="off" placeholder="Ex.: 3º A manhã">
    <datalist id="pf-klist">${turmas().map(t=>`<option value="${esc(t)}">`).join('')}</datalist>
    <label class="fl" for="pf-band">Faixa do conteúdo</label>
    <select id="pf-band" class="inp"><option value="auto"${d.band==='auto'?' selected':''}>Automática pela idade</option><option value="pre"${d.band==='pre'?' selected':''}>4 a 5 anos (mais simples e visual)</option><option value="mid"${d.band==='mid'?' selected':''}>6 a 8 anos</option><option value="big"${d.band==='big'?' selected':''}>9 a 12 anos</option></select>
    <p class="hint">Sem data de nascimento, o app usa 6 a 8 anos. Escolha aqui para mudar as atividades, o desafio do dia e a avaliação guiada.</p>
    <p class="hint" id="pf-bandinfo" role="status"></p>
    <label class="fl" for="pf-notes">Anotações (opcional)</label>
    <textarea id="pf-notes" class="inp" rows="3" maxlength="400">${esc(d.notes)}</textarea>
    <p class="hint">Use para registrar o que ajuda a criança (apoios, laudos, combinados). Fica salvo só neste aparelho e aparece no relatório. Dados de saúde só com autorização da família.</p>
  </div>
  ${worldsPanelHTML(d)}
  <details class="panel"><summary><h3>Ficha do aluno (anamnese, opcional)</h3></summary>
    <p class="hint">Para profissionais. O que for preenchido aparece no relatório impresso. Fica salvo só neste aparelho. Preencha só com autorização da família e o mínimo necessário.</p>
    ${AN_F.map(x=>`<label class="fl" for="an-${x[0]}">${x[1]}</label><textarea id="an-${x[0]}" class="inp" rows="2" maxlength="500">${esc(an[x[0]]||'')}</textarea>`).join('')}
  </details>
  <div class="panel"><h3>Tema</h3><div class="skins">
<button class="skincard" data-act="pskin" data-v="mundo" aria-pressed="${d.skin==='mundo'}" style="background:linear-gradient(160deg,#8EC9FF,#3F86F0);color:#0F1F66"><span class="sk-emo" aria-hidden="true">🦫🌎⭐</span><b>Mundo das Descobertas</b><small>Céu azul e a capivara Capi</small></button>
    <button class="skincard" data-act="pskin" data-v="algodao" aria-pressed="${d.skin==='algodao'}" style="background:linear-gradient(135deg,#FFD3E8,#FF9CC9);color:#5A1F42"><span class="sk-emo" aria-hidden="true">🎀🍭🦄</span><b>Algodão-doce</b><small>Tudo em tons de rosa</small></button>
    <button class="skincard" data-act="pskin" data-v="aventura" aria-pressed="${d.skin==='aventura'}" style="background:linear-gradient(135deg,#1B3A6B,#0B7285);color:#FFFFFF"><span class="sk-emo" aria-hidden="true">🦖🚀⚽</span><b>Aventura</b><small>Azul, verde e laranja</small></button>
  </div></div>
  <div class="row"><button class="btn primary" data-act="psave" style="--c:var(--c-letras)">Salvar</button></div>
  ${ed?`<div class="panel"><h3>Dados deste aluno</h3>
    <p>${ed.log.length} respostas registradas e ${ed.sessions.length} avaliações guiadas.</p>
    <div class="row"><button class="btn" data-act="askClear" id="askClear">Apagar histórico de respostas</button><button class="btn" data-act="askDel" id="askDel">Excluir aluno</button></div>
    <div id="confirmBox" hidden><p class="warn" id="confirmTxt"></p><div class="row"><button class="btn" data-act="confirmYes">Sim, apagar</button><button class="btn" data-act="confirmNo">Cancelar</button></div></div></div>`:''}
  </div>`;
  bindPform();
};
actions.pskin=b=>{const f=$('#pform');f.dataset.skin=b.dataset.v;$$('[data-act="pskin"]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));};
actions.psave=()=>{
  const f=$('#pform'),name=$('#pf-name').value.trim();
  if(!name){$('#pf-err').hidden=false;$('#pf-name').focus();return;}
  const vals={name:name,birth:$('#pf-birth').value,grade:$('#pf-grade').value,klass:$('#pf-klass').value.trim(),notes:$('#pf-notes').value.trim(),skin:normSkin(f.dataset.skin),band:$('#pf-band').value,worlds:collectWorlds($('#pf-band').value,$('#pf-birth').value),an:AN_F.reduce((o,x)=>{o[x[0]]=$('#an-'+x[0]).value.trim();return o;},{})};
  const id=f.dataset.id;
  if(id){
    const p=S.profiles.find(x=>x.id===id);Object.assign(p,vals);save();
    if(P&&P.id===id)applySkin();
    backTo('parents');
  }else{
    const p=newProfile(vals);if((vals.band==='pre')||(vals.band==='auto'&&bandFromBirth(vals.birth)==='pre')){p.prefs.fewOpts=true;p.prefs.big=true;}S.profiles.push(p);setProfile(p.id);go('home',undefined,{replace:true});
  }
};
let CONFIRM=null;
actions.askClear=()=>{CONFIRM='clear';$('#confirmTxt').textContent='Apagar todas as respostas e avaliações deste aluno? Isso não pode ser desfeito.';$('#confirmBox').hidden=false;};
actions.askDel=()=>{CONFIRM='del';$('#confirmTxt').textContent='Excluir este aluno e todo o histórico dele? Isso não pode ser desfeito.';$('#confirmBox').hidden=false;};
actions.confirmNo=()=>{CONFIRM=null;$('#confirmBox').hidden=true;};
actions.confirmYes=()=>{
  const id=$('#pform').dataset.id,p=S.profiles.find(x=>x.id===id);
  if(!p)return;
  if(CONFIRM==='clear'){p.log=[];p.sessions=[];p.rep={by:'',obs:'',beh:''};save();backTo('parents');}
  else if(CONFIRM==='del'){
    S.profiles=S.profiles.filter(x=>x.id!==id);
    if(P&&P.id===id){P=null;S.cur=null;if(S.profiles.length)setProfile(S.profiles[0].id);}
    save();backTo(S.profiles.length?'parents':'who');
  }
  CONFIRM=null;
};

/* ========== faixas etárias: 4–5 (pré), 6–8 (padrão), 9–12 (maiores) ========== */
function ageYears(b){
  if(!b)return null;const d=new Date(b+'T00:00:00');if(isNaN(d))return null;
  const n=new Date();let y=n.getFullYear()-d.getFullYear();
  if(n.getMonth()<d.getMonth()||(n.getMonth()===d.getMonth()&&n.getDate()<d.getDate()))y--;
  return y;
}
function bandFromBirth(b){const y=ageYears(b);return y==null?'mid':y<=5?'pre':y>=9?'big':'mid';}
function ageBand(){
  if(!P)return 'mid';
  if(P.band==='pre'||P.band==='mid'||P.band==='big')return P.band;
  return bandFromBirth(P.birth);
}
const BAND_NAME={pre:'4 a 5 anos',mid:'6 a 8 anos',big:'9 a 12 anos'};
/* ---- geradores: 4–5 anos ---- */
const EASY_L=['A','E','I','O','U','B','M','P','S','T','L','V'];
function qLetraPre(){
  const pool=LETTERS.filter(L=>EASY_L.indexOf(L[0])>=0);
  return pick(pool,6).map(L=>{
    const ls=shuffle([L[0]].concat(pick(pool.filter(x=>x[0]!==L[0]),2).map(x=>x[0])));
    return {dom:'letra',lab:'Achar a letra '+L[0],ans:L[0],stem:`<span class="bigspk">${ICON.speaker}</span>`,prompt:'Ouça e toque na letra certa.',say:[{t:'Toque na letra '+L[3]}],
      opts:ls.map(x=>({lab:x,h:`<span class="w">${x}</span>`,ok:x===L[0]})),cols:3,after:[{t:L[0]+', '+L[3]}]};
  });
}
function qInicialPre(){
  const pool=LETTERS.filter(L=>EASY_L.indexOf(L[0])>=0);
  return pick(pool,6).map(L=>{
    const ls=shuffle([L[0]].concat(pick(pool.filter(x=>x[0]!==L[0]),2).map(x=>x[0])));
    return {dom:'fon',lab:'Letra inicial de '+L[1],ans:L[0],stem:`<span class="emo xl">${L[2]}</span>`,prompt:'Com qual letra começa o nome da figura?',say:[{t:'Com qual letra começa '+L[1]+'?'}],
      opts:ls.map(x=>({lab:x,h:`<span class="w">${x}</span>`,ok:x===L[0]})),cols:3,after:[{t:L[1]}]};
  });
}
function qFigura(){
  const base=WORDS.filter(w=>w.w.length<=6);
  return pick(base,6).map(it=>{
    const others=pick(base.filter(x=>x.w!==it.w&&x.e!==it.e),2);
    return {dom:'ling',lab:'Achar a figura: '+it.w,ans:it.w,stem:`<span class="bigspk">${ICON.speaker}</span>`,prompt:'Ouça e toque na figura certa.',say:[{t:'Toque em: '+it.w}],
      opts:shuffle([it].concat(others)).map(x=>({lab:x.w,h:`<span class="emo">${x.e}</span>`,ok:x===it})),cols:3,after:[{t:it.w}]};
  });
}
function qNumeral(){
  return pick([1,2,3,4,5,6,7,8,9,10],6).map(n=>{
    const o=shuffle([n].concat(pick([1,2,3,4,5,6,7,8,9,10].filter(x=>x!==n),2)));
    return {dom:'calc',lab:'Achar o número '+n,ans:n,stem:`<span class="bigspk">${ICON.speaker}</span>`,prompt:'Ouça e toque no número certo.',say:[{t:'Toque no número '+n}],
      opts:o.map(x=>({lab:String(x),h:`<span class="num">${x}</span>`,ok:x===n})),cols:3,after:[{t:String(n)}]};
  });
}
function qContarPre(){
  const E=['🍎','⭐','🐶','🎈','🚗','🌸'];
  return Array.from({length:6},(_,i)=>{
    const n=i<3?rand(3)+1:rand(5)+3,e=E[rand(E.length)];
    const o=shuffle([n].concat(pick([1,2,3,4,5,6,7,8].filter(x=>x!==n&&Math.abs(x-n)<=2),2)));
    return {dom:'calc',lab:'Contar '+n+' figuras',ans:n,stem:`<div class="dots2">${Array.from({length:n},()=>`<span class="emo sm">${e}</span>`).join('')}</div>`,
      prompt:'Quantas figuras tem?',say:[{t:'Quantas figuras tem?'}],opts:o.map(x=>({lab:String(x),h:`<span class="num">${x}</span>`,ok:x===n})),cols:3};
  });
}
const COR=[['vermelho','#E03131'],['azul','#1C7ED6'],['amarelo','#FCC419'],['verde','#2F9E44'],['laranja','#F76707'],['roxo','#7048E8'],['rosa','#F783AC']];
function qFormas(){
  const out=[];
  pick(COR,3).forEach(c=>{
    const o=shuffle([c].concat(pick(COR.filter(x=>x[0]!==c[0]),2)));
    out.push({dom:'for',lab:'Achar a cor '+c[0],ans:c[0],stem:`<span class="bigspk">${ICON.speaker}</span>`,prompt:'Ouça e toque na cor certa.',say:[{t:'Toque na cor '+c[0]}],
      opts:o.map(x=>({lab:x[0],h:`<span class="swatch" style="display:block;width:64px;height:64px;border-radius:18px;background:${x[1]};border:2px solid rgba(0,0,0,.15)"></span>`,ok:x[0]===c[0]})),cols:3});
  });
  [['maior',[56,34,20]],['menor',[56,34,20]]].forEach(sp=>{
    const sizes=shuffle(sp[1]),target=sp[0]==='maior'?56:20;
    out.push({dom:'for',lab:'Achar o '+sp[0],ans:sp[0],stem:`<span class="stemtext">Qual é o ${sp[0]}?</span>`,prompt:'Toque no '+sp[0]+'.',say:[{t:'Toque no '+sp[0]+'.'}],
      opts:sizes.map(s=>({lab:String(s),h:`<span style="font-size:${s}px;line-height:1.1">🐻</span>`,ok:s===target})),cols:3});
  });
  return out;
}
/* ---- geradores: 9–12 anos ---- */
const ORT=[['exceção','esseção','excessão'],['excursão','escursão','excurção'],['berinjela','beringela','berinjéla'],['pesquisa','pesquiza','pesqisa'],['analisar','analizar','analissar'],
 ['aterrissar','aterisar','aterrizar'],['cidadão','cidadam','sidadão'],['previsão','previzão','previção'],['hospital','ospital','hospitau'],['exemplo','ezemplo','exenplo'],
 ['homem','omem','homen'],['humor','umor','humôr'],['vizinho','vesinho','vezinho'],['atrás','atraz','atrais'],['girafa','jirafa','girafá'],['coelho','coelio','quoelho'],
 ['açúcar','assucar','açucar'],['chuveiro','xuveiro','chuvero'],['assustado','asustado','assustádo'],['correto','corréto','coreto'],['gente','jente','gentee'],['quilômetro','kilômetro','quilomêtro']];
function qOrtografia(){
  return pick(ORT,6).map(it=>({dom:'ort',lab:'Escrita correta de “'+it[0]+'”',ans:it[0],stem:`<span class="bigspk">${ICON.speaker}</span>`,prompt:'Ouça a palavra e toque na que está escrita certa.',say:[{t:it[0]}],noauto:false,
    opts:shuffle(it.slice()).map(x=>({lab:x,h:`<span class="otext">${esc(x)}</span>`,ok:x===it[0]})),cols:1,after:[{t:it[0]}]}));
}
const OPW={'+':'mais','−':'menos','×':'vezes','÷':'dividido por'};
function bigOpts(ans){
  const set=new Set([ans]),cand=shuffle([ans+1,ans-1,ans+10,ans-10,ans+2,ans-2,ans+100,ans*2,Math.max(1,ans-5),ans+5].filter(x=>x>0&&x!==ans));
  for(const x of cand){if(set.size>=4)break;set.add(x);}
  return shuffle(Array.from(set)).map(n=>({lab:String(n),h:`<span class="num">${n}</span>`,ok:n===ans}));
}
function qCalcBig(level){
  const out=[],seen=new Set();let g=0;
  while(out.length<8&&g++<300){
    let a,b,op,ans;
    if(level===0){
      if(rand(2)){op='+';a=rand(60)+15;b=rand(60)+15;ans=a+b;}else{op='−';a=rand(70)+30;b=rand(a-10)+8;ans=a-b;}
    }else if(level===1){
      const t=rand(3);
      if(t===0){op='×';a=rand(5)+6;b=rand(5)+6;ans=a*b;}
      else if(t===1){op='÷';b=rand(8)+2;ans=rand(9)+2;a=b*ans;}
      else{op='×';a=rand(9)+2;b=rand(10)+2;ans=a*b;}
    }else{
      const t=rand(4);
      if(t===0){op='×';a=rand(20)+12;b=rand(8)+3;ans=a*b;}
      else if(t===1){op='÷';b=rand(9)+3;ans=rand(15)+8;a=b*ans;}
      else if(t===2){op='+';a=rand(500)+120;b=rand(400)+120;ans=a+b;}
      else{op='−';a=rand(600)+300;b=rand(250)+60;ans=a-b;}
    }
    const key=a+op+b;if(seen.has(key))continue;seen.add(key);
    out.push({dom:'calc',lab:a+' '+op+' '+b,ans:ans,stem:`<span class="eq">${a} ${op} ${b} = ?</span>`,prompt:'Quanto é?',say:[{t:a+' '+OPW[op]+' '+b+'?'}],opts:bigOpts(ans),cols:2});
  }
  return out;
}
function qRacBig(){
  const L=[
   {t:'2, 4, 8, 16, ?',a:32,l:'Dobro a cada passo'},{t:'1, 4, 9, 16, ?',a:25,l:'Quadrados'},{t:'100, 90, 80, 70, ?',a:60,l:'Sequência decrescente'},
   {t:'2, 3, 5, 8, 12, ?',a:17,l:'Soma crescente'},{t:'3, 6, 12, 24, ?',a:48,l:'Dobro a cada passo'},{t:'1, 2, 4, 7, 11, ?',a:16,l:'Soma crescente'},
   {t:'? + 18 = 45',a:27,l:'Número que falta'},{t:'6 × ? = 54',a:9,l:'Número que falta'},{t:'? − 14 = 29',a:43,l:'Número que falta'},{t:'72 ÷ ? = 8',a:9,l:'Número que falta'},
   {t:'Se 5 canetas custam 15 reais, quanto custam 8 canetas?',a:24,l:'Problema de proporção'},{t:'Ana tem 36 figurinhas e dá metade para Lia. Com quantas Ana fica?',a:18,l:'Problema de metade'},
   {t:'Um filme começou às 14h e durou 2 horas e meia. Que horas terminou? (em minutos após as 14h)',a:150,l:'Problema de tempo'}];
  return pick(L.filter(x=>x.a!==150),6).map(it=>({dom:'rac',lab:it.l+': '+it.t,ans:it.a,stem:`<span class="stemtext">${esc(it.t)}</span>`,prompt:'Descubra o número certo.',say:[{t:it.t.replace(/\?/g,'qual número').replace('×','vezes').replace('÷','dividido por').replace('−','menos').replace('+','mais')}],noauto:true,
    opts:bigOpts(it.a),cols:2}));
}
const TXT=[
 {p:'Todas as manhãs, Rita leva o cachorro para passear na praça. Hoje, porém, ela esqueceu a guia em casa e teve de voltar correndo. Quando chegou de novo, o cachorro já estava esperando na porta, balançando o rabo.',
  q:[{q:'Por que Rita voltou para casa?',o:['Esqueceu a guia','Perdeu o cachorro','Estava com frio'],a:'Esqueceu a guia'},{q:'Como o cachorro estava quando ela chegou?',o:['Animado, esperando na porta','Dormindo no sofá','Escondido no quintal'],a:'Animado, esperando na porta'}]},
 {p:'O professor levou a turma ao museu de ciências. Lá, os alunos viram o esqueleto de um dinossauro e aprenderam que ele viveu há milhões de anos. Mateus ficou tão curioso que fez dez perguntas ao guia.',
  q:[{q:'O que os alunos viram no museu?',o:['Um esqueleto de dinossauro','Um foguete de verdade','Uma pintura antiga'],a:'Um esqueleto de dinossauro'},{q:'Por que dá para dizer que Mateus ficou curioso?',o:['Fez muitas perguntas','Saiu mais cedo','Ficou calado'],a:'Fez muitas perguntas'}]},
 {p:'A professora pediu que cada aluno plantasse um feijão em um copo com algodão. Depois de uma semana, o feijão de Clara já tinha raiz e um pequeno broto. O de Bruno não nasceu, porque ele esqueceu de molhar o algodão.',
  q:[{q:'Por que o feijão de Bruno não nasceu?',o:['Faltou água','Faltou sol','O copo era grande'],a:'Faltou água'},{q:'O que o feijão de Clara tinha depois de uma semana?',o:['Raiz e broto','Só o algodão','Flores'],a:'Raiz e broto'}]},
 {p:'Lucas queria comprar uma bicicleta nova. Ele juntou as moedas do cofrinho por seis meses e ainda fez pequenos trabalhos, como lavar o carro do avô. No aniversário, finalmente tinha o suficiente.',
  q:[{q:'Como Lucas conseguiu o dinheiro?',o:['Juntou moedas e fez trabalhos','Ganhou na loteria','Vendeu a bicicleta velha'],a:'Juntou moedas e fez trabalhos'},{q:'Quanto tempo ele juntou moedas?',o:['Seis meses','Uma semana','Dois anos'],a:'Seis meses'}]}];
function qTextoBig(){
  const out=[];
  pick(TXT,3).forEach(t=>t.q.forEach(q=>out.push({dom:'comp',lab:q.q,ans:q.a,stem:`<span class="stemtext" style="font-size:.95em;text-align:left;display:block">${esc(t.p)}</span>`,prompt:q.q,say:[{t:t.p},{t:q.q}],noauto:true,
    opts:shuffle(q.o).map(o=>({h:`<span class="otext">${esc(o)}</span>`,ok:o===q.a})),cols:1})));
  return out;
}
const SIN=[['feliz','contente',['triste','bravo']],['rápido','veloz',['lento','pesado']],['enorme','gigante',['minúsculo','estreito']],['bonito','belo',['feio','velho']],['começar','iniciar',['terminar','parar']],
 ['pequeno','miúdo',['grande','alto']],['conversar','falar',['calar','ouvir']],['assustado','amedrontado',['corajoso','sonolento']],['esperto','inteligente',['bobo','cansado']],['antigo','velho',['novo','recente']],
 ['fácil','simples',['difícil','complicado']],['silêncio','quietude',['barulho','música']]];
function qSinonimos(){
  return pick(SIN,6).map(it=>({dom:'ling',lab:'Sinônimo de '+it[0],ans:it[1],stem:`<span class="stemtext">Qual palavra tem significado parecido com <b>${esc(it[0])}</b>?</span>`,prompt:'Toque na palavra com sentido parecido.',say:[{t:'Qual palavra tem significado parecido com '+it[0]+'?'}],noauto:true,
    opts:shuffle([it[1]].concat(it[2].concat(pick(SIN.filter(x=>x[0]!==it[0]).map(x=>x[1]),1))).slice(0,4)).map(o=>({h:`<span class="otext">${esc(o)}</span>`,ok:o===it[1]})),cols:2}));
}
/* ---- blocos de avaliação por faixa ---- */
const BLOCKS_PRE=[
 {k:'letra',n:5,min:2,mod:'letras',t:'Reconhecimento de letras (vogais e letras fáceis)',intro:'Vamos achar letras!',mk:()=>qLetraPre().slice(0,5)},
 {k:'fon',n:5,min:2,mod:'letras',t:'Consciência fonológica (som inicial)',intro:'Vamos descobrir como as palavras começam!',mk:()=>qInicialPre().slice(0,5)},
 {k:'ling',n:5,min:2,mod:'leitura',t:'Linguagem oral (vocabulário)',intro:'Vamos achar as figuras!',mk:()=>qFigura().slice(0,5)},
 {k:'for',n:5,min:2,mod:'mente',t:'Cores, formas e tamanhos',intro:'Vamos achar cores e tamanhos!',mk:()=>qFormas().slice(0,5)},
 {k:'calc',n:6,min:3,mod:'contas',t:'Numerais e contagem até 10',intro:'Vamos contar!',mk:()=>qNumeral().slice(0,3).concat(qContarPre().slice(0,3))},
 {k:'aten',n:4,min:2,mod:'mente',t:'Atenção visual',intro:'Vamos achar o que é diferente!',mk:()=>qAtencao().slice(0,4)},
 {k:'mem',n:4,min:2,mod:'mente',t:'Memória de trabalho visual',intro:'Vamos treinar a memória!',mk:()=>qMemoria().slice(0,4)},
 {k:'log',n:3,min:2,mod:'mente',t:'Padrões simples',intro:'Vamos descobrir o que vem depois!',mk:()=>qPadroes().slice(0,3)},
 {k:'viso',n:1,min:3,mod:'puzzle',t:'Quebra-cabeça de 4 peças',intro:'Vamos montar um quebra-cabeça!',puzzle:2}
];
const BLOCKS_BIG=[
 {k:'ort',n:6,min:2,mod:'leitura',t:'Ortografia',intro:'Vamos ver como se escreve!',mk:()=>qOrtografia()},
 {k:'ling',n:5,min:2,mod:'leitura',t:'Vocabulário (sinônimos)',intro:'Vamos pensar nas palavras!',mk:()=>qSinonimos().slice(0,5)},
 {k:'comp',n:6,min:4,mod:'leitura',t:'Interpretação de textos',intro:'Vamos ler textos e responder!',mk:()=>qTextoBig()},
 {k:'calc',n:8,min:4,mod:'contas',t:'Cálculo (contas de 2 algarismos, tabuada e divisão)',intro:'Vamos fazer contas!',mk:()=>qCalcBig(0).slice(0,3).concat(qCalcBig(1).slice(0,3),qCalcBig(2).slice(0,2))},
 {k:'rac',n:6,min:4,mod:'contas',t:'Raciocínio lógico-matemático',intro:'Vamos descobrir os números!',mk:()=>qRacBig()},
 {k:'hora',n:5,min:3,mod:'relogio',t:'Hora e tempo',intro:'Vamos falar de horas!',mk:()=>qHoras(1).slice(0,3).concat(qDuracao().slice(0,2))},
 {k:'din',n:6,min:3,mod:'dinheiro',t:'Dinheiro e consumo',intro:'Vamos falar de dinheiro!',mk:()=>qValores(1).slice(0,2).concat(qTroco(1).slice(0,2),qPouparBig().slice(0,2))},
 {k:'aten',n:6,min:3,mod:'mente',t:'Atenção visual',intro:'Vamos achar o que é diferente!',mk:()=>qAtencao()},
 {k:'mem',n:6,min:3,mod:'mente',t:'Memória de trabalho visual',intro:'Vamos treinar a memória!',mk:()=>qMemoria()},
 {k:'log',n:6,min:3,mod:'mente',t:'Padrões e raciocínio lógico',intro:'Vamos descobrir o que vem depois!',mk:()=>qPadroes()},
 {k:'viso',n:1,min:4,mod:'puzzle',t:'Quebra-cabeça de 9 peças',intro:'Vamos montar um quebra-cabeça!',puzzle:3}
];
function blocksFor(b){return b==='pre'?BLOCKS_PRE:b==='big'?BLOCKS_BIG:BLOCKS;}

/* ========== avaliação guiada ========== */
const BLOCKS=[
 {k:'letra',n:5,min:2,mod:'letras',t:'Reconhecimento de letras',intro:'Vamos achar letras!',mk:()=>qLetraNome().slice(0,5)},
 {k:'fon',n:5,min:2,mod:'letras',t:'Consciência fonológica (letra inicial)',intro:'Vamos descobrir como as palavras começam!',mk:()=>qLetraInicial().slice(0,5)},
 {k:'silc',n:5,min:2,mod:'letras',t:'Consciência silábica',intro:'Vamos completar palavras!',mk:()=>qSilabaFalta().slice(0,5)},
 {k:'ler',n:5,min:2,mod:'leitura',t:'Leitura de palavras',intro:'Vamos ler palavras!',mk:()=>qPalavraFigura().slice(0,5)},
 {k:'comp',n:5,min:3,mod:'leitura',t:'Compreensão de frases',intro:'Vamos completar frases!',mk:()=>qFrase().slice(0,5)},
 {k:'calc',n:8,min:4,mod:'contas',t:'Cálculo (até 10 e até 20)',intro:'Vamos fazer contas!',mk:()=>mathQs(1).slice(0,4).concat(mathQs(2).slice(0,4))},
 {k:'aten',n:6,min:3,mod:'mente',t:'Atenção visual',intro:'Vamos achar o que é diferente!',mk:()=>qAtencao()},
 {k:'mem',n:6,min:3,mod:'mente',t:'Memória de trabalho visual',intro:'Vamos treinar a memória!',mk:()=>qMemoria()},
 {k:'log',n:6,min:3,mod:'mente',t:'Padrões e raciocínio lógico',intro:'Vamos descobrir o que vem depois!',mk:()=>qPadroes()},
 {k:'viso',n:1,min:3,mod:'puzzle',t:'Quebra-cabeça de 4 peças',intro:'Vamos montar um quebra-cabeça!',puzzle:true}
];
const AV={form:'A',band:'mid'};
function seedFor(k){const bd=SESS&&SESS.band||'mid';return (SESS&&SESS.form==='B'?7000:3000)+(bd==='pre'?20000:bd==='big'?40000:0)+blocksFor(bd).findIndex(b=>b.k===k)*97;}

screens.aval=(m,arg)=>{
  if(!P)return go('who');
  const done=P.sessions.filter(s=>s.done),last=done[done.length-1];
  if(!(arg&&arg.keep)){AV.form=last&&last.form==='A'?'B':'A';AV.band=ageBand();}
  const BL=blocksFor(AV.band);
  const tot=BL.reduce((a,b)=>a+b.n,0),mins=BL.reduce((a,b)=>a+b.min,0);
  m.innerHTML=`${backBtn('parents')}<h2 class="mtitle" style="--c:var(--c-letras)">Avaliação guiada</h2>
  <p class="msub">Aluno: <b>${esc(P.name)}</b>. Os itens são sempre os mesmos em cada forma, para poder comparar uma aplicação com outra.</p>
  <div class="panel"><h3>Como aplicar</h3><ul class="plist">
    <li>Sente ao lado da criança, em um lugar tranquilo e sem muito barulho.</li>
    <li>Cada item tem uma única tentativa. O aplicativo não mostra se a criança acertou ou errou.</li>
    <li>Evite dar dicas durante o item. Anote o que observar (atenção, frustração, pedidos de ajuda) no campo de observações do relatório.</li>
    <li>A criança pode usar o botão Ouvir. O aplicativo registra quantas vezes ela usou.</li>
    <li>Dá para parar quando a criança cansar. O relatório mostra só as partes feitas.</li>
  </ul></div>
  <div class="panel"><h3>Faixa etária da prova</h3><div class="seg">${['pre','mid','big'].map(b=>`<button data-act="avband" data-v="${b}" aria-pressed="${AV.band===b}">${BAND_NAME[b]}</button>`).join('')}</div>
  <p>${ageText(P.birth)?'Idade cadastrada: '+ageText(P.birth)+'. ':''}Cada faixa tem itens próprios (4 a 5: mais visual e com 3 opções; 6 a 8: versão original; 9 a 12: ortografia, textos, contas maiores e raciocínio). Só compare aplicações da mesma faixa.</p></div>
  <div class="panel"><h3>Forma da prova</h3><div class="seg">
    <button data-act="avform" data-v="A" aria-pressed="${AV.form==='A'}">Forma A</button>
    <button data-act="avform" data-v="B" aria-pressed="${AV.form==='B'}">Forma B</button></div>
    <p>${last?`A última avaliação completa foi a Forma ${last.form}. Alterne as formas ao repetir, para a criança não decorar as respostas.`:'Use a Forma A na primeira aplicação e a Forma B nas seguintes.'}</p></div>
  <div class="panel"><h3>Partes (${tot} itens, cerca de ${mins} a ${mins+8} minutos)</h3>
    ${BL.map(b=>`<label class="chk"><input type="checkbox" id="b-${b.k}" checked><span>${esc(b.t)}<small>${b.n} ${b.n===1?'item':'itens'}</small></span></label>`).join('')}
    <p class="warn" id="avErr" hidden>Marque pelo menos uma parte.</p></div>
  <div class="row"><button class="btn primary" data-act="avstart" style="--c:var(--c-letras)">Começar avaliação</button></div>`;
};
actions.avband=b=>{AV.band=b.dataset.v;screens.aval($('#main'),{keep:true});};
actions.avform=b=>{AV.form=b.dataset.v;$$('[data-act="avform"]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));};
actions.avstart=()=>{
  const keys=blocksFor(AV.band).filter(b=>{const c=$('#b-'+b.k);return c&&c.checked;}).map(b=>b.k);
  if(!keys.length){$('#avErr').hidden=false;return;}
  const sess={id:'s'+Date.now().toString(36),ts:Date.now(),form:AV.form,band:AV.band,blocks:keys,done:false,note:''};
  P.sessions.push(sess);save();SESS=sess;go('avalrun',{i:0});
};
screens.avalrun=(m,arg)=>{
  if(!P||!SESS)return go('aval');
  const i=arg&&arg.i||0,keys=SESS.blocks;
  if(i>=keys.length){
    SESS.done=true;save();
    m.innerHTML=`<section class="result" style="--c:var(--c-letras)"><div class="medal">${mascot('cheer')}</div><h2>Terminamos! Muito obrigado!</h2>
    <p class="score">A avaliação foi registrada.</p>
    <div class="noprint" style="width:100%;max-width:420px;text-align:left"><label class="fl" for="sn">Observações desta aplicação (para o adulto)</label><textarea id="sn" class="inp" rows="3" maxlength="600" placeholder="Atenção, cansaço, frustração, apoios, ambiente...">${esc(SESS.note||'')}</textarea></div>
    <div class="row"><button class="btn primary" id="vr">Ver relatório</button><button class="btn" id="vh">Voltar ao início</button></div></section>`;
    $('#sn',m).oninput=e=>{SESS.note=e.target.value;save();};
    $('#vr',m).onclick=()=>go('report',{sel:SESS.id});
    $('#vh',m).onclick=()=>go('home');
    say({t:'Terminamos! Muito obrigado!'});
    return;
  }
  const B=blocksFor(SESS.band||'mid').find(b=>b.k===keys[i]);
  m.innerHTML=`<section class="result" style="--c:var(--c-${B.mod})"><p class="score">Parte ${i+1} de ${keys.length}</p><h2>${esc(B.intro)}</h2>
  <p class="msub" style="text-align:center">${esc(B.t)}</p>
  <div class="row"><button class="btn primary" id="go1">Começar</button><button class="btn" id="stop1">Parar por hoje</button></div></section>`;
  say({t:B.intro});
  $('#stop1',m).onclick=()=>{stopSpeech();backTo('aval');};
  $('#go1',m).onclick=()=>{
    sfx.tap();stopSpeech();
    const onDone=()=>go('avalrun',{i:i+1},{replace:true});
    if(B.puzzle)puzzle(m,B.puzzle===true?2:B.puzzle,B.puzzle===true?2:B.puzzle,'aval:'+B.k,{assess:true,scene:SCENES[0],onDone:onDone});
    else quiz(m,{key:'aval:'+B.k,module:B.mod,assess:true,make:()=>seeded(seedFor(B.k),B.mk),back:['aval'],onDone:onDone});
  };
};

/* ========== relatório ========== */
const DOMS=[['letra','Reconhecimento de letras'],['fon','Consciência fonológica (letra inicial)'],['silc','Consciência silábica'],['ler','Leitura de palavras'],
  ['comp','Compreensão de frases e histórias'],['calc','Cálculo'],['aten','Atenção visual'],['mem','Memória de trabalho visual'],
  ['log','Padrões e raciocínio lógico'],['viso','Quebra-cabeça (visuoespacial)'],['ling','Linguagem e vocabulário'],['hora','Hora e tempo'],['din','Dinheiro e consumo'],['for','Cores, formas e tamanhos'],['ort','Ortografia'],['rac','Raciocínio lógico-matemático'],['ing','Inglês (vocabulário)']];
const BAND={insuf:'Poucos itens',aut:'Com autonomia',des:'Em desenvolvimento',apo:'Precisa de apoio'};
const band=(n,p)=>n<3?'insuf':p>=80?'aut':p>=50?'des':'apo';
const median=a=>{if(!a.length)return null;const s=a.slice().sort((x,y)=>x-y),h=Math.floor(s.length/2);return s.length%2?s[h]:(s[h-1]+s[h])/2;};
const fmtS=ms=>ms==null?'–':(ms/1000).toFixed(1).replace('.',',')+' s';
const fmtMin=ms=>ms<60000?Math.max(1,Math.round(ms/1000))+' s':Math.round(ms/60000)+' min';
const fmtDate=ts=>new Date(ts).toLocaleDateString('pt-BR');
const isItem=e=>e.ok1!==null&&e.ok1!==undefined;
const domName=k=>(DOMS.find(d=>d[0]===k)||['',k])[1];
function ageText(b){
  if(!b)return '';
  const d=new Date(b+'T00:00:00');if(isNaN(d))return '';
  const n=new Date();let y=n.getFullYear()-d.getFullYear(),mo=n.getMonth()-d.getMonth();
  if(n.getDate()<d.getDate())mo--;
  if(mo<0){y--;mo+=12;}
  if(y<0)return '';
  return y+' anos'+(mo?' e '+mo+(mo===1?' mês':' meses'):'');
}
function stats(E){
  const out=[];
  DOMS.forEach(d=>{
    const it=E.filter(e=>e.dom===d[0]&&isItem(e));
    if(!it.length)return;
    const c=it.filter(e=>e.ok1).length;
    out.push({k:d[0],name:d[1],n:it.length,c:c,p:Math.round(100*c/it.length),
      ms:median(it.map(e=>e.ms).filter(x=>typeof x==='number')),ou:it.filter(e=>e.listens>0).length,
      supN:it.filter(e=>e.sup!=null).length,sup:it.filter(e=>e.sup>0).length,b:band(it.length,100*c/it.length)});
  });
  return out;
}
function observations(E,st){
  const o=[],ok=st.filter(s=>s.n>=3);
  const low=ok.filter(s=>s.p<50).map(s=>s.name+' ('+s.p+'%)');
  const high=ok.filter(s=>s.p>=80).map(s=>s.name+' ('+s.p+'%)');
  if(low.length)o.push('Áreas com mais respostas incorretas na 1ª tentativa: '+low.join('; ')+'.');
  if(high.length)o.push('Áreas realizadas com autonomia: '+high.join('; ')+'.');
  const mAll=median(E.filter(e=>isItem(e)&&typeof e.ms==='number').map(e=>e.ms));
  if(mAll){
    const slow=st.filter(s=>s.n>=3&&s.ms!=null&&s.ms>mAll*1.6).map(s=>s.name+' ('+fmtS(s.ms)+')');
    o.push('Tempo mediano de resposta: '+fmtS(mAll)+(slow.length?'. Mais lento em: '+slow.join('; ')+'.':'.'));
  }
  const it=E.filter(isItem);
  if(it.length)o.push('Usou o botão Ouvir em '+Math.round(100*it.filter(e=>e.listens>0).length/it.length)+'% dos itens.');
  const sN=it.filter(e=>e.sup!=null);
  if(sN.length){
    const s1=sN.filter(e=>e.sup>0).length;
    const more=st.filter(s=>s.supN>=3&&s.sup/s.supN>=0.5).map(s=>s.name);
    o.push('Apoio do adulto registrado em '+sN.length+' itens: '+s1+' com dica ou ajuda ('+Math.round(100*s1/sN.length)+'%).'+(more.length?' Mais apoio em: '+more.join('; ')+'.':''));
  }
  const multi=E.filter(e=>!e.sid&&isItem(e)&&e.tries>1).length;
  if(multi)o.push('Na prática livre, precisou de mais de uma tentativa em '+multi+' itens.');
  const pz=E.filter(e=>e.mod==='pausa');
  if(pz.length)o.push('Pediu pausa '+pz.length+(pz.length===1?' vez':' vezes')+' (tempo total: '+fmtMin(pz.reduce((a,e)=>a+(e.ms||0),0))+').');
  const pairs=[['B','D'],['P','Q'],['M','N'],['F','V'],['T','D'],['C','G'],['S','Z']];
  const conf=E.filter(e=>e.ok1===false&&(e.dom==='letra'||e.dom==='fon')&&e.err&&e.err.length&&pairs.some(p=>(p[0]===e.ans&&p[1]===e.err[0])||(p[1]===e.ans&&p[0]===e.err[0])));
  if(conf.length)o.push('Troca entre letras de grafia ou som parecidos em '+conf.length+' item(ns) (por exemplo b/d, p/q, m/n, f/v). Vale observar com atenção.');
  return o;
}
const selEntries=sel=>sel==='all'?P.log:sel==='free'?P.log.filter(e=>!e.sid):P.log.filter(e=>e.sid===sel);
function repSel(arg){
  if(arg&&arg.sel)return arg.sel;
  const ss=P.sessions.filter(s=>P.log.some(e=>e.sid===s.id));
  return ss.length?ss[ss.length-1].id:'all';
}

/* evolução entre aplicações e metas */
const guidedSessions=()=>P.sessions.filter(s=>P.log.some(e=>e.sid===s.id&&isItem(e)));
function evolution(){
  const cols=guidedSessions().slice(-6).map(s=>({s:s,st:stats(P.log.filter(e=>e.sid===s.id))}));
  const rows=DOMS.map(d=>({name:d[1],v:cols.map(c=>{const x=c.st.find(y=>y.k===d[0]);return x?{p:x.p,n:x.n}:null;})})).filter(r=>r.v.some(Boolean));
  return {cols:cols,rows:rows};
}
function goalSeries(g){
  if(!g.dom)return [];
  return guidedSessions().map(s=>{
    const it=P.log.filter(e=>e.sid===s.id&&e.dom===g.dom&&isItem(e));
    if(!it.length)return null;
    return {ts:s.ts,p:Math.round(100*it.filter(e=>e.ok1&&!(e.sup>0)).length/it.length),n:it.length};
  }).filter(Boolean);
}
function goalStatus(g){
  if(!g.dom)return ({iniciar:'Não iniciada',andamento:'Em andamento',atingida:'Atingida'})[g.status||'iniciar'];
  const s=goalSeries(g);
  if(!s.length)return 'Sem aplicação ainda';
  const l=s[s.length-1];
  return l.n<3?'Poucos itens':l.p>=g.target?'Atingida':'Em andamento';
}

function buildReport(sel){
  const E=selEntries(sel),st=stats(E),ts=E.map(e=>e.ts);
  return {sel:sel,E:E,st:st,sess:P.sessions.find(s=>s.id===sel)||null,
    errs:E.filter(e=>e.ok1===false).map(e=>({dom:domName(e.dom),lab:e.lab,got:(e.err||[]).join(', '),ans:e.ans})),
    puz:E.filter(e=>e.dom==='viso'),obs:observations(E,st),pauses:E.filter(e=>e.mod==='pausa'),
    from:ts.length?Math.min.apply(null,ts):null,to:ts.length?Math.max.apply(null,ts):null,total:E.filter(isItem).length};
}
function modeText(R){
  if(R.sess)return 'Avaliação guiada, Forma '+R.sess.form+' (faixa '+BAND_NAME[R.sess.band||'mid']+'), de '+fmtDate(R.sess.ts)+'. Uma tentativa por item e sem informar acerto ou erro à criança.'+(R.sess.done?'':' Aplicação parcial.');
  if(R.sel==='free')return 'Prática livre. A criança pode tentar de novo até acertar; o relatório considera só a 1ª tentativa.';
  return 'Todos os registros (avaliações guiadas e prática livre). A prática livre permite novas tentativas; o relatório considera só a 1ª tentativa.';
}
function sessionRows(){
  return P.sessions.filter(s=>P.log.some(e=>e.sid===s.id)).map(s=>({
    date:fmtDate(s.ts),form:s.form,band:BAND_NAME[s.band||'mid'],note:s.note||'',parts:s.blocks.map(k=>(blocksFor(s.band||'mid').find(b=>b.k===k)||{t:k}).t).join(', '),
    n:P.log.filter(e=>e.sid===s.id&&isItem(e)).length,done:s.done}));
}
const AN_F=[['queixa','Motivo da avaliação / queixa'],['escola','Escola e situação escolar'],['saude','Saúde, audição, visão e desenvolvimento'],['hist','Histórico familiar e de aprendizagem'],['apoio','Acompanhamentos e apoios (terapias, laudos)'],['obj','Objetivos e expectativas']];
function anamneseHTML(){
  const a=P.an||{},f=AN_F.filter(x=>a[x[0]]&&a[x[0]].trim());
  if(!f.length)return '';
  return '<h3>Dados e histórico do aluno (anamnese resumida)</h3><ul>'+f.map(x=>'<li><b>'+x[1]+':</b> '+esc(a[x[0]])+'</li>').join('')+'</ul>';
}
function sheetHTML(R){
  const age=ageText(P.birth),rows=R.st,hasSup=rows.some(s=>s.supN>0);
  const tbl=rows.length?`<div class="tw"><table><thead><tr><th>Área</th><th>Acertos na 1ª tentativa</th><th>Desempenho</th><th>Tempo mediano</th><th>Usou Ouvir</th>${hasSup?'<th>Com apoio</th>':''}<th>Situação</th></tr></thead><tbody>
    ${rows.map(s=>`<tr><td>${esc(s.name)}</td><td>${s.c} de ${s.n}</td><td><div class="bar" aria-hidden="true"><i style="width:${s.p}%"></i></div>${s.p}%</td><td>${fmtS(s.ms)}</td><td>${Math.round(100*s.ou/s.n)}%</td>${hasSup?`<td>${s.supN?s.sup+' de '+s.supN:'–'}</td>`:''}<td><span class="bd ${s.b}">${BAND[s.b]}</span></td></tr>`).join('')}</tbody></table></div>
    <p class="foot">As situações são só uma ajuda visual: 80% ou mais, com autonomia; de 50% a 79%, em desenvolvimento; abaixo de 50%, precisa de apoio. Com menos de 3 itens na área, aparece “poucos itens”. Não são notas de corte por idade e não indicam diagnóstico.</p>`
    :'<p>Ainda não há respostas registradas para esta seleção.</p>';
  const errs=R.errs.length?`<h3>Itens errados na 1ª tentativa</h3><div class="tw"><table><thead><tr><th>Área</th><th>Item</th><th>Resposta da criança</th><th>Resposta esperada</th></tr></thead><tbody>
    ${R.errs.slice(0,40).map(e=>`<tr><td>${esc(e.dom)}</td><td>${esc(e.lab)}</td><td>${esc(e.got)}</td><td>${esc(e.ans)}</td></tr>`).join('')}</tbody></table></div>${R.errs.length>40?`<p class="foot">Mostrando 40 de ${R.errs.length}. A planilha (CSV) traz todos.</p>`:''}`:'';
  const puz=R.puz.length?`<h3>Quebra-cabeça</h3><div class="tw"><table><thead><tr><th>Data</th><th>Peças</th><th>Trocas feitas</th><th>Trocas mínimas</th><th>Tempo total</th></tr></thead><tbody>
    ${R.puz.map(e=>`<tr><td>${fmtDate(e.ts)}</td><td>${e.pieces||''}</td><td>${e.moves==null?'–':e.moves}</td><td>${e.minMoves==null?'–':e.minMoves}</td><td>${fmtS(e.ms)}</td></tr>`).join('')}</tbody></table></div>`:'';
  const ev=evolution(),evT=ev.cols.length>=2?`<h3>Evolução entre aplicações</h3><p class="foot" style="margin-top:0">Acertos na 1ª tentativa por área. ▲ subiu, ▼ caiu, = igual à aplicação anterior.</p><div class="tw"><table><thead><tr><th>Área</th>${ev.cols.map(c=>`<th>${fmtDate(c.s.ts)}<br>Forma ${c.s.form}</th>`).join('')}</tr></thead><tbody>
    ${ev.rows.map(r=>`<tr><td>${esc(r.name)}</td>${r.v.map((x,i)=>{if(!x)return '<td>–</td>';const pv=i>0?r.v[i-1]:null,ar=pv?(x.p>pv.p?' ▲':x.p<pv.p?' ▼':' ='):'';return `<td>${x.p}%${ar}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`:'';
  const goals=P.goals.length?`<h3>Metas individuais</h3><div class="tw"><table><thead><tr><th>Meta</th><th>Área</th><th>Meta</th><th>Resultados (sozinha/o)</th><th>Situação</th></tr></thead><tbody>
    ${P.goals.map(g=>{const sr=goalSeries(g);return `<tr><td>${esc(g.text)}</td><td>${g.dom?esc(domName(g.dom)):'Acompanhamento manual'}</td><td>${g.dom?g.target+'%':'–'}</td><td>${g.dom?(sr.length?sr.slice(-4).map(x=>fmtDate(x.ts)+': '+x.p+'%').join('<br>'):'–'):'–'}</td><td>${esc(goalStatus(g))}</td></tr>`;}).join('')}</tbody></table></div>`:'';
  const ses=sessionRows(),sesT=ses.length?`<h3>Aplicações guiadas já feitas</h3><div class="tw"><table><thead><tr><th>Data</th><th>Forma</th><th>Faixa</th><th>Partes</th><th>Itens</th><th>Situação</th></tr></thead><tbody>
    ${ses.map(s=>`<tr><td>${s.date}</td><td>${s.form}</td><td>${s.band}</td><td>${esc(s.parts)}</td><td>${s.n}</td><td>${s.done?'Completa':'Parcial'}</td></tr>`).join('')}</tbody></table></div>${ses.some(s=>s.note)?'<p><b>Observações por aplicação:</b></p><ul>'+ses.filter(s=>s.note).map(s=>'<li>'+s.date+' (Forma '+s.form+'): '+esc(s.note)+'</li>').join('')+'</ul>':''}`:'';
  return `<article class="sheet" id="sheet">
  <h2>Relatório de observação pedagógica</h2><p class="foot" style="margin:0">Mundo das Descobertas · registro de apoio à avaliação psicopedagógica</p>
  <div class="meta"><div><span>Aluno(a)</span>${esc(P.name)}</div><div><span>Idade</span>${age||'não informada'}</div><div><span>Ano escolar</span>${esc(P.grade)||'não informado'}</div>
  <div><span>Data do relatório</span>${fmtDate(Date.now())}</div><div><span>Registros</span>${R.from?fmtDate(R.from)+(fmtDate(R.from)!==fmtDate(R.to)?' a '+fmtDate(R.to):''):'sem registros'}</div><div><span>Itens considerados</span>${R.total}</div>
  <div><span>Pausas pedidas</span>${R.pauses.length?R.pauses.length+' ('+fmtMin(R.pauses.reduce((a,e)=>a+(e.ms||0),0))+')':'nenhuma'}</div></div>
  <p><b>Tipo de registro:</b> ${esc(modeText(R))}</p>
  ${P.notes?`<p><b>Anotações sobre o aluno:</b> ${esc(P.notes)}</p>`:''}
  ${anamneseHTML()}
  <h3>Desempenho por área</h3>${tbl}${errs}${puz}${evT}${goals}
  ${R.obs.length?`<h3>Indicativos automáticos</h3><ul>${R.obs.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
  ${sesT}
  <h3>Observações da profissional</h3>
  <label class="fl2" for="rp-by">Profissional responsável</label>
  <input id="rp-by" class="ln" maxlength="80" value="${esc(P.rep.by)}"><div class="pnote" id="pn-by">${esc(P.rep.by)}</div>
  <label class="fl2" for="rp-beh">Comportamento durante a aplicação (atenção, frustração, pedidos de ajuda, apoios usados)</label>
  <textarea id="rp-beh" rows="4">${esc(P.rep.beh)}</textarea><div class="pnote" id="pn-beh">${esc(P.rep.beh)}</div>
  <label class="fl2" for="rp-obs">Observações e encaminhamentos</label>
  <textarea id="rp-obs" rows="4">${esc(P.rep.obs)}</textarea><div class="pnote" id="pn-obs">${esc(P.rep.obs)}</div>
  <div class="sign keep"><div>Assinatura da profissional</div><div>Data</div></div>
  <p class="foot">Contém dados pessoais de criança (LGPD). Guarde em local protegido e compartilhe apenas com a família e com profissionais envolvidos.</p>
  <p class="foot">Este relatório é um registro de apoio à observação. Ele não substitui a avaliação de um profissional e não fornece diagnóstico. A interpretação deve considerar o contexto da criança, a mediação durante a aplicação e outras fontes de informação.</p>
  </article>`;
}
function reportText(R){
  const L=[],hasSup=R.st.some(s=>s.supN>0);
  L.push('RELATÓRIO DE OBSERVAÇÃO PEDAGÓGICA - Mundo das Descobertas');
  L.push('Aluno(a): '+P.name+(ageText(P.birth)?' | Idade: '+ageText(P.birth):'')+(P.grade?' | Ano: '+P.grade:''));
  L.push('Data do relatório: '+fmtDate(Date.now())+' | Itens considerados: '+R.total);
  L.push('Tipo de registro: '+modeText(R));
  if(P.notes)L.push('Anotações: '+P.notes);
  L.push('');L.push('DESEMPENHO POR ÁREA (1ª tentativa)');
  R.st.forEach(s=>L.push('- '+s.name+': '+s.c+' de '+s.n+' ('+s.p+'%) | tempo mediano '+fmtS(s.ms)+' | usou Ouvir em '+Math.round(100*s.ou/s.n)+'%'+(hasSup&&s.supN?' | com apoio em '+s.sup+' de '+s.supN:'')+' | '+BAND[s.b]));
  if(R.errs.length){L.push('');L.push('ITENS ERRADOS NA 1ª TENTATIVA');R.errs.forEach(e=>L.push('- '+e.dom+' | '+e.lab+' | respondeu: '+e.got+' | esperado: '+e.ans));}
  if(R.puz.length){L.push('');L.push('QUEBRA-CABEÇA');R.puz.forEach(e=>L.push('- '+fmtDate(e.ts)+' | '+e.pieces+' peças | trocas '+e.moves+' (mínimo '+e.minMoves+') | '+fmtS(e.ms)));}
  const ev=evolution();
  if(ev.cols.length>=2){L.push('');L.push('EVOLUÇÃO ENTRE APLICAÇÕES (acertos na 1ª tentativa)');L.push('Aplicações: '+ev.cols.map(c=>fmtDate(c.s.ts)+' (Forma '+c.s.form+')').join(' | '));ev.rows.forEach(r=>L.push('- '+r.name+': '+r.v.map(x=>x?x.p+'%':'–').join(' | ')));}
  if(P.goals.length){L.push('');L.push('METAS INDIVIDUAIS');P.goals.forEach(g=>{const sr=goalSeries(g);L.push('- '+g.text+(g.dom?' ['+domName(g.dom)+', meta '+g.target+'%'+(sr.length?', último: '+sr[sr.length-1].p+'%':'')+']':' [acompanhamento manual]')+' - '+goalStatus(g));});}
  if(R.obs.length){L.push('');L.push('INDICATIVOS AUTOMÁTICOS');R.obs.forEach(x=>L.push('- '+x));}
  if(P.rep.by||P.rep.beh||P.rep.obs){L.push('');L.push('OBSERVAÇÕES DA PROFISSIONAL');if(P.rep.by)L.push('Profissional: '+P.rep.by);if(P.rep.beh)L.push('Comportamento: '+P.rep.beh);if(P.rep.obs)L.push('Observações: '+P.rep.obs);}
  L.push('');L.push('Registro de apoio à observação. Não substitui avaliação profissional nem fornece diagnóstico.');
  L.push('ATENÇÃO: este texto contém dados pessoais de criança (LGPD). Guarde em local protegido e compartilhe apenas com a família e com profissionais envolvidos.');
  return L.join('\n');
}
let RSEL='all';
let TSEL='';
function turmaRows(){
  const ts=turmas();if(TSEL&&ts.indexOf(TSEL)<0)TSEL='';
  const y=(()=>{try{return new Date(Date.now()-864e5).toLocaleDateString('sv-SE');}catch(e){return '';}})();
  return S.profiles.filter(p=>!TSEL||p.klass===TSEL).map(p=>{
    const rounds=Object.keys(p.rounds||{}).reduce((s,k)=>s+(p.rounds[k]||0),0);
    const st=p.streak&&(p.streak.last===today()||p.streak.last===y)?p.streak.n||0:0;
    const lastLog=p.log&&p.log.length?p.log[p.log.length-1].ts:0;
    const done=(p.sessions||[]).filter(s=>s.done);
    const ls=done[done.length-1];
    return {name:p.name,klass:p.klass||'',grade:p.grade||'',stars:p.stars||0,rounds:rounds,streak:st,
      last:lastLog?fmtDate(lastLog):'sem atividade',areas:areaRounds(p),proj:projsDone(p),nsess:done.length,lastSess:ls?fmtDate(ls.ts)+' (Forma '+ls.form+')':'nenhuma'};
  }).sort((x,z)=>x.name.localeCompare(z.name,'pt-BR'));
}
const AREA_KEYS=['letras','leitura','contas','relogio','dinheiro','formas','mente','puzzle','ingles'];
const AREA_NAME={letras:'Letras',leitura:'Leitura',contas:'Números',relogio:'Relógios',dinheiro:'Dinheiro',formas:'Cores e formas',mente:'Mente',puzzle:'Quebra-cabeças',ingles:'Inglês'};
function areaRounds(p){const o={};AREA_KEYS.forEach(k=>{o[k]=0;});Object.keys(p.rounds||{}).forEach(k=>{const a=k.split(':')[0];if(a in o)o[a]+=(+p.rounds[k]||0);});return o;}
function projsDone(p){return Object.keys(p.proj||{}).filter(k=>p.proj[k]&&p.proj[k].fin).length;}
screens.turma=m=>{
  if(!P)return go('who');
  const ts=turmas(),rows=turmaRows();
  const tot=rows.reduce((s,r)=>s+r.rounds,0),ativos=rows.filter(r=>r.last===fmtDate(Date.now())).length;
  m.innerHTML=`<div class="noprint">${backBtn('parents')}<h2 class="mtitle" style="--c:var(--c-letras)">Relatório da turma</h2>
  <div class="panel"><label class="fl" for="tSel">Turma</label><select id="tSel" class="inp"><option value="">Todos os alunos</option>${ts.map(t=>`<option value="${esc(t)}"${t===TSEL?' selected':''}>${esc(t)}</option>`).join('')}</select>
  ${ts.length?'':'<p class="hint">Nenhum aluno tem turma cadastrada. Preencha o campo “Turma” em Editar aluno para separar por turma.</p>'}
  <div class="row" style="--c:var(--c-letras)"><button class="btn primary" data-act="print">Imprimir</button><button class="btn" data-act="tcsv">Baixar planilha (CSV)</button><button class="btn" data-go="escola">Painel da escola</button></div>
  <p class="hint">Imprimir e baixar funcionam quando o aplicativo está aberto no navegador. O relatório mostra nomes dos alunos: guarde e compartilhe com cuidado.</p></div></div>
  <div class="sheet"><h2>Relatório da turma</h2><p class="foot" style="margin:0">Mundo das Descobertas · ${TSEL?esc(TSEL):'todos os alunos'} · gerado em ${fmtDate(Date.now())}</p>
  <div class="meta"><div><b>Alunos:</b> ${rows.length}</div><div><b>Rodadas completas (total):</b> ${tot}</div><div><b>Com atividade hoje:</b> ${ativos}</div></div>
  <div class="tw"><table><thead><tr><th>Aluno</th><th>Turma</th><th>Ano</th><th>Estrelas</th><th>Rodadas</th><th>Dias seguidos</th><th>Última atividade</th><th>Avaliações guiadas</th></tr></thead><tbody>
  ${rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.klass)||'—'}</td><td>${esc(r.grade)||'—'}</td><td>${r.stars}</td><td>${r.rounds}</td><td>${r.streak}</td><td>${esc(r.last)}</td><td>${r.nsess?r.nsess+', última em '+esc(r.lastSess):'nenhuma'}</td></tr>`).join('')||'<tr><td colspan="8">Nenhum aluno.</td></tr>'}</tbody></table></div>
  <h3>Rodadas completas por área</h3><div class="tw"><table><thead><tr><th>Aluno</th>${AREA_KEYS.map(k=>`<th>${AREA_NAME[k]}</th>`).join('')}<th>Projetos concluídos</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.name)}</td>${AREA_KEYS.map(k=>`<td>${r.areas[k]}</td>`).join('')}<td>${r.proj}</td></tr>`).join('')||'<tr><td colspan="11">Nenhum aluno.</td></tr>'}</tbody></table></div>
  <p class="foot">Dados registrados neste aparelho. Este quadro mostra uso e participação; não substitui a avaliação individual nem tem valor de diagnóstico.</p></div>`;
  $('#tSel',m).onchange=e=>{TSEL=e.target.value;render();};
};
actions.tcsv=()=>{
  const rows=[['aluno','turma','ano','estrelas','rodadas_completas','dias_seguidos','ultima_atividade','avaliacoes_guiadas','ultima_avaliacao'].concat(AREA_KEYS.map(k=>'rodadas_'+AREA_NAME[k].toLowerCase().replace(/\W+/g,'_')),['projetos_concluidos'])];
  turmaRows().forEach(r=>rows.push([r.name,r.klass,r.grade,r.stars,r.rounds,r.streak,r.last,r.nsess,r.nsess?r.lastSess:''].concat(AREA_KEYS.map(k=>r.areas[k]),[r.proj])));
  const csv='﻿'+rows.map(r=>r.map(c=>'"'+String(c==null?'':c).replace(/"/g,'""')+'"').join(';')).join('\r\n');
  try{const b=new Blob([csv],{type:'text/csv;charset=utf-8'}),x=document.createElement('a');x.href=URL.createObjectURL(b);x.download='turma-'+(TSEL||'todos').replace(/\W+/g,'-')+'.csv';document.body.appendChild(x);x.click();x.remove();}catch(e){}
};
screens.report=(m,arg)=>{
  if(!P)return go('who');
  const sel=repSel(arg);RSEL=sel;
  const R=buildReport(sel);
  const ss=P.sessions.filter(s=>P.log.some(e=>e.sid===s.id)).slice().reverse();
  const opts=ss.map(s=>`<option value="${s.id}"${s.id===sel?' selected':''}>Avaliação guiada de ${fmtDate(s.ts)} (Forma ${s.form})${s.done?'':', parcial'}</option>`).join('')
    +`<option value="free"${sel==='free'?' selected':''}>Só a prática livre</option><option value="all"${sel==='all'?' selected':''}>Todos os registros</option>`;
  m.innerHTML=`<div class="noprint">${backBtn('parents')}<h2 class="mtitle" style="--c:var(--c-letras)">Relatório de ${esc(P.name)}</h2>
  <div class="panel"><label class="fl" for="repSel">Quais registros incluir</label><select id="repSel" class="inp">${opts}</select>
  <div class="row" style="--c:var(--c-letras)"><button class="btn primary" data-act="print">Imprimir</button><button class="btn" data-act="copy">Copiar texto</button><button class="btn" data-act="csv">Baixar planilha (CSV)</button></div>
  <p class="hint">Imprimir e baixar funcionam quando o aplicativo está aberto no navegador, por exemplo no endereço publicado no Netlify. Dentro do Claude esses botões podem não responder; use “Copiar texto”.</p>
  <textarea id="copyBox" class="inp" rows="8" readonly hidden aria-label="Texto do relatório"></textarea></div></div>${sheetHTML(R)}`;
  $('#repSel',m).onchange=e=>go('report',{sel:e.target.value},{replace:true});
  [['by','rp-by','pn-by'],['beh','rp-beh','pn-beh'],['obs','rp-obs','pn-obs']].forEach(a=>{
    const el=$('#'+a[1],m),pn=$('#'+a[2],m);
    el.oninput=()=>{P.rep[a[0]]=el.value;pn.textContent=el.value;save();};
  });
};
actions.print=()=>{try{window.print();}catch(e){}};
actions.copy=()=>{
  const t=reportText(buildReport(RSEL)),box=$('#copyBox');
  const fb=()=>{box.hidden=false;box.value=t;box.focus();box.select();};
  try{navigator.clipboard.writeText(t).then(()=>{const b=$('[data-act="copy"]');if(b)b.textContent='Copiado!';},fb);}catch(e){fb();}
};
actions.csv=()=>{
  const rows=[['data_hora','aplicacao','forma','modulo','atividade','area','item','resposta_esperada','acertou_1a_tentativa','tentativas','tempo_ms','usos_ouvir','apoio_0sozinha_1dica_2ajuda','respostas_erradas','pecas','trocas','trocas_minimas']];
  selEntries(RSEL).forEach(e=>{
    const s=P.sessions.find(x=>x.id===e.sid);
    rows.push([new Date(e.ts).toLocaleString('pt-BR'),s?fmtDate(s.ts):'pratica livre',s?s.form:'',e.mod,e.act,e.dom,e.lab,e.ans,
      isItem(e)?(e.ok1?'sim':'nao'):'',e.tries,e.ms,e.listens,e.sup==null?'':e.sup,(e.err||[]).join(' | '),e.pieces||'',e.moves==null?'':e.moves,e.minMoves==null?'':e.minMoves]);
  });
  const csv='﻿'+rows.map(r=>r.map(c=>'"'+String(c==null?'':c).replace(/"/g,'""')+'"').join(';')).join('\r\n');
  try{
    const b=new Blob([csv],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');
    a.href=URL.createObjectURL(b);a.download='registro-'+P.name.replace(/\W+/g,'-')+'.csv';
    document.body.appendChild(a);a.click();a.remove();
  }catch(e){}
};


/* ========== área dos adultos ========== */
function applyPrefs(){
  const c=document.body.classList;
  c.toggle('upper',!!S.upper);c.toggle('big',!!S.big);c.toggle('legible',!!S.legible);
  c.toggle('no-anim',!S.anim);c.toggle('no-masc',!S.masc);c.toggle('no-dots',!S.dots);
}
const PT=(k,label)=>`<button data-act="pref" data-k="${k}" aria-pressed="${!!S[k]}">${label}</button>`;
const PO=(k,v,label)=>`<button data-act="setpref" data-k="${k}" data-v='${JSON.stringify(v)}' aria-pressed="${JSON.stringify(S[k])===JSON.stringify(v)}">${label}</button>`;
screens.parents=m=>{
  if(!P)return go('who');
  const pt=voices.filter(v=>/^pt/i.test(v.lang)).length,en=voices.filter(v=>/^en/i.test(v.lang)).length;
  const ns=P.sessions.filter(s=>P.log.some(e=>e.sid===s.id)).length;
  m.innerHTML=`${backBtn('home')}<h2 class="mtitle" style="--c:var(--c-letras)">Área dos adultos</h2><p class="msub">Avaliação, relatório e ajustes de ${esc(P.name)}. Cada aluno tem as próprias configurações, salvas neste aparelho.</p>${updBarHTML()}
  <div class="panel"><h3>Avaliação e relatório</h3><p>Para avaliar outra criança, use “Trocar aluno” na tela inicial.</p>
  <div class="row" style="--c:var(--c-letras)"><button class="btn primary" data-go="aval">Iniciar avaliação guiada</button><button class="btn" data-go="report">Ver e imprimir relatório</button><button class="btn" data-go="metas">Metas</button><button class="btn" data-go="turma">Relatório da turma</button><button class="btn" data-go="escola">Painel da escola</button></div>
  <p>${P.log.length} respostas registradas, ${ns} ${ns===1?'avaliação guiada':'avaliações guiadas'}.</p></div>
  <div class="panel"><h3>Alunos</h3>
  ${S.profiles.map(p=>`<div class="rowline"><span><b>${esc(p.name)}</b>${p.klass?' · '+esc(p.klass):''}${p.id===P.id?' (atual)':''}</span><button class="chip" data-go="pform" data-arg="${esc(JSON.stringify({id:p.id}))}">Editar</button></div>`).join('')}
  <div class="row"><button class="btn" data-go="pform">Cadastrar novo aluno</button></div></div>

  <details class="panel"><summary><h3>Senha dos adultos (PIN)</h3></summary><div id="pinBox"></div></details>

  <details class="panel"><summary><h3>Privacidade e dados</h3></summary>
  <p>Os dados ficam só neste aparelho. Leia como eles são tratados e saiba como apagá-los.</p>
  <div class="row" style="margin-top:0"><button class="btn" data-go="privacy" data-arg='{"from":"parents"}'>Privacidade e termos de uso</button></div>
  <button class="btn" data-act="wipeAsk" id="wipeAsk">Apagar todos os dados deste aparelho</button>
  <div id="wipeBox" hidden><p class="warn">Isso apaga todos os alunos, o progresso, os relatórios, o PIN e o aceite do aviso inicial deste aparelho. Não dá para desfazer. Antes, salve uma cópia de segurança se quiser guardar algo.</p><div class="row"><button class="btn" data-act="wipeYes">Sim, apagar tudo</button><button class="btn" data-act="wipeNo">Cancelar</button></div></div></details>

  <details class="panel"><summary><h3>Cópia de segurança</h3></summary>
  <p>Salve um arquivo com todos os alunos, progresso, relatórios e configurações deste aparelho. O arquivo tem dados pessoais de criança: guarde em local protegido e não compartilhe em grupos. O PIN não entra no arquivo. Para trocar de celular ou recuperar dados, use “Restaurar”.</p>
  <div class="row" style="margin-top:0"><button class="btn primary" data-act="bkExport">Salvar cópia de segurança</button><label class="btn" for="bkFile" style="cursor:pointer">Restaurar de um arquivo</label><input type="file" id="bkFile" accept=".json,application/json" hidden></div>
  <p id="bkLast">${esc(bkLastText())}</p><p id="bkMsg" role="status" aria-live="polite"></p><div id="bkPlan"></div>
  <p>Ao restaurar, aparece uma prévia. Nada é apagado: alunos novos são adicionados e, para quem já existe aqui, fica a versão com atividade mais recente.</p></details>

  <details class="panel" open><summary><h3>Conforto sensorial</h3></summary>
  <p>Escolha o que fica ligado para esta criança. Tudo é opcional.</p>
  <div class="row" style="margin-top:0"><button class="btn" data-act="calmOn">Modo calmo (sem sons, confete, animações e fundo)</button><button class="btn" data-act="defaults">Restaurar padrão</button></div>
  <div class="seg">${PT('fx','Sons de efeito')}${PT('conf','Confete')}${PT('anim','Animações')}${PT('masc','Mascote')}${PT('dots','Fundo com bolinhas')}</div>
  <label class="fl" for="vol">Volume dos sons e da voz</label><input type="range" id="vol" min="0" max="1" step="0.1" value="${S.vol}" aria-label="Volume">
  <label class="fl" for="rate">Velocidade da voz</label><input type="range" id="rate" min="0.6" max="1.1" step="0.05" value="${S.rate}" aria-label="Velocidade da voz"><p id="rateV">Velocidade: ${Number(S.rate).toFixed(2)}x. Mais devagar costuma ajudar a acompanhar.</p>
  <div class="row" style="margin-top:0"><button class="btn" data-act="testpt">${ICON.speaker}<span>Testar em português</span></button><button class="btn" data-act="testen">${ICON.speaker}<span>Testar em inglês</span></button></div>
  <p>${hasTTS?`Vozes encontradas neste aparelho: ${pt} em português, ${en} em inglês.${pt===0?' Nenhuma voz em português do Brasil foi encontrada. Instale uma nas configurações de voz do aparelho.':''}`:'Este navegador não tem voz de leitura. Use o Chrome, Edge ou Safari atualizados.'}</p>
  <h3>Leitura e letras</h3><div class="seg">${PO('auto','listen','Voz só nas atividades de ouvir')}${PO('auto','all','Voz em todas as atividades')}</div>
  <div class="seg">${PO('upper',true,'MAIÚSCULAS')}${PO('upper',false,'minúsculas')}${PT('big','Tudo maior')}${PT('legible','Letra de fácil leitura')}</div>
  </details>

  <details class="panel"><summary><h3>Pausa e rotina visual</h3></summary>
  <div class="seg">${PT('pausebtn','Botão de pausa sempre visível')}</div>
  <p>Duração da contagem na tela de pausa. A criança pode voltar quando quiser; a contagem é só uma barra, sem alarme.</p>
  <div class="seg">${PO('pauseSec',0,'Sem contagem')}${PO('pauseSec',60,'1 min')}${PO('pauseSec',120,'2 min')}${PO('pauseSec',300,'5 min')}</div>
  <h3>Rotina de hoje (primeiro, depois)</h3>
  <p>Toque nas etapas na ordem em que devem acontecer. Elas aparecem na tela inicial com “Agora” e “Depois”.</p>
  <div class="seg">${Object.keys(ROUTINE_STEPS).map(k=>{const i=P.routine.indexOf(k);return `<button data-act="rt" data-k="${k}" data-l="${esc(ROUTINE_STEPS[k][1])}" aria-pressed="${i>=0}">${i>=0?(i+1)+'. ':''}${esc(ROUTINE_STEPS[k][1])}</button>`;}).join('')}</div>
  <div class="row" style="margin-top:0"><button class="btn" data-act="rtClear">Limpar rotina</button></div>
  </details>

  <details class="panel"><summary><h3>Interesses e reforço</h3></summary>
  <p>O interesse da criança aparece nas contas, nas palavras para ler, na memória e nos padrões. Na avaliação guiada os itens continuam sempre os mesmos.</p>
  <div class="seg">${INTERESTS.map(i=>PO('interest',i[0],i[2]+' '+i[1])).join('')}</div>
  <h3>Como celebrar os acertos</h3>
  <div class="seg">${PO('reinf','stars','Estrelas e confete')}${PO('reinf','tokens','Quadro de fichas')}${PO('reinf','none','Sem reforço visual')}</div>
  <p>No quadro de fichas, cada acerto de primeira vale uma ficha (a figura do interesse da criança). Ao completar, aparece a recompensa combinada.</p>
  <label class="fl" for="goalT">Fichas para completar o quadro</label>
  <div class="seg" id="goalT">${[3,5,8,10].map(n=>PO('goalTokens',n,String(n))).join('')}</div>
  <label class="fl" for="rw-text">Recompensa combinada</label>
  <input id="rw-text" class="inp" maxlength="60" value="${esc(S.reward)}">
  <div class="row" style="margin-top:0"><button class="btn" data-act="tokReset">Zerar fichas de agora</button></div>
  </details>

  <details class="panel"><summary><h3>Apoio do adulto e atividades</h3></summary>
  <p>No modo mediado aparecem, em cada pergunta, os botões “Sozinha(o)”, “Com dica” e “Com ajuda”. O nível escolhido entra no relatório.</p>
  <div class="seg">${PT('mediated','Modo mediado')}${PT('fewOpts','Menos opções (2 por pergunta)')}</div>
  <p>“Menos opções” vale só para a prática livre. Na avaliação guiada as perguntas não mudam.</p>
  </details>

  <details class="panel"><summary><h3>Tema deste aluno</h3></summary><div class="seg">
  <button data-act="skin" data-v="mundo" aria-pressed="${P.skin==='mundo'}">Mundo das Descobertas</button>
  <button data-act="skin" data-v="algodao" aria-pressed="${P.skin==='algodao'}">Algodão-doce</button>
  <button data-act="skin" data-v="aventura" aria-pressed="${P.skin==='aventura'}">Aventura</button></div></details>

  <details class="panel"><summary><h3>Zerar estrelas</h3></summary><p>Apaga as estrelas e as rodadas de ${esc(P.name)}. O histórico de respostas e os relatórios continuam.</p>
  <button class="btn" data-act="resetAsk" id="resetAsk">Zerar estrelas</button>
  <div id="resetBox" hidden><p class="warn">Tem certeza? Isso apaga todas as estrelas.</p><div class="row"><button class="btn" data-act="resetYes">Sim, zerar</button><button class="btn" data-act="resetNo">Cancelar</button></div></div></details>`;
  if(!(PINMODE==='code'&&RECOV))PINMODE='idle';
  renderPinBox();
  $('#rate',m).oninput=e=>{S.rate=+e.target.value;save();$('#rateV',m).textContent='Velocidade: '+S.rate.toFixed(2)+'x. Mais devagar costuma ajudar a acompanhar.';};
  $('#vol',m).oninput=e=>{S.vol=+e.target.value;save();};
  $('#rw-text',m).oninput=e=>{S.reward=e.target.value;save();};
};
function syncAdult(){
  $$('[data-act="pref"]').forEach(b=>b.setAttribute('aria-pressed',String(!!S[b.dataset.k])));
  $$('[data-act="setpref"]').forEach(b=>b.setAttribute('aria-pressed',String(JSON.stringify(S[b.dataset.k])===b.dataset.v)));
  $$('[data-act="rt"]').forEach(b=>{const i=P.routine.indexOf(b.dataset.k);b.setAttribute('aria-pressed',String(i>=0));b.textContent=(i>=0?(i+1)+'. ':'')+b.dataset.l;});
  $$('[data-act="skin"]').forEach(b=>b.setAttribute('aria-pressed',String(P.skin===b.dataset.v)));
  const v=$('#vol');if(v)v.value=S.vol;
}
actions.pref=b=>{const k=b.dataset.k;S[k]=!S[k];save();applyPrefs();syncAdult();};
actions.setpref=b=>{S[b.dataset.k]=JSON.parse(b.dataset.v);save();applyPrefs();syncAdult();};
actions.calmOn=()=>{S.calm=true;save();applyPrefs();syncAdult();};
actions.defaults=()=>{['fx','conf','anim','masc','dots','vol'].forEach(k=>{S[k]=DEFAULT_PREFS[k];});save();applyPrefs();syncAdult();};
actions.rt=b=>{const k=b.dataset.k,i=P.routine.indexOf(k);if(i>=0)P.routine.splice(i,1);else if(P.routine.length<6)P.routine.push(k);save();syncAdult();};
actions.rtClear=()=>{P.routine=[];save();syncAdult();};
actions.tokReset=()=>{P.tokens.n=0;save();};
actions.sound=()=>{S.sound=!S.sound;save();if(!S.sound)stopSpeech();const h=$('.top');if(h)h.outerHTML=headerHTML();};
actions.testpt=()=>say({t:'Olá! Eu sou a voz do aplicativo. Vamos aprender juntos?'});
actions.testen=()=>say({t:'Hello! Let us learn together.',lang:'en-US'});
actions.resetAsk=b=>{b.hidden=true;$('#resetBox').hidden=false;};
actions.resetNo=()=>{$('#resetAsk').hidden=false;$('#resetBox').hidden=true;};
actions.resetYes=()=>{if(P){P.stars=0;P.rounds={};P.day={d:'',m:{}};P.tokens={n:0};save();}go('home',undefined,{replace:true});};
actions.pause=()=>startPause();
actions.step=b=>{
  const k=b.dataset.k;
  if(MODS[k]){go('menu',k);return;}
  if(k==='pausa')startPause(()=>rdone('pausa'));else startBreak(()=>rdone('brincar'));
};

/* ========== metas individuais ========== */
screens.metas=m=>{
  if(!P)return go('who');
  const stat=g=>goalStatus(g);
  m.innerHTML=`${backBtn('parents')}<h2 class="mtitle" style="--c:var(--c-letras)">Metas de ${esc(P.name)}</h2>
  <p class="msub">Metas individuais que entram no relatório (por exemplo, as do PEI ou do plano de acompanhamento). Quando a meta está ligada a uma área do app, o progresso é calculado pelas avaliações guiadas.</p>
  <div class="panel"><h3>Nova meta</h3>
  <label class="fl" for="g-text">Descrição</label><input id="g-text" class="inp" maxlength="120" placeholder="Ex.: Reconhecer todas as letras do alfabeto">
  <label class="fl" for="g-dom">Área do app ligada à meta</label>
  <select id="g-dom" class="inp"><option value="">Sem ligação (acompanho à mão)</option>${DOMS.filter(d=>d[0]!=='ing').map(d=>`<option value="${d[0]}">${esc(d[1])}</option>`).join('')}</select>
  <label class="fl" for="g-tg">Meta de acertos sozinha(o) na 1ª tentativa</label>
  <select id="g-tg" class="inp"><option value="60">60%</option><option value="80" selected>80%</option><option value="100">100%</option></select>
  <p class="warn" id="g-err" hidden>Escreva a descrição da meta.</p>
  <div class="row"><button class="btn primary" data-act="gadd" style="--c:var(--c-letras)">Adicionar meta</button></div></div>
  <div class="panel"><h3>Metas cadastradas</h3>
  ${P.goals.length?P.goals.map(g=>`<div class="goal"><div><b>${esc(g.text)}</b><small>${g.dom?esc(domName(g.dom))+' · meta '+g.target+'%':'Acompanhamento manual'} · ${esc(stat(g))}</small></div>
    ${g.dom?'':`<select class="inp gst" data-id="${esc(g.id)}" aria-label="Situação da meta"><option value="iniciar"${g.status==='iniciar'||!g.status?' selected':''}>Não iniciada</option><option value="andamento"${g.status==='andamento'?' selected':''}>Em andamento</option><option value="atingida"${g.status==='atingida'?' selected':''}>Atingida</option></select>`}
    <button class="chip" data-act="gdel" data-id="${esc(g.id)}">Remover</button></div>`).join(''):'<p>Nenhuma meta cadastrada ainda.</p>'}</div>`;
  $$('.gst',m).forEach(s=>s.onchange=()=>{const g=P.goals.find(x=>x.id===s.dataset.id);if(g){g.status=s.value;save();}});
};
actions.gadd=()=>{
  const t=$('#g-text').value.trim();
  if(!t){$('#g-err').hidden=false;$('#g-text').focus();return;}
  P.goals.push({id:'g'+Date.now().toString(36),text:t,dom:$('#g-dom').value,target:+$('#g-tg').value,status:'iniciar',created:Date.now()});
  save();screens.metas($('#main'));
};
actions.gdel=b=>{P.goals=P.goals.filter(g=>g.id!==b.dataset.id);save();screens.metas($('#main'));};


/* --- tema --- */
function applySkin(){document.documentElement.setAttribute('data-skin',normSkin(S.skin));document.body.classList.toggle('mundo',normSkin(S.skin)==='mundo');}
screens.skin=m=>{
  m.innerHTML=`<section class="hero"><h1>Quem vai estudar?</h1><p>Escolha o tema. Dá para trocar quando quiser.</p></section>
  <div class="skins">
<button class="skincard" data-act="skin" data-v="mundo" style="background:linear-gradient(160deg,#8EC9FF,#3F86F0);color:#0F1F66"><span class="sk-emo" aria-hidden="true">🦫🌎⭐</span><b>Mundo das Descobertas</b><small>Céu azul e a capivara Capi</small></button>
    <button class="skincard" data-act="skin" data-v="algodao" style="background:linear-gradient(135deg,#FFD3E8,#FF9CC9);color:#5A1F42"><span class="sk-emo" aria-hidden="true">🎀🍭🦄</span><b>Algodão-doce</b><small>Tudo em tons de rosa</small></button>
  <button class="skincard" data-act="skin" data-v="aventura" style="background:linear-gradient(135deg,#1B3A6B,#0B7285);color:#FFFFFF"><span class="sk-emo" aria-hidden="true">🦖🚀⚽</span><b>Aventura</b><small>Azul, verde e laranja</small></button>
  </div>`;
};
actions.skin=b=>{S.skin=normSkin(b.dataset.v);save();applySkin();sceneIdx=0;sfx.ok();if(view.name==='parents')syncAdult();else go('home',undefined,{replace:true});};
actions.skinpick=()=>go('skin');

/* ========== privacidade (v22) e PIN dos adultos (v23) ========== */
const SHA_K=[],SHA_H=[];
(function(){
  const pr=[];for(let n=2;pr.length<64;n++){let ok=true;for(let d=2;d*d<=n;d++)if(n%d===0){ok=false;break;}if(ok)pr.push(n);}
  const fr=x=>Math.floor((x-Math.floor(x))*4294967296);
  pr.forEach(p=>SHA_K.push(fr(Math.pow(p,1/3))|0));
  pr.slice(0,8).forEach(p=>SHA_H.push(fr(Math.sqrt(p))|0));
})();
function utf8Bytes(s){
  const o=[];
  for(let i=0;i<s.length;i++){
    let c=s.charCodeAt(i);
    if(c>=0xd800&&c<0xdc00&&i+1<s.length)c=0x10000+((c-0xd800)<<10)+(s.charCodeAt(++i)-0xdc00);
    if(c<128)o.push(c);else if(c<2048)o.push(192|c>>6,128|c&63);
    else if(c<65536)o.push(224|c>>12,128|c>>6&63,128|c&63);
    else o.push(240|c>>18,128|c>>12&63,128|c>>6&63,128|c&63);
  }
  return o;
}
function sha256(str){
  const m=utf8Bytes(str),l=m.length;
  m.push(0x80);while(m.length%64!==56)m.push(0);
  const hi=Math.floor(l*8/4294967296),lo=(l*8)>>>0;
  m.push(hi>>>24&255,hi>>>16&255,hi>>>8&255,hi&255,lo>>>24&255,lo>>>16&255,lo>>>8&255,lo&255);
  let h=SHA_H.slice();const w=new Array(64);
  for(let o=0;o<m.length;o+=64){
    for(let i=0;i<16;i++)w[i]=(m[o+4*i]<<24|m[o+4*i+1]<<16|m[o+4*i+2]<<8|m[o+4*i+3])|0;
    for(let i=16;i<64;i++){
      const a=w[i-15],b=w[i-2];
      const s0=(a>>>7|a<<25)^(a>>>18|a<<14)^(a>>>3),s1=(b>>>17|b<<15)^(b>>>19|b<<13)^(b>>>10);
      w[i]=(w[i-16]+s0+w[i-7]+s1)|0;
    }
    let a=h[0],b=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],k=h[7];
    for(let i=0;i<64;i++){
      const e1=(e>>>6|e<<26)^(e>>>11|e<<21)^(e>>>25|e<<7),ch=(e&f)^(~e&g),t1=(k+e1+ch+SHA_K[i]+w[i])|0;
      const a1=(a>>>2|a<<30)^(a>>>13|a<<19)^(a>>>22|a<<10),mj=(a&b)^(a&c)^(b&c),t2=(a1+mj)|0;
      k=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;
    }
    h=[h[0]+a|0,h[1]+b|0,h[2]+c|0,h[3]+d|0,h[4]+e|0,h[5]+f|0,h[6]+g|0,h[7]+k|0];
  }
  return h.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('');
}
function randBytes(n){
  const a=new Uint8Array(n);
  try{crypto.getRandomValues(a);}catch(e){for(let i=0;i<n;i++)a[i]=Math.floor(Math.random()*256);}
  return a;
}
const randHex=n=>Array.prototype.map.call(randBytes(n),x=>x.toString(16).padStart(2,'0')).join('');
function hashPin(pin,salt){
  let h=sha256(salt+':'+pin);
  for(let i=0;i<1000;i++)h=sha256(h+salt+pin);
  return h;
}
const CODE_CH='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCode(){
  const b=randBytes(12);let s='';
  for(let i=0;i<12;i++){s+=CODE_CH[b[i]%CODE_CH.length];if(i%4===3&&i<11)s+='-';}
  return s;
}
const normCode=c=>String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const pinOk=v=>/^\d{4,6}$/.test(v);
const checkPin=v=>!!(S.pin&&pinOk(v)&&hashPin(v,S.pin.s)===S.pin.h);
const checkCode=c=>!!(S.pin&&S.pin.rh&&normCode(c).length===12&&hashPin(normCode(c),S.pin.rs)===S.pin.rh);
function setPin(pin){
  const code=genCode(),s=randHex(16),rs=randHex(16);
  S.pin={s:s,h:hashPin(pin,s),rs:rs,rh:hashPin(normCode(code),rs)};
  save();return code;
}
function newCode(){
  const code=genCode(),rs=randHex(16);
  S.pin.rs=rs;S.pin.rh=hashPin(normCode(code),rs);save();return code;
}

/* bloqueio das telas de adultos */
const ADULT_V=['parents','report','metas','aval','avalrun','pform','turma','escola'];
const NEUTRAL_V=['pin','privacy','intro'];
const PIN_IDLE_MS=10*60*1000,PIN_LOCK_MS=30000,PIN_MAX=5;
let UNLOCK=false,ULAST=0,PIN_DEST=null,PINMODE='idle',PINNOTE='',PIN_TIMER=null;
function adultOk(){return UNLOCK&&(view.name==='avalrun'||Date.now()-ULAST<PIN_IDLE_MS);}
function gateAdult(){
  if(NEUTRAL_V.indexOf(view.name)>=0)return;
  if(ADULT_V.indexOf(view.name)<0){UNLOCK=false;return;}
  if(!S.pin)return;
  if(adultOk()){ULAST=Date.now();return;}
  PIN_DEST={name:view.name,arg:view.arg};
  view={name:'pin'};
}
const pinFail=()=>S.pinFail||(S.pinFail={n:0,until:0});
const lockLeft=()=>Math.max(0,Math.ceil((((S.pinFail&&S.pinFail.until)||0)-Date.now())/1000));
function pinUnlocked(){
  UNLOCK=true;ULAST=Date.now();
  const f=pinFail();f.n=0;f.until=0;save();
  const d=PIN_DEST||{name:'parents'};PIN_DEST=null;
  go(d.name,d.arg,{replace:true});
}
function pinMsg(t,bad){const e=$('#pin-err');if(!e)return;e.textContent=t;e.hidden=!t;e.classList.toggle('warn',!!bad);}
function pinTick(){
  clearTimeout(PIN_TIMER);
  const e=$('#pin-err');if(!e||view.name!=='pin')return;
  const s=lockLeft();
  $$('[data-act="pinGo"],[data-act="pinRecover"]').forEach(b=>{b.disabled=s>0;});
  if(s>0){pinMsg('Muitas tentativas erradas. Espere '+s+' segundo'+(s===1?'':'s')+' para tentar de novo.',true);PIN_TIMER=setTimeout(pinTick,1000);}
  else if(e.dataset.lock){delete e.dataset.lock;pinMsg('');}
}
function pinWrong(what){
  const f=pinFail();f.n++;
  if(f.n>=PIN_MAX){f.n=0;f.until=Date.now()+PIN_LOCK_MS;save();const e=$('#pin-err');if(e)e.dataset.lock='1';pinTick();return;}
  save();pinMsg(what+' incorreto. Restam '+(PIN_MAX-f.n)+' tentativa'+(PIN_MAX-f.n===1?'':'s')+' antes de esperar.',true);
}
screens.pin=m=>{
  m.innerHTML=`${backBtn('home')}<h2 class="mtitle" style="--c:var(--c-letras)">Área dos adultos</h2><p class="msub">Digite a senha dos adultos (PIN) para continuar.</p>
  <div class="panel"><label class="fl" for="pin-in">PIN</label>
  <input id="pin-in" class="inp pinin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off">
  <p class="warn" id="pin-err" role="alert" hidden></p>
  <div class="row" style="--c:var(--c-letras)"><button class="btn primary" data-act="pinGo">Entrar</button><button class="btn" data-act="pinForgot">Esqueci o PIN</button></div>
  <div id="pin-rec" hidden><p class="hint">Digite o código de recuperação que apareceu quando o PIN foi criado. Ao usar o código, o PIN é removido e você pode criar outro.</p>
  <label class="fl" for="rec-in">Código de recuperação</label><input id="rec-in" class="inp" maxlength="14" autocomplete="off" placeholder="XXXX-XXXX-XXXX" autocapitalize="characters">
  <div class="row"><button class="btn" data-act="pinRecover">Usar código e remover o PIN</button></div></div></div>`;
  $('#pin-in',m).addEventListener('keydown',e=>{if(e.key==='Enter')actions.pinGo();});
  $('#rec-in',m).addEventListener('keydown',e=>{if(e.key==='Enter')actions.pinRecover();});
  pinTick();
};
actions.pinGo=()=>{
  if(lockLeft()>0)return pinTick();
  const v=$('#pin-in').value;
  if(checkPin(v))pinUnlocked();else{$('#pin-in').value='';pinWrong('PIN');}
};
actions.pinForgot=()=>{$('#pin-rec').hidden=false;$('#rec-in').focus();};
actions.pinRecover=()=>{
  if(lockLeft()>0)return pinTick();
  if(checkCode($('#rec-in').value)){S.pin=null;PINNOTE='O PIN foi removido pelo código de recuperação. Crie um novo PIN abaixo.';pinUnlocked();}
  else pinWrong('Código');
};

/* painel do PIN na área dos adultos */
function pinField(id,label){return `<label class="fl" for="${id}">${label}</label><input id="${id}" class="inp pinin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off">`;}
let RECOV='';
function renderPinBox(){
  const b=$('#pinBox');if(!b)return;
  const has=!!S.pin,note=PINNOTE?`<p class="hint" role="status">${esc(PINNOTE)}</p>`:'';PINNOTE='';
  const btns=(ok,okLabel)=>`<div class="row" style="margin-top:0"><button class="btn primary" data-act="pinSubmit" style="--c:var(--c-letras)">${okLabel}</button><button class="btn" data-act="pinMode" data-m="idle">Cancelar</button></div>`;
  let h='';
  if(PINMODE==='code'){
    h=`<p><b>Anote este código de recuperação agora.</b> Ele aparece só desta vez. Se esquecer o PIN, é com ele que você entra de novo.</p>
    <p class="reccode" id="recShown">${esc(RECOV)}</p><p class="hint">Guarde em papel ou em local seguro, longe da criança.</p>
    <div class="row" style="margin-top:0"><button class="btn primary" data-act="pinDone" style="--c:var(--c-letras)">Anotei o código</button></div>`;
  }else if(PINMODE==='create'){
    h=`<p>Escolha de 4 a 6 números. O aplicativo vai pedir o PIN para abrir a área dos adultos.</p>${pinField('pin-a','Novo PIN')}${pinField('pin-b','Repita o PIN')}<p class="warn" id="pinBoxErr" role="alert" hidden></p>${btns(0,'Criar PIN')}`;
  }else if(PINMODE==='change'){
    h=`${pinField('pin-c','PIN atual')}${pinField('pin-a','Novo PIN (4 a 6 números)')}${pinField('pin-b','Repita o novo PIN')}<p class="warn" id="pinBoxErr" role="alert" hidden></p>${btns(0,'Alterar PIN')}`;
  }else if(PINMODE==='newcode'){
    h=`<p>Gera um código novo. O código antigo deixa de valer.</p>${pinField('pin-c','PIN atual')}<p class="warn" id="pinBoxErr" role="alert" hidden></p>${btns(0,'Gerar novo código')}`;
  }else if(PINMODE==='remove'){
    h=`<p>Sem PIN, qualquer pessoa que usar o aparelho abre a área dos adultos.</p>${pinField('pin-c','PIN atual')}<p class="warn" id="pinBoxErr" role="alert" hidden></p>${btns(0,'Remover o PIN')}`;
  }else{
    h=has?`<p>O PIN está <b>ativo</b>. A área dos adultos, o relatório, as metas, a avaliação guiada e o cadastro de alunos pedem o PIN.</p>
    <div class="row" style="margin-top:0"><button class="btn" data-act="pinMode" data-m="change">Alterar PIN</button><button class="btn" data-act="pinMode" data-m="newcode">Novo código de recuperação</button><button class="btn" data-act="pinMode" data-m="remove">Remover PIN</button></div>`
    :`<p>Ainda não há PIN. Com um PIN de 4 a 6 números, a criança não consegue abrir sozinha a área dos adultos, o relatório e a avaliação.</p>
    <div class="row" style="margin-top:0"><button class="btn primary" data-act="pinMode" data-m="create" style="--c:var(--c-letras)">Criar PIN</button></div>`;
  }
  b.innerHTML=note+h;
}
actions.pinMode=b=>{PINMODE=b.dataset.m;renderPinBox();const f=$('#pin-c')||$('#pin-a');if(f)f.focus();};
actions.pinDone=()=>{RECOV='';PINMODE='idle';renderPinBox();};
function pinBoxErr(t){const e=$('#pinBoxErr');if(e){e.textContent=t;e.hidden=false;}}
actions.pinSubmit=()=>{
  const g=id=>{const e=$('#'+id);return e?e.value:'';};
  const mode=PINMODE;
  if(mode==='create'||mode==='change'){
    if(mode==='change'&&!checkPin(g('pin-c')))return pinBoxErr('O PIN atual não confere.');
    if(!pinOk(g('pin-a')))return pinBoxErr('O novo PIN deve ter de 4 a 6 números, sem letras.');
    if(g('pin-a')!==g('pin-b'))return pinBoxErr('Os dois PINs não são iguais.');
    const code=setPin(g('pin-a'));UNLOCK=true;ULAST=Date.now();RECOV=code;PINMODE='code';renderPinBox();
  }else if(mode==='newcode'){
    if(!checkPin(g('pin-c')))return pinBoxErr('O PIN atual não confere.');
    RECOV=newCode();PINMODE='code';renderPinBox();
  }else if(mode==='remove'){
    if(!checkPin(g('pin-c')))return pinBoxErr('O PIN atual não confere.');
    S.pin=null;save();PINMODE='idle';PINNOTE='O PIN foi removido.';renderPinBox();
  }
};

/* apagar tudo */
let WIPED=false;
actions.wipeAsk=b=>{b.hidden=true;$('#wipeBox').hidden=false;};
actions.wipeNo=()=>{$('#wipeAsk').hidden=false;$('#wipeBox').hidden=true;};
actions.wipeYes=()=>{
  WIPED=true;
  try{localStorage.removeItem(KEY);}catch(e){}
  try{location.reload();}catch(e){}
};

/* aviso inicial e tela de privacidade */
screens.intro=m=>{
  if(S.privOk===PRIV_V)return go(P?'home':'who',undefined,{replace:true});
  m.innerHTML=`<section class="hero2"><div>${mascot('cheer')}</div><div class="bubble"><h1>Antes de começar</h1><p>Este aviso é para um adulto ler.</p></div></section>
  <div class="panel"><h2>O que você precisa saber</h2><ul class="plist">
    <li>O aplicativo é para crianças de 4 a 12 anos e deve ser usado com o conhecimento de um adulto responsável.</li>
    <li>Ele guarda o nome ou apelido da criança, as respostas, o progresso e as configurações. Também pode guardar data de nascimento, ano escolar e anotações, se você preencher.</li>
    <li>Tudo fica <b>somente neste aparelho</b>. Nada é enviado para um servidor do aplicativo e não há conta nem anúncios.</li>
    <li>Quem disponibiliza o aplicativo pode contar as visitas de forma anônima (sem cookies e sem identificar a criança), só para saber quantas pessoas o acessam. Os dados dos alunos não entram nessa contagem.</li>
    <li>Use apelido, sem sobrenome, CPF, endereço ou telefone. Dados de saúde só com autorização da família.</li>
    <li>Você pode apagar tudo quando quiser, na Área dos adultos.</li>
  </ul>
  <p class="hint">Se você não concordar, feche o aplicativo. Nada foi guardado até agora.</p>
  <div class="row" style="--c:var(--c-letras)"><button class="btn primary" data-act="privOk">Sou adulto, li e concordo</button><button class="btn" data-go="privacy" data-arg='{"from":"intro"}'>Ler privacidade e termos de uso</button></div></div>`;
};
actions.privOk=()=>{S.privOk=PRIV_V;save();go(P?'home':'who',undefined,{replace:true});};
const PRIV_SECS=[
 ['1. Quais dados o aplicativo guarda',['Nome ou apelido do aluno, respostas e tempos nas atividades, estrelas, figurinhas, avaliações guiadas, metas e configurações.','Se o adulto preencher: data de nascimento, ano escolar, anotações, ficha do aluno (anamnese) e observações do relatório.','O aplicativo não pede sobrenome, CPF, endereço, telefone, e-mail nem foto. Evite colocar esses dados nas anotações.']],
 ['2. Onde os dados ficam',['Somente neste aparelho, no armazenamento do navegador. O aplicativo não tem conta, login nem servidor próprio, e não envia os dados dos alunos para a internet.','Ao abrir o endereço do aplicativo, o serviço que o hospeda pode registrar acessos comuns (como o endereço de IP). Isso não inclui os dados dos alunos.','O responsável pelo aplicativo pode usar uma ferramenta de estatística de visitas que não usa cookies e não identifica a pessoa (conta acessos, tipo de aparelho e país). Ela não lê nem recebe nomes, respostas, progresso ou anotações dos alunos.','A voz de leitura usa o recurso do próprio aparelho. Em alguns aparelhos, o sistema de voz pode usar um serviço online do fabricante.']],
 ['3. Quem pode ver',['Quem usa este aparelho e este navegador. O PIN da Área dos adultos protege contra a criança, mas não contra quem tem conhecimento técnico e acesso ao aparelho.','Se outras pessoas usam o aparelho, mantenha cada aluno em um perfil com apelido.']],
 ['4. Consentimento (LGPD, art. 14)',['A Lei Geral de Proteção de Dados (Lei 13.709/2018) exige que dados de crianças sejam tratados no melhor interesse delas e, em geral, com consentimento específico de um dos pais ou do responsável legal.','Ao tocar em “Sou adulto, li e concordo”, você declara que é o responsável pela criança ou que foi autorizado pela família a cadastrá-la.']],
 ['5. Seus direitos',['Você pode corrigir os dados (Área dos adultos > Editar aluno), apagar o histórico de um aluno, excluir um aluno ou apagar todos os dados deste aparelho (Área dos adultos > Privacidade e dados).','Também pode pedir confirmação do que é tratado, acesso e eliminação dos dados, nos termos do art. 18 da LGPD, a quem disponibilizou o aplicativo.']],
 ['6. Relatórios e cópias de segurança',['Relatórios impressos, textos copiados, planilhas e arquivos de cópia de segurança contêm dados pessoais de criança. Guarde em local protegido e compartilhe só com a família e com profissionais envolvidos.','O relatório é um registro de apoio à observação. Não é diagnóstico e não substitui a avaliação de um profissional.']],
 ['7. Uso em escolas',['A escola ou a rede de ensino deve definir quem é responsável pelos dados, qual é a base legal e como as famílias são informadas. Se houver encarregado de dados (DPO), ele deve revisar este texto.','Em aparelhos compartilhados, use um perfil por aluno com apelido, ative o PIN e apague os dados quando o aparelho for devolvido. Dados de saúde ou laudos só com autorização da família e necessidade pedagógica.']],
 ['8. Proteção por PIN',['O PIN (4 a 6 números) bloqueia a Área dos adultos, o relatório, as metas, a avaliação guiada e o cadastro de alunos. Ele é guardado só como um código embaralhado (hash), nunca como número, e não entra na cópia de segurança.','Há um código de recuperação, mostrado uma única vez. Depois de 5 erros, o aplicativo espera 30 segundos para aceitar nova tentativa.']],
 ['9. Atualizações e contato',['Este texto pode mudar. Se a mudança alterar o uso dos dados, o aviso inicial aparece de novo para um novo aceite.','Este texto é um modelo de apoio e não substitui orientação jurídica.']]
];
screens.privacy=(m,arg)=>{
  const from=arg&&arg.from||(S.privOk===PRIV_V?(P?'parents':'who'):'intro'),H=S.privOk===PRIV_V?'h2':'h1';
  m.innerHTML=`${backBtn(from)}<${H} class="mtitle" style="--c:var(--c-letras)">Privacidade e termos de uso</${H}><p class="msub">Em linguagem simples, para adultos.</p>
  ${PRIV_SECS.map(s=>`<div class="panel"><h3>${s[0]}</h3>${s[1].map(t=>`<p>${esc(t)}</p>`).join('')}${s[0].charAt(0)==='9'?`<p>${PRIV_CONTACT?'Contato do responsável pelo aplicativo: '+esc(PRIV_CONTACT)+'.':'Para dúvidas e pedidos sobre dados, fale com quem disponibilizou o aplicativo (a família, a escola ou o responsável pela instalação).'}</p>`:''}</div>`).join('')}`;
};

/* ========== v38: Painel da escola (tudo continua só no aparelho, sem servidor) ========== */
const GRADE_LIST=['Educação infantil','1º ano','2º ano','3º ano','4º ano','5º ano','6º ano','7º ano','Outro / EJA / não seriado'];
function normGrade(s){
  s=String(s||'').trim().toLowerCase();if(!s)return '';
  if(/infantil|pr[eé]/.test(s))return GRADE_LIST[0];
  const m=s.match(/^(\d)\s*(º|°|o|ª|a)?\s*(ano)?$/);
  if(m&&+m[1]>=1&&+m[1]<=7)return GRADE_LIST[+m[1]];
  const hit=GRADE_LIST.find(g=>g.toLowerCase()===s);return hit||'';
}
function normBirth(s){
  s=String(s||'').trim();let y,m,d,x;
  if((x=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))){y=+x[1];m=+x[2];d=+x[3];}
  else if((x=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/))){d=+x[1];m=+x[2];y=+x[3];}
  else return '';
  const dt=new Date(y,m-1,d);
  if(dt.getFullYear()!==y||dt.getMonth()!==m-1||dt.getDate()!==d||y<2000||dt>new Date())return '';
  return y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
}
const cleanTxt=(s,n)=>String(s||'').replace(/[\u0000-\u001f<>"]/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
/* lista de turma: uma linha por aluno. Colunas: nome; turma; ano; nascimento (separadas por ; , ou tab) */
function parseRoster(text){
  const lines=String(text||'').split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const sep=lines.some(l=>l.indexOf(';')>=0)?';':lines.some(l=>l.indexOf('\t')>=0)?'\t':',';
  const seen=new Set(S.profiles.map(p=>(p.name||'').trim().toLowerCase()+'|'+(p.klass||'').trim().toLowerCase()));
  const out={rows:[],dup:0,bad:0,cut:0};
  lines.forEach((l,i)=>{
    const c=l.split(sep).map(x=>x.replace(/^"|"$/g,'').trim());
    if(i===0&&/^(nome|aluno|aluna|estudante|nome do aluno)$/i.test(c[0]))return;
    const name=cleanTxt(c[0],40);if(!name){out.bad++;return;}
    const klass=cleanTxt(c[1],30),key=name.toLowerCase()+'|'+klass.toLowerCase();
    if(seen.has(key)){out.dup++;return;}
    if(out.rows.length>=200){out.cut++;return;}
    seen.add(key);out.rows.push({name:name,klass:klass,grade:normGrade(c[2]),birth:normBirth(c[3])});
  });
  return out;
}
/* cópias de segurança */
function profTs(p){
  let t=0;const up=v=>{if(v>t)t=v;};
  (p.log||[]).forEach(e=>up(+e.ts||0));(p.sessions||[]).forEach(s=>up(+s.ts||0));
  [p.streak&&p.streak.last,p.day&&p.day.d,p.chal].forEach(d=>{if(d){const v=Date.parse(d+'T12:00:00');if(!isNaN(v))up(v);}});
  Object.keys(p.proj||{}).forEach(k=>((p.proj[k]&&p.proj[k].s)||[]).forEach(a=>{if(a&&a.d){const v=Date.parse(a.d+'T12:00:00');if(!isNaN(v))up(v);}}));
  return t;
}
const profRounds=p=>Object.keys(p.rounds||{}).reduce((s,k)=>s+(+p.rounds[k]||0),0);
function newerThan(a,b){
  const ta=profTs(a),tb=profTs(b);if(ta!==tb)return ta>tb;
  if((a.stars||0)!==(b.stars||0))return (a.stars||0)>(b.stars||0);
  return profRounds(a)>profRounds(b);
}
function bkPlan(st){
  const local=new Map(S.profiles.map(p=>[p.id,p]));
  const plan={add:[],upd:[],keep:[]};
  st.profiles.forEach(p=>{const l=local.get(p.id);if(!l)plan.add.push(p);else if(newerThan(p,l))plan.upd.push(p);else plan.keep.push(p);});
  return plan;
}
function downloadFile(name,text,type){
  const b=new Blob([text],{type:type}),a=document.createElement('a');
  a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();a.remove();
}
function exportBackup(klass){
  const msg=$('#bkMsg');
  try{
    const list=klass?S.profiles.filter(p=>(p.klass||'').trim()===klass):S.profiles;
    if(!list.length){if(msg)msg.textContent='Não há alunos para salvar.';return false;}
    const data=JSON.stringify({app:'mundo-das-descobertas',v:2,when:new Date().toISOString(),klass:klass||'',state:{cur:S.cur,profiles:list}});
    downloadFile('copia-'+(klass?'turma-'+klass.replace(/\W+/g,'-')+'-':'')+'mundo-das-descobertas-'+today()+'.json',data,'application/json');
    S.lastBackup=Date.now();save();
    if(msg)msg.textContent='Arquivo gerado com '+list.length+' aluno(s). Procure em Downloads do aparelho.';
    return true;
  }catch(e){if(msg)msg.textContent='Não foi possível gerar o arquivo neste navegador.';return false;}
}
actions.bkExport=()=>{exportBackup('');const m=$('#bkLast');if(m)m.textContent=bkLastText();};
function bkLastText(){
  if(!S.lastBackup)return S.profiles.length?'Nenhuma cópia de segurança foi salva neste aparelho.':'';
  const d=Math.floor((Date.now()-S.lastBackup)/864e5);
  return 'Última cópia salva em '+fmtDate(S.lastBackup)+(d>=14?' (há '+d+' dias: vale salvar uma nova).':'.');
}
let BKPEND=null;
function bkImport(file){
  const msg=$('#bkMsg'),box=$('#bkPlan');
  const r=new FileReader();
  r.onload=()=>{
    try{
      if(String(r.result).length>30e6)throw 0;
      const j=JSON.parse(r.result),st=j&&j.state?j.state:j;
      if(!st||!Array.isArray(st.profiles)||!st.profiles.length||!st.profiles.every(p=>p&&typeof p.id==='string'&&p.id.length<=64&&typeof p.name==='string'))throw 0;
      const ids=new Set();st.profiles=st.profiles.filter(p=>!ids.has(p.id)&&ids.add(p.id));
      const plan=bkPlan(st);BKPEND={st:st,plan:plan};
      const nm=a=>a.slice(0,8).map(p=>esc(p.name)).join(', ')+(a.length>8?' e mais '+(a.length-8):'');
      if(msg)msg.textContent='';
      if(!box){if(msg)msg.textContent='Arquivo lido.';return;}
      const total=plan.add.length+plan.upd.length;
      box.innerHTML=`<div class="panel" role="group" aria-label="Prévia da importação"><h3>Prévia da importação</h3>
      <p>O arquivo tem ${st.profiles.length} aluno(s)${j.when?' (salvo em '+esc(fmtDate(j.when))+')':''}.</p>
      <p><b>${plan.add.length}</b> novo(s)${plan.add.length?': '+nm(plan.add):''}</p>
      <p><b>${plan.upd.length}</b> com atividade mais recente que a daqui (serão atualizados)${plan.upd.length?': '+nm(plan.upd):''}</p>
      <p><b>${plan.keep.length}</b> iguais ou mais atualizados aqui (serão mantidos)</p>
      <div class="row">${total?'<button class="btn primary" id="bkGo">Importar '+total+' aluno(s)</button>':''}<button class="btn" id="bkNo">${total?'Cancelar':'Fechar'}</button></div>${total?'':'<p>Nada novo para importar.</p>'}</div>`;
      const go2=$('#bkGo',box);
      if(go2)go2.onclick=()=>{
        try{
          const up=new Map(plan.upd.map(p=>[p.id,p]));
          const merged=S.profiles.map(p=>up.get(p.id)||p).concat(plan.add);
          localStorage.setItem(KEY,JSON.stringify(Object.assign(JSON.parse(JSON.stringify(S)),{profiles:merged})));
          box.innerHTML='<p role="status">Importado. Recarregando...</p>';setTimeout(()=>location.reload(),800);
        }catch(e){box.innerHTML='<p class="warn" role="status">Não foi possível salvar. O armazenamento do aparelho pode estar cheio.</p>';}
      };
      $('#bkNo',box).onclick=()=>{box.innerHTML='';BKPEND=null;};
      const f=$('#bkGo',box)||$('#bkNo',box);if(f)f.focus();
    }catch(e){if(msg)msg.textContent='Este arquivo não parece ser uma cópia do aplicativo.';}
  };
  r.onerror=()=>{if(msg)msg.textContent='Não foi possível ler o arquivo.';};
  r.readAsText(file);
}
document.addEventListener('change',e=>{if(e.target&&e.target.id==='bkFile'&&e.target.files[0]){bkImport(e.target.files[0]);e.target.value='';}});

/* aviso de nova versão (service worker) */
let NEWVER=false;
const updBarHTML=()=>NEWVER?'<div class="panel updbar" role="status"><p><b>Há uma nova versão do aplicativo.</b> Atualize quando não houver criança no meio de uma atividade.</p><button class="btn primary" data-act="reloadApp">Atualizar agora</button></div>':'';
actions.reloadApp=()=>location.reload();
try{
  if('serviceWorker' in navigator){
    const had=!!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(!had)return;NEWVER=true;
      if(['who','parents','escola','turma'].indexOf(view.name)>=0&&!($('textarea:focus,input:focus')))render();
    });
  }
}catch(e){}

/* aparelho compartilhado: volta sozinho para "Quem vai estudar?" */
let LASTACT=Date.now();
['pointerdown','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,()=>{LASTACT=Date.now();},true));
function sharedLogout(){stopSpeech();UNLOCK=false;setProfile(null);go('who',undefined,{replace:true});}
setInterval(()=>{
  if(!S.shared||!P||['who','intro','privacy','pin','avalrun'].indexOf(view.name)>=0)return;
  if(Date.now()-LASTACT>(S.idleMin||5)*60000)sharedLogout();
},15000);

/* tela */
let ROSTER=null,ENDK='',ENDOK=false;
screens.escola=m=>{
  if(!P)return go('who');
  const ts=turmas();
  m.innerHTML=`${backBtn('parents')}<h2 class="mtitle" style="--c:var(--c-letras)">Painel da escola</h2>
  <p class="msub">Ferramentas para usar o aplicativo com turmas. Tudo continua só neste aparelho: nada é enviado para a internet.</p>${updBarHTML()}
  <div class="panel"><h3>1. Cadastrar a turma de uma vez</h3>
  <p>Cole a lista ou escolha um arquivo .csv ou .txt. Uma linha por aluno, com colunas separadas por ponto e vírgula, vírgula ou tab: <b>nome; turma; ano; nascimento</b>. Só o nome é obrigatório. Exemplo: <i>Ana Souza; 3º A manhã; 3º ano; 12/05/2017</i>. Use apelido ou primeiro nome, se preferir.</p>
  <label class="fl" for="rosterTxt">Lista de alunos</label><textarea id="rosterTxt" class="inp" rows="6" maxlength="20000" placeholder="Ana Souza; 3º A manhã; 3º ano&#10;Bruno Lima; 3º A manhã; 3º ano"></textarea>
  <div class="row"><label class="btn" for="rosterFile" style="cursor:pointer">Escolher arquivo</label><input type="file" id="rosterFile" accept=".csv,.txt,text/csv,text/plain" hidden><button class="btn primary" id="rosterPrev">Ver prévia</button></div>
  <div id="rosterBox" role="status" aria-live="polite"></div></div>

  <div class="panel"><h3>2. Cópias e troca entre aparelhos</h3>
  <p id="bkLast">${esc(bkLastText())}</p>
  <p>Para os alunos aparecerem em vários tablets: cadastre a turma em um aparelho, salve a cópia da turma e importe nos outros. Ao importar, nada é apagado: alunos novos são adicionados e, para quem já existe, fica a versão com atividade mais recente.</p>
  <div class="row"><button class="btn primary" data-act="bkExport">Salvar cópia de todos</button>${ts.length?`<select id="bkKlass" class="inp" aria-label="Turma para salvar" style="max-width:240px">${ts.map(t=>`<option>${esc(t)}</option>`).join('')}</select><button class="btn" id="bkKlassGo">Salvar só esta turma</button>`:''}<label class="btn" for="bkFile" style="cursor:pointer">Importar de um arquivo</label><input type="file" id="bkFile" accept=".json,application/json" hidden></div>
  <p id="bkMsg" role="status" aria-live="polite"></p><div id="bkPlan"></div></div>

  <div class="panel"><h3>3. Tablet ou computador compartilhado</h3>
  <p>Com esta opção ligada, o aplicativo não continua no aluno anterior: ao abrir, ao tocar em “Trocar aluno” ou depois de um tempo sem uso, volta para “Quem vai estudar?”. Vale para este aparelho.</p>
  <div class="seg"><button data-act="sharedToggle" aria-pressed="${!!S.shared}">Aparelho compartilhado: ${S.shared?'ligado':'desligado'}</button></div>
  ${S.shared?`<label class="fl" for="idleSeg">Voltar à lista depois de</label><div class="seg" id="idleSeg">${[3,5,10].map(n=>`<button data-act="idleSet" data-n="${n}" aria-pressed="${(S.idleMin||5)===n}">${n} min</button>`).join('')}</div>`:''}</div>

  <div class="panel"><h3>4. Armazenamento do aparelho</h3><p id="persistTxt">Verificando...</p>
  <p class="hint">Os dados ficam no navegador. Limpar dados de navegação, trocar de navegador ou usar janela anônima faz o progresso sumir daquele aparelho. Por isso, salve cópias com regularidade.</p></div>

  <div class="panel"><h3>5. Relatório e fim de ano</h3>
  <div class="row"><button class="btn" data-go="turma">Relatório da turma</button></div>
  ${ts.length?`<p>No fim do ano, salve a cópia da turma e depois remova os alunos dela deste aparelho. Isso libera a lista para a próxima turma.</p>
  <label class="fl" for="endK">Turma</label><select id="endK" class="inp"><option value="">Escolha...</option>${ts.map(t=>`<option${t===ENDK?' selected':''}>${esc(t)}</option>`).join('')}</select>
  <div class="row"><button class="btn" id="endSave">1. Salvar cópia desta turma</button><button class="btn" id="endDel" ${ENDOK&&ENDK?'':'disabled aria-disabled="true"'}>2. Remover esta turma deste aparelho</button></div><p id="endMsg" role="status" aria-live="polite" class="hint"></p>`:'<p class="hint">Nenhum aluno tem turma cadastrada.</p>'}</div>`;
  /* lista */
  const ta=$('#rosterTxt',m),box=$('#rosterBox',m);
  $('#rosterFile',m).onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{ta.value=String(r.result).slice(0,20000);box.textContent='Arquivo lido. Toque em “Ver prévia”.';};r.readAsText(f);e.target.value='';};
  $('#rosterPrev',m).onclick=()=>{
    ROSTER=parseRoster(ta.value);const R=ROSTER;
    if(!R.rows.length){box.innerHTML='<p>Nenhum aluno novo para cadastrar.'+(R.dup?' '+R.dup+' já existe(m) neste aparelho.':'')+'</p>';return;}
    box.innerHTML=`<p><b>${R.rows.length}</b> aluno(s) novo(s)${R.dup?'; '+R.dup+' já existe(m) e será(ão) ignorado(s)':''}${R.bad?'; '+R.bad+' linha(s) sem nome ignorada(s)':''}${R.cut?'; '+R.cut+' acima do limite de 200 por vez':''}.</p>
    <div class="tw"><table><thead><tr><th>Nome</th><th>Turma</th><th>Ano</th><th>Nascimento</th></tr></thead><tbody>${R.rows.slice(0,12).map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.klass)||'—'}</td><td>${esc(r.grade)||'—'}</td><td>${r.birth?esc(r.birth.split('-').reverse().join('/')):'—'}</td></tr>`).join('')}</tbody></table></div>${R.rows.length>12?'<p class="hint">Mostrando os 12 primeiros.</p>':''}
    <div class="row"><button class="btn primary" id="rosterGo">Cadastrar ${R.rows.length} aluno(s)</button></div>`;
    $('#rosterGo',box).onclick=()=>{
      ROSTER.rows.forEach(r=>S.profiles.push(newProfile({name:r.name,klass:r.klass,grade:r.grade,birth:r.birth})));
      save();const n=ROSTER.rows.length;ROSTER=null;ta.value='';
      render();
      const nb=$('#rosterBox');if(nb)nb.innerHTML='<p role="status"><b>'+n+' aluno(s) cadastrado(s).</b> Lembre de salvar uma cópia de segurança.</p>';
    };
  };
  /* cópia por turma */
  const kg=$('#bkKlassGo',m);if(kg)kg.onclick=()=>{exportBackup($('#bkKlass',m).value);$('#bkLast',m).textContent=bkLastText();};
  /* armazenamento */
  try{
    const pt=$('#persistTxt',m),est=navigator.storage&&navigator.storage.estimate?navigator.storage.estimate():Promise.resolve(null);
    const per=navigator.storage&&navigator.storage.persisted?navigator.storage.persisted():Promise.resolve(null);
    Promise.all([per,est]).then(r=>{if(!pt.isConnected)return;pt.textContent='Proteção contra limpeza automática: '+(r[0]===true?'ativada.':r[0]===false?'não ativada (o navegador pode apagar os dados se faltar espaço).':'não informada pelo navegador.')+(r[1]&&r[1].usage!=null?' Espaço usado pelo aplicativo: '+Math.max(1,Math.round(r[1].usage/1024))+' KB.':'');}).catch(()=>{pt.textContent='Não foi possível consultar o armazenamento.';});
  }catch(e){$('#persistTxt',m).textContent='Este navegador não informa o armazenamento.';}
  /* fim de ano */
  const ek=$('#endK',m);
  if(ek){
    ek.onchange=()=>{ENDK=ek.value;ENDOK=false;render();};
    $('#endSave',m).onclick=()=>{if(!ek.value){$('#endMsg',m).textContent='Escolha a turma primeiro.';return;}if(exportBackup(ek.value)){ENDK=ek.value;ENDOK=true;render();const s=$('#endMsg');if(s)s.textContent='Cópia gerada. Confirme que o arquivo foi salvo e então remova a turma.';}};
    const del=$('#endDel',m);
    del.onclick=()=>{
      if(!ENDOK||!ENDK)return;
      if(del.dataset.sure!=='1'){del.dataset.sure='1';del.textContent='Tem certeza? Toque de novo para remover';$('#endMsg',m).textContent='Serão removidos '+S.profiles.filter(p=>(p.klass||'').trim()===ENDK).length+' aluno(s) da turma '+ENDK+' deste aparelho. Não dá para desfazer, só restaurando a cópia.';return;}
      const gone=S.profiles.filter(p=>(p.klass||'').trim()===ENDK);
      S.profiles=S.profiles.filter(p=>(p.klass||'').trim()!==ENDK);
      if(!P||gone.indexOf(P)>=0){P=null;S.cur=S.profiles[0]?S.profiles[0].id:null;}
      save();ENDK='';ENDOK=false;
      if(S.profiles.length){setProfile(S.cur);go('escola',undefined,{replace:true});}else{setProfile(null);go('who',undefined,{replace:true});}
    };
  }
};
actions.sharedToggle=()=>{S.shared=!S.shared;if(!S.idleMin)S.idleMin=5;save();render();};
actions.idleSet=b=>{S.idleMin=+b.dataset.n;save();render();};
/* ========== início ========== */
applyPrefs();
if(S.cur&&!S.shared)setProfile(S.cur);
if(!P&&S.profiles.length===1&&!S.shared)setProfile(S.profiles[0].id);
if(S.shared&&S.cur){S.cur=null;save();}
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();}catch(e){}
if(!P)view={name:'who'};
hist=[{name:view.name,arg:view.arg}];hpos=0;
try{history.replaceState({i:0},'');}catch(e){}
applySkin();
render();
})();
