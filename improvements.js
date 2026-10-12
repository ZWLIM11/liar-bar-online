window.animationRate=1;
try{const saved=Number(localStorage.getItem('animationRate'));if([.7,1,1.6].includes(saved))window.animationRate=saved}catch{}
$('animationSpeed').value=String(window.animationRate);
$('animationSpeed').onchange=()=>{window.animationRate=Number($('animationSpeed').value);try{localStorage.setItem('animationRate',String(window.animationRate))}catch{}};
let lastRevealId=null,revealTimer;
function displayReveal(){const r=game?.lastReveal;if(!r)return;$('revealContent').innerHTML='<span class="eyebrow">THE EVIDENCE</span><h2>'+escapeHTML(r.title)+'</h2><p>Claim: <strong>'+escapeHTML(r.claim)+'</strong></p>'+r.rows.map(row=>'<div class="reveal-row"><b>'+escapeHTML(row.name)+'</b><span>'+row.values.map(v=>'<i>'+escapeHTML(v)+'</i>').join('')+'</span></div>').join('')+'<h3>'+escapeHTML(r.actual)+'</h3><p>'+escapeHTML(r.reason)+'</p>';$('revealPanel').hidden=false;}
$('showReveal').onclick=displayReveal;$('closeReveal').onclick=()=>$('revealPanel').hidden=true;
window.addEventListener('table-state',()=>{const r=game?.lastReveal;$('showReveal').disabled=!r;if(r&&r.id!==lastRevealId){lastRevealId=r.id;clearTimeout(revealTimer);revealTimer=setTimeout(displayReveal,3600/(window.animationRate||1));}});
window.addEventListener('table-reset',()=>{lastRevealId=null;clearTimeout(revealTimer);$('revealPanel').hidden=true;$('showReveal').disabled=true;});
let tutorialStep=0;
function tutorial(){const pages=[['Check your secret hand','Click the cup to reveal your practice dice. Only your own roll is visible.','<button id="lessonAction">Lift practice cup</button><div id="lessonResult">Covered</div>'],['Make a claim','A bid counts dice across every player. Your dice show two 3s. Claim at least two 3s to begin.','<button id="lessonAction">Bid two 3s</button><div id="lessonResult"></div>'],['Challenge a bluff','Your opponent claims six 3s. Choose Call bluff to reveal the table and compare the count.','<button id="lessonAction">Call bluff</button><div id="lessonResult"></div>'],['Cards and survival','In Deck, flip your hand, select 1–3 cards and claim the table rank. A lost challenge triggers roulette. In Dice, two poison drinks eliminate you.','<button id="lessonAction">Finish lesson</button><div id="lessonResult"></div>']];const p=pages[tutorialStep];$('tutorialContent').innerHTML='<span class="eyebrow">PRACTICE · '+(tutorialStep+1)+' / 4</span><h2>'+p[0]+'</h2><p>'+p[1]+'</p>'+p[2]+'<button id="lessonNext" hidden>Next →</button>';$('lessonAction').onclick=()=>{if(tutorialStep===3){$('tutorialDialog').close();return}$('lessonResult').textContent=['Your dice: 3 · 3 · 1 · 5 · 6','You bid two 3s. Next player must raise or challenge.','Revealed: only four 3s. The bidder was wrong and drinks poison.'][tutorialStep];$('lessonNext').hidden=false;$('lessonAction').disabled=true};$('lessonNext').onclick=()=>{tutorialStep++;tutorial()};}
$('openTutorial').onclick=()=>{tutorialStep=0;tutorial();$('tutorialDialog').showModal()};$('closeTutorial').onclick=()=>$('tutorialDialog').close();

// Numbered public actions prevent duplicate notices during online polling.
const actionNotice=document.createElement('div');actionNotice.id='actionNotice';actionNotice.setAttribute('role','status');actionNotice.setAttribute('aria-live','polite');actionNotice.hidden=true;$('gameScreen').append(actionNotice);
let noticeSerial=null,noticeTimer,noticeQueue=[];
function nextNotice(){clearTimeout(noticeTimer);const message=noticeQueue.shift();if(!message){actionNotice.hidden=true;return}actionNotice.textContent=message;actionNotice.hidden=false;actionNotice.classList.toggle('challenge',/called Liar|challenged|challenge|all in/i.test(message));noticeTimer=setTimeout(nextNotice,2800);}
window.addEventListener('table-reset',()=>{noticeSerial=null;noticeQueue=[];clearTimeout(noticeTimer);actionNotice.hidden=true;});
window.addEventListener('table-state',()=>{
 if(!game)return;
 const serial=game.logSerial||0;
 if(noticeSerial!==null&&serial>noticeSerial){const fresh=game.log.slice(0,Math.min(serial-noticeSerial,game.log.length)).reverse();if(fresh.some(x=>/called Liar|challenged/i.test(x))){window.callLiarAudio?.();noticeQueue=[];clearTimeout(noticeTimer);actionNotice.hidden=true;}noticeQueue.push(...fresh);noticeQueue=noticeQueue.slice(-8);if(actionNotice.hidden)nextNotice();}
 noticeSerial=serial;
 document.querySelectorAll('#playerRow .player').forEach((node,i)=>{
  const p=game.players[i];if(!['deck','poker'].includes(game.mode))return;
  const pulls=Math.min(6,p.pulls||0),stake=Math.min(6,p.stake||0),remaining=6-pulls;
  const meter=document.createElement('div');meter.className='chamber-meter';
  const label=document.createElement('strong');label.textContent=game.mode==='deck'?'1 BULLET · '+pulls+'/6 PULLS':stake+' / 6 BULLETS';meter.append(label);
  const track=document.createElement('span');track.className='chamber-track';track.setAttribute('aria-hidden','true');
  for(let k=0;k<6;k++){const dot=document.createElement('i');dot.className=game.mode==='deck'?(k<pulls?'spent':'unknown'):(k<stake?'loaded':'empty');track.append(dot)}meter.append(track);
  const risk=document.createElement('small');risk.textContent=!p.alive?'Eliminated':game.mode==='deck'?'Next pull: '+Math.round(100/Math.max(1,remaining))+'% risk · position hidden':'At risk: '+Math.round(stake/6*100)+'%';meter.append(risk);meter.classList.toggle('danger',p.alive&&(game.mode==='deck'?remaining<=2:stake>=4));node.append(meter);
 });
 const p=game.players[localSeat];
 if(game.mode==='deck')$('lifeMeter').textContent=p.alive?'YOUR GUN · 1 BULLET · '+p.pulls+'/6 PULLS · '+Math.round(100/Math.max(1,6-p.pulls))+'% NEXT RISK':'YOUR GUN · ELIMINATED';
 if(game.mode==='poker')$('lifeMeter').textContent='YOUR GUN · '+(p.stake||0)+' / 6 BULLETS';
 if(game.mode==='deck'){const total=(game.tablePlays||[]).reduce((n,p)=>n+p.count,0);const count=document.createElement('small');count.className='pile-count';count.textContent=total+' cards on the table · face-down until challenged';$('tableCenter').append(count);}
});

// Large touch targets keep bidding in one compact action strip.
window.addEventListener('table-state',()=>{
 const qty=$('bidQty'),face=$('bidFace');if(!qty||!face)return;
 const max=Number(qty.max),bid=game.bid;
 qty.value=String(bid?(bid.face===6?Math.min(max,bid.qty+1):bid.qty):1);
 face.value=String(bid&&bid.face<6?bid.face+1:1);
 qty.parentElement.classList.add('quantity-control');
 const minus=document.createElement('button'),plus=document.createElement('button');minus.type=plus.type='button';minus.textContent='−';plus.textContent='+';minus.setAttribute('aria-label','Decrease bid quantity');plus.setAttribute('aria-label','Increase bid quantity');qty.before(minus);qty.after(plus);
 const picker=document.createElement('div');picker.className='face-picker';picker.setAttribute('role','group');picker.setAttribute('aria-label','Bid face');face.parentElement.hidden=true;face.parentElement.after(picker);
 const submit=document.querySelector('[data-action="bid"]');
 function refresh(){const n=Number(qty.value);let selected=Number(face.value);const legal=f=>!bid||n>bid.qty||n===bid.qty&&f>bid.face;
  if(!legal(selected)){selected=[1,2,3,4,5,6].find(legal)||selected;face.value=String(selected)}
  picker.querySelectorAll('button').forEach((b,i)=>{b.disabled=!legal(i+1);b.setAttribute('aria-pressed',String(i+1===selected))});
  minus.disabled=n<=Math.max(1,bid?.qty||1);plus.disabled=n>=max;submit.disabled=!Number.isInteger(n)||n<1||n>max||!legal(selected);submit.textContent='Bid '+n+' × '+selected;
 }
 for(let i=1;i<=6;i++){const b=document.createElement('button');b.type='button';b.textContent=faces[i-1];b.setAttribute('aria-label','Bid face '+i);b.onclick=()=>{face.value=String(i);refresh()};picker.append(b)}
 minus.onclick=()=>{qty.value=String(Math.max(bid?.qty||1,Number(qty.value)-1));refresh()};plus.onclick=()=>{qty.value=String(Math.min(max,Number(qty.value)+1));refresh()};qty.oninput=refresh;refresh();
});

const originalSoundToggle=$('soundButton').onclick;$('soundButton').onclick=()=>{originalSoundToggle();if(!sound)window.speechSynthesis?.cancel()};

window.addEventListener('table-state',()=>{$('tableCenter').hidden=game?.mode==='deck';});

function updateTablePreview(){const mode=modes[selectedMode],symbols={dice:['⚂','⚄','⚁'],deck:['K','◆','A'],poker:['♠','Q','♥'],roulette:['♥','★','♥']}[selectedMode];const descriptions={dice:'Read the odds. Raise the stakes.',deck:'Keep a straight face. Sell the lie.',poker:'One hand. A dangerous decision.',roulette:'Spin your luck. Bluff your rivals.'};
 $('tablePreview').innerHTML='<span class="eyebrow">YOUR NEXT TABLE</span><div class="preview-felt '+selectedMode+'">'+symbols.map((v,i)=>'<span class="preview-piece" style="--piece:'+i+'">'+v+'</span>').join('')+'</div><h3>'+escapeHTML(mode.name)+'</h3><p>'+descriptions[selectedMode]+'</p>';
 $('setupSummary').textContent=$('playerCount').value+' seats · '+$('rulesetSelect').value+($('onlineSetup').hidden?' · '+$('aiDifficulty').selectedOptions[0].text+' AI':' · Private online room');
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$('tablePreview').animate([{opacity:.3,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'});
}
window.addEventListener('lobby-selection',updateTablePreview);
['rulesetSelect','playerCount','aiDifficulty'].forEach(id=>$(id).addEventListener('change',updateTablePreview));
['chooseSolo','chooseOnline'].forEach(id=>$(id).addEventListener('click',updateTablePreview));updateTablePreview();
